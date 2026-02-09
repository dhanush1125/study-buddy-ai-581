import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Award, Trophy, Flame, Lock } from 'lucide-react';
import { useGoalHistory } from '@/hooks/useGoalHistory';
import { useAchievements, Achievement } from '@/hooks/useAchievements';
import { cn } from '@/lib/utils';

interface AchievementBadgesProps {
  userId?: string;
  compact?: boolean;
}

const tierColors = {
  bronze: 'from-amber-600 to-amber-800',
  silver: 'from-slate-300 to-slate-500',
  gold: 'from-yellow-400 to-yellow-600',
  platinum: 'from-cyan-300 to-purple-400',
};

const tierBorderColors = {
  bronze: 'border-amber-600/50',
  silver: 'border-slate-400/50',
  gold: 'border-yellow-500/50',
  platinum: 'border-cyan-400/50',
};

const AchievementBadge = ({ achievement, compact }: { achievement: Achievement; compact?: boolean }) => {
  const isEarned = achievement.earned;
  const tier = achievement.tier || 'bronze';
  
  if (compact) {
    return (
      <div
        className={cn(
          'relative flex items-center gap-2 p-2 rounded-lg transition-all',
          isEarned 
            ? 'bg-gradient-to-r ' + tierColors[tier] + ' text-white shadow-md' 
            : 'bg-muted/50 text-muted-foreground opacity-60'
        )}
        title={`${achievement.name}: ${achievement.description}`}
      >
        <span className="text-lg">{achievement.icon}</span>
        <span className="text-xs font-medium truncate">{achievement.name}</span>
        {!isEarned && <Lock className="w-3 h-3 absolute top-1 right-1" />}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative flex flex-col items-center p-4 rounded-xl border-2 transition-all',
        isEarned 
          ? `bg-gradient-to-br ${tierColors[tier]} text-white shadow-lg ${tierBorderColors[tier]}` 
          : 'bg-muted/30 border-muted text-muted-foreground'
      )}
    >
      {!isEarned && (
        <div className="absolute inset-0 bg-background/60 rounded-xl flex items-center justify-center backdrop-blur-[1px]">
          <Lock className="w-6 h-6 text-muted-foreground/50" />
        </div>
      )}
      
      <span className="text-3xl mb-2">{achievement.icon}</span>
      <h4 className="font-semibold text-sm text-center">{achievement.name}</h4>
      <p className={cn(
        'text-xs text-center mt-1',
        isEarned ? 'text-white/80' : 'text-muted-foreground'
      )}>
        {achievement.description}
      </p>
      
      {!isEarned && achievement.progress !== undefined && achievement.maxProgress && (
        <div className="w-full mt-3">
          <Progress 
            value={(achievement.progress / achievement.maxProgress) * 100} 
            className="h-1.5"
          />
          <p className="text-xs text-center mt-1 text-muted-foreground">
            {achievement.progress}/{achievement.maxProgress}
          </p>
        </div>
      )}
      
      {isEarned && achievement.earnedDate && (
        <p className="text-xs text-white/70 mt-2">Earned: {achievement.earnedDate}</p>
      )}
    </div>
  );
};

export const AchievementBadges = ({ userId, compact = false }: AchievementBadgesProps) => {
  const { history, isLoading } = useGoalHistory(userId);
  const { achievements, earnedCount, totalCount, currentStreak } = useAchievements(history);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-muted rounded-xl" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const earnedAchievements = achievements.filter(a => a.earned);
  const lockedAchievements = achievements.filter(a => !a.earned);

  if (compact) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              Achievements
            </span>
            <Badge variant="secondary" className="gap-1">
              {earnedCount}/{totalCount}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {currentStreak > 0 && (
            <div className="flex items-center gap-2 p-2 bg-orange-500/10 rounded-lg border border-orange-500/20">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
                {currentStreak} week streak!
              </span>
            </div>
          )}
          
          {earnedAchievements.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {earnedAchievements.slice(0, 4).map(achievement => (
                <AchievementBadge key={achievement.id} achievement={achievement} compact />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-2">
              Keep studying to earn badges!
            </p>
          )}
          
          {earnedAchievements.length > 4 && (
            <p className="text-xs text-muted-foreground text-center">
              +{earnedAchievements.length - 4} more earned
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-500" />
            Achievement Badges
          </span>
          <div className="flex items-center gap-3">
            {currentStreak > 0 && (
              <Badge className="gap-1 bg-orange-500/20 text-orange-600 border-orange-500/30">
                <Flame className="w-3 h-3" />
                {currentStreak} week streak
              </Badge>
            )}
            <Badge variant="outline">
              {earnedCount}/{totalCount} Earned
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {earnedAchievements.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              Earned Badges
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {earnedAchievements.map(achievement => (
                <AchievementBadge key={achievement.id} achievement={achievement} />
              ))}
            </div>
          </div>
        )}

        {lockedAchievements.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2 text-muted-foreground">
              <Lock className="w-4 h-4" />
              Locked Badges
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {lockedAchievements.map(achievement => (
                <AchievementBadge key={achievement.id} achievement={achievement} />
              ))}
            </div>
          </div>
        )}

        {history.length === 0 && (
          <div className="text-center py-8">
            <Award className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">
              Start studying to earn achievement badges!
            </p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Complete weekly goals consistently to unlock rewards
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
