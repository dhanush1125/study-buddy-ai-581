-- Add study goal columns to user_preferences
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS weekly_topic_goal INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS weekly_quiz_goal INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS study_days_goal INTEGER DEFAULT 5;