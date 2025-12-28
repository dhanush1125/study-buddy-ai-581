import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export const useConversations = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    if (!user) {
      setConversations([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching conversations:", error);
    } else {
      setConversations(data || []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const createConversation = useCallback(async (title?: string) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from("conversations")
      .insert({
        user_id: user.id,
        title: title || "New Conversation",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating conversation:", error);
      return null;
    }

    setConversations((prev) => [data, ...prev]);
    return data;
  }, [user]);

  const updateConversationTitle = useCallback(async (id: string, title: string) => {
    const { error } = await supabase
      .from("conversations")
      .update({ title })
      .eq("id", id);

    if (error) {
      console.error("Error updating conversation:", error);
      return;
    }

    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title } : c))
    );
  }, []);

  const deleteConversation = useCallback(async (id: string) => {
    const { error } = await supabase
      .from("conversations")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting conversation:", error);
      return;
    }

    setConversations((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return {
    conversations,
    loading,
    createConversation,
    updateConversationTitle,
    deleteConversation,
    refreshConversations: fetchConversations,
  };
};
