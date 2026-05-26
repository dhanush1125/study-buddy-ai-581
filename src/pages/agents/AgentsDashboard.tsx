import { Link } from "react-router-dom";
import { AgentLayout } from "@/components/agents/AgentLayout";
import { useAgents } from "@/hooks/useAgents";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, MessageSquare, Bot, Zap, TrendingUp, Trash2, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";

const AgentsDashboard = () => {
  const { agents, loading, deleteAgent } = useAgents();
  const { user } = useAuth();
  const [stats, setStats] = useState({ threads: 0, messages: 0 });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ count: threads }, { data: msgRows }] = await Promise.all([
        supabase.from("agent_threads").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("agent_threads").select("id").eq("user_id", user.id),
      ]);
      const ids = (msgRows || []).map(t => t.id);
      let messages = 0;
      if (ids.length) {
        const { count } = await supabase.from("agent_messages")
          .select("id", { count: "exact", head: true }).in("thread_id", ids);
        messages = count || 0;
      }
      setStats({ threads: threads || 0, messages });
    })();
  }, [user, agents.length]);

  return (
    <AgentLayout>
      <div className="p-8 overflow-y-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Your Agents</h1>
            <p className="text-muted-foreground mt-1">Build, deploy, and chat with custom AI agents.</p>
          </div>
          <Link to="/agents/new">
            <Button className="gap-2"><Plus className="w-4 h-4" /> New Agent</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard icon={Bot} label="Active Agents" value={agents.length} />
          <StatCard icon={MessageSquare} label="Conversations" value={stats.threads} />
          <StatCard icon={Zap} label="Total Messages" value={stats.messages} />
        </div>

        {loading ? (
          <div className="text-muted-foreground">Loading agents...</div>
        ) : agents.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <Bot className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No agents yet</h3>
            <p className="text-muted-foreground mb-4">Create your first AI agent in seconds.</p>
            <Link to="/agents/new"><Button>Create Agent</Button></Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map(a => (
              <Card key={a.id} className="p-5 hover:border-primary/50 transition-colors group relative">
                <div className="flex items-start gap-3 mb-3">
                  <div className="text-3xl">{a.avatar_emoji}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{a.name}</h3>
                    <p className="text-xs text-muted-foreground truncate">{a.role}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4 min-h-[2.5rem]">
                  {a.description || "No description"}
                </p>
                <div className="flex items-center gap-2">
                  <Link to={`/agents/${a.id}`} className="flex-1">
                    <Button className="w-full gap-2" size="sm">
                      <MessageSquare className="w-3.5 h-3.5" /> Chat
                    </Button>
                  </Link>
                  <Link to={`/agents/${a.id}/edit`}>
                    <Button size="icon" variant="outline"><Pencil className="w-3.5 h-3.5" /></Button>
                  </Link>
                  <Button size="icon" variant="outline" onClick={() => {
                    if (confirm(`Delete ${a.name}?`)) deleteAgent(a.id);
                  }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
                {a.is_public && (
                  <div className="absolute top-2 right-2 text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    PUBLIC
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </AgentLayout>
  );
};

const StatCard = ({ icon: Icon, label, value }: any) => (
  <Card className="p-5 bg-gradient-to-br from-card to-card/50 backdrop-blur">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  </Card>
);

export default AgentsDashboard;
