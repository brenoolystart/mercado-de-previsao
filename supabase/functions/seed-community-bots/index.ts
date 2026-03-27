import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const BOTS = [
  { name: 'Lucas Trader', email: 'bot-lucas@onchoice.internal', avatar: 'Lucas' },
  { name: 'Ana Investidora', email: 'bot-ana@onchoice.internal', avatar: 'Ana' },
  { name: 'Pedro Markets', email: 'bot-pedro@onchoice.internal', avatar: 'Pedro' },
  { name: 'Julia Cripto', email: 'bot-julia@onchoice.internal', avatar: 'Julia' },
  { name: 'Rafael Odds', email: 'bot-rafael@onchoice.internal', avatar: 'Rafael' },
  { name: 'Camila Bet', email: 'bot-camila@onchoice.internal', avatar: 'Camila' },
  { name: 'Diego Análise', email: 'bot-diego@onchoice.internal', avatar: 'Diego' },
  { name: 'Fernanda Pro', email: 'bot-fernanda@onchoice.internal', avatar: 'Fernanda' },
  { name: 'Thiago Risk', email: 'bot-thiago@onchoice.internal', avatar: 'Thiago' },
  { name: 'Mariana Trends', email: 'bot-mariana@onchoice.internal', avatar: 'Mariana' },
  { name: 'Bruno Gains', email: 'bot-bruno@onchoice.internal', avatar: 'Bruno' },
  { name: 'Isabela Forecast', email: 'bot-isabela@onchoice.internal', avatar: 'Isabela' },
  { name: 'Gustavo Alpha', email: 'bot-gustavo@onchoice.internal', avatar: 'Gustavo' },
  { name: 'Letícia Stats', email: 'bot-leticia@onchoice.internal', avatar: 'Leticia' },
  { name: 'Matheus Edge', email: 'bot-matheus@onchoice.internal', avatar: 'Matheus' },
  { name: 'Carla Previsões', email: 'bot-carla@onchoice.internal', avatar: 'Carla' },
];

const INITIAL_POSTS = [
  { botIdx: 0, content: 'Acabei de entrar na OnChoice e já tô viciado! Esses mercados de previsão são muito mais legais que apostar no escuro. 🎯', hoursAgo: 48 },
  { botIdx: 1, content: 'Pessoal, dica de ouro: nunca coloque mais de 10% do seu saldo em um único mercado. Diversificação é a chave! 💡', hoursAgo: 44 },
  { botIdx: 2, content: 'Tô de olho no mercado de cripto aqui. Bitcoin tá dando sinais de alta e as odds tão muito boas pra quem entrar agora.', hoursAgo: 40 },
  { botIdx: 3, content: 'Alguém mais acertou o mercado do Fed ontem? Eu apostei que iam manter os juros e deu certo! 🙌', hoursAgo: 36 },
  { botIdx: 4, content: 'Fiz minha primeira análise de probabilidades aqui na plataforma. As odds dos mercados de esportes tão muito justas, impressionado.', hoursAgo: 34 },
  { botIdx: 5, content: 'Gente, que plataforma incrível! Consegui lucrar R$200 essa semana só apostando em mercados que eu entendo. Paciência paga!', hoursAgo: 30 },
  { botIdx: 6, content: 'Análise rápida: mercados de política costumam ter mais volatilidade perto de eleições. Fica a dica pra quem quer surfar. 📊', hoursAgo: 28 },
  { botIdx: 7, content: 'Pro pessoal que tá começando: leiam sobre o conceito de "valor esperado" antes de fazer apostas. Muda completamente sua perspectiva.', hoursAgo: 26 },
  { botIdx: 8, content: 'Tô montando uma estratégia de apostas em mercados de tech. Se a Apple lançar algo grande, quero estar posicionado.', hoursAgo: 24 },
  { botIdx: 9, content: 'Mercado de geopolítica hoje tá bem movimentado. Quem acompanha notícias internacionais tem uma vantagem enorme aqui.', hoursAgo: 22 },
  { botIdx: 10, content: 'Ganhos da semana: +R$350 🔥 Apostei certo no mercado de cripto e no de economia. Bora continuar! 💪', hoursAgo: 20 },
  { botIdx: 11, content: 'Uma coisa que aprendi: não apostar por emoção. Se o mercado parece bom demais pra ser verdade, provavelmente tem algo que você não tá vendo.', hoursAgo: 18 },
  { botIdx: 12, content: 'Alguém aqui também opera nos mercados de esportes? Tô achando as odds da NBA muito boas essa temporada.', hoursAgo: 16 },
  { botIdx: 13, content: 'Fiz um estudo de 30 mercados resolvidos e a taxa de acerto da plataforma é impressionante. Os preços realmente refletem as probabilidades reais.', hoursAgo: 14 },
  { botIdx: 14, content: 'Dica do dia: quando o mercado tá 90%+ pra um lado, geralmente não vale a pena apostar. Procure as oportunidades em mercados 40-60%.', hoursAgo: 12 },
  { botIdx: 15, content: 'Primeira vez aqui na comunidade! Vim da Polymarket e tô curtindo muito a versão em português. Muito mais acessível!', hoursAgo: 10 },
  { botIdx: 0, content: 'Update do meu portfólio: 60% em mercados de economia, 25% em cripto e 15% em política. Diversificação é tudo!', hoursAgo: 8 },
  { botIdx: 3, content: 'Quem mais tá vendo esse mercado do Bitcoin? As odds mudaram muito nas últimas 24h. Algo grande vem aí? 🤔', hoursAgo: 6 },
  { botIdx: 5, content: 'Fechei minha semana com +15% de ROI. Não é fácil, mas com estudo e disciplina dá pra ter resultados consistentes.', hoursAgo: 4 },
  { botIdx: 8, content: 'Mercado de IA tá super quente hoje. Quem apostou na OpenAI lançar algo novo deve tá feliz!', hoursAgo: 2 },
  { botIdx: 1, content: 'Boa noite comunidade! Amanhã vou compartilhar minha análise completa dos mercados da semana. Fiquem ligados! 🔔', hoursAgo: 1 },
  { botIdx: 10, content: 'Alguém tem dicas de como analisar melhor os mercados de esportes? Tô querendo expandir meus horizontes.', hoursAgo: 0.5 },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const createdBots: { idx: number; userId: string; name: string }[] = [];

    // Create bot auth users
    for (let i = 0; i < BOTS.length; i++) {
      const bot = BOTS[i];

      // Check if bot already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('full_name', bot.name)
        .maybeSingle();

      if (existingProfile) {
        createdBots.push({ idx: i, userId: existingProfile.user_id, name: bot.name });
        continue;
      }

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: bot.email,
        password: `bot_${bot.avatar}_${Date.now()}`,
        email_confirm: true,
        user_metadata: { full_name: bot.name },
      });

      if (authError) {
        console.error(`Failed to create bot ${bot.name}:`, authError);
        continue;
      }

      const userId = authData.user.id;

      // Update profile with avatar
      await supabase
        .from('profiles')
        .update({
          avatar_url: `https://api.dicebear.com/9.x/avataaars/svg?seed=${bot.avatar}`,
          full_name: bot.name,
        })
        .eq('user_id', userId);

      createdBots.push({ idx: i, userId, name: bot.name });
      console.log(`Created bot: ${bot.name} (${userId})`);
    }

    // Insert initial posts
    let postsCreated = 0;
    const now = Date.now();

    for (const post of INITIAL_POSTS) {
      const bot = createdBots.find(b => b.idx === post.botIdx);
      if (!bot) continue;

      const createdAt = new Date(now - post.hoursAgo * 3600000).toISOString();

      const { error } = await supabase.from('posts').insert({
        user_id: bot.userId,
        content: post.content,
        created_at: createdAt,
      });

      if (!error) postsCreated++;
    }

    // Add some likes between bots
    const { data: allPosts } = await supabase
      .from('posts')
      .select('id, user_id')
      .order('created_at', { ascending: false })
      .limit(30);

    if (allPosts) {
      for (const post of allPosts) {
        // Each post gets 2-5 random bot likes
        const likeCount = 2 + Math.floor(Math.random() * 4);
        const likers = createdBots
          .filter(b => b.userId !== post.user_id)
          .sort(() => Math.random() - 0.5)
          .slice(0, likeCount);

        for (const liker of likers) {
          await supabase.from('post_likes').insert({
            post_id: post.id,
            user_id: liker.userId,
          }).then(() => {});
        }

        // Update likes count
        await supabase.from('posts').update({ likes_count: likeCount }).eq('id', post.id);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      botsCreated: createdBots.length,
      postsCreated,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Seed error:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
