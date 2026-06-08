import { useEffect, useState } from "react";
import { AgentLayout } from "@/components/agents/AgentLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Copy, Search, Star } from "lucide-react";
import { toast } from "sonner";

const Marketplace = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [agents, setAgents] = useState<any[]>([]);
  const [ratings, setRatings] = useState<Record<string, { avg: number; count: number }>>({});
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("agents")
      .select("*").eq("is_public", true)
      .order("clone_count", { ascending: false }).limit(60);
    setAgents(data || []);
    if (data?.length) {
      const { data: rs } = await supabase.rpc("get_agent_rating_aggregates", {
        _agent_ids: data.map((a: any) => a.id),
      });
      const agg: Record<string, { avg: number; count: number }> = {};
      (rs || []).forEach((r: any) => {
        agg[r.agent_id] = { avg: Number(r.avg_rating), count: Number(r.rating_count) };
      });
      setRatings(agg);
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const clone = async (a: any) => {
    if (!user) return toast.error("Sign in to clone");
    const { data, error } = await supabase.from("agents").insert({
      user_id: user.id,
      name: `${a.name} (copy)`,
      role: a.role, system_prompt: a.system_prompt,
      personality: a.personality, goals: a.goals, tools: a.tools,
      memory_enabled: a.memory_enabled, model: a.model,
      category: a.category, description: a.description, avatar_emoji: a.avatar_emoji,
      is_public: false,
    }).select().single();
    if (error) return toast.error(error.message);
    await supabase.from("agents").update({ clone_count: (a.clone_count || 0) + 1 }).eq("id", a.id);
    toast.success("Cloned to your agents!");
    navigate(`/agents/${data.id}`);
  };

  const rate = async (agentId: string, rating: number) => {
    if (!user) return toast.error("Sign in to rate");
    const { error } = await supabase.from("agent_ratings")
      .upsert({ agent_id: agentId, user_id: user.id, rating }, { onConflict: "agent_id,user_id" });
    if (error) return toast.error(error.message);
    toast.success("Thanks for rating!");
    load();
  };

  const filtered = agents.filter(a =>
    !q.trim() || (a.name + " " + a.role + " " + a.category + " " + a.description)
      .toLowerCase().includes(q.toLowerCase())
  );

  return (
    <AgentLayout>
      <div className="p-8 overflow-y-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Marketplace</h1>
          <p className="text-muted-foreground mt-1">Discover and clone community agents.</p>
        </div>
        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search agents..." className="pl-9" />
        </div>

        {loading ? <div className="text-muted-foreground">Loading...</div> : filtered.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <p className="text-muted-foreground">No public agents yet. Be the first — mark one of your agents as Public.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(a => {
              const r = ratings[a.id];
              return (
                <Card key={a.id} className="p-5 hover:border-primary/50 transition-colors">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="text-3xl">{a.avatar_emoji}</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{a.name}</h3>
                      <p className="text-xs text-muted-foreground truncate">{a.role}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px]">{a.category}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3 min-h-[2.5rem]">
                    {a.description || "No description"}
                  </p>
                  <div className="flex items-center gap-1 mb-3">
                    {[1,2,3,4,5].map(n => (
                      <button key={n} onClick={() => rate(a.id, n)}>
                        <Star className={`w-4 h-4 ${
                          r && n <= Math.round(r.avg) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                        }`} />
                      </button>
                    ))}
                    <span className="text-xs text-muted-foreground ml-2">
                      {r ? `${r.avg.toFixed(1)} (${r.count})` : "No ratings"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{a.clone_count || 0} clones</span>
                    <Button size="sm" onClick={() => clone(a)} className="gap-2">
                      <Copy className="w-3.5 h-3.5" /> Clone
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AgentLayout>
  );
};

export default Marketplace;
