import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface StudentTopic {
  id: string;
  topic_name: string;
  subject: string;
  difficulty: string;
  completed_at: string;
  notes: string | null;
}

interface QuizAttempt {
  id: string;
  topic_name: string;
  subject: string;
  score: number;
  total_questions: number;
  percentage: number;
  attempted_at: string;
}

interface ProgressStats {
  totalTopics: number;
  totalQuizzes: number;
  averageScore: number;
  topicsBySubject: Record<string, number>;
  recentActivity: (StudentTopic | QuizAttempt)[];
}

export const useProgress = () => {
  const { user } = useAuth();
  const [topics, setTopics] = useState<StudentTopic[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
  const [stats, setStats] = useState<ProgressStats>({
    totalTopics: 0,
    totalQuizzes: 0,
    averageScore: 0,
    topicsBySubject: {},
    recentActivity: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProgress();
    }
  }, [user]);

  const fetchProgress = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      const [topicsRes, quizzesRes] = await Promise.all([
        supabase
          .from('student_topics')
          .select('*')
          .eq('user_id', user.id)
          .order('completed_at', { ascending: false }),
        supabase
          .from('quiz_attempts')
          .select('*')
          .eq('user_id', user.id)
          .order('attempted_at', { ascending: false })
      ]);

      const fetchedTopics = (topicsRes.data || []) as StudentTopic[];
      const fetchedQuizzes = (quizzesRes.data || []) as QuizAttempt[];

      setTopics(fetchedTopics);
      setQuizAttempts(fetchedQuizzes);

      // Calculate stats
      const topicsBySubject: Record<string, number> = {};
      fetchedTopics.forEach(topic => {
        topicsBySubject[topic.subject] = (topicsBySubject[topic.subject] || 0) + 1;
      });

      const avgScore = fetchedQuizzes.length > 0
        ? fetchedQuizzes.reduce((sum, q) => sum + Number(q.percentage), 0) / fetchedQuizzes.length
        : 0;

      setStats({
        totalTopics: fetchedTopics.length,
        totalQuizzes: fetchedQuizzes.length,
        averageScore: Math.round(avgScore),
        topicsBySubject,
        recentActivity: [...fetchedTopics.slice(0, 3), ...fetchedQuizzes.slice(0, 3)]
      });
    } catch (error) {
      console.error('Error fetching progress:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addTopic = async (topicName: string, subject: string, difficulty: string = 'beginner', notes?: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('student_topics')
      .upsert({
        user_id: user.id,
        topic_name: topicName,
        subject,
        difficulty,
        notes,
        completed_at: new Date().toISOString()
      }, { onConflict: 'user_id,topic_name' });

    if (!error) {
      fetchProgress();
    }
    return { error };
  };

  const addQuizAttempt = async (topicName: string, subject: string, score: number, totalQuestions: number) => {
    if (!user) return;

    const percentage = (score / totalQuestions) * 100;

    const { error } = await supabase
      .from('quiz_attempts')
      .insert({
        user_id: user.id,
        topic_name: topicName,
        subject,
        score,
        total_questions: totalQuestions,
        percentage
      });

    if (!error) {
      fetchProgress();
    }
    return { error };
  };

  return {
    topics,
    quizAttempts,
    stats,
    isLoading,
    addTopic,
    addQuizAttempt,
    refreshProgress: fetchProgress
  };
};
