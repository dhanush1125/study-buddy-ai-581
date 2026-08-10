import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listAgentsTool from "./tools/list-agents";
import createAgentTool from "./tools/create-agent";
import getStudyProgressTool from "./tools/get-study-progress";
import logCompletedTopicTool from "./tools/log-completed-topic";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "study-buddy-ai",
  title: "Study Buddy AI",
  version: "0.1.0",
  instructions:
    "Tools for Study Buddy AI. Use `list_agents` and `create_agent` to manage the user's custom AI agents, `get_study_progress` to read their completed topics and quiz results, and `log_completed_topic` to record new study progress. All tools act as the signed-in user.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listAgentsTool, createAgentTool, getStudyProgressTool, logCompletedTopicTool],
});
