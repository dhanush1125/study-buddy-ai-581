-- Create table to store weekly goal history snapshots
CREATE TABLE public.weekly_goal_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  week_start DATE NOT NULL,
  topics_completed INTEGER NOT NULL DEFAULT 0,
  quizzes_completed INTEGER NOT NULL DEFAULT 0,
  study_days INTEGER NOT NULL DEFAULT 0,
  topic_goal INTEGER NOT NULL DEFAULT 5,
  quiz_goal INTEGER NOT NULL DEFAULT 3,
  study_days_goal INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start)
);

-- Enable RLS
ALTER TABLE public.weekly_goal_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own history
CREATE POLICY "Users can view their own goal history"
ON public.weekly_goal_history
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own history
CREATE POLICY "Users can insert their own goal history"
ON public.weekly_goal_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow public read for parent view
CREATE POLICY "Allow public read for parent view"
ON public.weekly_goal_history
FOR SELECT
USING (true);