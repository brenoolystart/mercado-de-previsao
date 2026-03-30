const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const POLYMARKET_API = 'https://gamma-api.polymarket.com';
const AI_GATEWAY = 'https://ai.gateway.lovable.dev/v1/chat/completions';

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  politics: ['trump', 'biden', 'election', 'president', 'senate', 'congress', 'governor', 'democrat', 'republican', 'vote', 'party', 'political', 'lula', 'bolsonaro', 'parliament', 'prime minister', 'mandate', 'gop', 'kamala', 'harris', 'desantis', 'newsom', 'cabinet', 'impeach'],
  crypto: ['bitcoin', 'btc', 'ethereum', 'eth', 'crypto', 'token', 'blockchain', 'solana', 'sol', 'defi', 'nft', 'dogecoin', 'altcoin', 'binance', 'coinbase', 'stablecoin', 'xrp', 'ripple', 'memecoin', 'doge'],
  sports: ['nba', 'nfl', 'mlb', 'soccer', 'football', 'basketball', 'baseball', 'tennis', 'golf', 'ufc', 'boxing', 'f1', 'formula', 'championship', 'world cup', 'olympics', 'super bowl', 'playoff', 'match', 'game', 'team', 'player', 'league', 'premier', 'lakers', 'celtics', 'warriors', 'nets', 'spurs', 'pistons', 'kings', 'grizzlies', 'raptors', 'cavaliers', 'nuggets', 'bucks', 'heat', 'knicks', 'clippers', 'mavericks', 'thunder', 'pacers', 'hawks', 'rockets', 'bulls', 'suns', 'magic', '76ers', 'sixers', 'blazers', 'timberwolves', 'hornets', 'wizards', 'pelicans', 'tottenham', 'arsenal', 'chelsea', 'liverpool', 'manchester', 'real madrid', 'barcelona', 'champions league', 'serie a', 'bundesliga', 'la liga', 'win the', 'vs.', 'versus', 'villarreal', 'atletico', 'juventus', 'inter', 'milan', 'napoli', 'bayern', 'dortmund', 'psg', 'lyon', 'marseille', 'benfica', 'porto', 'sporting', 'ajax', 'feyenoord', 'celtic', 'rangers', 'galatasaray', 'fenerbahce', 'besiktas', 'copa libertadores', 'copa sudamericana', 'concacaf', 'uefa', 'fifa', 'world series', 'stanley cup', 'nhl', 'mls', 'ncaa', 'march madness', 'wimbledon', 'roland garros', 'us open', 'australian open', 'grand slam', 'atp', 'wta', 'pga', 'masters', 'ryder cup'],
  tech: ['ai', 'artificial intelligence', 'openai', 'google', 'apple', 'microsoft', 'meta', 'nvidia', 'chatgpt', 'gpt', 'model', 'tech', 'software', 'hardware', 'chip', 'semiconductor', 'robot', 'spacex', 'tesla', 'elon', 'anthropic', 'gemini', 'claude'],
  finance: ['stock', 'market', 'fed', 'interest rate', 'inflation', 'gdp', 'recession', 'sp500', 's&p', 'nasdaq', 'dow', 'treasury', 'bond', 'dollar', 'forex', 'ipo', 'earnings', 'wall street', 'bank', 'rate cut', 'rate hike', 'fomc', 'powell', 'bps'],
  world: ['war', 'ukraine', 'russia', 'china', 'nato', 'un', 'eu', 'europe', 'asia', 'middle east', 'israel', 'gaza', 'iran', 'north korea', 'india', 'africa', 'brazil', 'mexico', 'climate', 'earthquake', 'hurricane', 'strikes', 'ceasefire', 'peace', 'sanctions'],
  culture: ['oscar', 'grammy', 'emmy', 'movie', 'film', 'music', 'album', 'concert', 'celebrity', 'award', 'tv show', 'streaming', 'netflix', 'disney', 'tiktok', 'viral', 'influencer', 'book', 'art', 'pope', 'jesus', 'christ', 'religion', 'church', 'big brother', 'bbb', 'reality tv', 'reality show', 'entertainment', 'spotify', 'youtube', 'instagram', 'rapper', 'singer', 'actor', 'actress', 'pregnancy', 'pregnant', 'baby born', 'dating', 'married', 'divorce', 'scandal', 'meme', 'podcast', 'tweet', 'social media', 'kardashian', 'kanye', 'taylor swift', 'beyonce', 'rihanna', 'nara smith', 'confirmed', 'gravida', 'ballon d\'or', 'golden ball', 'golden boot'],
  economy: ['gdp', 'unemployment', 'jobs', 'trade war', 'tariff', 'export', 'import', 'manufacturing', 'housing', 'real estate', 'oil price', 'natural gas', 'energy price', 'commodity', 'supply chain', 'debt ceiling', 'deficit'],
  health: ['covid', 'vaccine', 'pandemic', 'fda', 'drug approval', 'health crisis', 'disease outbreak', 'virus', 'who declares', 'hospital', 'medical', 'cancer', 'treatment', 'pharma', 'bird flu', 'mpox'],
};

const SPORTS_TAXONOMY = [
  { id: 'nba', label: 'NBA', keywords: ['nba', 'thunder', 'knicks', 'lakers', 'celtics', 'warriors', 'mavericks', 'nuggets', 'bucks', 'cavaliers', 'heat', 'suns', 'raptors', 'nets', 'spurs', 'pistons', 'kings', 'grizzlies', 'pacers', 'hawks', 'rockets', 'bulls', 'magic', '76ers', 'sixers', 'blazers', 'timberwolves', 'hornets', 'wizards', 'pelicans', 'clippers', 'nba champion', 'nba mvp', 'nba rookie'] },
  { id: 'ncaab', label: 'NCAAB', keywords: ['ncaab', 'ncaa basketball', 'college basketball', 'march madness', 'bulldogs', 'salukis', 'eagles', 'terriers', 'bearkats', 'blue hens', 'bison', 'midshipmen', 'bearcat', 'fightin'] },
  { id: 'nhl', label: 'NHL', keywords: ['nhl', 'stanley cup', 'ice hockey', 'panthers', 'blue jackets', 'sabres', 'penguins', 'maple leafs', 'rangers', 'lightning', 'jets', 'bruins', 'predators', 'islanders', 'avalanche', 'hurricanes', 'capitals', 'red wings', 'senators', 'canadiens', 'flames', 'oilers', 'canucks', 'kraken', 'wild', 'blackhawks', 'blues', 'stars', 'sharks', 'golden knights', 'flyers', 'devils'] },
  { id: 'soccer', label: 'Soccer', keywords: ['soccer', 'premier league', 'champions league', 'la liga', 'serie a', 'bundesliga', 'ligue 1', 'mls', 'fifa', 'uefa', 'world cup winner', 'fc barcelona', 'real madrid', 'atletico madrid', 'villarreal', 'athletic bilbao', 'betis', 'celta vigo', 'sevilla', 'espanyol', 'osasuna', 'man city', 'man united', 'liverpool', 'arsenal', 'chelsea', 'tottenham', 'aston villa', 'bayern', 'dortmund', 'napoli', 'juventus', 'inter', 'milan', 'roma', 'lazio', 'psg', 'lyon', 'marseille', 'lens', 'olympique', 'benfica', 'porto', 'sporting', 'ajax', 'galatasaray', 'leverkusen', 'atalanta', 'bodo glimt', 'europa league', 'french ligue'] },
  { id: 'esports', label: 'Esports', keywords: ['esports', 'counter-strike', 'valorant', 'league of legends', 'dota', 'cs2', 'cs:go', 'lol:', 'cloud9', 'red canids', 'verdant', 'bulldog esports', 'americas cup playoffs'] },
  { id: 'tennis', label: 'Tennis', keywords: ['tennis', 'wimbledon', 'roland garros', 'us open tennis', 'australian open tennis', 'atp', 'wta', 'indian wells', 'miami open', 'monte carlo', 'madrid open', 'rome masters', 'cincinnati', 'shanghai masters', 'paris masters', 'davis cup', 'billie jean king cup', 'novak djokovic', 'carlos alcaraz', 'jannik sinner', 'iga swiatek', 'aryna sabalenka', 'medvedev', 'rublev', 'tsitsipas', 'zverev'] },
  { id: 'cricket', label: 'Cricket', keywords: ['cricket', 'ipl', 'test match', 't20', 'icc'] },
  { id: 'basketball', label: 'Basketball', keywords: ['basketball', 'euroleague', 'fiba'] },
  { id: 'baseball', label: 'Baseball', keywords: ['baseball', 'mlb', 'world series', 'world baseball classic', 'dominican republic'] },
  { id: 'hockey', label: 'Hockey', keywords: ['hockey', 'field hockey'] },
  { id: 'rugby', label: 'Rugby', keywords: ['rugby', 'six nations', 'rugby world cup'] },
  { id: 'lacrosse', label: 'Lacrosse', keywords: ['lacrosse', 'pll', 'nll'] },
  { id: 'ufc', label: 'UFC', keywords: ['ufc', 'mma', 'octagon', 'ufc 326', 'lightweight', 'oliveira', 'holloway', 'fight night', 'main card', 'co-main', 'welterweight', 'middleweight', 'featherweight', 'light heavyweight', 'heavyweight', 'bantamweight', 'flyweight', 'mcgregor', 'jon jones', 'islam makhachev', 'alex pereira', 'adesanya', 'gaethje', 'poirier', 'chimaev', 'volkanovski', 'pantoja', 'amanda nunes'] },
  { id: 'football', label: 'Football', keywords: ['football', 'nfl', 'super bowl', 'touchdown', 'american football', 'afc', 'nfc', 'chiefs', 'eagles', '49ers', 'cowboys', 'packers', 'ravens', 'bills', 'dolphins', 'jets', 'patriots', 'steelers', 'bengals', 'browns', 'colts', 'titans', 'texans', 'jaguars', 'broncos', 'chargers', 'raiders', 'vikings', 'lions', 'bears', 'saints', 'falcons', 'panthers', 'buccaneers', 'seahawks', 'cardinals', 'commanders', 'giants', 'rams'] },
  { id: 'table-tennis', label: 'Table Tennis', keywords: ['table tennis', 'ping pong'] },
  { id: 'golf', label: 'Golf', keywords: ['golf', 'pga', 'the masters', 'ryder cup', 'pga tour', 'major championship', 'us open golf', 'the open', 'open championship', 'pga championship', 'players championship', 'fedex cup', 'scottie scheffler', 'rory mcilroy', 'jon rahm', 'brooks koepka', 'collin morikawa', 'xander schauffele', 'viktor hovland', 'ludvig aberg'] },
  { id: 'formula-1', label: 'Formula 1', keywords: ['formula 1', 'f1', 'grand prix', "drivers' champion"] },
  { id: 'chess', label: 'Chess', keywords: ['chess', 'fide', 'grandmaster'] },
  { id: 'boxing', label: 'Boxing', keywords: ['boxing', 'boxe', 'title fight'] },
  { id: 'pickleball', label: 'Pickleball', keywords: ['pickleball'] },
];

function parseClobTokenIds(value: unknown): string[] | undefined {
  if (!value) return undefined;

  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    return Array.isArray(parsed) ? parsed.map(String) : undefined;
  } catch {
    return undefined;
  }
}

type EventAssetMaps = {
  eventImages: Map<string, string>;
  optionImagesByEvent: Map<string, Map<string, string>>;
};

type TeamLookup = {
  byId: Map<string, string>;
  byName: Map<string, string>;
};

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

function buildTeamLookup(teams: any[] = []): TeamLookup {
  const byId = new Map<string, string>();
  const byName = new Map<string, string>();

  for (const team of teams) {
    const logo = team?.logo;
    const name = team?.name;
    if (!logo || !name) continue;

    if (team.id != null) byId.set(String(team.id), logo);

    const normalizedName = normalizeTeamName(String(name));
    if (normalizedName) byName.set(normalizedName, logo);

    if (team.abbreviation) {
      const normalizedAbbr = normalizeTeamName(String(team.abbreviation));
      if (normalizedAbbr) byName.set(normalizedAbbr, logo);
    }
  }

  return { byId, byName };
}

function resolveTeamLogo(teamLookup: TeamLookup, name?: string | null, preferredId?: string | number | null) {
  if (preferredId != null) {
    const byId = teamLookup.byId.get(String(preferredId));
    if (byId) return byId;
  }

  if (!name) return undefined;

  const normalizedName = normalizeTeamName(name);
  if (!normalizedName) return undefined;

  const exact = teamLookup.byName.get(normalizedName);
  if (exact) return exact;

  for (const [candidate, logo] of teamLookup.byName.entries()) {
    if (candidate.includes(normalizedName) || normalizedName.includes(candidate)) {
      return logo;
    }
  }

  return undefined;
}

const PERSONALITY_IMAGE_OVERRIDES: Record<string, string> = {
  // Music artists
  'bad bunny': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Bad_Bunny_-_2023.jpg/220px-Bad_Bunny_-_2023.jpg',
  'the weeknd': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/The_Weeknd_with_hand_in_the_air_performing_live_in_Hong_Kong_in_November_2018_%28cropped%29.jpg/220px-The_Weeknd_with_hand_in_the_air_performing_live_in_Hong_Kong_in_November_2018_%28cropped%29.jpg',
  'sabrina carpenter': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Sabrina_Carpenter_%282023%29.jpg/220px-Sabrina_Carpenter_%282023%29.jpg',
  'taylor swift': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Taylor_Swift_at_the_2023_MTV_Video_Music_Awards_%283%29.png/220px-Taylor_Swift_at_the_2023_MTV_Video_Music_Awards_%283%29.png',
  'drake': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Drake_July_2016_%28cropped%29.jpg/220px-Drake_July_2016_%28cropped%29.jpg',
  'kendrick lamar': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Kendrick_Lamar_2016.jpg/220px-Kendrick_Lamar_2016.jpg',
  'bruno mars': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Bruno_Mars_Bruno_Mars_24K_Magic_World_Tour_%28cropped%29.jpg/220px-Bruno_Mars_Bruno_Mars_24K_Magic_World_Tour_%28cropped%29.jpg',
  'morgan wallen': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Morgan_Wallen_2023_%28cropped%29.jpg/220px-Morgan_Wallen_2023_%28cropped%29.jpg',
  'olivia dean': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Olivia_Dean_2024.jpg/220px-Olivia_Dean_2024.jpg',
  'billie eilish': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Billie_Eilish_2019_by_Glenn_Francis_%28cropped%29_2.jpg/220px-Billie_Eilish_2019_by_Glenn_Francis_%28cropped%29_2.jpg',
  'dua lipa': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Dua_Lipa_%28cropped%29.jpg/220px-Dua_Lipa_%28cropped%29.jpg',
  'sza': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/SZA_2022.jpg/220px-SZA_2022.jpg',
  'post malone': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Post_Malone_at_the_2023_MTV_VMAs.jpg/220px-Post_Malone_at_the_2023_MTV_VMAs.jpg',
  'travis scott': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Travis_Scott_-_Openair_Frauenfeld_2019_08.jpg/220px-Travis_Scott_-_Openair_Frauenfeld_2019_08.jpg',
  'ed sheeran': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Ed_Sheeran-6886_%28cropped%29.jpg/220px-Ed_Sheeran-6886_%28cropped%29.jpg',
  'ariana grande': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Ariana_Grande_Grammys_Red_Carpet_2020.png/220px-Ariana_Grande_Grammys_Red_Carpet_2020.png',
  'rihanna': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Rihanna_Fenty_2018.png/220px-Rihanna_Fenty_2018.png',
  'harry styles': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Harry_Styles_Brit_Awards_2023_%28cropped%29.jpg/220px-Harry_Styles_Brit_Awards_2023_%28cropped%29.jpg',
  'olivia rodrigo': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Olivia_Rodrigo_at_the_White_House%2C_July_2021_%28cropped%29.jpg/220px-Olivia_Rodrigo_at_the_White_House%2C_July_2021_%28cropped%29.jpg',
  'karol g': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Karol_G_2023.jpg/220px-Karol_G_2023.jpg',
  'shakira': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Shakira_in_Brazil_%28cropped%29.jpg/220px-Shakira_in_Brazil_%28cropped%29.jpg',
  'peso pluma': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Peso_pluma_2023_%28cropped%29.jpg/220px-Peso_pluma_2023_%28cropped%29.jpg',
  'doja cat': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Doja_Cat_2021_2_%28cropped%29.jpg/220px-Doja_Cat_2021_2_%28cropped%29.jpg',
  'beyonce': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Beyonc%C3%A9_at_The_Lion_King_European_Premiere_2019.png/220px-Beyonc%C3%A9_at_The_Lion_King_European_Premiere_2019.png',
  // Politicians
  'donald trump': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Donald_Trump_official_portrait.jpg/220px-Donald_Trump_official_portrait.jpg',
  'joe biden': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Joe_Biden_presidential_portrait.jpg/220px-Joe_Biden_presidential_portrait.jpg',
  'kamala harris': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Kamala_Harris_Vice_Presidential_Portrait.jpg/220px-Kamala_Harris_Vice_Presidential_Portrait.jpg',
  'ron desantis': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Ron_DeSantis_at_CPAC_%28cropped%29.jpg/220px-Ron_DeSantis_at_CPAC_%28cropped%29.jpg',
  'elon musk': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Elon_Musk_Royal_Society_%28crop2%29.jpg/220px-Elon_Musk_Royal_Society_%28crop2%29.jpg',
  'vivek ramaswamy': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Vivek_Ramaswamy_by_Gage_Skidmore.jpg/220px-Vivek_Ramaswamy_by_Gage_Skidmore.jpg',
  'gavin newsom': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Gavin_Newsom_by_Gage_Skidmore_2_%28cropped_2%29.jpg/220px-Gavin_Newsom_by_Gage_Skidmore_2_%28cropped_2%29.jpg',
  'nikki haley': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Nikki_Haley_official_photo.jpg/220px-Nikki_Haley_official_photo.jpg',
  // UFC fighters
  'conor mcgregor': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Conor_McGregor_2018_%28cropped%29.jpg/220px-Conor_McGregor_2018_%28cropped%29.jpg',
  'jon jones': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Jon_Jones_2019_%28cropped%29.jpg/220px-Jon_Jones_2019_%28cropped%29.jpg',
  'islam makhachev': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Islam_Makhachev_2022.jpg/220px-Islam_Makhachev_2022.jpg',
  'alex pereira': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Alex_Pereira_UFC.jpg/220px-Alex_Pereira_UFC.jpg',
  'charles oliveira': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Charles_Oliveira_2022.jpg/220px-Charles_Oliveira_2022.jpg',
  'max holloway': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Max_Holloway_2019_%28cropped%29.jpg/220px-Max_Holloway_2019_%28cropped%29.jpg',
  // Football/Soccer players (for Ballon d'Or, Golden Boot, etc.)
  'vinicius jr': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Vinicius_Junior_2024.jpg/220px-Vinicius_Junior_2024.jpg',
  'vinicius junior': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Vinicius_Junior_2024.jpg/220px-Vinicius_Junior_2024.jpg',
  'jude bellingham': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Jude_Bellingham_2023.jpg/220px-Jude_Bellingham_2023.jpg',
  'erling haaland': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Erling_Haaland_2023.jpg/220px-Erling_Haaland_2023.jpg',
  'haaland': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Erling_Haaland_2023.jpg/220px-Erling_Haaland_2023.jpg',
  'kylian mbappe': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/2019-07-17_SG_Dynamo_Dresden_vs._Paris_Saint-Germain_by_Sandro_Halank%E2%80%93129_%28cropped%29.jpg/220px-2019-07-17_SG_Dynamo_Dresden_vs._Paris_Saint-Germain_by_Sandro_Halank%E2%80%93129_%28cropped%29.jpg',
  'mbappe': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/2019-07-17_SG_Dynamo_Dresden_vs._Paris_Saint-Germain_by_Sandro_Halank%E2%80%93129_%28cropped%29.jpg/220px-2019-07-17_SG_Dynamo_Dresden_vs._Paris_Saint-Germain_by_Sandro_Halank%E2%80%93129_%28cropped%29.jpg',
  'lionel messi': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Lionel-Messi-Argentina-2022-FIFA-World-Cup_%28cropped%29.jpg/220px-Lionel-Messi-Argentina-2022-FIFA-World-Cup_%28cropped%29.jpg',
  'messi': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Lionel-Messi-Argentina-2022-FIFA-World-Cup_%28cropped%29.jpg/220px-Lionel-Messi-Argentina-2022-FIFA-World-Cup_%28cropped%29.jpg',
  'cristiano ronaldo': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Cristiano_Ronaldo_2018.jpg/220px-Cristiano_Ronaldo_2018.jpg',
  'ronaldo': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Cristiano_Ronaldo_2018.jpg/220px-Cristiano_Ronaldo_2018.jpg',
  'lamine yamal': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Lamine_Yamal_Euro_2024.jpg/220px-Lamine_Yamal_Euro_2024.jpg',
  'rodri': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Rodrigo_Hernandez_2023.jpg/220px-Rodrigo_Hernandez_2023.jpg',
  'mohamed salah': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Mohamed_Salah_2018.jpg/220px-Mohamed_Salah_2018.jpg',
  'salah': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Mohamed_Salah_2018.jpg/220px-Mohamed_Salah_2018.jpg',
  'harry kane': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Harry_Kane_2022.jpg/220px-Harry_Kane_2022.jpg',
  'neymar': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/20180610_FIFA_Friendly_Match_Austria_vs._Brazil_Neymar_850_1705_%28cropped%29.jpg/220px-20180610_FIFA_Friendly_Match_Austria_vs._Brazil_Neymar_850_1705_%28cropped%29.jpg',
  'florian wirtz': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Florian_Wirtz_2024.jpg/220px-Florian_Wirtz_2024.jpg',
};

function resolvePersonalityImage(label?: string | null): string | undefined {
  if (!label) return undefined;
  const key = normalizeTeamName(label);
  if (!key) return undefined;
  const exact = PERSONALITY_IMAGE_OVERRIDES[key];
  if (exact) return exact;
  for (const [name, image] of Object.entries(PERSONALITY_IMAGE_OVERRIDES)) {
    if (key.includes(name) || name.includes(key)) return image;
  }
  return undefined;
}

function extractOptionLabelFromQuestion(question?: string): string {
  if (!question) return 'Opção';
  const spotify = question.match(/^Will\s+(.+?)\s+be\s+the\s+top\s+Spotify\s+artist/i);
  if (spotify?.[1]) return spotify[1].trim();
  const winner = question.match(/^Will\s+(.+?)\s+win\b/i);
  if (winner?.[1]) return winner[1].trim();
  return question;
}

// ESPN team/athlete logo endpoints (no API key needed)
const ESPN_TEAM_ENDPOINTS: Record<string, string> = {
  nba: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams',
  nhl: 'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/teams',
  nfl: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams',
  mlb: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/teams',
  ncaab: 'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/teams?limit=100',
  soccer_epl: 'https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/teams',
  soccer_laliga: 'https://site.api.espn.com/apis/site/v2/sports/soccer/esp.1/teams',
  soccer_bundesliga: 'https://site.api.espn.com/apis/site/v2/sports/soccer/ger.1/teams',
  soccer_seriea: 'https://site.api.espn.com/apis/site/v2/sports/soccer/ita.1/teams',
  soccer_ligue1: 'https://site.api.espn.com/apis/site/v2/sports/soccer/fra.1/teams',
  soccer_mls: 'https://site.api.espn.com/apis/site/v2/sports/soccer/usa.1/teams',
  soccer_champions: 'https://site.api.espn.com/apis/site/v2/sports/soccer/uefa.champions/teams',
};

const ESPN_ATHLETE_ENDPOINTS: Record<string, string> = {
  ufc: 'https://site.api.espn.com/apis/site/v2/sports/mma/ufc/athletes?limit=500',
  boxing: 'https://site.api.espn.com/apis/site/v2/sports/boxing/boxing/athletes?limit=200',
  tennis: 'https://site.api.espn.com/apis/site/v2/sports/tennis/atp/athletes?limit=200',
  golf: 'https://site.api.espn.com/apis/site/v2/sports/golf/pga/athletes?limit=200',
};

async function fetchESPNLogos(): Promise<Map<string, string>> {
  const logoMap = new Map<string, string>();

  // Fetch team logos
  const teamFetches = Object.entries(ESPN_TEAM_ENDPOINTS).map(async ([, url]) => {
    try {
      const resp = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (!resp.ok) { await resp.text(); return; }
      const data = await resp.json();
      const teams = data?.sports?.[0]?.leagues?.[0]?.teams || [];
      for (const entry of teams) {
        const team = entry?.team;
        if (!team) continue;
        const logo = team.logos?.[0]?.href;
        if (!logo) continue;
        
        // Index by multiple name variants for better matching
        const names = [
          team.displayName,
          team.shortDisplayName,
          team.name,
          team.nickname,
          team.abbreviation,
        ].filter(Boolean);
        
        for (const name of names) {
          const key = normalizeTeamName(String(name));
          if (key && key.length > 1) logoMap.set(key, logo);
        }
      }
    } catch (err) {
      console.warn(`ESPN teams fetch error:`, err);
    }
  });

  // Fetch athlete headshots (UFC, boxing, tennis, golf)
  const athleteFetches = Object.entries(ESPN_ATHLETE_ENDPOINTS).map(async ([sport, url]) => {
    try {
      const resp = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (!resp.ok) { await resp.text(); return; }
      const data = await resp.json();
      const athletes = data?.athletes || data?.items || [];
      for (const athlete of athletes) {
        const headshot = athlete?.headshot?.href || athlete?.image?.href;
        if (!headshot) continue;
        
        const fullName = athlete?.fullName || athlete?.displayName;
        const lastName = athlete?.lastName;
        
        if (fullName) {
          const key = normalizeTeamName(String(fullName));
          if (key) logoMap.set(key, headshot);
        }
        if (lastName) {
          const key = normalizeTeamName(String(lastName));
          if (key && key.length > 2) logoMap.set(key, headshot);
        }
      }
      console.log(`ESPN ${sport} athletes: fetched ${athletes.length} entries`);
    } catch (err) {
      console.warn(`ESPN athletes (${sport}) fetch error:`, err);
    }
  });

  await Promise.all([...teamFetches, ...athleteFetches]);
  console.log(`ESPN logo fallback: ${logoMap.size} entries loaded`);
  return logoMap;
}

function resolveESPNLogo(espnLogos: Map<string, string>, name?: string | null): string | undefined {
  if (!name) return undefined;
  const normalized = normalizeTeamName(name);
  if (!normalized) return undefined;
  
  // Exact match
  const exact = espnLogos.get(normalized);
  if (exact) return exact;
  
  // Partial match (last word - typically the team name or last name)
  const words = normalized.split(' ');
  const lastName = words[words.length - 1];
  if (lastName && lastName.length > 2) {
    const byLast = espnLogos.get(lastName);
    if (byLast) return byLast;
  }
  
  // Fuzzy: check if any key contains or is contained
  for (const [candidate, logo] of espnLogos.entries()) {
    if (candidate.length > 2 && (candidate.includes(normalized) || normalized.includes(candidate))) {
      return logo;
    }
  }
  
  return undefined;
}

function buildSportImageMap(items: any[] = []) {
  const map = new Map<string, string>();

  for (const item of items) {
    if (!item?.sport || !item?.image) continue;
    map.set(String(item.sport).toLowerCase(), item.image);
  }

  return map;
}

function resolveSportImage(sportImageMap: Map<string, string>, sportKey?: string | null) {
  if (!sportKey) return undefined;
  return sportImageMap.get(String(sportKey).toLowerCase());
}

function buildTagHaystack(market: any) {
  return (market?.tags || [])
    .flatMap((tag: any) => [tag?.label, tag?.slug, tag?.name])
    .filter(Boolean)
    .join(' ');
}

function inferSportInfo(market: any, labels: string[] = []): { sportKey: string; sportLabel: string } | null {
  const haystack = [
    market.question,
    market.groupItemTitle,
    market.description,
    market.slug,
    market.events?.[0]?.title,
    market.events?.[0]?.slug,
    market.events?.[0]?.series?.[0]?.title,
    market.events?.[0]?.series?.[0]?.slug,
    market.events?.[0]?.sports?.[0]?.title,
    market.events?.[0]?.sports?.[0]?.slug,
    buildTagHaystack(market),
    ...labels,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  let bestMatch: { id: string; label: string; keywords: string[] } | null = null;
  let bestScore = 0;

  for (const sport of SPORTS_TAXONOMY) {
    const score = sport.keywords.reduce((total, keyword) => total + (haystack.includes(keyword) ? keyword.length : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = sport;
    }
  }

  return bestMatch ? { sportKey: bestMatch.id, sportLabel: bestMatch.label } : null;
}

// Comprehensive pattern-based translation for Polymarket questions
const PATTERN_TRANSLATIONS: [RegExp, (match: RegExpMatchArray) => string][] = [
  // US strikes X by DATE
  [/^US strikes (.+) by (.+)\?$/i, (m) => `EUA atacarão ${translateTerm(m[1])} até ${translateDate(m[2])}?`],
  // Will the price of X be above/below $AMOUNT on DATE
  [/^Will the price of (.+) be (above|below) \$?([\d,.]+[KMB]?) (?:on|by|in) (.+)\?$/i, (m) => {
    const dir = m[2].toLowerCase() === 'above' ? 'acima de' : 'abaixo de';
    return `O preço de ${translateTerm(m[1])} será ${dir} $${m[3]} em ${translateDate(m[4])}?`;
  }],
  // Will X dip to $AMOUNT in PERIOD
  [/^Will (.+) (?:dip|drop|fall) (?:to|below) \$?([\d,.]+[KMB]?) (?:in|by|on) (.+)\?$/i, (m) => `${translateTerm(m[1])} vai cair para $${m[2]} em ${translateDate(m[3])}?`],
  // Will X reach $AMOUNT in PERIOD
  [/^Will (.+) reach \$?([\d,.]+[KMB]?) (?:in|by) (.+)\?$/i, (m) => `${translateTerm(m[1])} vai atingir $${m[2]} em ${translateDate(m[3])}?`],
  // Will X hit $AMOUNT
  [/^Will (.+) hit \$?([\d,.]+[KMB]?) (.+)\?$/i, (m) => `${translateTerm(m[1])} vai atingir $${m[2]} ${translateDate(m[3])}?`],
  // Will there be X
  [/^Will there be (.+)\?$/i, (m) => `Haverá ${translateTerm(m[1])}?`],
  // Will the Fed increase/cut/decrease interest rates
  [/^Will (?:the )?Fed (increase|cut|raise|lower|decrease) interest rates? by (.+) after the (.+) meeting\?$/i, (m) => {
    const action = m[1].toLowerCase() === 'increase' || m[1].toLowerCase() === 'raise' ? 'aumentar' : 'cortar';
    return `O Fed vai ${action} as taxas de juros em ${m[2]} após a reunião de ${translateDate(m[3])}?`;
  }],
  // Will there be no change in Fed interest rates after X meeting
  [/^Will there be no change in (?:the )?Fed (?:funds? )?(?:interest )?rates? after the (.+) meeting\?$/i, (m) => `O Fed vai manter as taxas de juros após a reunião de ${translateDate(m[1])}?`],
  // Will X win the YEAR COMPETITION
  [/^Will (?:the )?(.+) win (?:the )?(.+)\?$/i, (m) => `${translateTerm(m[1])} vai vencer ${translateTerm(m[2])}?`],
  // Will X nominate Y as Z
  [/^Will (.+) nominate (.+) as (?:the )?(.+)\?$/i, (m) => `${translateTerm(m[1])} vai nomear ${m[2]} como ${translateTerm(m[3])}?`],
  // Will X post N tweets
  [/^Will (.+) post (.+) tweets (.+)\?$/i, (m) => `${translateTerm(m[1])} vai postar ${m[2]} tweets ${translateDate(m[3])}?`],
  // Will X confirm Y
  [/^Will (.+) confirm (.+)\?$/i, (m) => `${translateTerm(m[1])} vai confirmar ${translateTerm(m[2])}?`],
  // Will X return before Y
  [/^Will (.+) return (?:before|by) (.+)\?$/i, (m) => `${translateTerm(m[1])} vai retornar antes de ${translateDate(m[2])}?`],
  // Will X be accused of Y
  [/^Will (.+) be accused of (.+)\?$/i, (m) => `${translateTerm(m[1])} será acusado(a) de ${translateTerm(m[2])}?`],
  // X vs Y (sports)
  [/^(.+)\s+vs\.?\s+(.+)$/i, (m) => `${m[1].trim()} vs. ${m[2].trim()}`],
  // Will X be Y
  [/^Will (.+) be (.+)\?$/i, (m) => `${translateTerm(m[1])} será ${translateTerm(m[2])}?`],
  // Will X drop/fall below $AMOUNT
  [/^Will (.+) (?:drop|fall) (?:below|under) \$?([\d,.]+[KMB]?) (.+)\?$/i, (m) => `${translateTerm(m[1])} vai cair abaixo de $${m[2]} ${translateDate(m[3])}?`],
  // Will X rise/go above $AMOUNT
  [/^Will (.+) (?:rise|go) (?:above|over) \$?([\d,.]+[KMB]?) (.+)\?$/i, (m) => `${translateTerm(m[1])} vai subir acima de $${m[2]} ${translateDate(m[3])}?`],
  // Generic "Will X VERB Y?"
  [/^Will (?:the )?(.+)\?$/i, (m) => `${translateTerm(m[1])}?`],
  // Generic question without Will
  [/^(.+)\?$/i, (m) => `${translateTerm(m[1])}?`],
];

const TERM_MAP: Record<string, string> = {
  // Institutions
  'the fed': 'o Fed', 'fed chair': 'presidente do Fed', 'next fed chair': 'próximo presidente do Fed',
  'interest rates': 'taxas de juros', 'interest rate': 'taxa de juros',
  'united states': 'Estados Unidos', 'us': 'EUA', 'the us': 'os EUA',
  // Countries
  'iran': 'Irã', 'ukraine': 'Ucrânia', 'russia': 'Rússia', 'china': 'China',
  'israel': 'Israel', 'gaza': 'Gaza', 'north korea': 'Coreia do Norte',
  'south korea': 'Coreia do Sul', 'japan': 'Japão', 'germany': 'Alemanha',
  'france': 'França', 'spain': 'Espanha', 'italy': 'Itália', 'brazil': 'Brasil',
  'mexico': 'México', 'canada': 'Canadá', 'turkey': 'Turquia', 'egypt': 'Egito',
  // Sports
  'english premier league': 'Premier League Inglesa', 'premier league': 'Premier League',
  'nba finals': 'Finais da NBA', 'nba championship': 'Campeonato da NBA',
  'world cup': 'Copa do Mundo', 'champions league': 'Champions League',
  'super bowl': 'Super Bowl', 'world series': 'World Series',
  'french ligue 1': 'Ligue 1 Francesa', 'ligue 1': 'Ligue 1',
  'serie a': 'Serie A', 'bundesliga': 'Bundesliga', 'la liga': 'La Liga',
  // Politics/Government
  'democratic presidential nomination': 'indicação presidencial Democrata',
  'republican presidential nomination': 'indicação presidencial Republicana',
  'presidential nomination': 'indicação presidencial',
  'presidential election': 'eleição presidencial',
  'elected': 'eleito', 'inaugurated': 'empossado',
  'president': 'presidente', 'vice president': 'vice-presidente',
  'prime minister': 'primeiro-ministro', 'governor': 'governador',
  'senate': 'senado', 'congress': 'congresso',
  'impeached': 'sofrer impeachment', 'resign': 'renunciar',
  'approved': 'aprovado', 'passed': 'aprovado',
  'nomination': 'indicação', 'nominee': 'indicado',
  // Economy/Finance
  'recession': 'recessão', 'inflation': 'inflação',
  'stock market': 'mercado de ações', 'bull market': 'mercado em alta',
  'bear market': 'mercado em baixa', 'rate cut': 'corte de juros',
  'rate hike': 'aumento de juros', 'default': 'calote',
  'insider trading': 'insider trading',
  // Tech
  'launched': 'lançado', 'released': 'lançado', 'announce': 'anunciar',
  'acquired': 'adquirido', 'merger': 'fusão', 'acquisition': 'aquisição',
  // Conflict
  'banned': 'banido', 'legalized': 'legalizado',
  'ceasefire': 'cessar-fogo', 'peace deal': 'acordo de paz',
  'war': 'guerra', 'conflict': 'conflito', 'invasion': 'invasão',
  'sanctions': 'sanções', 'embargo': 'embargo',
  // Common verbs/words
  'accused of': 'acusado de', 'arrested': 'preso', 'convicted': 'condenado',
  'confirmed': 'confirmado', 'denied': 'negado',
  'before': 'antes de', 'after': 'após', 'during': 'durante',
  'that aliens exist': 'que alienígenas existem',
  'jesus christ': 'Jesus Cristo', 'return': 'retornar',
  'no change in': 'sem mudança em', 'increase': 'aumento', 'decrease': 'queda',
  'the price of': 'o preço de', 'above': 'acima de', 'below': 'abaixo de',
  'on': 'em', 'by': 'até', 'from': 'de', 'to': 'a',
};

const MONTH_MAP: Record<string, string> = {
  'january': 'janeiro', 'february': 'fevereiro', 'march': 'março',
  'april': 'abril', 'may': 'maio', 'june': 'junho', 'july': 'julho',
  'august': 'agosto', 'september': 'setembro', 'october': 'outubro',
  'november': 'novembro', 'december': 'dezembro',
};

function translateDate(text: string): string {
  let result = text;
  for (const [en, pt] of Object.entries(MONTH_MAP)) {
    result = result.replace(new RegExp(en, 'gi'), pt);
  }
  return result;
}

function translateTerm(text: string): string {
  let result = text;
  // Sort by length (longest first) to avoid partial replacements
  const sorted = Object.entries(TERM_MAP).sort((a, b) => b[0].length - a[0].length);
  for (const [en, pt] of sorted) {
    result = result.replace(new RegExp(`\\b${en}\\b`, 'gi'), pt);
  }
  result = translateDate(result);
  return result;
}

function dictionaryTranslate(question: string): string {
  for (const [pattern, translator] of PATTERN_TRANSLATIONS) {
    const match = question.match(pattern);
    if (match) {
      return translator(match);
    }
  }
  // Fallback: translate known terms in-place
  return translateTerm(question);
}

function categorizeMarket(input: string | any, labels: string[] = []): string {
  const q = (
    typeof input === 'string'
      ? input
      : [
          input?.question,
          input?.groupItemTitle,
          input?.description,
          input?.slug,
          input?.events?.[0]?.title,
          input?.events?.[0]?.slug,
          input?.events?.[0]?.series?.[0]?.title,
          input?.events?.[0]?.series?.[0]?.slug,
          input?.events?.[0]?.sports?.[0]?.title,
          input?.events?.[0]?.sports?.[0]?.slug,
          buildTagHaystack(input),
          ...labels,
        ]
          .filter(Boolean)
          .join(' ')
  ).toLowerCase();

  // Check if Polymarket explicitly tagged this as sports via events.sports or tags
  const hasSportsTag = typeof input === 'object' && (
    input?.events?.[0]?.sports?.length > 0 ||
    (input?.tags || []).some((t: any) => /sport/i.test(t?.label || t?.slug || ''))
  );

  let bestCategory = 'world';
  let bestScore = 0;

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;
    let matchCount = 0;
    for (const keyword of keywords) {
      if (q.includes(keyword)) {
        score += keyword.length;
        matchCount++;
      }
    }
    // Sports has many short team names that cause false positives.
    // Require at least 2 keyword matches for sports unless explicitly tagged.
    if (category === 'sports' && matchCount < 2 && !hasSportsTag) {
      score = Math.floor(score * 0.3); // heavily penalize single-keyword sports matches
    }
    // Health and economy have generic words; penalize single matches to avoid false positives
    if ((category === 'health' || category === 'economy') && matchCount < 2) {
      score = Math.floor(score * 0.3);
    }
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }

  return bestCategory;
}

function extractTrendingTopics(markets: any[]): string[] {
  const topicMap: Record<string, { label: string; count: number }> = {};

  const knownTopics: Record<string, string> = {
    'trump': 'Trump', 'biden': 'Biden', 'bitcoin': 'Bitcoin',
    'ethereum': 'Ethereum', 'fed': 'Fed', 'iran': 'Irã',
    'ukraine': 'Ucrânia', 'russia': 'Rússia', 'china': 'China',
    'ai': 'Inteligência Artificial', 'election': 'Eleições',
    'nba': 'NBA', 'nfl': 'NFL', 'tesla': 'Tesla', 'musk': 'Musk',
    'crypto': 'Cripto', 'oil': 'Petróleo', 'gaza': 'Gaza',
    'israel': 'Israel', 'nato': 'OTAN', 'recession': 'Recessão',
    'inflation': 'Inflação', 'interest': 'Juros',
    'premier': 'Premier League', 'champions': 'Champions League',
    'cup': 'Copa', 'climate': 'Clima', 'pandemic': 'Pandemia',
    'spacex': 'SpaceX', 'openai': 'OpenAI', 'google': 'Google',
    'apple': 'Apple', 'microsoft': 'Microsoft', 'nvidia': 'Nvidia',
  };

  for (const market of markets) {
    const q = (market.question || '').toLowerCase();
    for (const [keyword, label] of Object.entries(knownTopics)) {
      if (q.includes(keyword)) {
        if (!topicMap[label]) {
          topicMap[label] = { label, count: 0 };
        }
        topicMap[label].count++;
      }
    }
  }

  return Object.values(topicMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map(t => t.label);
}

// Deduplicate similar markets - keep only the highest volume variant
function deduplicateMarkets(markets: any[]): any[] {
  // Only deduplicate markets that are truly the same question with different thresholds
  // e.g., "Will Bitcoin reach $X?" with different $X values → keep highest volume
  function normalizeKey(question: string): string {
    return question.toLowerCase()
      .replace(/\$[\d,.]+[kmb]?/gi, '$X') // Normalize dollar amounts
      .replace(/\b\d+(\.\d+)?\s*(bps|%|points)\b/gi, 'N$2') // Normalize numeric thresholds
      .replace(/\s+/g, ' ')
      .trim();
  }

  const seen = new Map<string, any>();

  for (const market of markets) {
    const key = normalizeKey(market.question || '');
    // Only dedup if keys are long enough to be meaningful (avoid false positives)
    if (key.length < 15) {
      seen.set(`_unique_${Math.random()}`, market);
      continue;
    }
    const existing = seen.get(key);

    if (!existing || (parseFloat(market.volume24hr || market.volume || '0')) > (parseFloat(existing.volume24hr || existing.volume || '0'))) {
      seen.set(key, market);
    }
  }

  return Array.from(seen.values());
}

// Check if a market is a spread/over-under derivative (not the main event)
function isSportsDerivative(market: any): boolean {
  const title = (market.groupItemTitle || '').toLowerCase();
  const question = (market.question || '').toLowerCase();
  return /spread|o\/u|over\/under|over under|total|handicap/i.test(title) ||
    /spread|o\/u|over\/under/i.test(question);
}

// Detect spread market type and extract line
function parseSpreadInfo(market: any): { team: string; line: number; price: number } | null {
  const title = (market.groupItemTitle || market.question || '');
  // Match patterns like "Dallas Mavericks +8.5" or "Spread: DAL +8.5"
  const spreadMatch = title.match(/(.+?)\s*([+-]\d+\.?\d*)/);
  if (!spreadMatch) return null;

  let price = 0.5;
  try {
    if (market.outcomePrices) {
      const prices = JSON.parse(market.outcomePrices);
      price = parseFloat(prices[0]) || 0.5;
    }
  } catch {}

  return {
    team: spreadMatch[1].replace(/spread:?\s*/i, '').trim(),
    line: parseFloat(spreadMatch[2]),
    price,
  };
}

// Detect total/over-under market and extract line
function parseTotalInfo(market: any): { type: 'over' | 'under'; line: number; price: number } | null {
  const title = (market.groupItemTitle || market.question || '').toLowerCase();
  const overMatch = title.match(/over\s+(\d+\.?\d*)/i);
  const underMatch = title.match(/under\s+(\d+\.?\d*)/i);

  if (!overMatch && !underMatch) return null;

  let price = 0.5;
  try {
    if (market.outcomePrices) {
      const prices = JSON.parse(market.outcomePrices);
      price = parseFloat(prices[0]) || 0.5;
    }
  } catch {}

  if (overMatch) return { type: 'over', line: parseFloat(overMatch[1]), price };
  if (underMatch) return { type: 'under', line: parseFloat(underMatch[1]), price };
  return null;
}

// Group related binary markets by event into multi-option markets
function groupMarketsByEvent(
  markets: any[],
  teamLookup: TeamLookup,
  optionImagesByEvent: Map<string, Map<string, string>>,
  eventImageMap: Map<string, string>
): any[] {
  const eventGroups = new Map<string, any[]>();
  const standalone: any[] = [];

  for (const market of markets) {
    const events = market.events || [];
    const eventId = events.length > 0 ? events[0].id : null;
    const groupTitle = market.groupItemTitle;

    if (eventId && groupTitle) {
      if (!eventGroups.has(eventId)) {
        eventGroups.set(eventId, []);
      }
      eventGroups.get(eventId)!.push(market);
    } else {
      standalone.push(market);
    }
  }

  const colors = [
    'hsl(142, 76%, 36%)', 'hsl(217, 91%, 60%)', 'hsl(45, 93%, 47%)',
    'hsl(0, 84%, 60%)', 'hsl(280, 87%, 65%)', 'hsl(180, 70%, 45%)',
    'hsl(25, 95%, 53%)', 'hsl(320, 70%, 60%)', 'hsl(200, 98%, 39%)',
    'hsl(84, 81%, 44%)',
  ];

  for (const [_eventId, group] of eventGroups) {
    if (group.length <= 1) {
      standalone.push(...group);
      continue;
    }

    // Separate main markets from derivatives
    const mainMarkets: any[] = [];
    const spreadMarkets: any[] = [];
    const totalMarkets: any[] = [];

    for (const m of group) {
      const title = (m.groupItemTitle || '').toLowerCase();
      if (/spread|handicap/i.test(title)) {
        spreadMarkets.push(m);
      } else if (/over|under|total|o\/u/i.test(title)) {
        totalMarkets.push(m);
      } else {
        mainMarkets.push(m);
      }
    }

    const event = group[0].events?.[0];
    const eventId = String(event?.id || '');
    const eventOptionImages = eventId ? optionImagesByEvent.get(eventId) : undefined;
    const eventTitle = event?.title || group[0].question;
    const eventImage = event?.image || event?.icon || eventImageMap.get(eventId) || group[0].image;
    const eventTeamIds = [event?.teamAID, event?.teamAId, event?.teamAid, event?.teamBID, event?.teamBId, event?.teamBid]
      .filter(Boolean)
      .slice(0, 2);
    const totalVolume = group.reduce((sum: number, m: any) => sum + parseFloat(m.volume24hr || m.volume || '0'), 0);

    // Build spread data array
    const spreadData = spreadMarkets.map((m: any) => {
      const info = parseSpreadInfo(m);
      return info || { team: m.groupItemTitle || '', line: 0, price: 0.5 };
    }).filter(Boolean);

    // Build total data array
    const totalData = totalMarkets.map((m: any) => {
      const info = parseTotalInfo(m);
      return info || { type: 'over' as const, line: 0, price: 0.5 };
    }).filter(Boolean);

    const candidateMarkets = mainMarkets.length > 0 ? mainMarkets : group.filter((m: any) => !isSportsDerivative(m));
    const marketsToUse = candidateMarkets.length > 0 ? candidateMarkets : group;

    const options = marketsToUse
      .map((m: any, i: number) => {
        let yesPrice = 0.5;
        try {
          if (m.outcomePrices) {
            const prices = JSON.parse(m.outcomePrices);
            yesPrice = parseFloat(prices[0]) || 0;
          }
        } catch {}

        const tokenIds = parseClobTokenIds(m.clobTokenIds);
        const label = m.groupItemTitle || extractOptionLabelFromQuestion(m.question);
        const personalityImage = resolvePersonalityImage(label);
        const optionKey = normalizeTeamName(label);
        const mappedOptionImage = optionKey ? eventOptionImages?.get(optionKey) : undefined;
        const marketIcon = m.icon || undefined;
        const marketImage = m.image || undefined;
        const preferredOptionImage = marketIcon || marketImage || mappedOptionImage || eventImage || undefined;

        return {
          label,
          price: yesPrice,
          color: colors[i % colors.length],
          icon: marketIcon || mappedOptionImage || marketImage || eventImage || undefined,
          image: personalityImage || resolveTeamLogo(teamLookup, label, eventTeamIds[i]) || preferredOptionImage,
          tokenId: tokenIds?.[0],
        };
      })
      .sort((a: any, b: any) => b.price - a.price);

    const merged: any = {
      id: group[0].id,
      question: eventTitle,
      groupItemTitle: undefined,
      events: group[0].events,
      image: eventImage,
      outcomePrices: JSON.stringify(options.map((o: any) => o.price)),
      outcomes: JSON.stringify(options.map((o: any) => o.label)),
      volume24hr: String(totalVolume),
      volume: String(totalVolume),
      _isGrouped: true,
      _groupedOptions: options,
      _spreadData: spreadData.length > 0 ? spreadData : undefined,
      _totalData: totalData.length > 0 ? totalData : undefined,
    };

    standalone.push(merged);
  }

  console.log(`Grouped ${eventGroups.size} events, resulting in ${standalone.length} markets`);
  return standalone;
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ESPN API endpoints for live scores (no API key needed)
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

        const status = competition.status?.type?.state; // 'in', 'pre', 'post'
        if (status !== 'in') continue; // Only live games

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
  console.log(`Fetched ${allScores.length} live scores from ESPN`);
  return allScores;
}

function matchScoreToMarket(scores: LiveScore[], question: string, options?: any[]): { scores: Array<{ team: string; score: number; period: string }>, isLive: boolean } | null {
  const haystack = (question + ' ' + (options?.map(o => o.label).join(' ') || '')).toLowerCase();

  for (const score of scores) {
    const homeLower = normalizeTeamName(score.homeTeam);
    const awayLower = normalizeTeamName(score.awayTeam);

    // Check if both teams appear in the market (use words with length > 2 for better matching)
    const homeMatch = homeLower.split(' ').some(w => w.length > 2 && haystack.includes(w));
    const awayMatch = awayLower.split(' ').some(w => w.length > 2 && haystack.includes(w));

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

async function translateQuestions(questions: string[]): Promise<string[]> {
  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) {
    console.warn('LOVABLE_API_KEY not found, using dictionary translation');
    return questions.map(dictionaryTranslate);
  }

  const numberedList = questions.map((q, idx) => `${idx + 1}. ${q}`).join('\n');

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      if (attempt > 0) {
        await sleep(Math.pow(2, attempt) * 1500);
      }

      const response = await fetch(AI_GATEWAY, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'openai/gpt-5-nano',
          messages: [
            {
              role: 'system',
              content: 'Traduza as perguntas de mercados de previsão do inglês para português brasileiro. Mantenha nomes próprios inalterados. Responda APENAS com as traduções numeradas.'
            },
            { role: 'user', content: numberedList }
          ],
          temperature: 0.1,
          max_tokens: 8000,
        }),
      });

      if (response.status === 429 || response.status === 402) {
        console.warn(`Translation API returned ${response.status} (attempt ${attempt + 1}/3)`);
        continue;
      }

      if (!response.ok) {
        console.error('Translation API error:', response.status);
        continue;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      const lines = content.split('\n').filter((l: string) => l.trim());
      const parsed: string[] = [];

      for (const line of lines) {
        const match = line.match(/^\d+\.\s*(.+)/);
        if (match) parsed.push(match[1].trim());
      }

      console.log(`Translated ${parsed.length}/${questions.length} questions via AI`);

      const result: string[] = [];
      for (let j = 0; j < questions.length; j++) {
        result.push(j < parsed.length ? parsed[j] : dictionaryTranslate(questions[j]));
      }
      return result;
    } catch (err) {
      console.error(`Translation attempt ${attempt + 1} error:`, err);
    }
  }

  // Fallback: dictionary-based translation
  console.warn('AI translation failed, using dictionary fallback');
  return questions.map(dictionaryTranslate);
}

// Fetch event-level and outcome-level images from Gamma API /events endpoint
async function fetchEventAssets(_eventIds: string[]): Promise<EventAssetMaps> {
  const imageMap = new Map<string, string>();
  const optionImagesByEvent = new Map<string, Map<string, string>>();
  const PAGE_SIZE = 100;
  const MAX_PAGES = 10;

  const fetches: Promise<void>[] = [];
  for (let p = 0; p < MAX_PAGES; p++) {
    const offset = p * PAGE_SIZE;
    fetches.push(
      (async () => {
        try {
          const url = `${POLYMARKET_API}/events?limit=${PAGE_SIZE}&offset=${offset}&order=volume24hr&ascending=false&closed=false&active=true`;
          const resp = await fetch(url, { headers: { 'Accept': 'application/json' } });
          if (!resp.ok) return;
          const data = await resp.json();
          const events = Array.isArray(data) ? data : [];
          for (const ev of events) {
            const id = String(ev?.id || '');
            if (!id) continue;

            const eventImage = ev?.image || ev?.icon;
            if (eventImage) imageMap.set(id, eventImage);

            const optionMap = new Map<string, string>();
            const eventMarkets = Array.isArray(ev?.markets) ? ev.markets : [];
            for (const market of eventMarkets) {
              const optionLabel = market?.groupItemTitle || extractOptionLabelFromQuestion(market?.question);
              const optionKey = optionLabel ? normalizeTeamName(String(optionLabel)) : '';
              const optionImage = market?.icon || market?.image || eventImage;
              if (!optionKey || !optionImage || optionMap.has(optionKey)) continue;
              optionMap.set(optionKey, optionImage);
            }

            if (optionMap.size > 0) {
              optionImagesByEvent.set(id, optionMap);
            }
          }
        } catch (err) {
          console.warn('Event images fetch error:', err);
        }
      })()
    );
  }

  await Promise.all(fetches);
  console.log(`Fetched ${imageMap.size} event images and ${optionImagesByEvent.size} option-image maps from Gamma API`);
  return { eventImages: imageMap, optionImagesByEvent };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fetching markets from Polymarket (paginated)...');

    const allMarkets: any[] = [];
    const PAGE_SIZE = 100;
    const MAX_PAGES = 15; // Up to 1500 markets – keeps response fast

    // Fetch pages in parallel batches of 5 for speed
    for (let batch = 0; batch < MAX_PAGES; batch += 5) {
      const pageFetches = [];
      for (let p = batch; p < Math.min(batch + 5, MAX_PAGES); p++) {
        const offset = p * PAGE_SIZE;
        const url = `${POLYMARKET_API}/markets?closed=false&active=true&limit=${PAGE_SIZE}&offset=${offset}&order=volume24hr&ascending=false`;
        pageFetches.push(
          fetch(url, { headers: { 'Accept': 'application/json' } })
            .then(async (resp) => {
              if (!resp.ok) return [];
              const data = await resp.json();
              return Array.isArray(data) ? data : [];
            })
            .catch(() => [] as any[])
        );
      }
      const results = await Promise.all(pageFetches);
      let batchEmpty = false;
      for (const pageData of results) {
        if (pageData.length === 0) { batchEmpty = true; break; }
        allMarkets.push(...pageData);
      }
      console.log(`Batch ${batch / 5 + 1}: total ${allMarkets.length} markets`);
      if (batchEmpty) break;
    }

    // Collect all unique event IDs from markets to fetch event-level images
    const eventIds = new Set<string>();
    for (const m of allMarkets) {
      const eid = m.events?.[0]?.id;
      if (eid) eventIds.add(String(eid));
    }

    const [teamsData, sportsMetadata, liveScores, espnLogos, eventAssets] = await Promise.all([
      fetch(`${POLYMARKET_API}/teams?limit=2000`, { headers: { 'Accept': 'application/json' } })
        .then((resp) => (resp.ok ? resp.json() : []))
        .catch(() => []),
      fetch(`${POLYMARKET_API}/sports`, { headers: { 'Accept': 'application/json' } })
        .then((resp) => (resp.ok ? resp.json() : []))
        .catch(() => []),
      fetchLiveScores(),
      fetchESPNLogos(),
      fetchEventAssets(Array.from(eventIds)),
    ]);

    const teamLookup = buildTeamLookup(Array.isArray(teamsData) ? teamsData : []);
    const sportImageMap = buildSportImageMap(Array.isArray(sportsMetadata) ? sportsMetadata : []);
    const eventImageMap = eventAssets.eventImages;
    const eventOptionImageMap = eventAssets.optionImagesByEvent;

    const rawMarkets = allMarkets;
    console.log(`Fetched ${rawMarkets.length} total markets from Polymarket`);
    console.log(`Loaded ${teamLookup.byId.size} Polymarket logos + ${espnLogos.size} ESPN logos`);

    const now = new Date();
    const validMarkets = rawMarkets.filter((m: any) => {
      if (!m.question || (!m.outcomePrices && !m.bestBid)) return false;

      // Filter out resolved/closed markets that slipped through
      if (m.closed === true || m.active === false || m.resolved === true) return false;

      // Filter out markets whose end date has already passed
      const endDateRaw = m.endDate || m.end_date_iso || m.events?.[0]?.endDate;
      if (endDateRaw) {
        const endDate = new Date(endDateRaw);
        if (!isNaN(endDate.getTime()) && endDate < now) return false;
      }

      return true;
    });
    console.log(`After filtering expired/closed: ${validMarkets.length} of ${rawMarkets.length} markets`);

    // Group related binary markets by event (e.g., multiple candidates for same race)
    const groupedMarkets = groupMarketsByEvent(validMarkets, teamLookup, eventOptionImageMap, eventImageMap);

    // Deduplicate before translating to save API calls
    const dedupedMarkets = deduplicateMarkets(groupedMarkets);
    console.log(`After deduplication: ${dedupedMarkets.length} unique markets`);

    const questions = dedupedMarkets.map((m: any) => m.question);

    // Use fast dictionary translation only (AI translation was causing 429/timeout)
    const translatedQuestions = questions.map(dictionaryTranslate);
    console.log(`Translated ${translatedQuestions.length} questions via dictionary`);

    const markets = dedupedMarkets.map((m: any, idx: number) => {
      let yesPercent = 50;
      let noPercent = 50;
      let isMultiOption = false;
      let options: any[] | undefined;

      // If this market was pre-grouped from multiple binary markets
      if (m._isGrouped && m._groupedOptions) {
        isMultiOption = true;
        options = m._groupedOptions;
        yesPercent = Math.round((options?.[0]?.price || 0.5) * 100);
        noPercent = 100 - yesPercent;

        const volume = parseFloat(m.volume24hr || m.volume || '0');
        const category = categorizeMarket(m, options?.map((option: any) => option.label) || []);
        const sportInfo = category === 'sports'
          ? inferSportInfo(m, options?.map((option: any) => option.label) || [])
          : null;
        const sportImage = resolveSportImage(sportImageMap, sportInfo?.sportKey);
        const seriesTitle = m.events?.[0]?.series?.[0]?.title || sportInfo?.sportLabel || undefined;

        // Extract end date from event or market
        const endDateIso = m.endDate || m.end_date_iso || m.events?.[0]?.endDate || null;

        // Extract clobTokenIds for real chart data
        const clobTokenIds = parseClobTokenIds(m.clobTokenIds);

        const scoreMatch = category === 'sports' ? matchScoreToMarket(liveScores, m.question, options) : null;

        return {
          id: m.id || `poly-${idx}`,
          question: translatedQuestions[idx] || m.question,
          originalQuestion: m.question,
          subtitle: `Vol: R$${volume >= 1000000 ? (volume / 1000000).toFixed(1) + 'M' : volume >= 1000 ? (volume / 1000).toFixed(0) + 'K' : volume.toFixed(0)}`,
          category,
          sportKey: sportInfo?.sportKey,
          sportLabel: sportInfo?.sportLabel,
          sportImage,
          seriesTitle,
          image: m.icon || m.image || m.events?.[0]?.icon || eventImageMap.get(String(m.events?.[0]?.id)) || sportImage || `https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=400&fit=crop`,
          yesPercent,
          noPercent,
          volume: Math.round(volume),
          source: 'polymarket',
          isMultiOption: true,
          options,
          endDate: endDateIso,
          clobTokenIds,
          spreadData: m._spreadData,
          totalData: m._totalData,
          liveScores: scoreMatch?.scores,
          isLive: scoreMatch?.isLive || false,
        };
      }

      let outcomeLabels: string[] | undefined;
      const clobTokenIds = parseClobTokenIds(m.clobTokenIds);
      const event = m.events?.[0];
      const eventFallbackImage = event?.image || event?.icon || eventImageMap.get(String(event?.id)) || m.icon || m.image;
      const eventTeamIds = [event?.teamAID, event?.teamAId, event?.teamAid, event?.teamBID, event?.teamBId, event?.teamBid]
        .filter(Boolean)
        .slice(0, 2);

      try {
        if (m.outcomePrices) {
          const prices = JSON.parse(m.outcomePrices);
          if (prices.length === 2) {
            yesPercent = Math.round(parseFloat(prices[0]) * 100);
            noPercent = 100 - yesPercent;

            if (m.outcomes) {
              const outcomes = JSON.parse(m.outcomes);
              const isYesNo = outcomes.length === 2 &&
                outcomes[0].toLowerCase() === 'yes' && outcomes[1].toLowerCase() === 'no';

              if (!isYesNo) {
                outcomeLabels = outcomes;
                options = outcomes.map((label: string, i: number) => ({
                  icon: m.icon || m.image || eventFallbackImage || undefined,
                  label,
                  price: parseFloat(prices[i]) || 0,
                  image: resolvePersonalityImage(label) || resolveTeamLogo(teamLookup, label, eventTeamIds[i]) || m.icon || m.image || eventFallbackImage || undefined,
                  tokenId: clobTokenIds?.[i],
                }));
              }
            }
          } else if (prices.length > 2) {
            isMultiOption = true;
            const outcomes = m.outcomes ? JSON.parse(m.outcomes) : prices.map((_: any, i: number) => `Opção ${i + 1}`);
            const colors = [
              'hsl(142, 76%, 36%)', 'hsl(217, 91%, 60%)', 'hsl(45, 93%, 47%)',
              'hsl(0, 84%, 60%)', 'hsl(280, 87%, 65%)', 'hsl(180, 70%, 45%)',
              'hsl(25, 95%, 53%)', 'hsl(320, 70%, 60%)', 'hsl(200, 98%, 39%)',
              'hsl(84, 81%, 44%)',
            ];
            options = outcomes.map((label: string, i: number) => ({
              icon: m.icon || m.image || eventFallbackImage || undefined,
              label,
              price: parseFloat(prices[i]) || 0,
              color: colors[i % colors.length],
              image: resolvePersonalityImage(label) || resolveTeamLogo(teamLookup, label, eventTeamIds[i]) || m.icon || m.image || eventFallbackImage || undefined,
              tokenId: clobTokenIds?.[i],
            }));
            yesPercent = Math.round(parseFloat(prices[0]) * 100);
            noPercent = 100 - yesPercent;
          }
        }
      } catch {
        // fallback
      }

      const volume = parseFloat(m.volume24hr || m.volume || '0');
      const labelsForClassification = outcomeLabels || options?.map((option: any) => option.label) || [];
      const category = categorizeMarket(m, labelsForClassification);
      const sportInfo = category === 'sports'
        ? inferSportInfo(m, labelsForClassification)
        : null;
      const sportImage = resolveSportImage(sportImageMap, sportInfo?.sportKey);
      const seriesTitle = m.events?.[0]?.series?.[0]?.title || sportInfo?.sportLabel || undefined;

      // Extract end date
      const endDateIso = m.endDate || m.end_date_iso || m.events?.[0]?.endDate || null;

      const scoreMatch = category === 'sports' ? matchScoreToMarket(liveScores, m.question, options) : null;

      return {
        id: m.id || `poly-${idx}`,
        question: translatedQuestions[idx] || m.question,
        originalQuestion: m.originalQuestion || m.question,
        subtitle: `Vol: R$${volume >= 1000000 ? (volume / 1000000).toFixed(1) + 'M' : volume >= 1000 ? (volume / 1000).toFixed(0) + 'K' : volume.toFixed(0)}`,
        category,
        sportKey: sportInfo?.sportKey,
        sportLabel: sportInfo?.sportLabel,
        sportImage,
        seriesTitle,
        image: m.icon || m.image || event?.icon || eventImageMap.get(String(m.events?.[0]?.id)) || sportImage || `https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=400&fit=crop`,
        yesPercent,
        noPercent,
        volume: Math.round(volume),
        source: 'polymarket',
        isMultiOption,
        options,
        outcomeLabels,
        endDate: endDateIso,
        clobTokenIds,
        liveScores: scoreMatch?.scores,
        isLive: scoreMatch?.isLive || false,
      };
    });

    // Detect bad/unreliable Polymarket team images
    // Polymarket often assigns wrong images: country flags, esports logos, college teams for NBA/NHL
    function isBadImage(url?: string): boolean {
      if (!url) return true;
      // Polymarket country flags are always wrong for outcome photos
      if (/country-flags\//i.test(url)) return true;
      // Esports logos misused for real sports
      if (/team_logos\/esports\//i.test(url)) return true;
      // ESPN images are always good
      if (url.includes('espncdn.com')) return false;
      // Wikipedia images are always good (from our overrides)
      if (url.includes('wikipedia.org') || url.includes('wikimedia.org')) return false;
      // UFC images are always good
      if (url.includes('dmxg5wxfqgb4u.cloudfront.net')) return false;
      // Polymarket S3 uploaded images are good (artist headshots, event thumbnails)
      if (url.includes('polymarket-upload.s3')) return false;
      // Polymarket CDN images are good
      if (url.includes('polymarket.com') && !(/country-flags\//i.test(url))) return false;
      // Unsplash images are ok
      if (url.includes('unsplash.com')) return false;
      // Generic placeholders
      if (/placeholder/i.test(url)) return true;
      // College/random team logos that don't match
      if (/Cal[\+\s]Lutheran|Shanghai[\+\s]Dragons|rainbow[\+\s]warriors/i.test(url)) return true;
      return false;
    }

    // Post-process: for ALL markets with options, try ESPN logos; remove bad images
    let espnFills = 0;
    for (const market of markets) {
      if (market.options && Array.isArray(market.options)) {
        for (const option of market.options) {
          const currentImage = option.icon || option.image;
          const personality = resolvePersonalityImage(option.label);
          if (personality) {
            option.icon = personality;
            option.image = personality;
            continue;
          }

          // Try ESPN logos for ALL categories (sports players appear in culture markets like Ballon d'Or)
          const espnLogo = resolveESPNLogo(espnLogos, option.label);
          if (espnLogo) {
            if (!currentImage || isBadImage(currentImage) || (!currentImage.includes('espncdn.com') && !currentImage.includes('wikipedia.org'))) {
              option.icon = espnLogo;
              option.image = espnLogo;
              espnFills++;
            }
          } else if (isBadImage(currentImage)) {
            option.icon = undefined;
            option.image = undefined;
          }
        }
      }
      // Also fill main market image if bad
      if (isBadImage(market.image)) {
        const questionImage = resolvePersonalityImage(market.question);
        const firstOption = market.options?.[0];
        if (questionImage) market.image = questionImage;
        else if (firstOption?.image && !isBadImage(firstOption.image)) market.image = firstOption.image;
      }
    }
    console.log(`ESPN logos applied to ${espnFills} options across all categories`);
    const trendingTopics = extractTrendingTopics(rawMarkets);

    console.log(`Returning ${markets.length} processed markets with ${trendingTopics.length} trending topics`);

    return new Response(
      JSON.stringify({ markets, trendingTopics }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching Polymarket data:', error);

    return new Response(
      JSON.stringify({ markets: [], trendingTopics: [], error: String(error) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
