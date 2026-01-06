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
    const { prompt, style, duration } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!prompt) {
      throw new Error("Video prompt is required");
    }

    console.log("Generating video with prompt:", prompt);

    // Parse video style (CONCEPT, ANIME, 3D, REVISION)
    let videoStyle = style?.toUpperCase() || "CONCEPT";
    
    // Build style-specific prompt hints
    let styleHint = "";
    switch (videoStyle) {
      case "ANIME":
        styleHint = "Anime style animation, soft colors, expressive characters, educational setting, studio-quality, clean line art";
        break;
      case "3D":
        styleHint = "3D animated render, isometric view, soft lighting, clean geometry, professional visualization, smooth motion";
        break;
      case "REVISION":
        styleHint = "Clean educational animation, labeled diagrams, minimal colors, white background, exam-focused, clear text overlays";
        break;
      case "CONCEPT":
      default:
        styleHint = "Educational explainer animation, clear visuals, step-by-step flow, beginner-friendly, calm pacing, professional quality";
        break;
    }

    // Build comprehensive video prompt
    const fullPrompt = `Create a short educational video: ${styleHint}. Content: ${prompt}. High quality, smooth animation, clear visuals, no text unless essential. Duration: ${duration || 5} seconds.`;
    console.log("Full video prompt:", fullPrompt);

    // Call video generation API
    const response = await fetch("https://ai.gateway.lovable.dev/v1/videos/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "veo2",
        prompt: fullPrompt,
        n: 1,
        duration: duration || 5,
        aspect_ratio: "16:9",
        resolution: "1080p"
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
      
      throw new Error(`Video generation failed: ${response.status}`);
    }

    const data = await response.json();
    console.log("Video generation response:", JSON.stringify(data, null, 2));
    
    // Extract video URL from response
    const videoUrl = data.data?.[0]?.url;
    
    if (!videoUrl) {
      console.error("No video URL in response:", data);
      return new Response(
        JSON.stringify({ error: "Failed to generate video", details: data }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Video successfully generated:", videoUrl);
    return new Response(
      JSON.stringify({ videoUrl, style: videoStyle }),
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
