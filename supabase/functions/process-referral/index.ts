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

    const { referralCode } = await req.json();
    if (!referralCode || typeof referralCode !== 'string' || referralCode.length < 4) {
      return new Response(JSON.stringify({ error: 'Código inválido' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Check if user was already referred
    const { data: alreadyReferred } = await supabase
      .from('referrals')
      .select('id')
      .eq('referred_user_id', userId)
      .limit(1);

    if (alreadyReferred && alreadyReferred.length > 0) {
      return new Response(JSON.stringify({ error: 'Você já foi indicado por alguém' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Find the referral code owner
    const { data: referralEntry } = await supabase
      .from('referrals')
      .select('*')
      .eq('referral_code', referralCode.toUpperCase())
      .is('referred_user_id', null)
      .eq('status', 'active')
      .limit(1);

    let referrerId: string;

    if (referralEntry && referralEntry.length > 0) {
      referrerId = referralEntry[0].referrer_id;

      // Don't allow self-referral
      if (referrerId === userId) {
        return new Response(JSON.stringify({ error: 'Você não pode usar seu próprio código' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Create a new referral entry for this referred user
      await supabase.from('referrals').insert({
        referrer_id: referrerId,
        referred_user_id: userId,
        referral_code: referralCode.toUpperCase(),
        status: 'converted',
        converted_at: new Date().toISOString(),
      });
    } else {
      // Maybe the code is just a user prefix - find by code
      const { data: anyRef } = await supabase
        .from('referrals')
        .select('referrer_id')
        .eq('referral_code', referralCode.toUpperCase())
        .limit(1);

      if (!anyRef || anyRef.length === 0) {
        return new Response(JSON.stringify({ error: 'Código de indicação não encontrado' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      referrerId = anyRef[0].referrer_id;

      if (referrerId === userId) {
        return new Response(JSON.stringify({ error: 'Você não pode usar seu próprio código' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      await supabase.from('referrals').insert({
        referrer_id: referrerId,
        referred_user_id: userId,
        referral_code: referralCode.toUpperCase(),
        status: 'converted',
        converted_at: new Date().toISOString(),
      });
    }

    // Credit R$25 to referrer
    const { data: referrerWallet } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', referrerId)
      .single();

    if (referrerWallet) {
      const newBalance = Number(referrerWallet.balance) + 25;
      await supabase.from('wallets').update({ balance: newBalance }).eq('id', referrerWallet.id);

      await supabase.from('transactions').insert({
        user_id: referrerId,
        wallet_id: referrerWallet.id,
        type: 'referral_bonus',
        amount: 25,
        balance_after: newBalance,
        description: 'Bônus de indicação: amigo cadastrado!',
      });

      // Update referral bonus status
      await supabase.from('referrals')
        .update({ referrer_bonus_paid: true })
        .eq('referrer_id', referrerId)
        .eq('referred_user_id', userId);

      await supabase.from('notifications').insert({
        user_id: referrerId,
        type: 'referral',
        title: '🎉 Indicação convertida!',
        message: 'Um amigo se cadastrou com seu código! R$25 foram adicionados à sua carteira.',
      });
    }

    return new Response(JSON.stringify({ success: true, message: 'Indicação registrada com sucesso!' }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Process referral error:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
