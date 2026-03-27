import type { PredictionMarket, TrendingTopic } from '@/hooks/useNews';

export interface SportDefinition {
  id: string;
  label: string;
  aliases: string[];
  colorVar: string;
}

export interface SportSummary extends SportDefinition {
  count: number;
  liveCount: number;
  futuresCount: number;
  totalVolume: number;
  active: boolean;
  imageUrl?: string;
}

export const SPORTS_CATALOG: SportDefinition[] = [
  {
    id: 'nba',
    label: 'NBA',
    colorVar: '--sport-nba',
    aliases: ['nba', 'thunder', 'knicks', 'lakers', 'celtics', 'warriors', 'mavericks', 'nuggets', 'bucks', 'cavaliers', 'heat', 'suns', 'raptors', 'nets', 'spurs', 'pistons', 'kings', 'grizzlies', 'pacers', 'hawks', 'rockets', 'bulls', 'magic', '76ers', 'sixers', 'blazers', 'timberwolves', 'hornets', 'wizards', 'pelicans', 'clippers', 'nba champion', 'nba mvp', 'nba rookie'],
  },
  {
    id: 'ncaab',
    label: 'NCAAB',
    colorVar: '--sport-ncaab',
    aliases: ['ncaab', 'ncaa basketball', 'college basketball', 'march madness', 'bulldogs', 'salukis', 'eagles', 'terriers', 'bearkats', 'blue hens', 'bison', 'midshipmen'],
  },
  {
    id: 'nhl',
    label: 'NHL',
    colorVar: '--sport-nhl',
    aliases: ['nhl', 'stanley cup', 'ice hockey', 'panthers', 'blue jackets', 'sabres', 'penguins', 'maple leafs', 'rangers', 'lightning', 'jets', 'bruins', 'predators', 'islanders', 'avalanche', 'hurricanes', 'capitals', 'red wings', 'senators', 'canadiens', 'flames', 'oilers', 'canucks', 'kraken', 'wild', 'blackhawks', 'blues', 'stars', 'sharks', 'golden knights', 'flyers', 'devils'],
  },
  {
    id: 'soccer',
    label: 'Futebol',
    colorVar: '--sport-soccer',
    aliases: ['soccer', 'premier league', 'champions league', 'la liga', 'serie a', 'bundesliga', 'ligue 1', 'mls', 'uefa', 'fifa', 'football club', 'world cup winner', 'fc barcelona', 'real madrid', 'atletico madrid', 'villarreal', 'athletic bilbao', 'betis', 'celta vigo', 'sevilla', 'espanyol', 'osasuna', 'man city', 'man united', 'liverpool', 'arsenal', 'chelsea', 'tottenham', 'aston villa', 'bayern', 'dortmund', 'napoli', 'juventus', 'inter', 'milan', 'roma', 'lazio', 'psg', 'lyon', 'marseille', 'lens', 'olympique', 'benfica', 'porto', 'sporting', 'ajax', 'galatasaray', 'leverkusen', 'atalanta', 'bodo glimt', 'europa league', 'french ligue'],
  },
  {
    id: 'esports',
    label: 'eSports',
    colorVar: '--sport-esports',
    aliases: ['esports', 'counter-strike', 'valorant', 'league of legends', 'dota', 'cs2', 'cs:go', 'lol:', 'cloud9', 'red canids', 'verdant', 'bulldog esports', 'americas cup playoffs'],
  },
  {
    id: 'tennis',
    label: 'Tênis',
    colorVar: '--sport-tennis',
    aliases: ['tennis', 'wimbledon', 'roland garros', 'us open tennis', 'australian open tennis', 'atp', 'wta', 'indian wells', 'miami open', 'monte carlo', 'madrid open', 'rome masters', 'cincinnati', 'shanghai masters', 'paris masters', 'davis cup', 'billie jean king cup', 'novak djokovic', 'carlos alcaraz', 'jannik sinner', 'iga swiatek', 'aryna sabalenka', 'medvedev', 'rublev', 'tsitsipas', 'zverev'],
  },
  {
    id: 'cricket',
    label: 'Críquete',
    colorVar: '--sport-cricket',
    aliases: ['cricket', 'ipl', 'test match', 't20', 'icc'],
  },
  {
    id: 'basketball',
    label: 'Basquete',
    colorVar: '--sport-basketball',
    aliases: ['basketball', 'euroleague', 'fiba'],
  },
  {
    id: 'baseball',
    label: 'Beisebol',
    colorVar: '--sport-baseball',
    aliases: ['baseball', 'mlb', 'world series', 'world baseball classic'],
  },
  {
    id: 'hockey',
    label: 'Hóquei',
    colorVar: '--sport-hockey',
    aliases: ['hockey', 'field hockey'],
  },
  {
    id: 'rugby',
    label: 'Rúgbi',
    colorVar: '--sport-rugby',
    aliases: ['rugby', 'six nations', 'rugby world cup'],
  },
  {
    id: 'lacrosse',
    label: 'Lacrosse',
    colorVar: '--sport-lacrosse',
    aliases: ['lacrosse', 'pll', 'nll'],
  },
  {
    id: 'ufc',
    label: 'UFC',
    colorVar: '--sport-ufc',
    aliases: ['ufc', 'mma', 'octagon', 'ufc 326', 'oliveira', 'holloway', 'fight night', 'main card', 'co-main', 'welterweight', 'middleweight', 'featherweight', 'light heavyweight', 'heavyweight', 'bantamweight', 'flyweight', 'mcgregor', 'jon jones', 'islam makhachev', 'alex pereira', 'adesanya', 'gaethje', 'poirier', 'chimaev', 'volkanovski', 'pantoja', 'amanda nunes'],
  },
  {
    id: 'football',
    label: 'Futebol Americano',
    colorVar: '--sport-football',
    aliases: ['football', 'nfl', 'super bowl', 'touchdown', 'american football', 'afc', 'nfc', 'chiefs', 'eagles', '49ers', 'cowboys', 'packers', 'ravens', 'bills', 'dolphins', 'jets', 'patriots', 'steelers', 'bengals', 'browns', 'colts', 'titans', 'texans', 'jaguars', 'broncos', 'chargers', 'raiders', 'vikings', 'lions', 'bears', 'saints', 'falcons', 'panthers', 'buccaneers', 'seahawks', 'cardinals', 'commanders', 'giants', 'rams'],
  },
  {
    id: 'table-tennis',
    label: 'Tênis de mesa',
    colorVar: '--sport-table-tennis',
    aliases: ['table tennis', 'ping pong'],
  },
  {
    id: 'golf',
    label: 'Golf',
    colorVar: '--sport-golf',
    aliases: ['golf', 'pga', 'the masters', 'ryder cup', 'pga tour', 'major championship', 'us open golf', 'the open', 'open championship', 'pga championship', 'players championship', 'fedex cup', 'scottie scheffler', 'rory mcilroy', 'jon rahm', 'brooks koepka', 'collin morikawa', 'xander schauffele', 'viktor hovland', 'ludvig aberg'],
  },
  {
    id: 'formula-1',
    label: 'Fórmula 1',
    colorVar: '--sport-formula-1',
    aliases: ['formula 1', 'f1', 'grand prix', "drivers' champion"],
  },
  {
    id: 'chess',
    label: 'Xadrez',
    colorVar: '--sport-chess',
    aliases: ['chess', 'fide', 'grandmaster'],
  },
  {
    id: 'boxing',
    label: 'Boxe',
    colorVar: '--sport-boxing',
    aliases: ['boxing', 'boxe', 'title fight'],
  },
  {
    id: 'pickleball',
    label: 'Pickleball',
    colorVar: '--sport-pickleball',
    aliases: ['pickleball'],
  },
];

function buildMarketSearchText(market: PredictionMarket) {
  return [
    market.sportKey,
    market.sportLabel,
    market.seriesTitle,
    market.question,
    market.originalQuestion,
    market.subtitle,
    market.outcomeLabels?.join(' '),
    market.options?.map((option) => option.label).join(' '),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export function inferSportFromMarket(market: PredictionMarket): SportDefinition | null {
  if (market.sportKey) {
    const explicitMatch = SPORTS_CATALOG.find((sport) => sport.id === market.sportKey);
    if (explicitMatch) return explicitMatch;
  }

  const text = buildMarketSearchText(market);
  let bestMatch: SportDefinition | null = null;
  let bestScore = 0;

  for (const sport of SPORTS_CATALOG) {
    const score = sport.aliases.reduce((total, alias) => {
      return total + (text.includes(alias) ? alias.length : 0);
    }, 0);

    if (score > bestScore) {
      bestScore = score;
      bestMatch = sport;
    }
  }

  return bestScore > 0 ? bestMatch : null;
}

export type SportsBoardView = 'live' | 'futures';

const SPORTS_FUTURES_PATTERNS = [
  /\bwinner\b/i,
  /\bchampion\b/i,
  /\bto win\b/i,
  /\bwin the\b/i,
  /\bplayoffs\b/i,
  /\bseason\b/i,
  /\btitle\b/i,
  /\bgolden boot\b/i,
  /\btop scorer\b/i,
  /\bmvp\b/i,
  /\bworld cup\b/i,
  /\bstanley cup\b/i,
  /\bworld series\b/i,
  /\bmasters\b/i,
  /\bgrand prix\b/i,
];

function isYesNoPair(labels?: string[]) {
  return labels?.length === 2 && labels.every((label) => ['yes', 'no', 'sim', 'não', 'nao'].includes(label.toLowerCase()));
}

function getSportsMarketText(market: PredictionMarket) {
  return [market.originalQuestion, market.question, market.subtitle].filter(Boolean).join(' ');
}

export function getSportsOptionPair(market: PredictionMarket) {
  return market.options?.length === 2 ? market.options : undefined;
}

export function getMarketCompetitors(market: PredictionMarket): string[] {
  const optionPair = getSportsOptionPair(market);
  if (optionPair) {
    return optionPair.map((option) => option.label);
  }

  if (market.outcomeLabels?.length === 2 && !isYesNoPair(market.outcomeLabels)) {
    return market.outcomeLabels;
  }

  const text = [market.originalQuestion, market.question].filter(Boolean);
  const patterns = [/^(.+?)\s+vs\.?\s+(.+)$/i, /^(.+?)\s+v\s+(.+)$/i];

  for (const entry of text) {
    for (const pattern of patterns) {
      const match = entry?.match(pattern);
      if (match) {
        return [match[1].trim(), match[2].trim()];
      }
    }
  }

  return [];
}

export function getSportsMarketPhase(market: PredictionMarket): SportsBoardView {
  // If the API explicitly marks it as live, always show in live
  if (market.isLive) return 'live';

  // If the market has live scores data, it's live
  if (market.liveScores && market.liveScores.length > 0) return 'live';

  // Check if endDate is today or within the next 24h (upcoming match, not a future)
  if (market.endDate) {
    try {
      const end = new Date(market.endDate);
      const now = new Date();
      const diffHours = (end.getTime() - now.getTime()) / (1000 * 60 * 60);
      // If the match ends within 24h from now or already started, it's "live" (upcoming)
      if (diffHours <= 24 && diffHours >= -6) return 'live';
    } catch { /* ignore */ }
  }

  const text = getSportsMarketText(market);
  if (SPORTS_FUTURES_PATTERNS.some((pattern) => pattern.test(text))) {
    return 'futures';
  }

  if (getSportsOptionPair(market)) {
    return 'live';
  }

  return getMarketCompetitors(market).length === 2 ? 'live' : 'futures';
}


export function groupSportsMarketsByPhase(markets: PredictionMarket[]) {
  return {
    liveMarkets: markets.filter((market) => getSportsMarketPhase(market) === 'live').sort((a, b) => b.volume - a.volume),
    futuresMarkets: markets.filter((market) => getSportsMarketPhase(market) === 'futures').sort((a, b) => b.volume - a.volume),
  };
}

export function filterMarketsBySport(markets: PredictionMarket[], sportId: string) {
  if (sportId === 'all') return markets;
  return markets.filter((market) => inferSportFromMarket(market)?.id === sportId);
}

export function buildSportsSummary(markets: PredictionMarket[]): SportSummary[] {
  const summaryMap = new Map(
    SPORTS_CATALOG.map((sport) => [
      sport.id,
      { ...sport, count: 0, liveCount: 0, futuresCount: 0, totalVolume: 0, active: false, imageUrl: undefined },
    ])
  );

  for (const market of markets) {
    const sport = inferSportFromMarket(market);
    if (!sport) continue;

    const current = summaryMap.get(sport.id);
    if (!current) continue;

    current.count += 1;
    current.totalVolume += market.volume || 0;
    current.active = true;
    current[getSportsMarketPhase(market) === 'live' ? 'liveCount' : 'futuresCount'] += 1;

    if (!current.imageUrl && market.sportImage) {
      current.imageUrl = market.sportImage;
    }
  }

  return SPORTS_CATALOG.map((sport) => summaryMap.get(sport.id)!);
}

export function buildSportsTrendingTopics(markets: PredictionMarket[]): TrendingTopic[] {
  return buildSportsSummary(markets)
    .filter((s) => s.count > 0)
    .map(({ id, label }) => ({ id, label }));
}
