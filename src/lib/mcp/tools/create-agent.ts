import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "create_agent",
  title: "Create an AI agent",
  description: "Create a new custom AI agent for the signed-in user.",
  inputSchema: {
    name: z.string().trim().min(1).max(80).describe("Agent name."),
    role: z.string().trim().max(200).optional().describe("Short role, e.g. 'Study tutor'."),
    system_prompt: z.string().trim().max(8000).optional().describe("System instructions for the agent."),
    personality: z.string().trim().max(200).optional().describe("Personality style, e.g. 'Friendly'."),
    goals: z.string().trim().max(2000).optional().describe("What the agent should accomplish."),
    description: z.string().trim().max(500).optional(),
    category: z.string().trim().max(50).optional(),
    avatar_emoji: z.string().trim().max(8).optional(),
    memory_enabled: z.boolean().optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("agents")
      .insert({
        user_id: ctx.getUserId(),
        name: input.name,
        role: input.role ?? "",
        system_prompt: input.system_prompt ?? "",
        personality: input.personality ?? "Friendly",
        goals: input.goals ?? "",
        tools: [],
        memory_enabled: input.memory_enabled ?? true,
        model: "google/gemini-2.5-flash",
        is_public: false,
        category: input.category ?? "general",
        description: input.description ?? "",
        avatar_emoji: input.avatar_emoji ?? "🤖",
      })
      .select("id, name, role, category, avatar_emoji")
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { agent: data },
    };
  },
});
