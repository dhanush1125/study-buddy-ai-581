import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AgentLayout } from "@/components/agents/AgentLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AGENT_TEMPLATES, AVAILABLE_TOOLS, PERSONALITIES, MODELS } from "@/lib/agentTemplates";
import { useAgents, Agent } from "@/hooks/useAgents";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkles, Save } from "lucide-react";

const EMOJIS = ["🤖","🎧","💻","📚","✉️","🔬","💬","🧠","⚡","🚀","🎨","🦾","🪄","🛡️","📊"];

const CreateAgent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { createAgent, updateAgent } = useAgents();
  const editing = Boolean(id);

  const [form, setForm] = useState<Partial<Agent>>({
    name: "", role: "", system_prompt: "", personality: "Friendly",
    goals: "", tools: [], memory_enabled: true,
    model: "google/gemini-2.5-flash", is_public: false,
    category: "general", description: "", avatar_emoji: "🤖",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase.from("agents").select("*").eq("id", id).single();
      if (data) setForm(data as any);
    })();
  }, [id]);

  const applyTemplate = (tplId: string) => {
    const t = AGENT_TEMPLATES.find(x => x.id === tplId);
    if (!t) return;
    setForm(prev => ({ ...prev, ...t, id: prev.id }));
    toast.success(`Loaded "${t.name}" template`);
  };

  const toggleTool = (t: string) => {
    const cur = form.tools || [];
    setForm({ ...form, tools: cur.includes(t) ? cur.filter(x => x !== t) : [...cur, t] });
  };

  const save = async () => {
    if (!form.name?.trim()) return toast.error("Name is required");
    setSaving(true);
    const result = editing
      ? await updateAgent(id!, form)
      : await createAgent(form);
    setSaving(false);
    if (result) {
      toast.success(editing ? "Agent updated" : "Agent created");
      navigate(editing ? `/agents/${id}` : "/agents");
    }
  };

  return (
    <AgentLayout>
      <div className="p-8 overflow-y-auto max-w-5xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">{editing ? "Edit Agent" : "Create Agent"}</h1>
            <p className="text-muted-foreground mt-1">Configure personality, goals, and tools.</p>
          </div>
          <Button onClick={save} disabled={saving} className="gap-2">
            <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save"}
          </Button>
        </div>

        {!editing && (
          <Card className="p-5 mb-6 border-primary/20 bg-primary/5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm">Start from template</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {AGENT_TEMPLATES.map(t => (
                <button key={t.id} onClick={() => applyTemplate(t.id)}
                  className="text-left p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-card transition-all">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{t.avatar_emoji}</span>
                    <span className="font-medium text-sm">{t.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{t.description}</p>
                </button>
              ))}
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-5 lg:col-span-2 space-y-5">
            <div>
              <Label>Avatar</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {EMOJIS.map(e => (
                  <button key={e} onClick={() => setForm({ ...form, avatar_emoji: e })}
                    className={`w-10 h-10 rounded-lg border text-xl ${
                      form.avatar_emoji === e ? "border-primary bg-primary/10" : "border-border"
                    }`}>{e}</button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Agent Name</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Support Hero" />
              </div>
              <div>
                <Label>Role</Label>
                <Input value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                  placeholder="e.g. Customer Support Agent" />
              </div>
            </div>
            <div>
              <Label>Short Description</Label>
              <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="What does this agent do?" />
            </div>
            <div>
              <Label>System Prompt</Label>
              <Textarea rows={5} value={form.system_prompt}
                onChange={e => setForm({ ...form, system_prompt: e.target.value })}
                placeholder="Detailed instructions, tone, output format..." />
            </div>
            <div>
              <Label>Goals</Label>
              <Textarea rows={3} value={form.goals}
                onChange={e => setForm({ ...form, goals: e.target.value })}
                placeholder="What should this agent always strive for?" />
            </div>
          </Card>

          <div className="space-y-6">
            <Card className="p-5 space-y-4">
              <div>
                <Label>Personality</Label>
                <Select value={form.personality} onValueChange={v => setForm({ ...form, personality: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PERSONALITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Model</Label>
                <Select value={form.model} onValueChange={v => setForm({ ...form, model: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MODELS.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Category</Label>
                <Input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
              </div>
            </Card>

            <Card className="p-5 space-y-3">
              <Label>Tools Access</Label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_TOOLS.map(t => {
                  const on = form.tools?.includes(t);
                  return (
                    <Badge key={t} variant={on ? "default" : "outline"}
                      className="cursor-pointer" onClick={() => toggleTool(t)}>
                      {t}
                    </Badge>
                  );
                })}
              </div>
            </Card>

            <Card className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Memory</Label>
                  <p className="text-xs text-muted-foreground">Remember conversation context</p>
                </div>
                <Switch checked={!!form.memory_enabled}
                  onCheckedChange={v => setForm({ ...form, memory_enabled: v })} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Public in Marketplace</Label>
                  <p className="text-xs text-muted-foreground">Anyone can clone</p>
                </div>
                <Switch checked={!!form.is_public}
                  onCheckedChange={v => setForm({ ...form, is_public: v })} />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AgentLayout>
  );
};

export default CreateAgent;
