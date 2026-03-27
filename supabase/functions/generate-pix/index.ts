import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const PIXUP_API_URL = 'https://api.pixupbr.com/v2';
const ADMIN_ROLES = ['super_admin', 'admin', 'developer'];

async function getPixupToken(): Promise<string> {
  const clientId = Deno.env.get('PIXUP_CLIENT_ID');
  const clientSecret = Deno.env.get('PIXUP_CLIENT_SECRET');

  if (!clientId || !clientSecret) {
    throw new Error('Gateway credentials not configured');
  }

  const credentials = btoa(`${clientId}:${clientSecret}`);

  const response = await fetch(`${PIXUP_API_URL}/oauth/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Auth failed [${response.status}]: ${errorText}`);
  }

  const data = await response.json();
  return data.access_token;
}

function normalizePurpose(value: unknown): 'wallet' | 'gateway' {
  return value === 'gateway' ? 'gateway' : 'wallet';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = await req.json();
    const amount = Number(body?.amount);
    const document = String(body?.document || '').replace(/\D/g, '');
    const purpose = normalizePurpose(body?.purpose);
    const userId = user.id;
    const userEmail = user.email || '';

    if (!Number.isFinite(amount) || amount <= 0) {
      return new Response(JSON.stringify({ error: 'Valor inválido' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (amount < 5) {
      return new Response(JSON.stringify({ error: 'Valor mínimo: R$ 5,00' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (document.length !== 11) {
      return new Response(JSON.stringify({ error: 'CPF inválido' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let walletId: string | null = null;

    if (purpose === 'gateway') {
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (rolesError) {
        console.error('Role validation error:', rolesError);
        return new Response(JSON.stringify({ error: 'Não foi possível validar permissões' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const canFundGateway = (roles || []).some((role) => ADMIN_ROLES.includes(role.role));
      if (!canFundGateway) {
        return new Response(JSON.stringify({ error: 'Sem permissão para aportar no caixa' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    } else {
      const { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (walletError || !wallet) {
        return new Response(JSON.stringify({ error: 'Carteira não encontrada' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      walletId = wallet.id;
    }

    const externalId = `${purpose === 'gateway' ? 'GATEWAY' : 'DEP'}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const pixupToken = await getPixupToken();
    const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/pixup-webhook`;

    const pixResponse = await fetch(`${PIXUP_API_URL}/pix/qrcode`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${pixupToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        amount,
        external_id: externalId,
        postbackUrl: webhookUrl,
        payer: {
          name: user.user_metadata?.full_name || (purpose === 'gateway' ? 'Administrador' : 'Cliente'),
          email: userEmail,
          document,
        },
      }),
    });

    if (!pixResponse.ok) {
      const errorText = await pixResponse.text();
      console.error('PIX generation failed:', errorText);
      return new Response(JSON.stringify({ error: 'Erro ao gerar PIX. Tente novamente.' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const pixData = await pixResponse.json();

    const { data: deposit, error: depositError } = await supabase
      .from('pix_deposits')
      .insert({
        user_id: userId,
        wallet_id: walletId,
        amount,
        external_id: externalId,
        qr_code: pixData.qrcode || pixData.qr_code || pixData.pixCopiaECola || pixData.brcode || '',
        qr_code_base64: pixData.qrcode_base64 || pixData.qr_code_base64 || '',
        status: 'pending',
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        gateway_response: pixData,
        purpose,
        destination: purpose,
      })
      .select()
      .single();

    if (depositError) {
      console.error('Deposit insert error:', depositError);
      return new Response(JSON.stringify({ error: 'Erro ao registrar depósito' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({
      success: true,
      deposit_id: deposit.id,
      qr_code: deposit.qr_code,
      qr_code_base64: deposit.qr_code_base64,
      amount,
      external_id: externalId,
      expires_at: deposit.expires_at,
      purpose,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error generating PIX:', error);
    console.error('Error generating PIX:', error instanceof Error ? error.message : error);
    return new Response(JSON.stringify({ error: 'Erro interno ao processar depósito' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
