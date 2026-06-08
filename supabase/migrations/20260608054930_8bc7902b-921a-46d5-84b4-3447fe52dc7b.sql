
DROP VIEW IF EXISTS public.agent_ratings_public;

CREATE OR REPLACE FUNCTION public.get_agent_rating_aggregates(_agent_ids uuid[])
RETURNS TABLE(agent_id uuid, avg_rating numeric, rating_count bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT r.agent_id, ROUND(AVG(r.rating)::numeric, 2) AS avg_rating, COUNT(*)::bigint AS rating_count
  FROM public.agent_ratings r
  WHERE r.agent_id = ANY(_agent_ids)
  GROUP BY r.agent_id;
$$;

REVOKE ALL ON FUNCTION public.get_agent_rating_aggregates(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_agent_rating_aggregates(uuid[]) TO anon, authenticated;
