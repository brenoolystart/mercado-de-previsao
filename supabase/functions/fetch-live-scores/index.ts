const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const ESPN_ENDPOINTS: Record<string, string> = {
  nba: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard',
  nhl: 'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard',
  nfl: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard',
  mlb: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard',
  soccer: 'https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard',
  ncaab: 'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard',
};

interface LiveScore {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  period: string;
  isLive: boolean;
}

function normalizeTeamName(name: string) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\b(fc|cf|sc|ac|afc|club|the|bk|bc)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchLiveScores(): Promise<LiveScore[]> {
  const allScores: LiveScore[] = [];

  const fetches = Object.entries(ESPN_ENDPOINTS).map(async ([sport, url]) => {
    try {
      const resp = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (!resp.ok) return;
      const data = await resp.json();
      const events = data?.events || [];

      for (const event of events) {
        const competition = event?.competitions?.[0];
        if (!competition) continue;

        const status = competition.status?.type?.state;
        if (status !== 'in') continue;

        const competitors = competition.competitors || [];
        if (competitors.length < 2) continue;

        const home = competitors.find((c: any) => c.homeAway === 'home');
        const away = competitors.find((c: any) => c.homeAway === 'away');
        if (!home || !away) continue;

        const period = competition.status?.type?.shortDetail || competition.status?.type?.detail || '';

        allScores.push({
          homeTeam: home.team?.displayName || home.team?.shortDisplayName || '',
          awayTeam: away.team?.displayName || away.team?.shortDisplayName || '',
          homeScore: parseInt(home.score || '0', 10),
          awayScore: parseInt(away.score || '0', 10),
          period,
          isLive: true,
        });
      }
    } catch (err) {
      console.warn(`ESPN ${sport} fetch error:`, err);
    }
  });

  await Promise.all(fetches);
  return allScores;
}

function matchScoreToMarket(scores: LiveScore[], question: string, optionLabels: string[]): { scores: Array<{ team: string; score: number; period: string }>, isLive: boolean } | null {
  const haystack = (question + ' ' + optionLabels.join(' ')).toLowerCase();

  for (const score of scores) {
    const homeLower = normalizeTeamName(score.homeTeam);
    const awayLower = normalizeTeamName(score.awayTeam);

    const homeMatch = homeLower.split(' ').some(w => w.length > 3 && haystack.includes(w));
    const awayMatch = awayLower.split(' ').some(w => w.length > 3 && haystack.includes(w));

    if (homeMatch && awayMatch) {
      return {
        scores: [
          { team: score.awayTeam, score: score.awayScore, period: score.period },
          { team: score.homeTeam, score: score.homeScore, period: score.period },
        ],
        isLive: true,
      };
    }
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let marketIds: string[] = [];
    let marketMeta: Array<{ id: string; question: string; optionLabels: string[] }> = [];

    try {
      const body = await req.json();
      marketMeta = body?.markets || [];
      marketIds = marketMeta.map(m => m.id);
    } catch {
      // no body = return all raw scores
    }

    const scores = await fetchLiveScores();

    if (marketMeta.length === 0) {
      return new Response(
        JSON.stringify({ scores }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Match scores to specific markets
    const matchedScores: Record<string, { scores: Array<{ team: string; score: number; period: string }>; isLive: boolean }> = {};

    for (const meta of marketMeta) {
      const match = matchScoreToMarket(scores, meta.question, meta.optionLabels);
      if (match) {
        matchedScores[meta.id] = match;
      }
    }

    return new Response(
      JSON.stringify({ matchedScores, totalLiveGames: scores.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching live scores:', error);
    return new Response(
      JSON.stringify({ matchedScores: {}, error: String(error) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
