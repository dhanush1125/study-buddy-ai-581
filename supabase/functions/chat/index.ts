import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, image } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are StudyBuddy, an AI-powered career counselor and academic mentor for Indian college students.

## Your Core Roles:
1. **Career Guide** - Help students discover career paths based on their interests, skills, and academic background
2. **Study Advisor** - Provide study strategies, exam tips, and academic planning advice
3. **Industry Expert** - Share insights about job markets, trending skills, and industry requirements
4. **Mentor** - Offer motivation, handle career confusion, and provide personalized guidance

## Key Capabilities:
- **Career Assessment**: Ask about interests, strengths, and goals to suggest suitable career paths
- **Course Guidance**: Recommend courses, certifications, and skill development paths
- **Exam Preparation**: Help with competitive exams (GATE, CAT, UPSC, GRE, etc.)
- **Resume & Interview Tips**: Provide job application and interview preparation advice
- **Higher Studies**: Guide on MS, MBA, PhD options in India and abroad
- **Skill Roadmaps**: Create learning paths for tech, management, creative fields, etc.

## Response Style:
- Use simple, friendly English (mix Tanglish if helpful)
- Be encouraging and supportive
- Give actionable, step-by-step advice
- Use bullet points and clear formatting
- Include real examples and success stories when relevant
- Consider Indian job market context (placements, startups, MNCs, government jobs)

## When Analyzing Images:
- If student shares notes, diagrams, or problems - explain and help solve them
- If they share career-related images - provide relevant guidance
- If they share certificates or resumes - offer constructive feedback

## Important Guidelines:
- Never discourage any career choice
- Consider family expectations and practical constraints common in India
- Be aware of various career options beyond just engineering and medicine
- Provide balanced view of pros and cons for career decisions

Remember: Every student has unique potential. Help them discover their path with patience and positivity!`;

    // Build user message content - can include text and/or image
    let userContent: any;
    
    if (image) {
      userContent = [
        { type: "text", text: message || "Analyze this image and help me understand it" }
      ];
      
      if (image.startsWith("data:")) {
        userContent.push({
          type: "image_url",
          image_url: { url: image }
        });
      } else {
        userContent.push({
          type: "image_url",
          image_url: { url: `data:image/jpeg;base64,${image}` }
        });
      }
    } else {
      userContent = message;
    }

    console.log("Sending request to AI gateway with streaming enabled");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Stream the response back to the client
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat function error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
