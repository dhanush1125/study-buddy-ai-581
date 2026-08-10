-- Trigger-only functions: never callable through the API
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.prevent_share_token_change() FROM PUBLIC, anon, authenticated;

-- Rating aggregates: signed-in users only
REVOKE ALL ON FUNCTION public.get_agent_rating_aggregates(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_agent_rating_aggregates(uuid[]) TO authenticated;

-- Parent view: intentionally reachable without an account, but only with a valid share token.
-- Remove the blanket PUBLIC grant and grant explicitly to the two API roles.
REVOKE ALL ON FUNCTION public.get_parent_view_data(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_parent_view_data(text) TO anon, authenticated;