import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ScheduledReport {
  id: string;
  share_token: string;
  user_id: string;
  label: string | null;
  report_email: string;
  report_scheduled_date: string;
}

interface StudentData {
  topics: Array<{
    topic_name: string;
    subject: string;
    difficulty: string;
    completed_at: string;
  }>;
  quizzes: Array<{
    topic_name: string;
    subject: string;
    score: number;
    total_questions: number;
    percentage: number;
    attempted_at: string;
  }>;
  goalHistory: Array<{
    week_start: string;
    topics_completed: number;
    quizzes_completed: number;
    study_days: number;
    topic_goal: number;
    quiz_goal: number;
    study_days_goal: number;
  }>;
}

function generateReportHTML(studentName: string, data: StudentData, shareToken: string, baseUrl: string): string {
  const totalTopics = data.topics.length;
  const totalQuizzes = data.quizzes.length;
  const avgScore = totalQuizzes > 0
    ? Math.round(data.quizzes.reduce((sum, q) => sum + Number(q.percentage), 0) / totalQuizzes)
    : 0;

  // Calculate weak areas
  const subjectScores: Record<string, { total: number; count: number }> = {};
  data.quizzes.forEach(quiz => {
    if (!subjectScores[quiz.subject]) {
      subjectScores[quiz.subject] = { total: 0, count: 0 };
    }
    subjectScores[quiz.subject].total += Number(quiz.percentage);
    subjectScores[quiz.subject].count += 1;
  });

  const weakAreas = Object.entries(subjectScores)
    .map(([subject, scores]) => ({
      subject,
      avgScore: Math.round(scores.total / scores.count),
    }))
    .filter(area => area.avgScore < 70)
    .sort((a, b) => a.avgScore - b.avgScore);

  // Get unique subjects
  const subjects = new Set(data.topics.map(t => t.subject));

  const weakAreasHTML = weakAreas.length > 0
    ? weakAreas.map(area => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-transform: capitalize;">${area.subject}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: ${area.avgScore < 50 ? '#dc2626' : '#f59e0b'};">${area.avgScore}%</td>
        </tr>
      `).join('')
    : '<tr><td colspan="2" style="padding: 16px; text-align: center; color: #16a34a;">✓ All areas looking good! (All subjects above 70%)</td></tr>';

  const recentTopicsHTML = data.topics.slice(0, 5).map(topic => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${topic.topic_name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-transform: capitalize;">${topic.subject}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${new Date(topic.completed_at).toLocaleDateString()}</td>
    </tr>
  `).join('') || '<tr><td colspan="3" style="padding: 16px; text-align: center; color: #6b7280;">No topics yet</td></tr>';

  const recentQuizzesHTML = data.quizzes.slice(0, 5).map(quiz => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${quiz.topic_name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-transform: capitalize;">${quiz.subject}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: ${Number(quiz.percentage) >= 70 ? '#16a34a' : '#f59e0b'};">${Number(quiz.percentage).toFixed(0)}%</td>
    </tr>
  `).join('') || '<tr><td colspan="3" style="padding: 16px; text-align: center; color: #6b7280;">No quizzes yet</td></tr>';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Student Progress Report - ${studentName}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 12px 12px 0 0; padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">📚 Student Progress Report</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px;">${studentName}</p>
          <p style="color: rgba(255,255,255,0.7); margin: 4px 0 0 0; font-size: 14px;">Generated: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        <!-- Main Content -->
        <div style="background: white; padding: 24px; border-radius: 0 0 12px 12px;">
          <!-- Summary Stats -->
          <h2 style="color: #1f2937; font-size: 18px; margin: 0 0 16px 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">📊 Progress Summary</h2>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 24px;">
            <div style="background: #eff6ff; border-radius: 8px; padding: 16px; text-align: center;">
              <p style="color: #3b82f6; font-size: 28px; font-weight: bold; margin: 0;">${totalTopics}</p>
              <p style="color: #6b7280; font-size: 12px; margin: 4px 0 0 0;">Topics Learned</p>
            </div>
            <div style="background: #f0fdf4; border-radius: 8px; padding: 16px; text-align: center;">
              <p style="color: #22c55e; font-size: 28px; font-weight: bold; margin: 0;">${totalQuizzes}</p>
              <p style="color: #6b7280; font-size: 12px; margin: 4px 0 0 0;">Quizzes Taken</p>
            </div>
            <div style="background: #faf5ff; border-radius: 8px; padding: 16px; text-align: center;">
              <p style="color: ${avgScore >= 70 ? '#22c55e' : avgScore >= 50 ? '#f59e0b' : '#dc2626'}; font-size: 28px; font-weight: bold; margin: 0;">${avgScore}%</p>
              <p style="color: #6b7280; font-size: 12px; margin: 4px 0 0 0;">Avg Quiz Score</p>
            </div>
            <div style="background: #fff7ed; border-radius: 8px; padding: 16px; text-align: center;">
              <p style="color: #f97316; font-size: 28px; font-weight: bold; margin: 0;">${subjects.size}</p>
              <p style="color: #6b7280; font-size: 12px; margin: 4px 0 0 0;">Subjects Explored</p>
            </div>
          </div>

          <!-- Weak Areas -->
          <h2 style="color: #1f2937; font-size: 18px; margin: 24px 0 16px 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">⚠️ Areas Needing Attention</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <thead>
              <tr style="background: #f9fafb;">
                <th style="padding: 8px; text-align: left; font-weight: 600; color: #374151;">Subject</th>
                <th style="padding: 8px; text-align: left; font-weight: 600; color: #374151;">Avg Score</th>
              </tr>
            </thead>
            <tbody>
              ${weakAreasHTML}
            </tbody>
          </table>

          <!-- Recent Topics -->
          <h2 style="color: #1f2937; font-size: 18px; margin: 24px 0 16px 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">📖 Recent Topics</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <thead>
              <tr style="background: #f9fafb;">
                <th style="padding: 8px; text-align: left; font-weight: 600; color: #374151;">Topic</th>
                <th style="padding: 8px; text-align: left; font-weight: 600; color: #374151;">Subject</th>
                <th style="padding: 8px; text-align: left; font-weight: 600; color: #374151;">Date</th>
              </tr>
            </thead>
            <tbody>
              ${recentTopicsHTML}
            </tbody>
          </table>

          <!-- Recent Quizzes -->
          <h2 style="color: #1f2937; font-size: 18px; margin: 24px 0 16px 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">🎯 Recent Quiz Scores</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <thead>
              <tr style="background: #f9fafb;">
                <th style="padding: 8px; text-align: left; font-weight: 600; color: #374151;">Topic</th>
                <th style="padding: 8px; text-align: left; font-weight: 600; color: #374151;">Subject</th>
                <th style="padding: 8px; text-align: left; font-weight: 600; color: #374151;">Score</th>
              </tr>
            </thead>
            <tbody>
              ${recentQuizzesHTML}
            </tbody>
          </table>

          <!-- CTA -->
          <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 16px 0;">View the full interactive progress dashboard:</p>
            <a href="${baseUrl}/parent/${shareToken}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600;">View Full Dashboard</a>
          </div>
        </div>

        <!-- Footer -->
        <div style="text-align: center; padding: 24px;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">Powered by Study Buddy AI</p>
          <p style="color: #9ca3af; font-size: 11px; margin: 4px 0 0 0;">This is an automated report scheduled for your parent-teacher meeting.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials not configured");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const resend = new Resend(RESEND_API_KEY);

    // Get reports scheduled for today or earlier that haven't been sent
    const today = new Date().toISOString().split('T')[0];
    
    const { data: scheduledReports, error: fetchError } = await supabase
      .from('parent_share_links')
      .select('id, share_token, user_id, label, report_email, report_scheduled_date')
      .lte('report_scheduled_date', today)
      .is('report_sent_at', null)
      .eq('is_active', true)
      .not('report_email', 'is', null);

    if (fetchError) {
      throw new Error(`Failed to fetch scheduled reports: ${fetchError.message}`);
    }

    console.log(`Found ${scheduledReports?.length || 0} reports to send`);

    const results: { success: string[]; failed: string[] } = { success: [], failed: [] };
    const baseUrl = req.headers.get('origin') || 'https://study-buddy-ai-581.lovable.app';

    for (const report of (scheduledReports as ScheduledReport[]) || []) {
      try {
        // Fetch student data
        const [topicsRes, quizzesRes, historyRes] = await Promise.all([
          supabase
            .from('student_topics')
            .select('topic_name, subject, difficulty, completed_at')
            .eq('user_id', report.user_id)
            .order('completed_at', { ascending: false }),
          supabase
            .from('quiz_attempts')
            .select('topic_name, subject, score, total_questions, percentage, attempted_at')
            .eq('user_id', report.user_id)
            .order('attempted_at', { ascending: false }),
          supabase
            .from('weekly_goal_history')
            .select('week_start, topics_completed, quizzes_completed, study_days, topic_goal, quiz_goal, study_days_goal')
            .eq('user_id', report.user_id)
            .order('week_start', { ascending: false })
            .limit(12)
        ]);

        const studentData: StudentData = {
          topics: topicsRes.data || [],
          quizzes: quizzesRes.data || [],
          goalHistory: historyRes.data || [],
        };

        const studentName = report.label || 'Student';
        const emailHTML = generateReportHTML(studentName, studentData, report.share_token, baseUrl);

        // Send email
        const emailResult = await resend.emails.send({
          from: 'Study Buddy <noreply@resend.dev>',
          to: [report.report_email],
          subject: `📚 Progress Report for ${studentName} - Parent-Teacher Meeting`,
          html: emailHTML,
        });

        console.log(`Email sent to ${report.report_email}:`, emailResult);

        // Mark as sent
        await supabase
          .from('parent_share_links')
          .update({ report_sent_at: new Date().toISOString() })
          .eq('id', report.id);

        results.success.push(report.report_email);
      } catch (error) {
        console.error(`Failed to send report to ${report.report_email}:`, error);
        results.failed.push(report.report_email);
      }
    }

    return new Response(
      JSON.stringify({
        message: `Processed ${scheduledReports?.length || 0} scheduled reports`,
        results,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-scheduled-report:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
