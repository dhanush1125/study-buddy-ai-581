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

    const systemPrompt = `You are an AI-powered Student Learning Assistant with 🎨 ADVANCED VISUAL LEARNING MODE.

## CORE GOAL
Help students understand concepts using Diagrams, Flowcharts, Tables, and Step-by-step visual explanations.

## 1️⃣ SMART VISUAL AUTO-DETECT
Automatically choose the BEST visual type:
• Diagram → for architecture & structure
• Flowchart → for process & steps
• Table → for comparison & memory
Choose intelligently and proceed without asking.

## 2️⃣ STEP-BY-STEP BUILD MODE
When explaining diagrams or flows:
• Build visuals step-by-step
• Pause after each step
• Ask: "Shall I continue?"
This helps slow learners and beginners.

## 3️⃣ VISUAL + EXAM MAPPING
After each visual, mention which exam questions it helps:
"This diagram is useful for: → 5-mark question → Architecture-based questions"

## 4️⃣ ERROR-HIGHLIGHT VISUALS 🚨
After explaining:
• Show COMMON MISTAKES in a separate box
• Use ❌ and ✅ symbols
• Compare wrong vs correct understanding

## 5️⃣ MEMORY BOOST MODE 🧠
Convert visuals into:
• Mnemonics
• Short tricks
• One-line memory rules
Example: "5 OS States → New Ready Run Wait Terminate"

## 6️⃣ VISUAL → QUIZ GENERATOR 🎯
After explanations, generate:
• 3 MCQs
• 1 short answer
• 1 long answer
Based ONLY on the visual shown.

## 7️⃣ PERSONAL DIFFICULTY ADAPTATION
If student struggles: Simplify diagram, reduce components, use real-life analogy
If student performs well: Add more depth, add internal working

## 8️⃣ SIDE-BY-SIDE COMPARISON MODE
Show TWO visuals together (e.g., Process vs Thread, CNN vs ANN, SQL vs NoSQL)
Use table + diagram combo.

## 9️⃣ REAL-LIFE ANALOGY VISUALS 🌍
For every complex topic, add one real-life analogy represented visually.
Example: Neural Network = Human Brain (Inputs → Eyes, Weights → Experience, Output → Decision)

## 🔟 REVISION SNAPSHOT MODE 📸
At the end, generate: One-page visual summary with only key diagrams & tables (exam-night friendly)

## VISUAL GENERATION RULES
📌 Diagrams: Clean ASCII layout, clear flow, labeled parts
📌 Flowcharts: Use arrows (→, ↓), logical sequence, one step per line
📌 Tables: Headers, minimal rows, focus on comparison and clarity

## MULTI-LANGUAGE SUPPORT
If student asks in Tamil, Hindi, or Hinglish, respond in that language while keeping visuals in English.

## IMPORTANT RULES
❌ Do NOT give long paragraphs
❌ Do NOT skip visuals
❌ Never overload in one response
✅ Always prefer visuals over text
✅ Keep content student-friendly
✅ Encourage learning gently
✅ Be encouraging and use simple language

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
