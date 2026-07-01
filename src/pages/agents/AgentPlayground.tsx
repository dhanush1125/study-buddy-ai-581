import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AgentLayout } from "@/components/agents/AgentLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAgentThreads, useAgentChat } from "@/hooks/useAgentChat";
import type { Agent } from "@/hooks/useAgents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STUDY_LANGUAGES } from "@/lib/agentTemplates";
import { Plus, Send, Trash2, MessageSquare, Square, Pencil, Languages } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const AgentPlayground = () => {
  const { agentId, threadId } = useParams();
  const navigate = useNavigate();
  const [agent, setAgent] = useState<Agent | null>(null);
  const { threads, createThread, deleteThread, renameThread } = useAgentThreads(agentId);
  const { messages, sending, send, stop } = useAgentChat(threadId);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const langKey = agentId ? `agent-lang:${agentId}` : "";
  const [language, setLanguage] = useState<string>(() => {
    if (typeof window === "undefined" || !langKey) return "auto";
    return localStorage.getItem(langKey) || "auto";
  });
  useEffect(() => {
    if (!langKey) return;
    setLanguage(localStorage.getItem(langKey) || "auto");
  }, [langKey]);
  const updateLanguage = (v: string) => {
    setLanguage(v);
    if (langKey) localStorage.setItem(langKey, v);
  };


  useEffect(() => {
    if (!agentId) return;
    (async () => {
      const { data } = await supabase.from("agents").select("*").eq("id", agentId).maybeSingle();
      if (!data) { toast.error("Agent not found"); navigate("/agents"); return; }
      setAgent(data as any);
    })();
  }, [agentId, navigate]);

  // If no thread in URL, create or pick one
  useEffect(() => {
    if (!agentId || threadId) return;
    (async () => {
      if (threads.length > 0) {
        navigate(`/agents/${agentId}/chat/${threads[0].id}`, { replace: true });
      } else {
        const t = await createThread();
        if (t) navigate(`/agents/${agentId}/chat/${t.id}`, { replace: true });
      }
    })();
  }, [agentId, threadId, threads, createThread, navigate]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { inputRef.current?.focus(); }, [threadId, sending]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput("");
    await send(text);
  };

  const newChat = async () => {
    const t = await createThread();
    if (t) navigate(`/agents/${agentId}/chat/${t.id}`);
  };

  return (
    <AgentLayout>
      <div className="flex flex-1 overflow-hidden">
        {/* Thread sidebar */}
        <aside className="w-64 border-r border-border/50 bg-card/30 flex flex-col">
          <div className="p-3 border-b border-border/50">
            <Button onClick={newChat} className="w-full gap-2" size="sm">
              <Plus className="w-4 h-4" /> New Chat
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {threads.length === 0 && (
              <p className="text-xs text-muted-foreground p-3">No chats yet.</p>
            )}
            {threads.map(t => (
              <div key={t.id} className={cn(
                "group flex items-center gap-1 rounded-md text-sm",
                t.id === threadId ? "bg-primary/10" : "hover:bg-muted"
              )}>
                <button onClick={() => navigate(`/agents/${agentId}/chat/${t.id}`)}
                  className="flex-1 text-left px-3 py-2 truncate flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{t.title}</span>
                </button>
                <button onClick={async (e) => {
                  e.stopPropagation();
                  const name = prompt("Rename chat", t.title);
                  if (name) await renameThread(t.id, name);
                }} className="opacity-0 group-hover:opacity-100 p-1.5">
                  <Pencil className="w-3 h-3 text-muted-foreground" />
                </button>
                <button onClick={async (e) => {
                  e.stopPropagation();
                  if (!confirm("Delete chat?")) return;
                  await deleteThread(t.id);
                  if (t.id === threadId) navigate(`/agents/${agentId}`);
                }} className="opacity-0 group-hover:opacity-100 p-1.5">
                  <Trash2 className="w-3 h-3 text-muted-foreground" />
                </button>
              </div>
            ))}
          </div>
        </aside>

        {/* Chat area */}
        <div className="flex-1 flex flex-col">
          {agent && (
            <header className="border-b border-border/50 p-4 flex items-center gap-3 bg-card/30 backdrop-blur">
              <div className="text-3xl">{agent.avatar_emoji}</div>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold">{agent.name}</h2>
                <p className="text-xs text-muted-foreground truncate">{agent.role}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate(`/agents/${agentId}/edit`)}>
                Edit
              </Button>
            </header>
          )}

          <div className="flex-1 overflow-y-auto p-6">
            {messages.length === 0 && agent && (
              <div className="max-w-md mx-auto text-center mt-12">
                <div className="text-6xl mb-4">{agent.avatar_emoji}</div>
                <h3 className="text-xl font-semibold mb-2">Chat with {agent.name}</h3>
                <p className="text-sm text-muted-foreground">{agent.description || agent.role}</p>
              </div>
            )}
            <div className="max-w-3xl mx-auto space-y-4">
              {messages.map((m, i) => (
                <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                  {m.role === "user" ? (
                    <Card className="px-4 py-2.5 max-w-[80%] bg-primary text-primary-foreground border-0">
                      <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                    </Card>
                  ) : (
                    <div className="max-w-[80%] text-sm whitespace-pre-wrap leading-relaxed">
                      {m.content || <span className="text-muted-foreground">Thinking…</span>}
                    </div>
                  )}
                </div>
              ))}
              <div ref={endRef} />
            </div>
          </div>

          <form onSubmit={submit} className="border-t border-border/50 p-4 bg-card/30 backdrop-blur">
            <div className="max-w-3xl mx-auto flex gap-2">
              <Input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                placeholder="Message your agent..." disabled={!threadId} />
              {sending ? (
                <Button type="button" variant="outline" onClick={stop} className="gap-2">
                  <Square className="w-4 h-4" /> Stop
                </Button>
              ) : (
                <Button type="submit" disabled={!input.trim() || !threadId} className="gap-2">
                  <Send className="w-4 h-4" />
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </AgentLayout>
  );
};

export default AgentPlayground;
