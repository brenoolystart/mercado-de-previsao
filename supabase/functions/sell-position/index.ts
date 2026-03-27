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
    const userId = claimsData.claims.sub;

    const { betId, sellAmount } = await req.json();

    if (!betId || !sellAmount || sellAmount <= 0) {
      return new Response(JSON.stringify({ error: 'Dados incompletos' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Fetch the bet
    const { data: bet, error: betError } = await supabase
      .from('bets')
      .select('*')
      .eq('id', betId)
      .eq('user_id', userId)
      .eq('status', 'pending')
      .single();

    if (betError || !bet) {
      return new Response(JSON.stringify({ error: 'Palpite não encontrado ou já resolvido' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Validate sell amount doesn't exceed the original bet amount
    if (sellAmount > Number(bet.amount)) {
      return new Response(JSON.stringify({ error: 'Valor de venda excede o valor do palpite' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Calculate sell value: user gets back the sell amount * current market price
    // For simplicity, we use the price_at_bet as current price (since we don't have a real order book)
    // The user gets back a percentage of their original stake
    const sellRatio = sellAmount / Number(bet.amount);
    const currentPrice = Number(bet.price_at_bet);
    
    // Sell value = shares being sold * current price
    // shares = original amount / price_at_bet
    // sell_shares = shares * sellRatio
    // sell_value = sell_shares * currentPrice = sellAmount (at same price)
    // But to make it realistic, add a small spread (user gets 95% of face value)
    const sellValue = sellAmount * 0.95;

    // Get wallet
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (walletError || !wallet) {
      return new Response(JSON.stringify({ error: 'Carteira não encontrada' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const newBalance = Number(wallet.balance) + sellValue;
    const remainingAmount = Number(bet.amount) - sellAmount;
    const remainingPayout = Number(bet.potential_payout) * (1 - sellRatio);

    // If selling entire position, mark bet as cancelled
    if (remainingAmount < 0.01) {
      const { error: updateBetError } = await supabase
        .from('bets')
        .update({
          status: 'cancelled',
          resolved_at: new Date().toISOString(),
          payout_amount: sellValue,
        })
        .eq('id', betId);

      if (updateBetError) {
        console.error('Update bet error:', updateBetError);
        return new Response(JSON.stringify({ error: 'Erro ao atualizar palpite' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    } else {
      // Partial sell - reduce the bet amount
      const { error: updateBetError } = await supabase
        .from('bets')
        .update({
          amount: remainingAmount,
          potential_payout: remainingPayout,
        })
        .eq('id', betId);

      if (updateBetError) {
        console.error('Update bet error:', updateBetError);
        return new Response(JSON.stringify({ error: 'Erro ao atualizar palpite' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // Credit wallet
    const { error: creditError } = await supabase
      .from('wallets')
      .update({
        balance: newBalance,
        total_won: Number(wallet.total_won) + sellValue,
      })
      .eq('id', wallet.id);

    if (creditError) {
      console.error('Wallet credit error:', creditError);
      return new Response(JSON.stringify({ error: 'Erro ao creditar carteira' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Create transaction
    await supabase.from('transactions').insert({
      user_id: userId,
      wallet_id: wallet.id,
      type: 'bet_won',
      amount: sellValue,
      balance_after: newBalance,
      description: `Venda de posição: ${bet.market_title.substring(0, 50)}...`,
      reference_id: betId,
    });

    return new Response(JSON.stringify({ 
      success: true, 
      sellValue,
      remainingAmount: remainingAmount < 0.01 ? 0 : remainingAmount,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Sell position error:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});