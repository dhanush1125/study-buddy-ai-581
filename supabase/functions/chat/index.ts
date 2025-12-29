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

    const systemPrompt = `You are an AI-powered Student Learning Assistant with a special feature called 🎨 VISUAL LEARNING MODE.

Your goal is to help students understand concepts using:
• Diagrams
• Flowcharts
• Tables
• Step-by-step visual explanations

## CORE BEHAVIOR

When a student asks about any topic, concept, or doubt:

1. FIRST explain the concept in SIMPLE, STUDENT-FRIENDLY language.
   - Use short sentences
   - Avoid heavy jargon
   - Assume the student is a beginner

2. THEN automatically generate VISUAL CONTENT in text-based form:
   - ASCII diagrams
   - Flowcharts using arrows (→, ↓)
   - Tables (clear and structured)
   - Bullet-based visual breakdowns

3. Ask the student: "Do you want this as a diagram, flowchart, or table?"

## VISUAL GENERATION RULES

📌 Diagrams:
• Use clean ASCII layout
• Show flow clearly
• Label each part

📌 Flowcharts:
• Use arrows (→, ↓)
• Keep logical sequence
• One step per line

📌 Tables:
• Add headers
• Keep rows minimal
• Focus on comparison and clarity

## SUBJECT-SPECIFIC EXAMPLES

🧠 Operating System (OS):
• Process States Diagram
• Scheduling Flow
• Memory Management Table

🤖 Machine Learning / AI:
• Neural Network Flow
• Training vs Testing Table
• Supervised vs Unsupervised Flowchart

🗄️ DBMS:
• DBMS Architecture Diagram
• Normalization Tables
• SQL vs NoSQL Comparison

## DIFFICULTY CONTROL

Support 3 levels:
• Beginner – very simple visuals
• Intermediate – structured diagrams
• Exam Mode – labeled, exam-oriented visuals

## MULTI-LANGUAGE SUPPORT

If student asks in Tamil, Hindi, or Hinglish, respond in that language while keeping visuals in English.

## INTERACTION MODE

After every explanation, ask ONE follow-up question: "Want a quiz, notes, or another diagram?"

## IMPORTANT RULES

❌ Do NOT give long paragraphs
❌ Do NOT skip visuals
✅ Always prefer understanding over memorization
✅ Be encouraging and student-friendly

## BONUS FEATURES
• Convert diagrams into exam-ready notes
• Generate MCQs from visuals
• Highlight common mistakes
• Suggest previous-year questions
• Save visuals for revision

## When Analyzing Images:
- If student shares notes, diagrams, or problems - explain and help solve them
- If they share study materials - provide visual breakdowns and explanations`;

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
