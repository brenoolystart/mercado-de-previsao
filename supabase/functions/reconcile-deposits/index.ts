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
    // Authenticate caller
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

    // Find deposits marked 'confirmed' but not 'paid' (stuck deposits)
    const { data: stuckDeposits, error: fetchError } = await supabase
      .from('pix_deposits')
      .select('*')
      .eq('status', 'confirmed')
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error('Failed to fetch stuck deposits:', fetchError);
      return new Response(JSON.stringify({ error: 'Failed to fetch deposits' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!stuckDeposits || stuckDeposits.length === 0) {
      console.log('No stuck deposits found');
      return new Response(JSON.stringify({ success: true, processed: 0 }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${stuckDeposits.length} stuck deposit(s) to reconcile`);
    let processed = 0;
    let failed = 0;

    for (const deposit of stuckDeposits) {
      try {
        const destination = String(deposit.destination || deposit.purpose || 'wallet').toLowerCase();

        if (destination === 'gateway') {
          // Gateway funding
          const { data: setting } = await supabase
            .from('platform_settings')
            .select('value')
            .eq('key', 'gateway_balance')
            .maybeSingle();

          const previousBalance = Number(setting?.value) || 0;
          const newBalance = previousBalance + Number(deposit.amount);

          const { error: balanceError } = await supabase
            .from('platform_settings')
            .upsert({
              key: 'gateway_balance',
              value: newBalance,
              description: 'Saldo atual do gateway de pagamento',
              updated_by: deposit.user_id,
            }, { onConflict: 'key' });

          if (balanceError) {
            console.error(`Gateway credit failed for deposit ${deposit.id}:`, balanceError);
            failed++;
            continue;
          }

          await supabase.from('admin_audit_log').insert({
            admin_user_id: adminId,
            action: 'reconcile_gateway_credit',
            target_table: 'pix_deposits',
            target_id: deposit.id,
            old_data: { status: 'confirmed', gateway_balance: previousBalance },
            new_data: { status: 'paid', gateway_balance: newBalance, amount: Number(deposit.amount) },
          }).catch(e => console.error('Audit log failed:', e));

        } else {
          // User wallet credit
          let wallet = null;

          if (deposit.wallet_id) {
            const { data } = await supabase.from('wallets').select('*').eq('id', deposit.wallet_id).single();
            wallet = data;
          }
          if (!wallet) {
            const { data } = await supabase.from('wallets').select('*').eq('user_id', deposit.user_id).single();
            wallet = data;
          }

          if (!wallet) {
            console.error(`No wallet found for deposit ${deposit.id} (user ${deposit.user_id})`);
            failed++;
            continue;
          }

          // Check if transaction already exists (prevent double credit)
          const { data: existingTxn } = await supabase
            .from('transactions')
            .select('id')
            .eq('reference_id', deposit.id)
            .eq('type', 'deposit')
            .maybeSingle();

          if (existingTxn) {
            console.log(`Deposit ${deposit.id} already has a transaction, just updating status`);
          } else {
            const newBalance = Number(wallet.balance) + Number(deposit.amount);

            const { error: walletError } = await supabase
              .from('wallets')
              .update({
                balance: newBalance,
                total_deposited: Number(wallet.total_deposited) + Number(deposit.amount),
              })
              .eq('id', wallet.id);

            if (walletError) {
              console.error(`Wallet credit failed for deposit ${deposit.id}:`, walletError);
              failed++;
              continue;
            }

            await supabase.from('transactions').insert({
              user_id: deposit.user_id,
              wallet_id: wallet.id,
              type: 'deposit',
              amount: deposit.amount,
              balance_after: newBalance,
              description: `Depósito via PIX - ${deposit.external_id} (reconciliado)`,
              reference_id: deposit.id,
            }).catch(e => console.error('Transaction insert failed:', e));

            console.log(`Wallet credited for deposit ${deposit.id}: +${deposit.amount}`);
          }
        }

        // Mark as paid
        await supabase.from('pix_deposits').update({
          status: 'paid',
          paid_at: deposit.paid_at || new Date().toISOString(),
        }).eq('id', deposit.id);

        processed++;
        console.log(`Deposit ${deposit.id} reconciled successfully`);

      } catch (e) {
        console.error(`Error processing deposit ${deposit.id}:`, e);
        failed++;
      }
    }

    const summary = { success: true, total: stuckDeposits.length, processed, failed };
    console.log('Reconciliation complete:', JSON.stringify(summary));

    return new Response(JSON.stringify(summary), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Reconciliation error:', error);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
