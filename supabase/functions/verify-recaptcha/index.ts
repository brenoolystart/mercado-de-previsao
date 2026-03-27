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
    const { token, action, fingerprint, ip_hint } = await req.json();

    if (!token) {
      return new Response(JSON.stringify({ success: false, error: 'reCAPTCHA token required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const secretKey = Deno.env.get('RECAPTCHA_SECRET_KEY');
    if (!secretKey) {
      console.error('RECAPTCHA_SECRET_KEY not configured');
      return new Response(JSON.stringify({ success: false, error: 'Server config error' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify with Google
    const verifyPayload = new URLSearchParams({
      secret: secretKey,
      response: token,
    });

    const verifyRes = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: verifyPayload.toString(),
    });

    const verifyData = await verifyRes.json();

    if (!verifyData.success || (verifyData.score !== undefined && verifyData.score < 0.3)) {
      const details = verifyData['error-codes'] || [];
      const isRetryableTokenError = details.includes('invalid-input-response') || details.includes('timeout-or-duplicate');

      return new Response(JSON.stringify({ 
        success: false, 
        error: isRetryableTokenError
          ? 'Token reCAPTCHA inválido ou expirado. Marque novamente “Não sou um robô”.'
          : 'Verificação anti-bot falhou. Tente novamente.',
        score: verifyData.score,
        details
      }), {
        status: isRetryableTokenError ? 400 : 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // If action is signup, check rate limiting
    if (action === 'signup') {
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      );

      const clientIp = ip_hint || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

      // Check signups from this IP in last hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { data: recentSignups, error: rateErr } = await supabaseAdmin
        .from('signup_rate_limits')
        .select('id')
        .eq('ip_address', clientIp)
        .gte('created_at', oneHourAgo);

      if (!rateErr && recentSignups && recentSignups.length >= 3) {
        // Flag abuse
        await supabaseAdmin.from('abuse_flags').insert({
          user_id: '00000000-0000-0000-0000-000000000000',
          flag_type: 'rate_limit',
          details: { ip: clientIp, attempts: recentSignups.length, action: 'signup' },
        });

        return new Response(JSON.stringify({ success: false, error: 'Muitas tentativas de cadastro. Tente novamente mais tarde.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Log this signup attempt
      await supabaseAdmin.from('signup_rate_limits').insert({ ip_address: clientIp });

      // Check if fingerprint is already associated with other accounts
      if (fingerprint) {
        const { data: existingFp } = await supabaseAdmin
          .from('device_fingerprints')
          .select('user_id')
          .eq('fingerprint', fingerprint);

        const uniqueUsers = new Set(existingFp?.map(f => f.user_id) || []);
        if (uniqueUsers.size >= 2) {
          await supabaseAdmin.from('abuse_flags').insert({
            user_id: '00000000-0000-0000-0000-000000000000',
            flag_type: 'multi_account',
            details: { fingerprint, existing_accounts: uniqueUsers.size, ip: clientIp },
          });

          return new Response(JSON.stringify({ success: false, error: 'Atividade suspeita detectada. Entre em contato com o suporte.' }), {
            status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
    }

    // If authenticated user, track fingerprint
    if (action === 'login' && fingerprint) {
      const authHeader = req.headers.get('Authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const supabaseAuth = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_ANON_KEY')!,
          { global: { headers: { Authorization: authHeader } } }
        );
        const jwtToken = authHeader.replace('Bearer ', '');
        const { data: claims } = await supabaseAuth.auth.getClaims(jwtToken);
        if (claims?.claims?.sub) {
          const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
          );
          const userId = claims.claims.sub;
          const clientIp = ip_hint || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

          // Upsert fingerprint
          const { data: existing } = await supabaseAdmin
            .from('device_fingerprints')
            .select('id')
            .eq('user_id', userId)
            .eq('fingerprint', fingerprint)
            .maybeSingle();

          if (existing) {
            await supabaseAdmin.from('device_fingerprints').update({ last_seen_at: new Date().toISOString(), ip_address: clientIp }).eq('id', existing.id);
          } else {
            await supabaseAdmin.from('device_fingerprints').insert({
              user_id: userId,
              fingerprint,
              ip_address: clientIp,
              user_agent: req.headers.get('user-agent') || '',
            });
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('verify-recaptcha error:', err);
    return new Response(JSON.stringify({ success: false, error: 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
