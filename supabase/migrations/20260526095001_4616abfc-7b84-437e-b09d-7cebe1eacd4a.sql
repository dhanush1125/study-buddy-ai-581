
-- AGENTS
CREATE TABLE public.agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT '',
  system_prompt TEXT NOT NULL DEFAULT '',
  personality TEXT NOT NULL DEFAULT 'friendly',
  goals TEXT NOT NULL DEFAULT '',
  tools JSONB NOT NULL DEFAULT '[]'::jsonb,
  memory_enabled BOOLEAN NOT NULL DEFAULT true,
  model TEXT NOT NULL DEFAULT 'google/gemini-2.5-flash',
  is_public BOOLEAN NOT NULL DEFAULT false,
  category TEXT NOT NULL DEFAULT 'general',
  description TEXT NOT NULL DEFAULT '',
  avatar_emoji TEXT NOT NULL DEFAULT '🤖',
  clone_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage own agents select" ON public.agents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Public agents are viewable" ON public.agents FOR SELECT USING (is_public = true);
CREATE POLICY "Owners insert own agents" ON public.agents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners update own agents" ON public.agents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Owners delete own agents" ON public.agents FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER trg_agents_updated BEFORE UPDATE ON public.agents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- THREADS
CREATE TABLE public.agent_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'New Chat',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.agent_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own threads" ON public.agent_threads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own threads" ON public.agent_threads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own threads" ON public.agent_threads FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own threads" ON public.agent_threads FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER trg_agent_threads_updated BEFORE UPDATE ON public.agent_threads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_threads_agent ON public.agent_threads(agent_id);
CREATE INDEX idx_threads_user ON public.agent_threads(user_id);

-- MESSAGES
CREATE TABLE public.agent_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.agent_threads(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.agent_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own messages" ON public.agent_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.agent_threads t WHERE t.id = thread_id AND t.user_id = auth.uid())
);
CREATE POLICY "Users insert own messages" ON public.agent_messages FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.agent_threads t WHERE t.id = thread_id AND t.user_id = auth.uid())
);
CREATE POLICY "Users delete own messages" ON public.agent_messages FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.agent_threads t WHERE t.id = thread_id AND t.user_id = auth.uid())
);

CREATE INDEX idx_messages_thread ON public.agent_messages(thread_id, created_at);

-- RATINGS
CREATE TABLE public.agent_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (agent_id, user_id)
);
ALTER TABLE public.agent_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view ratings" ON public.agent_ratings FOR SELECT USING (true);
CREATE POLICY "Auth users insert own rating" ON public.agent_ratings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own rating" ON public.agent_ratings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own rating" ON public.agent_ratings FOR DELETE USING (auth.uid() = user_id);
