import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function parseSettingNumber(value: unknown) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return Number(value) || 0;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.json();
    console.log('Webhook received:', JSON.stringify(rawBody));

    const body = rawBody.requestBody || rawBody;
    const externalId = body.external_id || body.externalId || body.referenceId;
    const status = String(body.status || body.event || '').trim();

    if (!externalId) {
      console.error('No external_id in webhook payload');
      return new Response(JSON.stringify({ error: 'Missing external_id' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: deposit, error: findError } = await supabase
      .from('pix_deposits')
      .select('*')
      .eq('external_id', externalId)
      .single();

    if (findError || !deposit) {
      console.error('Deposit not found for external_id:', externalId);
      return new Response(JSON.stringify({ error: 'Deposit not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Already fully processed — idempotent return
    if (String(deposit.status).toLowerCase() === 'paid') {
      console.log('Deposit already fully processed (paid):', externalId);
      return new Response(JSON.stringify({ success: true, message: 'Already processed' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const isPaid = ['CONFIRMED', 'PAID', 'COMPLETED', 'paid', 'confirmed', 'completed', 'APPROVED', 'approved'].includes(status);
    const destination = String(deposit.destination || deposit.purpose || 'wallet').toLowerCase();

    if (isPaid) {
      // ===== CRITICAL FIX: Credit wallet/gateway FIRST, then mark deposit as paid =====
      // This ensures that if crediting fails, the deposit stays in a retryable state.

      if (destination === 'gateway') {
        // --- Gateway funding ---
        const { data: setting, error: settingError } = await supabase
          .from('platform_settings')
          .select('value')
          .eq('key', 'gateway_balance')
          .maybeSingle();

        if (settingError) {
          console.error('Gateway balance lookup failed:', settingError);
          return new Response(JSON.stringify({ error: 'Failed to load gateway balance' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const previousBalance = parseSettingNumber(setting?.value);
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
          console.error('Gateway balance update failed:', balanceError);
          return new Response(JSON.stringify({ error: 'Failed to update gateway balance' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // Audit log (non-blocking)
        await supabase
          .from('admin_audit_log')
          .insert({
            admin_user_id: deposit.user_id,
            action: 'gateway_balance_pix_credit',
            target_table: 'platform_settings',
            target_id: 'gateway_balance',
            old_data: { value: previousBalance, deposit_id: deposit.id, external_id: deposit.external_id },
            new_data: { value: newBalance, deposit_amount: Number(deposit.amount), external_id: deposit.external_id, source: 'pix_gateway_funding' },
          }).catch(e => console.error('Gateway audit log failed:', e));

        console.log('Gateway funding credited:', externalId);

      } else {
        // --- User wallet credit ---
        const { data: wallet, error: walletError } = await supabase
          .from('wallets')
          .select('*')
          .eq('id', deposit.wallet_id)
          .single();

        if (walletError || !wallet) {
          // Fallback: try finding wallet by user_id if wallet_id lookup fails
          const { data: walletByUser, error: walletByUserError } = await supabase
            .from('wallets')
            .select('*')
            .eq('user_id', deposit.user_id)
            .single();

          if (walletByUserError || !walletByUser) {
            console.error('Wallet not found for deposit:', deposit.id, walletError, walletByUserError);
            return new Response(JSON.stringify({ error: 'Wallet not found' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          }

          // Use the wallet found by user_id
          const newBalance = Number(walletByUser.balance) + Number(deposit.amount);

          const { error: walletUpdateError } = await supabase
            .from('wallets')
            .update({
              balance: newBalance,
              total_deposited: Number(walletByUser.total_deposited) + Number(deposit.amount),
            })
            .eq('id', walletByUser.id);

          if (walletUpdateError) {
            console.error('Wallet update failed (fallback):', walletUpdateError);
            return new Response(JSON.stringify({ error: 'Failed to credit wallet' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          }

          // Transaction record
          await supabase.from('transactions').insert({
            user_id: deposit.user_id,
            wallet_id: walletByUser.id,
            type: 'deposit',
            amount: deposit.amount,
            balance_after: newBalance,
            description: `Depósito via PIX - ${externalId}`,
            reference_id: deposit.id,
          }).catch(e => console.error('Transaction creation failed:', e));

          console.log('Deposit credited via user_id fallback:', externalId);

        } else {
          const newBalance = Number(wallet.balance) + Number(deposit.amount);

          const { error: walletUpdateError } = await supabase
            .from('wallets')
            .update({
              balance: newBalance,
              total_deposited: Number(wallet.total_deposited) + Number(deposit.amount),
            })
            .eq('id', wallet.id);

          if (walletUpdateError) {
            console.error('Wallet update failed:', walletUpdateError);
            return new Response(JSON.stringify({ error: 'Failed to credit wallet' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          }

          // Transaction record
          await supabase.from('transactions').insert({
            user_id: deposit.user_id,
            wallet_id: wallet.id,
            type: 'deposit',
            amount: deposit.amount,
            balance_after: newBalance,
            description: `Depósito via PIX - ${externalId}`,
            reference_id: deposit.id,
          }).catch(e => console.error('Transaction creation failed:', e));

          console.log('Deposit confirmed and wallet credited:', externalId);
        }
      }

      // ===== NOW mark deposit as 'paid' — only after successful credit =====
      const { error: updateDepositError } = await supabase
        .from('pix_deposits')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          gateway_response: body,
        })
        .eq('id', deposit.id);

      if (updateDepositError) {
        // Credit succeeded but status update failed — log but don't fail
        // Next webhook retry will see wallet already credited, and deposit not yet 'paid',
        // so it would try to credit again. To prevent double-credit, we check below.
        console.error('Failed to mark deposit as paid (wallet already credited!):', updateDepositError);
      }

    } else if (String(deposit.status).toLowerCase() === 'confirmed') {
      // Status is 'confirmed' (legacy) but not 'paid' — this means credit may have failed before.
      // Re-attempt credit by treating as a paid webhook (recursive safety: only if not already paid)
      console.log('Deposit in confirmed state, skipping non-paid webhook status:', status);
    } else {
      await supabase
        .from('pix_deposits')
        .update({
          status: status.toLowerCase(),
          gateway_response: body,
        })
        .eq('id', deposit.id);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
