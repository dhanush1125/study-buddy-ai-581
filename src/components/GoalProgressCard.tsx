import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Target, CheckCircle2, AlertCircle, BookOpen, Brain, Calendar } from 'lucide-react';

interface GoalProgress {
  weeklyTopicGoal: number;
  weeklyQuizGoal: number;
  studyDaysGoal: number;
  topicsCompleted: number;
  quizzesCompleted: number;
  studyDays: number;
}

interface GoalProgressCardProps {
  progress: GoalProgress;
}

export const GoalProgressCard = ({ progress }: GoalProgressCardProps) => {
  const {
    weeklyTopicGoal,
    weeklyQuizGoal,
    studyDaysGoal,
    topicsCompleted,
    quizzesCompleted,
    studyDays,
  } = progress;

  const goals = [
    {
      label: 'Topics',
      current: topicsCompleted,
      target: weeklyTopicGoal,
      icon: BookOpen,
      color: 'blue',
    },
    {
      label: 'Quizzes',
      current: quizzesCompleted,
      target: weeklyQuizGoal,
      icon: Brain,
      color: 'green',
    },
    {
      label: 'Study Days',
      current: studyDays,
      target: studyDaysGoal,
      icon: Calendar,
      color: 'purple',
    },
  ];

  const allGoalsMet = goals.every((g) => g.current >= g.target);
  const someGoalsMet = goals.some((g) => g.current >= g.target);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Weekly Goals Progress
          </span>
          {allGoalsMet ? (
            <Badge className="bg-green-500/20 text-green-600 border-green-500/30 gap-1">
              <CheckCircle2 className="h-3 w-3" />
              All goals met!
            </Badge>
          ) : someGoalsMet ? (
            <Badge variant="secondary" className="gap-1">
              <AlertCircle className="h-3 w-3" />
              In progress
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1 text-muted-foreground">
              <AlertCircle className="h-3 w-3" />
              Needs attention
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {goals.map((goal) => {
          const percentage = Math.min(100, Math.round((goal.current / goal.target) * 100));
          const isMet = goal.current >= goal.target;
          const Icon = goal.icon;

          return (
            <div key={goal.label} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 text-${goal.color}-500`} />
                  {goal.label}
                </span>
                <span className={isMet ? 'text-green-600 font-medium' : 'text-muted-foreground'}>
                  {goal.current}/{goal.target}
                  {isMet && ' ✓'}
                </span>
              </div>
              <Progress
                value={percentage}
                className={`h-2 ${isMet ? '[&>div]:bg-green-500' : ''}`}
              />
            </div>
          );
        })}

        {!allGoalsMet && (
          <p className="text-xs text-muted-foreground text-center pt-2">
            {weeklyTopicGoal - topicsCompleted > 0 &&
              `${weeklyTopicGoal - topicsCompleted} more topic${weeklyTopicGoal - topicsCompleted !== 1 ? 's' : ''} needed`}
            {weeklyTopicGoal - topicsCompleted > 0 && weeklyQuizGoal - quizzesCompleted > 0 && ' • '}
            {weeklyQuizGoal - quizzesCompleted > 0 &&
              `${weeklyQuizGoal - quizzesCompleted} more quiz${weeklyQuizGoal - quizzesCompleted !== 1 ? 'zes' : ''} needed`}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
