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

    const { amount, pixKey, pixKeyType } = await req.json();

    if (!amount || amount <= 0) {
      return new Response(JSON.stringify({ error: 'Valor inválido' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!pixKey || !pixKeyType) {
      return new Response(JSON.stringify({ error: 'Chave PIX obrigatória' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const validKeyTypes = ['cpf', 'cnpj', 'email', 'telefone', 'aleatoria'];
    if (!validKeyTypes.includes(pixKeyType)) {
      return new Response(JSON.stringify({ error: 'Tipo de chave PIX inválido' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Get wallet
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (walletError || !wallet) {
      return new Response(JSON.stringify({ error: 'Carteira não encontrada' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const minWithdrawal = 10;
    if (amount < minWithdrawal) {
      return new Response(JSON.stringify({ error: `Valor mínimo para saque: R$ ${minWithdrawal}` }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (Number(wallet.balance) < amount) {
      return new Response(JSON.stringify({ error: 'Saldo insuficiente' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Check for pending withdrawals
    const { data: pendingWithdrawals } = await supabase
      .from('pix_withdrawals')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'pending');

    if (pendingWithdrawals && pendingWithdrawals.length > 0) {
      return new Response(JSON.stringify({ error: 'Você já tem um saque pendente. Aguarde a aprovação.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const newBalance = Number(wallet.balance) - amount;

    // Debit wallet
    await supabase.from('wallets').update({
      balance: newBalance,
      total_withdrawn: Number(wallet.total_withdrawn) + amount,
    }).eq('id', wallet.id);

    // Create withdrawal record
    const { data: withdrawal, error: withdrawalError } = await supabase
      .from('pix_withdrawals')
      .insert({
        user_id: userId,
        wallet_id: wallet.id,
        amount,
        pix_key: pixKey,
        pix_key_type: pixKeyType,
        status: 'pending',
      })
      .select()
      .single();

    if (withdrawalError) {
      // Rollback wallet
      await supabase.from('wallets').update({
        balance: Number(wallet.balance),
        total_withdrawn: Number(wallet.total_withdrawn),
      }).eq('id', wallet.id);
      return new Response(JSON.stringify({ error: 'Erro ao criar saque' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Create transaction
    await supabase.from('transactions').insert({
      user_id: userId,
      wallet_id: wallet.id,
      type: 'withdrawal',
      amount: -amount,
      balance_after: newBalance,
      description: `Saque via PIX - ${pixKeyType}: ${pixKey.substring(0, 6)}***`,
      reference_id: withdrawal.id,
    });

    return new Response(JSON.stringify({ success: true, withdrawal }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Withdrawal error:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
