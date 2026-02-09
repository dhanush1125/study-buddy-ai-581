import { useState, useEffect, useCallback } from 'react';
import { Achievement } from './useAchievements';

const SEEN_BADGES_KEY = 'studybuddy_seen_badges';

export const useBadgeNotifications = (achievements: Achievement[]) => {
  const [newlyEarnedBadges, setNewlyEarnedBadges] = useState<Achievement[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [currentCelebrationBadge, setCurrentCelebrationBadge] = useState<Achievement | null>(null);

  useEffect(() => {
    if (achievements.length === 0) return;

    // Get previously seen badges from localStorage
    const seenBadgesRaw = localStorage.getItem(SEEN_BADGES_KEY);
    const seenBadges: string[] = seenBadgesRaw ? JSON.parse(seenBadgesRaw) : [];

    // Find newly earned badges that haven't been seen
    const earnedBadges = achievements.filter(a => a.earned);
    const newBadges = earnedBadges.filter(badge => !seenBadges.includes(badge.id));

    if (newBadges.length > 0) {
      setNewlyEarnedBadges(newBadges);
      // Show celebration for the first new badge
      setCurrentCelebrationBadge(newBadges[0]);
      setShowCelebration(true);
    }
  }, [achievements]);

  const dismissCelebration = useCallback(() => {
    if (!currentCelebrationBadge) return;

    // Mark current badge as seen
    const seenBadgesRaw = localStorage.getItem(SEEN_BADGES_KEY);
    const seenBadges: string[] = seenBadgesRaw ? JSON.parse(seenBadgesRaw) : [];
    
    if (!seenBadges.includes(currentCelebrationBadge.id)) {
      seenBadges.push(currentCelebrationBadge.id);
      localStorage.setItem(SEEN_BADGES_KEY, JSON.stringify(seenBadges));
    }

    // Check if there are more badges to show
    const remainingBadges = newlyEarnedBadges.filter(b => b.id !== currentCelebrationBadge.id);
    
    if (remainingBadges.length > 0) {
      setNewlyEarnedBadges(remainingBadges);
      setCurrentCelebrationBadge(remainingBadges[0]);
    } else {
      setNewlyEarnedBadges([]);
      setCurrentCelebrationBadge(null);
      setShowCelebration(false);
    }
  }, [currentCelebrationBadge, newlyEarnedBadges]);

  const markAllAsSeen = useCallback(() => {
    const earnedBadgeIds = achievements.filter(a => a.earned).map(a => a.id);
    localStorage.setItem(SEEN_BADGES_KEY, JSON.stringify(earnedBadgeIds));
    setNewlyEarnedBadges([]);
    setCurrentCelebrationBadge(null);
    setShowCelebration(false);
  }, [achievements]);

  return {
    newlyEarnedBadges,
    showCelebration,
    currentCelebrationBadge,
    dismissCelebration,
    markAllAsSeen,
  };
};
