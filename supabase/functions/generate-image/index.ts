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
    const { prompt } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!prompt) {
      throw new Error("Image prompt is required");
    }

    console.log("Generating image with prompt:", prompt);

    // Parse style from prompt (format: "STYLE | description" or just "description")
    let style = "DIAGRAM";
    let imageDescription = prompt;
    
    if (prompt.includes("|")) {
      const parts = prompt.split("|");
      style = parts[0].trim().toUpperCase();
      imageDescription = parts.slice(1).join("|").trim();
    }

    // Build style-specific prompt
    let styleHint = "";
    switch (style) {
      case "REALISTIC":
        styleHint = "Ultra-realistic photograph, natural lighting, DSLR camera quality, high detail, professional photography, sharp focus";
        break;
      case "3D":
        styleHint = "3D render, isometric view, soft lighting, clean geometry, depth and shadows, professional 3D visualization";
        break;
      case "ANIME":
        styleHint = "Anime style, studio-quality illustration, soft shading, expressive, clean line art, vibrant but soft colors";
        break;
      case "DIAGRAM":
      default:
        styleHint = "Clean educational diagram, labeled, minimal colors, white or light background, student-friendly, suitable for academic learning";
        break;
    }

    const fullPrompt = `${styleHint}. Subject: ${imageDescription}. High resolution, clear focus, no clutter.`;
    console.log("Full image prompt:", fullPrompt);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: fullPrompt
          }
        ],
        modalities: ["image", "text"]
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
      
      return new Response(
        JSON.stringify({ error: "Image generation failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    console.log("Image generation response received");
    
    // Extract the image URL from the response
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    const textContent = data.choices?.[0]?.message?.content || "";
    
    if (!imageUrl) {
      console.error("No image in response:", JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: "No image generated", textContent }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ imageUrl, textContent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Generate image function error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
