import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { GoalProgressCard } from '@/components/GoalProgressCard';
import { GoalHistoryChart } from '@/components/GoalHistoryChart';
import { ScheduleReportForm } from '@/components/ScheduleReportForm';
import { ProgressComparison } from '@/components/ProgressComparison';
import { AchievementBadges } from '@/components/AchievementBadges';
import type { GoalHistoryData } from '@/hooks/useGoalHistory';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { generateProgressReport } from '@/utils/generateProgressReport';
import { toast } from '@/hooks/use-toast';
import { 
  BookOpen, 
  Target, 
  TrendingUp, 
  Brain,
  Award,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowLeft,
  User,
  FileText,
  Loader2,
  Mail
} from 'lucide-react';
import { format, subDays, eachDayOfInterval, isSameDay } from 'date-fns';

const computeGoalHistory = (records: any[]): GoalHistoryData[] => {
  return (records || []).map((record) => {
    const topicsRate = record.topic_goal > 0
      ? Math.min(100, Math.round((record.topics_completed / record.topic_goal) * 100)) : 0;
    const quizzesRate = record.quiz_goal > 0
      ? Math.min(100, Math.round((record.quizzes_completed / record.quiz_goal) * 100)) : 0;
    const studyDaysRate = record.study_days_goal > 0
      ? Math.min(100, Math.round((record.study_days / record.study_days_goal) * 100)) : 0;
    const overallRate = Math.round((topicsRate + quizzesRate + studyDaysRate) / 3);
    return {
      week: record.week_start,
      weekLabel: format(new Date(record.week_start), 'MMM d'),
      topicsRate,
      quizzesRate,
      studyDaysRate,
      overallRate,
    };
  });
};


interface StudentData {
  topics: Array<{
    id: string;
    topic_name: string;
    subject: string;
    difficulty: string;
    completed_at: string;
  }>;
  quizzes: Array<{
    id: string;
    topic_name: string;
    subject: string;
    score: number;
    total_questions: number;
    percentage: number;
    attempted_at: string;
  }>;
}

interface WeakArea {
  subject: string;
  avgScore: number;
  attempts: number;
}

interface StudyGoals {
  weeklyTopicGoal: number;
  weeklyQuizGoal: number;
  studyDaysGoal: number;
}

interface ScheduleInfo {
  email: string | null;
  date: string | null;
  sentAt: string | null;
}

const ParentView = () => {
  const { token } = useParams<{ token: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [linkLabel, setLinkLabel] = useState<string | null>(null);
  const [studyGoals, setStudyGoals] = useState<StudyGoals>({ weeklyTopicGoal: 5, weeklyQuizGoal: 3, studyDaysGoal: 5 });
  const [studentUserId, setStudentUserId] = useState<string | null>(null);
  const [isExportingReport, setIsExportingReport] = useState(false);
  const [scheduleInfo, setScheduleInfo] = useState<ScheduleInfo>({ email: null, date: null, sentAt: null });

  const [goalHistory, setGoalHistory] = useState<GoalHistoryData[]>([]);
  const historyLoading = false;


  useEffect(() => {
    if (token) {
      fetchStudentProgress();
    }
  }, [token]);

  const fetchStudentProgress = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // First verify the share link is valid
      const { data: linkData, error: linkError } = await supabase
        .from('parent_share_links')
        .select('user_id, label, is_active, expires_at, report_email, report_scheduled_date, report_sent_at')
        .eq('share_token', token)
        .maybeSingle();

      if (linkError || !linkData) {
        setError('This share link is invalid or has expired.');
        setIsLoading(false);
        return;
      }

      if (!linkData.is_active) {
        setError('This share link has been deactivated by the student.');
        setIsLoading(false);
        return;
      }

      if (linkData.expires_at && new Date(linkData.expires_at) < new Date()) {
        setError('This share link has expired.');
        setIsLoading(false);
        return;
      }

      setLinkLabel(linkData.label);
      setStudentUserId(linkData.user_id);
      setScheduleInfo({
        email: linkData.report_email,
        date: linkData.report_scheduled_date,
        sentAt: linkData.report_sent_at,
      });

      // Fetch student's progress data and preferences (for study goals)
      const [topicsRes, quizzesRes, prefsRes] = await Promise.all([
        supabase
          .from('student_topics')
          .select('id, topic_name, subject, difficulty, completed_at')
          .eq('user_id', linkData.user_id)
          .order('completed_at', { ascending: false }),
        supabase
          .from('quiz_attempts')
          .select('id, topic_name, subject, score, total_questions, percentage, attempted_at')
          .eq('user_id', linkData.user_id)
          .order('attempted_at', { ascending: false }),
        supabase
          .from('user_preferences')
          .select('weekly_topic_goal, weekly_quiz_goal, study_days_goal')
          .eq('user_id', linkData.user_id)
          .maybeSingle()
      ]);

      if (prefsRes.data) {
        setStudyGoals({
          weeklyTopicGoal: prefsRes.data.weekly_topic_goal ?? 5,
          weeklyQuizGoal: prefsRes.data.weekly_quiz_goal ?? 3,
          studyDaysGoal: prefsRes.data.study_days_goal ?? 5,
        });
      }

      setStudentData({
        topics: (topicsRes.data || []) as StudentData['topics'],
        quizzes: (quizzesRes.data || []) as StudentData['quizzes']
      });
    } catch (err) {
      setError('Failed to load student progress.');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate weak areas (subjects with avg score < 70%)
  const getWeakAreas = (): WeakArea[] => {
    if (!studentData?.quizzes.length) return [];

    const subjectScores: Record<string, { total: number; count: number }> = {};
    
    studentData.quizzes.forEach(quiz => {
      if (!subjectScores[quiz.subject]) {
        subjectScores[quiz.subject] = { total: 0, count: 0 };
      }
      subjectScores[quiz.subject].total += Number(quiz.percentage);
      subjectScores[quiz.subject].count += 1;
    });

    return Object.entries(subjectScores)
      .map(([subject, data]) => ({
        subject,
        avgScore: Math.round(data.total / data.count),
        attempts: data.count
      }))
      .filter(area => area.avgScore < 70)
      .sort((a, b) => a.avgScore - b.avgScore);
  };

  // Calculate study consistency (last 14 days)
  const getStudyConsistency = () => {
    if (!studentData) return { activeDays: 0, totalDays: 14, streak: 0 };

    const last14Days = eachDayOfInterval({
      start: subDays(new Date(), 13),
      end: new Date()
    });

    const activityDates = new Set<string>();
    
    studentData.topics.forEach(topic => {
      activityDates.add(format(new Date(topic.completed_at), 'yyyy-MM-dd'));
    });
    
    studentData.quizzes.forEach(quiz => {
      activityDates.add(format(new Date(quiz.attempted_at), 'yyyy-MM-dd'));
    });

    const activeDays = last14Days.filter(day => 
      activityDates.has(format(day, 'yyyy-MM-dd'))
    ).length;

    // Calculate current streak
    let streak = 0;
    for (let i = last14Days.length - 1; i >= 0; i--) {
      if (activityDates.has(format(last14Days[i], 'yyyy-MM-dd'))) {
        streak++;
      } else if (i < last14Days.length - 1) {
        break;
      }
    }

    return { activeDays, totalDays: 14, streak, activityDates, last14Days };
  };

  // Calculate this week's activity for goal tracking
  const getThisWeekProgress = () => {
    if (!studentData) return { topicsCompleted: 0, quizzesCompleted: 0, studyDays: 0 };
    
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    
    const topicsThisWeek = studentData.topics.filter(t => new Date(t.completed_at) >= weekStart).length;
    const quizzesThisWeek = studentData.quizzes.filter(q => new Date(q.attempted_at) >= weekStart).length;
    
    const studyDates = new Set<string>();
    studentData.topics.forEach(t => {
      if (new Date(t.completed_at) >= weekStart) {
        studyDates.add(new Date(t.completed_at).toDateString());
      }
    });
    studentData.quizzes.forEach(q => {
      if (new Date(q.attempted_at) >= weekStart) {
        studyDates.add(new Date(q.attempted_at).toDateString());
      }
    });
    
    return {
      topicsCompleted: topicsThisWeek,
      quizzesCompleted: quizzesThisWeek,
      studyDays: studyDates.size,
    };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Link to="/">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go to Study Buddy
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const weakAreas = getWeakAreas();
  const consistency = getStudyConsistency();
  const thisWeekProgress = getThisWeekProgress();

  const totalTopics = studentData?.topics.length || 0;
  const totalQuizzes = studentData?.quizzes.length || 0;
  const avgScore = totalQuizzes > 0
    ? Math.round(studentData!.quizzes.reduce((sum, q) => sum + Number(q.percentage), 0) / totalQuizzes)
    : 0;

  // Topics by subject
  const topicsBySubject: Record<string, number> = {};
  studentData?.topics.forEach(topic => {
    topicsBySubject[topic.subject] = (topicsBySubject[topic.subject] || 0) + 1;
  });

  const handleExportFullReport = () => {
    if (!studentData) return;
    
    setIsExportingReport(true);
    try {
      generateProgressReport({
        studentName: linkLabel || 'Student',
        totalTopics,
        totalQuizzes,
        avgScore,
        subjectCount: Object.keys(topicsBySubject).length,
        goalProgress: {
          ...studyGoals,
          ...thisWeekProgress,
        },
        weakAreas,
        consistency: {
          activeDays: consistency.activeDays,
          totalDays: consistency.totalDays,
          streak: consistency.streak,
        },
        recentTopics: studentData.topics.slice(0, 5),
        recentQuizzes: studentData.quizzes.slice(0, 5),
        goalHistory,
      });
      
      toast({
        title: 'Report Downloaded',
        description: 'Full progress report has been saved as PDF.',
      });
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: 'Export Failed',
        description: 'Could not generate the report. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsExportingReport(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="font-semibold">Student Progress Report</h1>
              {linkLabel && <p className="text-sm text-muted-foreground">{linkLabel}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={handleExportFullReport}
              disabled={isExportingReport || !studentData}
              className="gap-2"
            >
              {isExportingReport ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              Download Full Report
            </Button>
            <Badge variant="secondary" className="gap-1">
              <Clock className="h-3 w-3" />
              Updated just now
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Summary Stats */}
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Progress Summary
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
              <CardContent className="p-4 flex flex-col items-center">
                <BookOpen className="h-8 w-8 text-blue-500 mb-2" />
                <p className="text-3xl font-bold">{totalTopics}</p>
                <p className="text-xs text-muted-foreground">Topics Learned</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
              <CardContent className="p-4 flex flex-col items-center">
                <Target className="h-8 w-8 text-green-500 mb-2" />
                <p className="text-3xl font-bold">{totalQuizzes}</p>
                <p className="text-xs text-muted-foreground">Quizzes Taken</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
              <CardContent className="p-4 flex flex-col items-center">
                <Award className="h-8 w-8 text-purple-500 mb-2" />
                <p className={`text-3xl font-bold ${avgScore >= 70 ? 'text-green-500' : avgScore >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                  {avgScore}%
                </p>
                <p className="text-xs text-muted-foreground">Avg Quiz Score</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
              <CardContent className="p-4 flex flex-col items-center">
                <Brain className="h-8 w-8 text-orange-500 mb-2" />
                <p className="text-3xl font-bold">{Object.keys(topicsBySubject).length}</p>
                <p className="text-xs text-muted-foreground">Subjects Explored</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Progress Comparison */}
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Period Comparison
          </h2>
          <ProgressComparison 
            topics={studentData?.topics || []}
            quizzes={studentData?.quizzes || []}
          />
        </section>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Weekly Goals Progress */}
          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Weekly Goals
            </h2>
            <GoalProgressCard
              progress={{
                ...studyGoals,
                ...thisWeekProgress,
              }}
            />
          </section>

          {/* Weak Areas */}
          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Areas Needing Attention
            </h2>
            <Card>
              <CardContent className="p-4">
                {weakAreas.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
                    <p className="font-medium text-green-600">All areas looking good!</p>
                    <p className="text-sm text-muted-foreground">No subjects below 70% average</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {weakAreas.map(area => (
                      <div key={area.subject} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="capitalize font-medium">{area.subject}</span>
                          <Badge variant={area.avgScore < 50 ? "destructive" : "secondary"}>
                            {area.avgScore}% avg
                          </Badge>
                        </div>
                        <Progress 
                          value={area.avgScore} 
                          className="h-2"
                        />
                        <p className="text-xs text-muted-foreground">
                          Based on {area.attempts} quiz{area.attempts !== 1 ? 'zes' : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        </div>

      {/* Achievement Badges */}
      <section>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Award className="h-5 w-5 text-yellow-500" />
          Achievement Badges
        </h2>
        <AchievementBadges userId={studentUserId || undefined} />
      </section>

      {/* Goal History Chart */}
      <section>
        <GoalHistoryChart 
          data={goalHistory} 
          isLoading={historyLoading} 
          studentName={linkLabel || 'Student'} 
        />
      </section>

        {/* Schedule Report for Meeting */}
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Email Report Scheduling
          </h2>
          <ScheduleReportForm
            shareToken={token || ''}
            existingEmail={scheduleInfo.email}
            existingDate={scheduleInfo.date}
            existingSentAt={scheduleInfo.sentAt}
            onScheduled={() => fetchStudentProgress()}
          />
        </section>

        <div className="grid md:grid-cols-2 gap-8">

          {/* Study Consistency */}
          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Study Consistency (Last 14 Days)
            </h2>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-3xl font-bold">{consistency.activeDays}/{consistency.totalDays}</p>
                    <p className="text-sm text-muted-foreground">Active study days</p>
                  </div>
                  {consistency.streak > 0 && (
                    <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/30">
                      🔥 {consistency.streak} day streak
                    </Badge>
                  )}
                </div>
                
                <Progress 
                  value={(consistency.activeDays / consistency.totalDays) * 100} 
                  className="h-3 mb-4"
                />

                {/* Activity Calendar */}
                <div className="grid grid-cols-7 gap-1">
                  {consistency.last14Days?.map((day, i) => {
                    const isActive = consistency.activityDates?.has(format(day, 'yyyy-MM-dd'));
                    const isToday = isSameDay(day, new Date());
                    return (
                      <div
                        key={i}
                        className={`
                          aspect-square rounded-sm flex items-center justify-center text-xs
                          ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted'}
                          ${isToday ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}
                        `}
                        title={format(day, 'MMM d')}
                      >
                        {format(day, 'd')}
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Colored days = study activity
                </p>
              </CardContent>
            </Card>
          </section>
        </div>

        {/* Recent Activity */}
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Recent Activity
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {/* Recent Topics */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Recent Topics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-48">
                  {studentData?.topics.slice(0, 5).map(topic => (
                    <div key={topic.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="font-medium text-sm">{topic.topic_name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{topic.subject}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(topic.completed_at), 'MMM d')}
                      </span>
                    </div>
                  ))}
                  {(!studentData?.topics.length) && (
                    <p className="text-sm text-muted-foreground text-center py-8">No topics yet</p>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Recent Quizzes */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Recent Quiz Scores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-48">
                  {studentData?.quizzes.slice(0, 5).map(quiz => (
                    <div key={quiz.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="font-medium text-sm">{quiz.topic_name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{quiz.subject}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={Number(quiz.percentage) >= 70 ? "default" : "secondary"}>
                          {Number(quiz.percentage).toFixed(0)}%
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(quiz.attempted_at), 'MMM d')}
                        </p>
                      </div>
                    </div>
                  ))}
                  {(!studentData?.quizzes.length) && (
                    <p className="text-sm text-muted-foreground text-center py-8">No quizzes yet</p>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center py-8 border-t">
          <p className="text-sm text-muted-foreground">
            Powered by <span className="font-semibold text-primary">Study Buddy AI</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            This is a read-only view of the student's learning progress.
          </p>
        </footer>
      </main>
    </div>
  );
};

export default ParentView;
