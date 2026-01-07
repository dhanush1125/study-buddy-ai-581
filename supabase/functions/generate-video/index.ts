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
    const { prompt, style } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!prompt) {
      throw new Error("Video prompt is required");
    }

    console.log("Video generation requested with prompt:", prompt);
    console.log("Note: Video generation API not available, falling back to animated image generation");

    // Parse video style
    let videoStyle = style?.toUpperCase() || "CONCEPT";
    
    // Build style-specific prompt for image generation (as fallback)
    let styleHint = "";
    switch (videoStyle) {
      case "ANIME":
        styleHint = "Anime style illustration, soft colors, expressive characters, educational setting, studio-quality, clean line art, dynamic pose suggesting motion";
        break;
      case "3D":
        styleHint = "3D rendered visualization, isometric view, soft lighting, clean geometry, professional quality, depth and dimension";
        break;
      case "REVISION":
        styleHint = "Clean educational diagram, labeled sections, minimal colors, white background, exam-focused, clear annotations and arrows";
        break;
      case "CONCEPT":
      default:
        styleHint = "Educational infographic, clear step-by-step visual flow, beginner-friendly icons, professional quality, arrows showing process";
        break;
    }

    // Generate an educational image instead (video not supported)
    const fullPrompt = `Create a detailed educational illustration: ${styleHint}. Content: ${prompt}. High resolution, clear focus, no clutter, visually engaging for students.`;
    console.log("Generating educational image with prompt:", fullPrompt);

    // Use chat completions endpoint with image modality
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [
          { role: "user", content: fullPrompt }
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Image generation error:", response.status, errorText);
      
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
      
      throw new Error(`Image generation failed: ${response.status}`);
    }

    const data = await response.json();
    console.log("Image generation response received");
    
    // Extract image URL from chat completions response format
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!imageUrl) {
      console.error("No image URL in response");
      return new Response(
        JSON.stringify({ error: "Failed to generate visual content" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Educational image successfully generated");
    
    // Return as image (since video isn't supported)
    return new Response(
      JSON.stringify({ 
        imageUrl, 
        style: videoStyle,
        type: "image",
        message: "Video generation is not currently available. Here's an educational illustration instead."
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
