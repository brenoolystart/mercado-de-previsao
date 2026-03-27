import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { photo } = await req.json();
    if (!photo) {
      return new Response(
        JSON.stringify({ error: "Photo is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use Gemini vision to analyze the photo and estimate age
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an age verification system. Analyze the provided photo and estimate the person's age.

RULES:
- You MUST respond ONLY with a valid JSON object, no other text.
- If the image contains a clear human face, estimate the age.
- If no human face is detected, or the image is blurry/unclear, set is_valid to false.
- If the photo appears to be a photo of a screen, printed photo, or digitally manipulated, set is_valid to false and set reason to "image_manipulation".
- Be conservative: if the person could be under 18, estimate lower.

Response format:
{"is_valid": true/false, "estimated_age": number|null, "confidence": "high"|"medium"|"low", "reason": "string explaining the result"}`,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this selfie photo and estimate the person's age. Is this person 18 years or older?",
              },
              {
                type: "image_url",
                image_url: {
                  url: photo,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service temporarily unavailable." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error("AI analysis failed");
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || "";

    // Parse the JSON from AI response
    let result;
    try {
      // Extract JSON from potential markdown code blocks
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch {
      console.error("Failed to parse AI response:", content);
      return new Response(
        JSON.stringify({
          approved: false,
          reason: "Não foi possível analisar a foto. Tente novamente com uma foto mais clara.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isAdult = result.is_valid && result.estimated_age !== null && result.estimated_age >= 18;

    return new Response(
      JSON.stringify({
        approved: isAdult,
        estimated_age: result.estimated_age,
        confidence: result.confidence || "unknown",
        reason: !result.is_valid
          ? result.reason === "image_manipulation"
            ? "A foto parece ser de uma tela ou manipulada. Tire uma selfie real."
            : "Não foi possível detectar um rosto claro na foto. Tente novamente."
          : !isAdult
            ? "A verificação indica que você pode ser menor de 18 anos. Cadastro não permitido."
            : "Verificação aprovada.",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("verify-age-photo error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
