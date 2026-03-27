import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const AI_GATEWAY = 'https://ai.gateway.lovable.dev/v1/chat/completions';

const BOT_TOPICS = [
  'mercados de previsão', 'estratégias de palpites', 'análise de probabilidades',
  'tendências do mercado cripto', 'política americana', 'economia brasileira',
  'esportes e previsões', 'inteligência artificial', 'geopolítica mundial',
  'dicas para iniciantes', 'análise técnica', 'gestão de risco',
  'resultados de palpites', 'mercados mais quentes', 'previsões da semana',
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const apiKey = Deno.env.get('LOVABLE_API_KEY');

    const supabase = createClient(supabaseUrl, serviceKey);

    // Get bot profiles (created by seed function - emails end with @onchoice.internal)
    const { data: botProfiles } = await supabase
      .from('profiles')
      .select('user_id, full_name')
      .in('full_name', [
        'Lucas Trader', 'Ana Investidora', 'Pedro Markets', 'Julia Cripto',
        'Rafael Odds', 'Camila Bet', 'Diego Análise', 'Fernanda Pro',
        'Thiago Risk', 'Mariana Trends', 'Bruno Gains', 'Isabela Forecast',
        'Gustavo Alpha', 'Letícia Stats', 'Matheus Edge', 'Carla Previsões'
      ]);

    if (!botProfiles || botProfiles.length === 0) {
      return new Response(JSON.stringify({ message: 'No bot profiles found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Pick a random bot and topic
    const bot = botProfiles[Math.floor(Math.random() * botProfiles.length)];
    const topic = BOT_TOPICS[Math.floor(Math.random() * BOT_TOPICS.length)];

    let content = '';

    if (apiKey) {
      try {
        const response = await fetch(AI_GATEWAY, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash-lite',
            messages: [
              {
                role: 'system',
                content: `Você é ${bot.full_name}, um trader brasileiro ativo em uma plataforma de mercados de previsão. 
Escreva um post curto e natural (2-4 frases) sobre ${topic}. 
Seja casual, use gírias brasileiras quando apropriado. 
Não use hashtags. Não diga que é um bot. Seja autêntico e engajante.
Varie entre: compartilhar uma opinião, fazer uma previsão, comentar um resultado, dar uma dica, ou reagir a um evento.`
              },
              { role: 'user', content: `Escreva um post sobre ${topic}` }
            ],
            temperature: 0.9,
            max_tokens: 200,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          content = data.choices?.[0]?.message?.content || '';
        }
      } catch (err) {
        console.error('AI generation failed:', err);
      }
    }

    // Fallback content if AI fails
    if (!content) {
      const fallbackPosts = [
        'Alguém mais acompanhando esse mercado de cripto? Tô achando que vai dar uma virada forte.',
        'Fiz um palpite bom ontem e já tô no lucro. A chave é paciência!',
        'Esse mercado de política tá muito volátil, mas quem aguenta colhe os frutos.',
        'Dica: nunca palpite tudo em um único mercado. Diversificação é tudo!',
        'Acabei de analisar as odds e tem oportunidade boa nos mercados de esporte.',
      ];
      content = fallbackPosts[Math.floor(Math.random() * fallbackPosts.length)];
    }

    // Insert the bot post
    const { error } = await supabase.from('posts').insert({
      user_id: bot.user_id,
      content: content.trim(),
      image_url: null,
    });

    if (error) {
      console.error('Error inserting bot post:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Bot ${bot.full_name} posted about ${topic}`);

    return new Response(JSON.stringify({ success: true, bot: bot.full_name, topic }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Bot post error:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
