-- Create topics table for tracking learned subjects
CREATE TABLE public.student_topics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  topic_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'beginner',
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  UNIQUE(user_id, topic_name)
);

-- Create quiz attempts table for tracking performance
CREATE TABLE public.quiz_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  topic_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  percentage DECIMAL(5,2) NOT NULL,
  attempted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.student_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

-- RLS policies for student_topics
CREATE POLICY "Users can view their own topics"
ON public.student_topics FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own topics"
ON public.student_topics FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own topics"
ON public.student_topics FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own topics"
ON public.student_topics FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for quiz_attempts
CREATE POLICY "Users can view their own quiz attempts"
ON public.quiz_attempts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own quiz attempts"
ON public.quiz_attempts FOR INSERT
WITH CHECK (auth.uid() = user_id);