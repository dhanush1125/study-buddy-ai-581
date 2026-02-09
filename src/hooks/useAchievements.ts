import { useMemo } from 'react';
import { GoalHistoryData } from './useGoalHistory';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedDate?: string;
  progress?: number;
  maxProgress?: number;
  tier?: 'bronze' | 'silver' | 'gold' | 'platinum';
}

const GOAL_THRESHOLD = 80; // Consider goal met if overall rate >= 80%

export const useAchievements = (history: GoalHistoryData[]) => {
  const achievements = useMemo(() => {
    const sortedHistory = [...history].sort((a, b) => 
      new Date(a.week).getTime() - new Date(b.week).getTime()
    );

    // Calculate consecutive weeks meeting goals
    let currentStreak = 0;
    let maxStreak = 0;
    let lastEarnedWeek: string | undefined;

    for (const week of sortedHistory) {
      if (week.overallRate >= GOAL_THRESHOLD) {
        currentStreak++;
        lastEarnedWeek = week.weekLabel;
        if (currentStreak > maxStreak) {
          maxStreak = currentStreak;
        }
      } else {
        currentStreak = 0;
      }
    }

    // Calculate topic-specific streaks
    let topicStreak = 0;
    for (const week of sortedHistory.slice().reverse()) {
      if (week.topicsRate >= 100) {
        topicStreak++;
      } else {
        break;
      }
    }

    // Calculate quiz-specific streaks
    let quizStreak = 0;
    for (const week of sortedHistory.slice().reverse()) {
      if (week.quizzesRate >= 100) {
        quizStreak++;
      } else {
        break;
      }
    }

    // Calculate study days streaks
    let studyStreak = 0;
    for (const week of sortedHistory.slice().reverse()) {
      if (week.studyDaysRate >= 100) {
        studyStreak++;
      } else {
        break;
      }
    }

    // Total weeks with any progress
    const activeWeeks = sortedHistory.filter(w => w.overallRate > 0).length;

    // Perfect weeks (100% on all goals)
    const perfectWeeks = sortedHistory.filter(
      w => w.topicsRate >= 100 && w.quizzesRate >= 100 && w.studyDaysRate >= 100
    ).length;

    const achievementsList: Achievement[] = [
      // Streak-based achievements
      {
        id: 'goal-crusher',
        name: 'Goal Crusher',
        description: 'Meet your weekly goals for 4 weeks in a row',
        icon: '🔥',
        earned: currentStreak >= 4,
        earnedDate: currentStreak >= 4 ? lastEarnedWeek : undefined,
        progress: Math.min(currentStreak, 4),
        maxProgress: 4,
        tier: currentStreak >= 12 ? 'platinum' : currentStreak >= 8 ? 'gold' : currentStreak >= 4 ? 'silver' : 'bronze',
      },
      {
        id: 'unstoppable',
        name: 'Unstoppable',
        description: 'Meet your weekly goals for 8 weeks in a row',
        icon: '⚡',
        earned: currentStreak >= 8,
        earnedDate: currentStreak >= 8 ? lastEarnedWeek : undefined,
        progress: Math.min(currentStreak, 8),
        maxProgress: 8,
        tier: currentStreak >= 8 ? 'gold' : 'bronze',
      },
      {
        id: 'legendary',
        name: 'Legendary',
        description: 'Meet your weekly goals for 12 weeks in a row',
        icon: '👑',
        earned: currentStreak >= 12,
        earnedDate: currentStreak >= 12 ? lastEarnedWeek : undefined,
        progress: Math.min(currentStreak, 12),
        maxProgress: 12,
        tier: currentStreak >= 12 ? 'platinum' : 'bronze',
      },

      // Category-specific achievements
      {
        id: 'topic-master',
        name: 'Topic Master',
        description: 'Complete all topic goals for 3 weeks straight',
        icon: '📚',
        earned: topicStreak >= 3,
        progress: Math.min(topicStreak, 3),
        maxProgress: 3,
        tier: topicStreak >= 6 ? 'gold' : topicStreak >= 3 ? 'silver' : 'bronze',
      },
      {
        id: 'quiz-champion',
        name: 'Quiz Champion',
        description: 'Complete all quiz goals for 3 weeks straight',
        icon: '🧠',
        earned: quizStreak >= 3,
        progress: Math.min(quizStreak, 3),
        maxProgress: 3,
        tier: quizStreak >= 6 ? 'gold' : quizStreak >= 3 ? 'silver' : 'bronze',
      },
      {
        id: 'dedicated-learner',
        name: 'Dedicated Learner',
        description: 'Meet study day goals for 3 weeks straight',
        icon: '📅',
        earned: studyStreak >= 3,
        progress: Math.min(studyStreak, 3),
        maxProgress: 3,
        tier: studyStreak >= 6 ? 'gold' : studyStreak >= 3 ? 'silver' : 'bronze',
      },

      // Milestone achievements
      {
        id: 'first-steps',
        name: 'First Steps',
        description: 'Complete your first week of studying',
        icon: '🌟',
        earned: activeWeeks >= 1,
        progress: Math.min(activeWeeks, 1),
        maxProgress: 1,
        tier: 'bronze',
      },
      {
        id: 'perfectionist',
        name: 'Perfectionist',
        description: 'Achieve 100% on all goals in a single week',
        icon: '💎',
        earned: perfectWeeks >= 1,
        progress: Math.min(perfectWeeks, 1),
        maxProgress: 1,
        tier: perfectWeeks >= 4 ? 'gold' : perfectWeeks >= 1 ? 'silver' : 'bronze',
      },
      {
        id: 'consistent',
        name: 'Consistent',
        description: 'Study for 4 different weeks',
        icon: '🎯',
        earned: activeWeeks >= 4,
        progress: Math.min(activeWeeks, 4),
        maxProgress: 4,
        tier: activeWeeks >= 8 ? 'gold' : activeWeeks >= 4 ? 'silver' : 'bronze',
      },
    ];

    return achievementsList;
  }, [history]);

  const earnedCount = achievements.filter(a => a.earned).length;
  const totalCount = achievements.length;

  return {
    achievements,
    earnedCount,
    totalCount,
    currentStreak: useMemo(() => {
      const sortedHistory = [...history].sort((a, b) => 
        new Date(a.week).getTime() - new Date(b.week).getTime()
      );
      let streak = 0;
      for (const week of sortedHistory.slice().reverse()) {
        if (week.overallRate >= GOAL_THRESHOLD) {
          streak++;
        } else {
          break;
        }
      }
      return streak;
    }, [history]),
  };
};
