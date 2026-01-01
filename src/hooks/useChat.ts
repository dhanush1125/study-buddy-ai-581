import { useState, useRef, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type Message = {
  id?: string;
  role: "user" | "assistant";
  content: string;
  image?: string;
  generatedImages?: string[]; // For AI-generated images
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
const IMAGE_GEN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-image`;

// Helper to extract image generation requests from content
const extractImageRequests = (content: string): { prompts: string[]; cleanContent: string } => {
  const regex = /\[GENERATE_IMAGE:\s*([^\]]+)\]/g;
  const prompts: string[] = [];
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    prompts.push(match[1].trim());
  }
  
  // Replace the markers with a placeholder for rendering
  const cleanContent = content.replace(regex, '\n\n🖼️ *Generating educational image...*\n\n');
  
  return { prompts, cleanContent };
};

// Generate an image using the edge function
const generateImage = async (prompt: string): Promise<string | null> => {
  try {
    const response = await fetch(IMAGE_GEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      console.error("Image generation failed:", response.status);
      return null;
    }

    const data = await response.json();
    return data.imageUrl || null;
  } catch (error) {
    console.error("Image generation error:", error);
    return null;
  }
};

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

        // Check for image generation requests after streaming is complete
        const { prompts, cleanContent } = extractImageRequests(assistantContent);
        
        if (prompts.length > 0) {
          // Update content to show loading state
          setMessages((prev) => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage?.role === "assistant") {
              newMessages[newMessages.length - 1] = {
                ...lastMessage,
                content: cleanContent,
              };
            }
            return newMessages;
          });

          // Generate images (only first one to avoid overload)
          const generatedImages: string[] = [];
          for (const prompt of prompts.slice(0, 1)) {
            const imageUrl = await generateImage(prompt);
            if (imageUrl) {
              generatedImages.push(imageUrl);
            }
          }

          // Update message with generated images
          if (generatedImages.length > 0) {
            const finalContent = cleanContent.replace(
              '🖼️ *Generating educational image...*',
              '🖼️ *Educational diagram generated:*'
            );
            
            setMessages((prev) => {
              const newMessages = [...prev];
              const lastMessage = newMessages[newMessages.length - 1];
              if (lastMessage?.role === "assistant") {
                newMessages[newMessages.length - 1] = {
                  ...lastMessage,
                  content: finalContent,
                  generatedImages,
                };
              }
              return newMessages;
            });
            
            assistantContent = finalContent;
          } else {
            // Image generation failed, update content
            const finalContent = cleanContent.replace(
              '🖼️ *Generating educational image...*',
              '🖼️ *[Image generation unavailable - here\'s the concept in text form]*'
            );
            
            setMessages((prev) => {
              const newMessages = [...prev];
              const lastMessage = newMessages[newMessages.length - 1];
              if (lastMessage?.role === "assistant") {
                newMessages[newMessages.length - 1] = {
                  ...lastMessage,
                  content: finalContent,
                };
              }
              return newMessages;
            });
            
            assistantContent = finalContent;
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
