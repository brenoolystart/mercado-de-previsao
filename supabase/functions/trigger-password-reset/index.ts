import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    // Validate email format
    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email) || email.length > 254) {
      return new Response(JSON.stringify({ error: 'Email inválido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Validate redirect URL against allowed origins
    const origin = req.headers.get('origin') || '';
    const allowedOrigins = [
      'https://onchoice.com.br',
      'https://www.onchoice.com.br',
      'https://id-preview--8b050e68-d713-4573-9ab6-83c4e1b24e87.lovable.app',
      'https://onchoice.lovable.app',
    ];
    const redirectOrigin = allowedOrigins.includes(origin) ? origin : 'https://onchoice.com.br';

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${redirectOrigin}/reset-password`,
    });

    if (error) {
      console.error('Password reset error:', error.message);
      // Always return success to prevent email enumeration
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Password reset error:', err);
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
