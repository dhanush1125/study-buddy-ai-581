 import { useState, useEffect, useCallback } from 'react';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/contexts/AuthContext';
 import { startOfWeek, format, subWeeks } from 'date-fns';
 
 interface WeeklyGoalRecord {
   id: string;
   week_start: string;
   topics_completed: number;
   quizzes_completed: number;
   study_days: number;
   topic_goal: number;
   quiz_goal: number;
   study_days_goal: number;
 }
 
 export interface GoalHistoryData {
   week: string;
   weekLabel: string;
   topicsRate: number;
   quizzesRate: number;
   studyDaysRate: number;
   overallRate: number;
 }
 
 export const useGoalHistory = (userId?: string) => {
   const { user } = useAuth();
   const effectiveUserId = userId || user?.id;
   const [history, setHistory] = useState<GoalHistoryData[]>([]);
   const [isLoading, setIsLoading] = useState(true);
 
   const fetchHistory = useCallback(async () => {
     if (!effectiveUserId) {
       setIsLoading(false);
       return;
     }
 
     try {
       const { data, error } = await supabase
         .from('weekly_goal_history')
         .select('*')
         .eq('user_id', effectiveUserId)
         .order('week_start', { ascending: true })
         .limit(12);
 
       if (error) throw error;
 
       const chartData: GoalHistoryData[] = (data || []).map((record: WeeklyGoalRecord) => {
         const topicsRate = record.topic_goal > 0 
           ? Math.min(100, Math.round((record.topics_completed / record.topic_goal) * 100))
           : 0;
         const quizzesRate = record.quiz_goal > 0 
           ? Math.min(100, Math.round((record.quizzes_completed / record.quiz_goal) * 100))
           : 0;
         const studyDaysRate = record.study_days_goal > 0 
           ? Math.min(100, Math.round((record.study_days / record.study_days_goal) * 100))
           : 0;
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
 
       setHistory(chartData);
     } catch (error) {
       console.error('Error fetching goal history:', error);
     } finally {
       setIsLoading(false);
     }
   }, [effectiveUserId]);
 
   useEffect(() => {
     fetchHistory();
   }, [fetchHistory]);
 
   const saveCurrentWeek = useCallback(async (
     topicsCompleted: number,
     quizzesCompleted: number,
     studyDays: number,
     topicGoal: number,
     quizGoal: number,
     studyDaysGoal: number
   ) => {
     if (!user) return;
 
     const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
 
     try {
       const { error } = await supabase
         .from('weekly_goal_history')
         .upsert({
           user_id: user.id,
           week_start: weekStart,
           topics_completed: topicsCompleted,
           quizzes_completed: quizzesCompleted,
           study_days: studyDays,
           topic_goal: topicGoal,
           quiz_goal: quizGoal,
           study_days_goal: studyDaysGoal,
         }, { onConflict: 'user_id,week_start' });
 
       if (error) throw error;
       fetchHistory();
     } catch (error) {
       console.error('Error saving goal history:', error);
     }
   }, [user, fetchHistory]);
 
   return {
     history,
     isLoading,
     saveCurrentWeek,
     refreshHistory: fetchHistory,
   };
 };