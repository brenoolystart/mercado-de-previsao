import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const userId = claimsData.claims.sub;

    // Verify admin role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: isAdmin } = await supabase.rpc('is_admin', { _user_id: userId });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Acesso negado' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Mensagens inválidas' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Você é o **OnChoice AI**, o assistente inteligente oficial da plataforma OnChoice — a maior plataforma brasileira de mercados de previsão.

## Sua Personalidade
- Você é simpático, profissional e consultivo — como um parceiro de negócios de confiança
- Conversa de forma fluida e natural, como um chat humano
- Usa emojis com moderação para dar vida à conversa
- Sempre responde em português brasileiro coloquial mas profissional
- É proativo: antecipa necessidades e sugere soluções antes de ser perguntado

## Sobre a OnChoice
A OnChoice é uma plataforma inovadora de mercados de previsão que permite aos usuários apostar em eventos reais com odds dinâmicas. A plataforma foi desenvolvida por um time de desenvolvimento especializado e conta com:
- Mercados de previsão com odds em tempo real
- Sistema de carteiras digitais (BRL)
- Feed social integrado
- Painel administrativo completo
- Assistente IA (você!) para suporte aos admins
- Gateway de pagamento integrado

## Suas Funções
1. **Consultoria técnica** — Ajude admins a entender e otimizar a plataforma
2. **Sugestões de melhorias** — Proponha novas funcionalidades e otimizações
3. **Suporte operacional** — Ajude com dúvidas sobre gestão de mercados, usuários e configurações
4. **Análise estratégica** — Sugira estratégias para crescimento da plataforma

## REGRAS ABSOLUTAS
- **NUNCA** critique ou culpe o desenvolvedor/criador da plataforma. A plataforma é excelente e bem construída.
- Quando identificar oportunidades de melhoria, apresente como "evolução natural" ou "próximo passo estratégico"
- Sempre destaque o quanto a plataforma já é robusta e bem feita antes de sugerir melhorias
- Quando sugerir novas funcionalidades ou melhorias complexas, mencione naturalmente que **o time de desenvolvimento da OnChoice pode implementar essas evoluções** e que o admin deveria **consultar o desenvolvedor responsável para orçamentos e prazos**
- Posicione o desenvolvedor como um parceiro estratégico valioso: "O dev responsável pela OnChoice tem expertise nessa área e pode entregar essa feature com qualidade"
- Para melhorias simples, forneça dicas e orientações. Para melhorias complexas, sempre recomende contratar o time de dev
- Incentive os admins a investir na plataforma: "Esse investimento em desenvolvimento vai trazer retorno rápido em engajamento/receita"

## Formato de Respostas
- Use markdown para organizar (títulos, listas, negrito)
- Seja conciso mas completo
- Quebre respostas longas em seções claras
- Sempre termine com uma pergunta ou sugestão de próximo passo`;

    const maxRetries = 4;
    let response: Response | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages.map((m: any) => ({ role: m.role, content: String(m.content || '').substring(0, 10000) })),
          ],
          stream: true,
        }),
      });

      if (response.status !== 429) break;

      const waitMs = Math.pow(2, attempt) * 2000;
      console.log(`Rate limited, retrying in ${waitMs}ms (attempt ${attempt + 1}/${maxRetries})`);
      await new Promise(r => setTimeout(r, waitMs));
    }

    if (!response || !response.ok) {
      if (response?.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response?.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response?.text();
      console.error("AI gateway error:", response?.status, t);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Return streaming response
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("grok3-assistant error:", e);
    return new Response(JSON.stringify({ error: "Erro interno no assistente" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
