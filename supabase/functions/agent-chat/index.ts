import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function buildSystemPrompt(agent: any) {
  const tools = Array.isArray(agent.tools) ? agent.tools : [];
  return `You are ${agent.name}, ${agent.role || "an AI assistant"}.

PERSONALITY: ${agent.personality || "friendly and helpful"}

GOALS:
${agent.goals || "Help the user accomplish their tasks."}

${agent.system_prompt ? `INSTRUCTIONS:\n${agent.system_prompt}\n` : ""}
${tools.length ? `AVAILABLE TOOLS (describe usage conceptually, you cannot actually call them):\n${tools.map((t: string) => `- ${t}`).join("\n")}\n` : ""}
${agent.memory_enabled ? "You have memory of this conversation." : "Treat each message as standalone."}

Stay in character. Be concise and useful.`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { threadId, messages, language } = await req.json();
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: thread } = await admin
      .from("agent_threads")
      .select("id, agent_id, user_id")
      .eq("id", threadId)
      .maybeSingle();
    if (!thread || thread.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Thread not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: agent } = await admin
      .from("agents").select("*").eq("id", thread.agent_id).maybeSingle();
    if (!agent) {
      return new Response(JSON.stringify({ error: "Agent not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: agent.model || "google/gemini-2.5-flash",
        messages: [{ role: "system", content: buildSystemPrompt(agent) }, ...messages],
        stream: true,
      }),
    });

    if (!aiRes.ok) {
      const txt = await aiRes.text();
      return new Response(JSON.stringify({ error: txt }), {
        status: aiRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Save user message immediately
    const lastUser = messages[messages.length - 1];
    if (lastUser?.role === "user") {
      await admin.from("agent_messages").insert({
        thread_id: threadId, role: "user", content: lastUser.content,
      });
    }

    let assistantContent = "";
    const reader = aiRes.body!.getReader();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        let buffer = "";
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
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
                if (delta) assistantContent += delta;
              } catch { /* ignore */ }
            }
          }
        } finally {
          controller.close();
          if (assistantContent) {
            await admin.from("agent_messages").insert({
              thread_id: threadId, role: "assistant", content: assistantContent,
            });
          }
          await admin.from("agent_threads")
            .update({ updated_at: new Date().toISOString() }).eq("id", threadId);
        }
      },
    });

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
