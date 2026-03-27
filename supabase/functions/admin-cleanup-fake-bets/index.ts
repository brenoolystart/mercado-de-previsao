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

    // Find all users with 0 real deposits (no paid pix_deposits)
    const { data: allWallets } = await supabase.from('wallets').select('user_id, id, balance, total_deposited');
    const { data: paidDeposits } = await supabase.from('pix_deposits').select('user_id, amount').eq('status', 'paid');

    const realDepositMap = new Map<string, number>();
    (paidDeposits || []).forEach(d => {
      realDepositMap.set(d.user_id, (realDepositMap.get(d.user_id) || 0) + Number(d.amount));
    });

    let cancelledBets = 0;
    let walletsReset = 0;
    const affectedUsers: string[] = [];

    for (const wallet of (allWallets || [])) {
      const realDeposit = realDepositMap.get(wallet.user_id) || 0;

      if (realDeposit <= 0) {
        // This user has NO real deposits - cancel all their pending bets
        const { data: userBets } = await supabase
          .from('bets')
          .select('id, amount')
          .eq('user_id', wallet.user_id)
          .eq('status', 'pending');

        if (userBets && userBets.length > 0) {
          await supabase.from('bets')
            .update({ status: 'cancelled', resolved_at: new Date().toISOString() })
            .eq('user_id', wallet.user_id)
            .eq('status', 'pending');

          cancelledBets += userBets.length;
          affectedUsers.push(wallet.user_id);
        }

        // Reset wallet to 0
        if (Number(wallet.balance) > 0 || Number(wallet.total_deposited) > 0) {
          await supabase.from('wallets').update({
            balance: 0,
            total_deposited: 0,
            total_lost: 0,
            total_won: 0,
          }).eq('id', wallet.id);
          walletsReset++;
        }
      } else {
        // User has real deposits - ensure wallet total_deposited matches reality
        if (Number(wallet.total_deposited) !== realDeposit) {
          await supabase.from('wallets').update({
            total_deposited: realDeposit,
          }).eq('id', wallet.id);
        }
      }
    }

    // Audit log
    await supabase.from('admin_audit_log').insert({
      admin_user_id: adminId,
      action: 'cleanup_fake_bets',
      target_table: 'bets',
      new_data: { cancelledBets, walletsReset, affectedUsers },
    });

    return new Response(JSON.stringify({
      success: true,
      cancelledBets,
      walletsReset,
      affectedUsers: affectedUsers.length,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
