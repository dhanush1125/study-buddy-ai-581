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
    const { prompt, style, duration = 5 } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      console.error("Configuration error: LOVABLE_API_KEY is not set");
      return new Response(
        JSON.stringify({ error: "Service temporarily unavailable" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (typeof prompt !== "string" || prompt.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Prompt is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (prompt.length > 2000) {
      return new Response(
        JSON.stringify({ error: "Prompt too long (max 2000 characters)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }


    console.log("Video generation requested with prompt:", prompt);
    console.log("Style:", style, "Duration:", duration);

    // Parse video style and build enhanced prompt
    const videoStyle = style?.toUpperCase() || "CONCEPT";
    
    let styleHint = "";
    switch (videoStyle) {
      case "ANIME":
        styleHint = "Anime style animation with soft colors, expressive movements, educational setting, studio-quality visuals";
        break;
      case "3D":
        styleHint = "3D rendered animation with isometric view, soft lighting, clean geometry, professional quality";
        break;
      case "REVISION":
        styleHint = "Clean educational animation with labeled sections, minimal colors, exam-focused, clear annotations";
        break;
      case "CONCEPT":
      default:
        styleHint = "Educational animated infographic with step-by-step visual flow, beginner-friendly, professional quality";
        break;
    }

    // Build video generation prompt
    const fullPrompt = `${styleHint}. ${prompt}. Smooth animation, educational content, engaging visuals for students.`;
    console.log("Generating video with prompt:", fullPrompt);

    // Use Lovable video generation API
    const response = await fetch("https://ai.gateway.lovable.dev/v1/videos/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "veo-2.0-generate-001",
        prompt: fullPrompt,
        aspect_ratio: "16:9",
        duration: Math.min(duration, 10), // Max 10 seconds
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Video generation error:", response.status, errorText);
      
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
      
      throw new Error(`Video generation failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("Video generation response received:", JSON.stringify(data, null, 2));
    
    // Extract video URL from response
    const videoUrl = data.data?.[0]?.url || data.url || data.video_url;
    
    if (!videoUrl) {
      console.error("No video URL in response:", JSON.stringify(data, null, 2));
      return new Response(
        JSON.stringify({ error: "Failed to generate video - no URL in response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Video successfully generated:", videoUrl);
    
    return new Response(
      JSON.stringify({ 
        videoUrl, 
        style: videoStyle,
        type: "video",
        duration: duration
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Generate video function error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
