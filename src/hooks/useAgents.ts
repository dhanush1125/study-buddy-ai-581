import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type Agent = {
  id: string;
  user_id: string;
  name: string;
  role: string;
  system_prompt: string;
  personality: string;
  goals: string;
  tools: string[];
  memory_enabled: boolean;
  model: string;
  is_public: boolean;
  category: string;
  description: string;
  avatar_emoji: string;
  clone_count: number;
  created_at: string;
  updated_at: string;
};

export const useAgents = () => {
  const { user } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) { setAgents([]); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from("agents").select("*").eq("user_id", user.id)
      .order("updated_at", { ascending: false });
    if (error) toast.error(error.message);
    else setAgents((data || []) as Agent[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const createAgent = async (input: Partial<Agent>) => {
    if (!user) return null;
    const { data, error } = await supabase.from("agents").insert({
      user_id: user.id,
      name: input.name || "New Agent",
      role: input.role || "",
      system_prompt: input.system_prompt || "",
      personality: input.personality || "Friendly",
      goals: input.goals || "",
      tools: input.tools || [],
      memory_enabled: input.memory_enabled ?? true,
      model: input.model || "google/gemini-2.5-flash",
      is_public: input.is_public ?? false,
      category: input.category || "general",
      description: input.description || "",
      avatar_emoji: input.avatar_emoji || "🤖",
    }).select().single();
    if (error) { toast.error(error.message); return null; }
    await refresh();
    return data as Agent;
  };

  const updateAgent = async (id: string, patch: Partial<Agent>) => {
    const { error } = await supabase.from("agents").update(patch).eq("id", id);
    if (error) { toast.error(error.message); return false; }
    await refresh();
    return true;
  };

  const deleteAgent = async (id: string) => {
    const { error } = await supabase.from("agents").delete().eq("id", id);
    if (error) { toast.error(error.message); return false; }
    await refresh();
    return true;
  };

  return { agents, loading, refresh, createAgent, updateAgent, deleteAgent };
};
