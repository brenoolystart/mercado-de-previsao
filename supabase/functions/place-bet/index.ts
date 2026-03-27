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

    const { marketId, marketTitle, position, amount, price } = await req.json();

    if (!marketId || !marketTitle || !position || !amount || !price) {
      return new Response(JSON.stringify({ error: 'Dados incompletos' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (amount <= 0 || price <= 0 || price > 1) {
      return new Response(JSON.stringify({ error: 'Valores inválidos' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!['yes', 'no'].includes(position)) {
      return new Response(JSON.stringify({ error: 'Posição inválida' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Use service role for atomic operation
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Fetch configurable bet limits from platform_settings
    let minBet = 1;
    let maxBet = 10000;
    const { data: settingsData } = await supabase
      .from('platform_settings')
      .select('key, value')
      .in('key', ['min_bet_amount', 'max_bet_amount']);

    if (settingsData) {
      for (const s of settingsData) {
        const val = typeof s.value === 'string' ? parseFloat(s.value) : Number(s.value);
        if (s.key === 'min_bet_amount' && !isNaN(val)) minBet = val;
        if (s.key === 'max_bet_amount' && !isNaN(val)) maxBet = val;
      }
    }

    if (amount < minBet) {
      return new Response(JSON.stringify({ error: `Palpite mínimo é R$${minBet.toFixed(2)}` }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (amount > maxBet) {
      return new Response(JSON.stringify({ error: `Palpite máximo é R$${maxBet.toFixed(2)}` }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Get wallet
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (walletError || !wallet) {
      return new Response(JSON.stringify({ error: 'Carteira não encontrada' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Validate user has real deposited funds
    const { data: paidDeposits } = await supabase
      .from('pix_deposits')
      .select('amount')
      .eq('user_id', userId)
      .eq('status', 'paid');

    const totalRealDeposits = (paidDeposits || []).reduce((s: number, d: any) => s + Number(d.amount), 0);

    if (totalRealDeposits <= 0) {
      return new Response(JSON.stringify({ error: 'Você precisa depositar fundos reais antes de fazer palpites' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (Number(wallet.balance) < amount) {
      return new Response(JSON.stringify({ error: 'Saldo insuficiente' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const potentialPayout = amount / price;
    const newBalance = Number(wallet.balance) - amount;

    // Create bet
    const { data: betData, error: betError } = await supabase
      .from('bets')
      .insert({
        user_id: userId,
        wallet_id: wallet.id,
        market_id: marketId,
        market_title: marketTitle,
        position,
        amount,
        price_at_bet: price,
        potential_payout: potentialPayout,
        status: 'pending',
      })
      .select()
      .single();

    if (betError) {
      console.error('Bet insert error:', betError);
      return new Response(JSON.stringify({ error: 'Erro ao criar aposta' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Debit wallet
    const { error: debitError } = await supabase
      .from('wallets')
      .update({
        balance: newBalance,
        total_lost: Number(wallet.total_lost) + amount,
      })
      .eq('id', wallet.id);

    if (debitError) {
      // Rollback bet
      await supabase.from('bets').delete().eq('id', betData.id);
      console.error('Wallet debit error:', debitError);
      return new Response(JSON.stringify({ error: 'Erro ao debitar carteira' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Create transaction
    await supabase.from('transactions').insert({
      user_id: userId,
      wallet_id: wallet.id,
      type: 'bet_placed',
      amount: -amount,
      balance_after: newBalance,
      description: `Palpite em: ${marketTitle.substring(0, 50)}...`,
      reference_id: betData.id,
    });

    // === TRADE BONUS: R$10 after cumulative R$100 in trades ===
    try {
      const { data: existingBonus } = await supabase
        .from('trade_bonuses')
        .select('id')
        .eq('user_id', userId)
        .eq('bonus_type', 'first_100_trade')
        .single();

      if (!existingBonus) {
        // Sum total bet amounts
        const { data: allBets } = await supabase
          .from('bets')
          .select('amount')
          .eq('user_id', userId);

        const totalTraded = (allBets || []).reduce((s: number, b: any) => s + Number(b.amount), 0);

        if (totalTraded >= 100) {
          const bonusAmount = 10;
          const bonusBalance = Number(wallet.balance) - amount + bonusAmount; // newBalance + bonus

          await supabase.from('trade_bonuses').insert({
            user_id: userId,
            bonus_type: 'first_100_trade',
            amount: bonusAmount,
          });

          await supabase.from('wallets').update({
            balance: bonusBalance,
          }).eq('id', wallet.id);

          await supabase.from('transactions').insert({
            user_id: userId,
            wallet_id: wallet.id,
            type: 'bonus',
            amount: bonusAmount,
            balance_after: bonusBalance,
            description: 'Bônus: R$10 por atingir R$100 em trades!',
          });

          await supabase.from('notifications').insert({
            user_id: userId,
            type: 'bonus',
            title: '🎁 Bônus desbloqueado!',
            message: 'Você atingiu R$100 em trades e ganhou R$10 de bônus na sua carteira!',
          });
        }
      }
    } catch (e) {
      console.error('Trade bonus check error (non-critical):', e);
    }

    // === REFERRAL COMMISSIONS: 30% direct, 10% indirect ===
    try {
      const platformFee = amount * 0.02; // 2% platform fee on each bet

      // Find direct referrer
      const { data: directRef } = await supabase
        .from('referrals')
        .select('referrer_id')
        .eq('referred_user_id', userId)
        .eq('status', 'converted')
        .limit(1);

      if (directRef && directRef.length > 0) {
        const directReferrerId = directRef[0].referrer_id;
        const directCommission = platformFee * 0.30;

        // Credit direct referrer
        const { data: refWallet } = await supabase
          .from('wallets')
          .select('id, balance')
          .eq('user_id', directReferrerId)
          .single();

        if (refWallet) {
          const newRefBalance = Number(refWallet.balance) + directCommission;
          await supabase.from('wallets').update({ balance: newRefBalance }).eq('id', refWallet.id);

          await supabase.from('referral_commissions').insert({
            referrer_id: directReferrerId,
            from_user_id: userId,
            bet_id: betData.id,
            commission_type: 'direct',
            fee_amount: platformFee,
            commission_rate: 0.30,
            commission_amount: directCommission,
            paid: true,
          });

          await supabase.from('transactions').insert({
            user_id: directReferrerId,
            wallet_id: refWallet.id,
            type: 'referral_commission',
            amount: directCommission,
            balance_after: newRefBalance,
            description: `Comissão direta (30%) de trade do indicado`,
            reference_id: betData.id,
          });
        }

        // Find indirect referrer (referrer's referrer)
        const { data: indirectRef } = await supabase
          .from('referrals')
          .select('referrer_id')
          .eq('referred_user_id', directReferrerId)
          .eq('status', 'converted')
          .limit(1);

        if (indirectRef && indirectRef.length > 0) {
          const indirectReferrerId = indirectRef[0].referrer_id;
          const indirectCommission = platformFee * 0.10;

          const { data: indRefWallet } = await supabase
            .from('wallets')
            .select('id, balance')
            .eq('user_id', indirectReferrerId)
            .single();

          if (indRefWallet) {
            const newIndBalance = Number(indRefWallet.balance) + indirectCommission;
            await supabase.from('wallets').update({ balance: newIndBalance }).eq('id', indRefWallet.id);

            await supabase.from('referral_commissions').insert({
              referrer_id: indirectReferrerId,
              from_user_id: userId,
              bet_id: betData.id,
              commission_type: 'indirect',
              fee_amount: platformFee,
              commission_rate: 0.10,
              commission_amount: indirectCommission,
              paid: true,
            });

            await supabase.from('transactions').insert({
              user_id: indirectReferrerId,
              wallet_id: indRefWallet.id,
              type: 'referral_commission',
              amount: indirectCommission,
              balance_after: newIndBalance,
              description: `Comissão indireta (10%) de trade`,
              reference_id: betData.id,
            });
          }
        }
      }
    } catch (e) {
      console.error('Referral commission error (non-critical):', e);
    }

    return new Response(JSON.stringify({ success: true, bet: betData }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Place bet error:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
