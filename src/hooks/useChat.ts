import { useState, useRef, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type Message = {
  id?: string;
  role: "user" | "assistant";
  content: string;
  image?: string;
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

export const useChat = (conversationId: string | null) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load messages when conversation changes
  useEffect(() => {
    const loadMessages = async () => {
      if (!conversationId || !user) {
        setMessages([]);
        return;
      }

      setMessagesLoading(true);
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error loading messages:", error);
      } else {
        setMessages(
          data?.map((m) => ({
            id: m.id,
            role: m.role as "user" | "assistant",
            content: m.content,
            image: m.image || undefined,
          })) || []
        );
      }
      setMessagesLoading(false);
    };

    loadMessages();
  }, [conversationId, user]);

  const saveMessage = useCallback(
    async (message: Message) => {
      if (!conversationId || !user) return null;

      const { data, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          role: message.role,
          content: message.content,
          image: message.image || null,
        })
        .select()
        .single();

      if (error) {
        console.error("Error saving message:", error);
        return null;
      }

      return data;
    },
    [conversationId, user]
  );

  const updateMessage = useCallback(
    async (id: string, content: string) => {
      if (!user) return;

      const { error } = await supabase
        .from("messages")
        .update({ content })
        .eq("id", id);

      if (error) {
        console.error("Error updating message:", error);
      }
    },
    [user]
  );

  const sendMessage = useCallback(
    async (input: string, imageBase64?: string) => {
      if ((!input.trim() && !imageBase64) || isLoading) return;

      const userMessage: Message = {
        role: "user",
        content: input.trim() || "Analyze this image",
        image: imageBase64,
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      // Save user message
      const savedUserMessage = await saveMessage(userMessage);
      if (savedUserMessage) {
        setMessages((prev) =>
          prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, id: savedUserMessage.id } : m
          )
        );
      }

      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch(CHAT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            message: input.trim() || "Analyze this image and explain what you see",
            image: imageBase64,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          toast.error(errorData.error || "Failed to get response");
          setIsLoading(false);
          return;
        }

        if (!response.body) {
          toast.error("No response body");
          setIsLoading(false);
          return;
        }

        // Stream handling
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let textBuffer = "";
        let assistantContent = "";
        let assistantMessageId: string | null = null;

        // Add empty assistant message that we'll update
        const assistantMessage: Message = { role: "assistant", content: "" };
        setMessages((prev) => [...prev, assistantMessage]);

        // Save empty assistant message to get ID
        const savedAssistantMessage = await saveMessage(assistantMessage);
        if (savedAssistantMessage) {
          assistantMessageId = savedAssistantMessage.id;
          setMessages((prev) =>
            prev.map((m, i) =>
              i === prev.length - 1 ? { ...m, id: savedAssistantMessage.id } : m
            )
          );
        }

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          textBuffer += decoder.decode(value, { stream: true });

          // Process line-by-line
          let newlineIndex: number;
          while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
            let line = textBuffer.slice(0, newlineIndex);
            textBuffer = textBuffer.slice(newlineIndex + 1);

            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (line.startsWith(":") || line.trim() === "") continue;
            if (!line.startsWith("data: ")) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") break;

            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content as
                | string
                | undefined;
              if (content) {
                assistantContent += content;
                // Update the last message with new content
                setMessages((prev) => {
                  const newMessages = [...prev];
                  const lastMessage = newMessages[newMessages.length - 1];
                  if (lastMessage?.role === "assistant") {
                    newMessages[newMessages.length - 1] = {
                      ...lastMessage,
                      content: assistantContent,
                    };
                  }
                  return newMessages;
                });
              }
            } catch {
              // Incomplete JSON, put it back and wait for more data
              textBuffer = line + "\n" + textBuffer;
              break;
            }
          }
        }

        // Final flush for any remaining content
        if (textBuffer.trim()) {
          for (let raw of textBuffer.split("\n")) {
            if (!raw) continue;
            if (raw.endsWith("\r")) raw = raw.slice(0, -1);
            if (raw.startsWith(":") || raw.trim() === "") continue;
            if (!raw.startsWith("data: ")) continue;
            const jsonStr = raw.slice(6).trim();
            if (jsonStr === "[DONE]") continue;
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content as
                | string
                | undefined;
              if (content) {
                assistantContent += content;
                setMessages((prev) => {
                  const newMessages = [...prev];
                  const lastMessage = newMessages[newMessages.length - 1];
                  if (lastMessage?.role === "assistant") {
                    newMessages[newMessages.length - 1] = {
                      ...lastMessage,
                      content: assistantContent,
                    };
                  }
                  return newMessages;
                });
              }
            } catch {
              /* ignore */
            }
          }
        }

        // Save final assistant message content
        if (assistantMessageId && assistantContent) {
          await updateMessage(assistantMessageId, assistantContent);
        }
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          console.log("Request aborted");
        } else {
          console.error("Chat error:", error);
          toast.error("Something went wrong. Please try again.");
        }
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [isLoading, saveMessage, updateMessage]
  );

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    messagesLoading,
    sendMessage,
    stopGeneration,
    clearChat,
  };
};
