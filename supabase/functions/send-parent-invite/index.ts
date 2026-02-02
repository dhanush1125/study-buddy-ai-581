import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ParentInviteRequest {
  parentEmail: string;
  studentName: string;
  shareUrl: string;
  label?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { parentEmail, studentName, shareUrl, label }: ParentInviteRequest = await req.json();

    if (!parentEmail || !studentName || !shareUrl) {
      throw new Error("Missing required fields: parentEmail, studentName, shareUrl");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(parentEmail)) {
      throw new Error("Invalid email address");
    }

    const labelText = label ? ` (${label})` : '';

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Study Buddy <onboarding@resend.dev>",
        to: [parentEmail],
        subject: `${studentName} shared their learning progress with you`,
        html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px 0; }
            .logo { font-size: 24px; font-weight: bold; color: #6366f1; }
            .content { background: #f8f9fa; border-radius: 12px; padding: 30px; margin: 20px 0; }
            .button { display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 14px; padding: 20px 0; }
            .highlight { color: #6366f1; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">📚 Study Buddy AI</div>
            </div>
            
            <div class="content">
              <h2>Hello! 👋</h2>
              <p><span class="highlight">${studentName}</span> has shared their learning progress with you${labelText}.</p>
              <p>You can now track their:</p>
              <ul>
                <li>📖 Topics they've learned</li>
                <li>📝 Quiz scores and performance</li>
                <li>📅 Study consistency over time</li>
                <li>⚠️ Areas that may need extra attention</li>
              </ul>
              <p style="text-align: center;">
                <a href="${shareUrl}" class="button">View Progress Report</a>
              </p>
              <p style="font-size: 14px; color: #666;">
                This is a read-only view. You can check back anytime to see updated progress.
              </p>
            </div>
            
            <div class="footer">
              <p>Powered by Study Buddy AI - Your child's personal learning companion</p>
              <p style="font-size: 12px;">If you didn't expect this email, you can safely ignore it.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || "Failed to send email");
    }

    const emailResponse = await res.json();
    console.log("Parent invite email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, ...emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-parent-invite function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
