import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ShareLink {
  id: string;
  user_id: string;
  share_token: string;
  label: string | null;
  parent_email: string;
  digest_enabled: boolean;
}

interface ProgressData {
  topicsThisWeek: number;
  quizzesThisWeek: number;
  avgScoreThisWeek: number;
  totalTopics: number;
  totalQuizzes: number;
  avgScore: number;
  studyDays: number;
  weakAreas: Array<{ subject: string; avgScore: number }>;
  goals: {
    weeklyTopicGoal: number;
    weeklyQuizGoal: number;
    studyDaysGoal: number;
  };
}

const getWeeklyProgress = async (
  supabase: any,
  userId: string
): Promise<ProgressData> => {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const weekAgoStr = oneWeekAgo.toISOString();

  // Get topics
  const { data: allTopics } = await supabase
    .from("student_topics")
    .select("*")
    .eq("user_id", userId);

  const { data: weekTopics } = await supabase
    .from("student_topics")
    .select("*")
    .eq("user_id", userId)
    .gte("completed_at", weekAgoStr);

  // Get user preferences for goals
  const { data: prefs } = await supabase
    .from("user_preferences")
    .select("weekly_topic_goal, weekly_quiz_goal, study_days_goal")
    .eq("user_id", userId)
    .maybeSingle();

  const goals = {
    weeklyTopicGoal: prefs?.weekly_topic_goal ?? 5,
    weeklyQuizGoal: prefs?.weekly_quiz_goal ?? 3,
    studyDaysGoal: prefs?.study_days_goal ?? 5,
  };

  // Get quizzes
  const { data: allQuizzes } = await supabase
    .from("quiz_attempts")
    .select("*")
    .eq("user_id", userId);

  const { data: weekQuizzes } = await supabase
    .from("quiz_attempts")
    .select("*")
    .eq("user_id", userId)
    .gte("attempted_at", weekAgoStr);

  // Calculate stats
  const topics = allTopics || [];
  const quizzes = allQuizzes || [];
  const thisWeekTopics = weekTopics || [];
  const thisWeekQuizzes = weekQuizzes || [];

  const avgScore =
    quizzes.length > 0
      ? quizzes.reduce((sum: number, q: any) => sum + Number(q.percentage), 0) /
        quizzes.length
      : 0;

  const avgScoreThisWeek =
    thisWeekQuizzes.length > 0
      ? thisWeekQuizzes.reduce(
          (sum: number, q: any) => sum + Number(q.percentage),
          0
        ) / thisWeekQuizzes.length
      : 0;

  // Calculate study days this week
  const studyDates = new Set<string>();
  thisWeekTopics.forEach((t: any) => {
    studyDates.add(new Date(t.completed_at).toDateString());
  });
  thisWeekQuizzes.forEach((q: any) => {
    studyDates.add(new Date(q.attempted_at).toDateString());
  });

  // Calculate weak areas
  const subjectScores: Record<string, { total: number; count: number }> = {};
  quizzes.forEach((q: any) => {
    if (!subjectScores[q.subject]) {
      subjectScores[q.subject] = { total: 0, count: 0 };
    }
    subjectScores[q.subject].total += Number(q.percentage);
    subjectScores[q.subject].count += 1;
  });

  const weakAreas = Object.entries(subjectScores)
    .map(([subject, data]) => ({
      subject,
      avgScore: Math.round(data.total / data.count),
    }))
    .filter((area) => area.avgScore < 70)
    .sort((a, b) => a.avgScore - b.avgScore)
    .slice(0, 3);

  return {
    topicsThisWeek: thisWeekTopics.length,
    quizzesThisWeek: thisWeekQuizzes.length,
    avgScoreThisWeek: Math.round(avgScoreThisWeek),
    totalTopics: topics.length,
    totalQuizzes: quizzes.length,
    avgScore: Math.round(avgScore),
    studyDays: studyDates.size,
    weakAreas,
    goals,
  };
};

const generateDigestHtml = (
  studentName: string,
  progress: ProgressData,
  shareUrl: string,
  label: string | null
) => {
  const labelText = label ? ` (${label})` : "";
  const weekActivity =
    progress.topicsThisWeek > 0 || progress.quizzesThisWeek > 0;

  // Goal progress calculation
  const topicGoalMet = progress.topicsThisWeek >= progress.goals.weeklyTopicGoal;
  const quizGoalMet = progress.quizzesThisWeek >= progress.goals.weeklyQuizGoal;
  const daysGoalMet = progress.studyDays >= progress.goals.studyDaysGoal;
  const allGoalsMet = topicGoalMet && quizGoalMet && daysGoalMet;
  const someGoalsMet = topicGoalMet || quizGoalMet || daysGoalMet;

  const weakAreasHtml =
    progress.weakAreas.length > 0
      ? `
      <div style="background: #fef3c7; border-radius: 8px; padding: 15px; margin: 15px 0;">
        <h4 style="margin: 0 0 10px 0; color: #92400e;">⚠️ Areas Needing Attention</h4>
        <ul style="margin: 0; padding-left: 20px;">
          ${progress.weakAreas.map((a) => `<li>${a.subject}: ${a.avgScore}% avg</li>`).join("")}
        </ul>
      </div>
    `
      : `
      <div style="background: #d1fae5; border-radius: 8px; padding: 15px; margin: 15px 0;">
        <p style="margin: 0; color: #065f46;">✅ All subjects are looking good!</p>
      </div>
    `;

  const goalsHtml = `
    <div style="background: ${allGoalsMet ? '#d1fae5' : someGoalsMet ? '#fef3c7' : '#fee2e2'}; border-radius: 8px; padding: 15px; margin: 15px 0;">
      <h4 style="margin: 0 0 10px 0; color: ${allGoalsMet ? '#065f46' : someGoalsMet ? '#92400e' : '#991b1b'};">
        ${allGoalsMet ? '🎯 All Weekly Goals Met!' : someGoalsMet ? '📊 Goal Progress' : '⚠️ Goals Need Attention'}
      </h4>
      <table style="width: 100%; font-size: 14px;">
        <tr>
          <td>Topics:</td>
          <td style="text-align: right; font-weight: bold;">
            ${progress.topicsThisWeek}/${progress.goals.weeklyTopicGoal} ${topicGoalMet ? '✓' : ''}
          </td>
        </tr>
        <tr>
          <td>Quizzes:</td>
          <td style="text-align: right; font-weight: bold;">
            ${progress.quizzesThisWeek}/${progress.goals.weeklyQuizGoal} ${quizGoalMet ? '✓' : ''}
          </td>
        </tr>
        <tr>
          <td>Study Days:</td>
          <td style="text-align: right; font-weight: bold;">
            ${progress.studyDays}/${progress.goals.studyDaysGoal} ${daysGoalMet ? '✓' : ''}
          </td>
        </tr>
      </table>
    </div>
  `;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 20px 0; }
        .logo { font-size: 24px; font-weight: bold; color: #6366f1; }
        .content { background: #f8f9fa; border-radius: 12px; padding: 30px; margin: 20px 0; }
        .stat-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
        .stat-card { background: white; border-radius: 8px; padding: 15px; text-align: center; }
        .stat-value { font-size: 28px; font-weight: bold; color: #6366f1; }
        .stat-label { font-size: 12px; color: #666; }
        .button { display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0; }
        .footer { text-align: center; color: #666; font-size: 14px; padding: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">📚 Study Buddy AI</div>
          <p style="color: #666;">Weekly Progress Digest</p>
        </div>
        
        <div class="content">
          <h2>Hi there! 👋</h2>
          <p>Here's <strong>${studentName}</strong>'s${labelText} learning progress for this week:</p>
          
          ${
            weekActivity
              ? `
            <h3>📅 This Week's Activity</h3>
            <div class="stat-grid">
              <div class="stat-card">
                <div class="stat-value">${progress.topicsThisWeek}</div>
                <div class="stat-label">Topics Learned</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${progress.quizzesThisWeek}</div>
                <div class="stat-label">Quizzes Taken</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${progress.avgScoreThisWeek}%</div>
                <div class="stat-label">Avg Quiz Score</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${progress.studyDays}/7</div>
                <div class="stat-label">Study Days</div>
              </div>
            </div>
          `
              : `
            <div style="background: #fee2e2; border-radius: 8px; padding: 15px; margin: 15px 0;">
              <p style="margin: 0; color: #991b1b;">📉 No study activity recorded this week. Consider checking in with the student!</p>
            </div>
          `
          }
          
          ${goalsHtml}
          
          <h3>📊 Overall Progress</h3>
          <p>Total topics: <strong>${progress.totalTopics}</strong> | Total quizzes: <strong>${progress.totalQuizzes}</strong> | Lifetime avg: <strong>${progress.avgScore}%</strong></p>
          
          ${weakAreasHtml}
          
          <p style="text-align: center;">
            <a href="${shareUrl}" class="button">View Full Progress Report</a>
          </p>
        </div>
        
        <div class="footer">
          <p>You're receiving this because ${studentName} enabled weekly digests for you.</p>
          <p style="font-size: 12px;">To stop receiving these emails, ask ${studentName} to disable digests in Study Buddy.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get all active share links with digest enabled
    const { data: shareLinks, error: linksError } = await supabase
      .from("parent_share_links")
      .select("*")
      .eq("is_active", true)
      .eq("digest_enabled", true)
      .not("parent_email", "is", null);

    if (linksError) throw linksError;

    if (!shareLinks || shareLinks.length === 0) {
      return new Response(
        JSON.stringify({ message: "No digests to send", count: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    let sentCount = 0;
    let errorCount = 0;

    for (const link of shareLinks as ShareLink[]) {
      try {
        // Get student progress
        const progress = await getWeeklyProgress(supabase, link.user_id);
        
        // Get student name from user metadata or use generic
        const { data: userData } = await supabase.auth.admin.getUserById(link.user_id);
        const studentName = userData?.user?.user_metadata?.full_name || 
                           userData?.user?.email?.split('@')[0] || 
                           'Your student';

        const shareUrl = `${req.headers.get("origin") || "https://study-buddy-ai-581.lovable.app"}/parent/${link.share_token}`;
        
        const html = generateDigestHtml(studentName, progress, shareUrl, link.label);

        // Send email via Resend
        const emailRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "Study Buddy <onboarding@resend.dev>",
            to: [link.parent_email],
            subject: `Weekly Progress: ${studentName}'s Learning Update`,
            html,
          }),
        });

        if (emailRes.ok) {
          sentCount++;
          // Update last_digest_sent
          await supabase
            .from("parent_share_links")
            .update({ last_digest_sent: new Date().toISOString() })
            .eq("id", link.id);
        } else {
          errorCount++;
          console.error(`Failed to send to ${link.parent_email}:`, await emailRes.text());
        }
      } catch (err) {
        errorCount++;
        console.error(`Error processing link ${link.id}:`, err);
      }
    }

    return new Response(
      JSON.stringify({ 
        message: "Weekly digest complete", 
        sent: sentCount, 
        errors: errorCount 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-weekly-digest:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
