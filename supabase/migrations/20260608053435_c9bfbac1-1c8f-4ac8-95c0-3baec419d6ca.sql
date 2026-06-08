
-- Drop overly permissive policies
DROP POLICY IF EXISTS "Anyone can view active links by token" ON public.parent_share_links;
DROP POLICY IF EXISTS "Allow public read for parent view" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Allow public read for parent view" ON public.student_topics;
DROP POLICY IF EXISTS "Allow public read for parent view" ON public.weekly_goal_history;

-- Secure token-scoped data accessor
CREATE OR REPLACE FUNCTION public.get_parent_view_data(_token text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _link public.parent_share_links%ROWTYPE;
  _result jsonb;
BEGIN
  IF _token IS NULL OR length(_token) < 16 THEN
    RETURN NULL;
  END IF;

  SELECT * INTO _link
  FROM public.parent_share_links
  WHERE share_token = _token
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'link', jsonb_build_object(
      'user_id', _link.user_id,
      'label', _link.label,
      'is_active', _link.is_active,
      'expires_at', _link.expires_at,
      'report_email', _link.report_email,
      'report_scheduled_date', _link.report_scheduled_date,
      'report_sent_at', _link.report_sent_at
    ),
    'topics', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', t.id,
        'topic_name', t.topic_name,
        'subject', t.subject,
        'difficulty', t.difficulty,
        'completed_at', t.completed_at
      ) ORDER BY t.completed_at DESC)
      FROM public.student_topics t
      WHERE t.user_id = _link.user_id
    ), '[]'::jsonb),
    'quizzes', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', q.id,
        'topic_name', q.topic_name,
        'subject', q.subject,
        'score', q.score,
        'total_questions', q.total_questions,
        'percentage', q.percentage,
        'attempted_at', q.attempted_at
      ) ORDER BY q.attempted_at DESC)
      FROM public.quiz_attempts q
      WHERE q.user_id = _link.user_id
    ), '[]'::jsonb),
    'preferences', (
      SELECT jsonb_build_object(
        'weekly_topic_goal', p.weekly_topic_goal,
        'weekly_quiz_goal', p.weekly_quiz_goal,
        'study_days_goal', p.study_days_goal
      )
      FROM public.user_preferences p
      WHERE p.user_id = _link.user_id
      LIMIT 1
    ),
    'goal_history', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', g.id,
        'week_start', g.week_start,
        'topics_completed', g.topics_completed,
        'quizzes_completed', g.quizzes_completed,
        'study_days', g.study_days,
        'topic_goal', g.topic_goal,
        'quiz_goal', g.quiz_goal,
        'study_days_goal', g.study_days_goal
      ) ORDER BY g.week_start ASC)
      FROM (
        SELECT * FROM public.weekly_goal_history
        WHERE user_id = _link.user_id
        ORDER BY week_start ASC
        LIMIT 12
      ) g
    ), '[]'::jsonb)
  ) INTO _result;

  RETURN _result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_parent_view_data(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_parent_view_data(text) TO anon, authenticated;
