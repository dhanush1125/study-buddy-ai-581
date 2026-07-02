import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type AgentMessage = { id?: string; role: "user" | "assistant"; content: string };

export type AgentThread = { id: string; agent_id: string; title: string; updated_at: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-chat`;

export const useAgentThreads = (agentId: string | undefined) => {
  const { user } = useAuth();
  const [threads, setThreads] = useState<AgentThread[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user || !agentId) { setThreads([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("agent_threads").select("id, agent_id, title, updated_at")
      .eq("agent_id", agentId).eq("user_id", user.id)
      .order("updated_at", { ascending: false });
    setThreads((data || []) as AgentThread[]);
    setLoading(false);
  }, [user, agentId]);

  useEffect(() => { refresh(); }, [refresh]);

  const createThread = async (title = "New Chat") => {
    if (!user || !agentId) return null;
    const { data, error } = await supabase.from("agent_threads")
      .insert({ user_id: user.id, agent_id: agentId, title })
      .select().single();
    if (error) { toast.error(error.message); return null; }
    await refresh();
    return data as AgentThread;
  };

  const deleteThread = async (id: string) => {
    const { error } = await supabase.from("agent_threads").delete().eq("id", id);
    if (error) { toast.error(error.message); return false; }
    await refresh();
    return true;
  };

  const renameThread = async (id: string, title: string) => {
    await supabase.from("agent_threads").update({ title }).eq("id", id);
    await refresh();
  };

  return { threads, loading, refresh, createThread, deleteThread, renameThread };
};

export const useAgentChat = (threadId: string | undefined) => {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!threadId) { setMessages([]); return; }
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("agent_messages").select("id, role, content")
        .eq("thread_id", threadId).order("created_at", { ascending: true });
      setMessages((data || []).map((m: any) => ({
        id: m.id, role: m.role as "user" | "assistant", content: m.content,
      })));
      setLoading(false);
    })();
  }, [threadId]);

  const send = useCallback(async (text: string, opts?: {
    language?: string;
    studyFilters?: {
      courseType?: string;
      level?: string;
      timeCommitment?: string;
      budget?: string;
    };
  }) => {
    if (!threadId || !text.trim() || sending) return;
    const userMsg: AgentMessage = { role: "user", content: text.trim() };
    const next = [...messages, userMsg];
    setMessages([...next, { role: "assistant", content: "" }]);
    setSending(true);

    const { data: sess } = await supabase.auth.getSession();
    const token = sess.session?.access_token;

    abortRef.current = new AbortController();
    try {
      const res = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          threadId,
          language: opts?.language,
          studyFilters: opts?.studyFilters,
          messages: next.map(m => ({ role: m.role, content: m.content })),
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (res.status === 429) toast.error("Rate limited. Try again in a moment.");
        else if (res.status === 402) toast.error("AI credits exhausted. Add credits in Workspace settings.");
        else toast.error(err.error || "Chat failed");
        setMessages(next);
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          const line = buffer.slice(0, idx).trim();
          buffer = buffer.slice(idx + 1);
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              acc += delta;
              setMessages([...next, { role: "assistant", content: acc }]);
            }
          } catch { /* ignore */ }
        }
      }
    } catch (e: any) {
      if (e.name !== "AbortError") toast.error("Network error");
    } finally {
      setSending(false);
      abortRef.current = null;
    }
  }, [threadId, messages, sending]);

  const stop = () => abortRef.current?.abort();

  return { messages, loading, sending, send, stop };
};
