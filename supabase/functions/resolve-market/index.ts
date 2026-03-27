import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
    const adminId = claimsData.claims.sub;

    // Use service role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Verify admin
    const { data: isAdmin } = await supabase.rpc('is_admin', { _user_id: adminId });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Acesso negado' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { marketId, winningPosition } = await req.json();
    if (!marketId || !['yes', 'no'].includes(winningPosition)) {
      return new Response(JSON.stringify({ error: 'Dados inválidos. Informe marketId e winningPosition (yes/no)' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Fetch all pending bets for this market
    const { data: pendingBets, error: betsError } = await supabase
      .from('bets')
      .select('*')
      .eq('market_id', marketId)
      .eq('status', 'pending');

    if (betsError) {
      return new Response(JSON.stringify({ error: 'Erro ao buscar apostas' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!pendingBets || pendingBets.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'Nenhuma aposta pendente para este mercado', resolved: 0 }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let wonCount = 0;
    let lostCount = 0;
    let totalPayout = 0;
    const now = new Date().toISOString();
    const notifiedUsers = new Set<string>();

    for (const bet of pendingBets) {
      const isWinner = bet.position === winningPosition;
      const payoutAmount = isWinner ? Number(bet.potential_payout) : 0;

      // Update bet
      await supabase.from('bets').update({
        status: isWinner ? 'won' : 'lost',
        payout_amount: payoutAmount,
        resolved_at: now,
      }).eq('id', bet.id);

      if (isWinner) {
        // Credit winner wallet
        const { data: wallet } = await supabase
          .from('wallets')
          .select('*')
          .eq('id', bet.wallet_id)
          .single();

        if (wallet) {
          const newBalance = Number(wallet.balance) + payoutAmount;
          await supabase.from('wallets').update({
            balance: newBalance,
            total_won: Number(wallet.total_won) + payoutAmount,
          }).eq('id', wallet.id);

          await supabase.from('transactions').insert({
            user_id: bet.user_id,
            wallet_id: wallet.id,
            type: 'bet_won',
            amount: payoutAmount,
            balance_after: newBalance,
            description: `Ganhou: ${bet.market_title.substring(0, 50)}`,
            reference_id: bet.id,
          });
        }
        wonCount++;
        totalPayout += payoutAmount;
      } else {
        lostCount++;
      }

      // Send notification to bettor (once per user)
      if (!notifiedUsers.has(bet.user_id)) {
        notifiedUsers.add(bet.user_id);
        const title = isWinner ? '🎉 Você ganhou!' : '📊 Mercado resolvido';
        const message = isWinner
          ? `Parabéns! Você acertou "${bet.market_title.substring(0, 40)}" e ganhou R$ ${payoutAmount.toFixed(2)}!`
          : `O mercado "${bet.market_title.substring(0, 40)}" foi resolvido. Resultado: ${winningPosition === 'yes' ? 'Sim' : 'Não'}.`;

        await supabase.from('notifications').insert({
          user_id: bet.user_id,
          type: 'market_resolved',
          title,
          message,
          reference_id: bet.market_id,
        });
      }
    }

    // Audit log
    await supabase.from('admin_audit_log').insert({
      admin_user_id: adminId,
      action: 'resolve_market',
      target_table: 'bets',
      target_id: marketId,
      new_data: { winningPosition, wonCount, lostCount, totalPayout },
    });

    return new Response(JSON.stringify({
      success: true,
      resolved: pendingBets.length,
      wonCount,
      lostCount,
      totalPayout,
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Resolve market error:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
