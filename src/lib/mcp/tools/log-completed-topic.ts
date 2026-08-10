import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "log_completed_topic",
  title: "Log a completed topic",
  description: "Record a study topic the signed-in student has completed.",
  inputSchema: {
    topic_name: z.string().trim().min(1).max(200),
    subject: z.string().trim().min(1).max(100),
    difficulty: z.enum(["easy", "medium", "hard"]).optional(),
    notes: z.string().trim().max(2000).optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("student_topics")
      .insert({
        user_id: ctx.getUserId(),
        topic_name: input.topic_name,
        subject: input.subject,
        difficulty: input.difficulty ?? "medium",
        notes: input.notes ?? null,
      })
      .select("id, topic_name, subject, difficulty, completed_at")
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { topic: data },
    };
  },
});
