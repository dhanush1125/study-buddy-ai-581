import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Target, Check, Loader2 } from 'lucide-react';

interface StudyGoals {
  weeklyTopicGoal: number;
  weeklyQuizGoal: number;
  studyDaysGoal: number;
}

interface StudyGoalSettingsProps {
  goals: StudyGoals;
  onSave: (goals: StudyGoals) => Promise<void>;
  isSaving?: boolean;
}

export const StudyGoalSettings = ({ goals, onSave, isSaving = false }: StudyGoalSettingsProps) => {
  const [weeklyTopicGoal, setWeeklyTopicGoal] = useState(goals.weeklyTopicGoal);
  const [weeklyQuizGoal, setWeeklyQuizGoal] = useState(goals.weeklyQuizGoal);
  const [studyDaysGoal, setStudyDaysGoal] = useState(goals.studyDaysGoal);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setWeeklyTopicGoal(goals.weeklyTopicGoal);
    setWeeklyQuizGoal(goals.weeklyQuizGoal);
    setStudyDaysGoal(goals.studyDaysGoal);
  }, [goals]);

  useEffect(() => {
    const changed =
      weeklyTopicGoal !== goals.weeklyTopicGoal ||
      weeklyQuizGoal !== goals.weeklyQuizGoal ||
      studyDaysGoal !== goals.studyDaysGoal;
    setHasChanges(changed);
  }, [weeklyTopicGoal, weeklyQuizGoal, studyDaysGoal, goals]);

  const handleSave = async () => {
    await onSave({
      weeklyTopicGoal,
      weeklyQuizGoal,
      studyDaysGoal,
    });
    setHasChanges(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          Weekly Study Goals
        </CardTitle>
        <CardDescription>
          Set your weekly targets — parents can see if you're meeting them!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Topics Goal */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="topic-goal">Topics per Week</Label>
            <span className="text-sm font-medium text-primary">{weeklyTopicGoal} topics</span>
          </div>
          <Slider
            id="topic-goal"
            value={[weeklyTopicGoal]}
            onValueChange={([value]) => setWeeklyTopicGoal(value)}
            min={1}
            max={20}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1 topic</span>
            <span>10</span>
            <span>20 topics</span>
          </div>
        </div>

        {/* Quizzes Goal */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="quiz-goal">Quizzes per Week</Label>
            <span className="text-sm font-medium text-primary">{weeklyQuizGoal} quizzes</span>
          </div>
          <Slider
            id="quiz-goal"
            value={[weeklyQuizGoal]}
            onValueChange={([value]) => setWeeklyQuizGoal(value)}
            min={1}
            max={15}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1 quiz</span>
            <span>7</span>
            <span>15 quizzes</span>
          </div>
        </div>

        {/* Study Days Goal */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="days-goal">Study Days per Week</Label>
            <span className="text-sm font-medium text-primary">{studyDaysGoal} days</span>
          </div>
          <Slider
            id="days-goal"
            value={[studyDaysGoal]}
            onValueChange={([value]) => setStudyDaysGoal(value)}
            min={1}
            max={7}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1 day</span>
            <span>4</span>
            <span>7 days</span>
          </div>
        </div>

        {hasChanges && (
          <Button onClick={handleSave} disabled={isSaving} className="w-full gap-2">
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Save Goals
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
