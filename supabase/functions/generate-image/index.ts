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

    // More explicit prompt that forces image generation
    const fullPrompt = `Generate an image: ${styleHint}. Subject: ${imageDescription}. High resolution, clear focus, no clutter. DO NOT just describe the image - YOU MUST GENERATE AND RETURN THE ACTUAL IMAGE.`;
    console.log("Full image prompt:", fullPrompt);

    // Retry logic - sometimes the model needs a second attempt
    const maxRetries = 3;
    let lastResponse = null;
    let lastData = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`Image generation attempt ${attempt}/${maxRetries}`);
      
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
              content: attempt === 1 
                ? fullPrompt 
                : `CREATE AN IMAGE NOW. ${fullPrompt} I need the actual generated image, not a text description.`
            }
          ],
          modalities: ["image", "text"]
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Attempt ${attempt} error:`, response.status, errorText);
        
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
        continue;
      }

      lastResponse = response;
      lastData = await response.json();
      console.log(`Attempt ${attempt} response received`);
      
      // Check if we got an image
      const imageUrl = lastData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      if (imageUrl) {
        console.log("Image successfully generated on attempt", attempt);
        return new Response(
          JSON.stringify({ imageUrl, textContent: lastData.choices?.[0]?.message?.content || "" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      console.log(`Attempt ${attempt}: No image in response, retrying...`);
    }

    // All retries failed - return error with last text content
    const textContent = lastData?.choices?.[0]?.message?.content || "";
    console.error("All attempts failed. No image generated after", maxRetries, "attempts");
    
    return new Response(
      JSON.stringify({ error: "Failed to generate image after multiple attempts", textContent }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Generate image function error:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred. Please try again later." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

});
