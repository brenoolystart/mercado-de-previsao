const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const CLOB_API = 'https://clob.polymarket.com';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tokenId, interval = 'all', fidelity = 60 } = await req.json();

    if (!tokenId) {
      return new Response(
        JSON.stringify({ error: 'tokenId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = `${CLOB_API}/prices-history?market=${tokenId}&interval=${interval}&fidelity=${fidelity}`;
    console.log(`Fetching price history: ${url}`);

    const resp = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });

    if (!resp.ok) {
      console.error(`CLOB API error: ${resp.status}`);
      return new Response(
        JSON.stringify({ history: [], error: `CLOB API returned ${resp.status}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await resp.json();
    const history = data?.history || [];

    console.log(`Got ${history.length} price history points for token ${tokenId}`);

    return new Response(
      JSON.stringify({ history }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching market history:', error);
    return new Response(
      JSON.stringify({ history: [], error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
