import { useState } from 'react';
import { useProgress } from '@/hooks/useProgress';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AchievementBadges } from '@/components/AchievementBadges';
import { 
  BookOpen, 
  Target, 
  TrendingUp, 
  Clock, 
  CheckCircle2,
  X,
  Brain,
  Award,
  Trophy
} from 'lucide-react';
import { format } from 'date-fns';

interface ProgressTrackerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProgressTracker = ({ isOpen, onClose }: ProgressTrackerProps) => {
  const { topics, quizAttempts, stats, isLoading } = useProgress();

  if (!isOpen) return null;

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-500';
    if (percentage >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-500/20 text-green-400';
      case 'intermediate': return 'bg-yellow-500/20 text-yellow-400';
      case 'exam': return 'bg-red-500/20 text-red-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <CardTitle>Learning Progress</CardTitle>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
                <TabsTrigger 
                  value="overview" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger 
                  value="achievements" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                >
                  <Trophy className="h-4 w-4 mr-1" />
                  Achievements
                </TabsTrigger>
                <TabsTrigger 
                  value="topics" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                >
                  Topics ({stats.totalTopics})
                </TabsTrigger>
                <TabsTrigger 
                  value="quizzes" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                >
                  Quizzes ({stats.totalQuizzes})
                </TabsTrigger>
              </TabsList>

              <ScrollArea className="h-[60vh]">
                <TabsContent value="overview" className="p-6 space-y-6 m-0">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                      <CardContent className="p-4 flex flex-col items-center">
                        <BookOpen className="h-8 w-8 text-blue-500 mb-2" />
                        <p className="text-2xl font-bold">{stats.totalTopics}</p>
                        <p className="text-xs text-muted-foreground">Topics Learned</p>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
                      <CardContent className="p-4 flex flex-col items-center">
                        <Target className="h-8 w-8 text-green-500 mb-2" />
                        <p className="text-2xl font-bold">{stats.totalQuizzes}</p>
                        <p className="text-xs text-muted-foreground">Quizzes Taken</p>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
                      <CardContent className="p-4 flex flex-col items-center">
                        <Award className="h-8 w-8 text-purple-500 mb-2" />
                        <p className="text-2xl font-bold">{stats.averageScore}%</p>
                        <p className="text-xs text-muted-foreground">Avg Quiz Score</p>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
                      <CardContent className="p-4 flex flex-col items-center">
                        <Brain className="h-8 w-8 text-orange-500 mb-2" />
                        <p className="text-2xl font-bold">{Object.keys(stats.topicsBySubject).length}</p>
                        <p className="text-xs text-muted-foreground">Subjects</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Subject Progress */}
                  {Object.keys(stats.topicsBySubject).length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Topics by Subject</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {Object.entries(stats.topicsBySubject).map(([subject, count]) => (
                          <div key={subject} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="capitalize">{subject}</span>
                              <span className="text-muted-foreground">{count} topics</span>
                            </div>
                            <Progress value={(count / stats.totalTopics) * 100} className="h-2" />
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* Empty State */}
                  {stats.totalTopics === 0 && stats.totalQuizzes === 0 && (
                    <div className="text-center py-12">
                      <Brain className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No progress yet</h3>
                      <p className="text-muted-foreground">
                        Start learning and your progress will appear here!
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="achievements" className="p-6 m-0">
                  <AchievementBadges />
                </TabsContent>

                <TabsContent value="topics" className="p-6 m-0">
                  {topics.length === 0 ? (
                    <div className="text-center py-12">
                      <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No topics learned yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {topics.map(topic => (
                        <Card key={topic.id} className="hover:bg-muted/50 transition-colors">
                          <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                              <div>
                                <p className="font-medium">{topic.topic_name}</p>
                                <p className="text-sm text-muted-foreground capitalize">{topic.subject}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge className={getDifficultyColor(topic.difficulty)}>
                                {topic.difficulty}
                              </Badge>
                              <div className="flex items-center text-sm text-muted-foreground">
                                <Clock className="h-3 w-3 mr-1" />
                                {format(new Date(topic.completed_at), 'MMM d')}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="quizzes" className="p-6 m-0">
                  {quizAttempts.length === 0 ? (
                    <div className="text-center py-12">
                      <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No quizzes taken yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {quizAttempts.map(quiz => (
                        <Card key={quiz.id} className="hover:bg-muted/50 transition-colors">
                          <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Target className={`h-5 w-5 ${getScoreColor(Number(quiz.percentage))}`} />
                              <div>
                                <p className="font-medium">{quiz.topic_name}</p>
                                <p className="text-sm text-muted-foreground capitalize">{quiz.subject}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className={`font-bold ${getScoreColor(Number(quiz.percentage))}`}>
                                  {Number(quiz.percentage).toFixed(0)}%
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {quiz.score}/{quiz.total_questions} correct
                                </p>
                              </div>
                              <div className="flex items-center text-sm text-muted-foreground">
                                <Clock className="h-3 w-3 mr-1" />
                                {format(new Date(quiz.attempted_at), 'MMM d')}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </ScrollArea>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
