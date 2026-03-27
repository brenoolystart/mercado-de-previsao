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

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Verify admin
    const { data: isAdmin } = await supabase.rpc('is_admin', { _user_id: adminId });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Acesso negado' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { withdrawalId, action, adminNotes } = await req.json();
    if (!withdrawalId || !['approve', 'reject'].includes(action)) {
      return new Response(JSON.stringify({ error: 'Dados inválidos' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: withdrawal, error: findError } = await supabase
      .from('pix_withdrawals')
      .select('*')
      .eq('id', withdrawalId)
      .single();

    if (findError || !withdrawal) {
      return new Response(JSON.stringify({ error: 'Saque não encontrado' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (withdrawal.status !== 'pending') {
      return new Response(JSON.stringify({ error: 'Este saque já foi processado' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const now = new Date().toISOString();

    if (action === 'approve') {
      await supabase.from('pix_withdrawals').update({
        status: 'approved',
        processed_by: adminId,
        processed_at: now,
        admin_notes: adminNotes || null,
      }).eq('id', withdrawalId);
    } else {
      // Reject: refund balance
      const { data: wallet } = await supabase
        .from('wallets')
        .select('*')
        .eq('id', withdrawal.wallet_id)
        .single();

      if (wallet) {
        const newBalance = Number(wallet.balance) + Number(withdrawal.amount);
        await supabase.from('wallets').update({
          balance: newBalance,
          total_withdrawn: Math.max(0, Number(wallet.total_withdrawn) - Number(withdrawal.amount)),
        }).eq('id', wallet.id);

        await supabase.from('transactions').insert({
          user_id: withdrawal.user_id,
          wallet_id: wallet.id,
          type: 'refund',
          amount: Number(withdrawal.amount),
          balance_after: newBalance,
          description: `Saque rejeitado - valor devolvido${adminNotes ? ': ' + adminNotes : ''}`,
          reference_id: withdrawalId,
        });
      }

      await supabase.from('pix_withdrawals').update({
        status: 'rejected',
        processed_by: adminId,
        processed_at: now,
        admin_notes: adminNotes || null,
      }).eq('id', withdrawalId);
    }

    // Audit
    await supabase.from('admin_audit_log').insert({
      admin_user_id: adminId,
      action: `withdrawal_${action}`,
      target_table: 'pix_withdrawals',
      target_id: withdrawalId,
      old_data: { status: 'pending' },
      new_data: { status: action === 'approve' ? 'approved' : 'rejected', adminNotes },
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Process withdrawal error:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
