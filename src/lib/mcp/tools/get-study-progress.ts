import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_study_progress",
  title: "Get study progress",
  description: "Get the signed-in student's recently completed topics and quiz attempts.",
  inputSchema: {
    limit: z.number().int().min(1).max(50).optional().describe("Max rows per section (default 10)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const n = limit ?? 10;
    const [topics, quizzes] = await Promise.all([
      supabase
        .from("student_topics")
        .select("topic_name, subject, difficulty, completed_at")
        .order("completed_at", { ascending: false })
        .limit(n),
      supabase
        .from("quiz_attempts")
        .select("topic_name, subject, score, total_questions, percentage, attempted_at")
        .order("attempted_at", { ascending: false })
        .limit(n),
    ]);
    const error = topics.error ?? quizzes.error;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const payload = { topics: topics.data ?? [], quizzes: quizzes.data ?? [] };
    return {
      content: [{ type: "text", text: JSON.stringify(payload) }],
      structuredContent: payload,
    };
  },
});
