-- Allow public SELECT access to student_topics and quiz_attempts for parent view
-- These policies allow reading data when accessed through a valid share token
-- The token validation happens in the application layer

CREATE POLICY "Allow public read for parent view"
  ON public.student_topics FOR SELECT
  USING (true);

CREATE POLICY "Allow public read for parent view"
  ON public.quiz_attempts FOR SELECT
  USING (true);