import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLoadingBar } from '@/hooks/useLoadingBar';
import { Header } from '@/components/Header';
import { Categories, categoryIconMap, type Category } from '@/components/Categories';
import { MarketsGrid } from '@/components/MarketsGrid';
import { FeaturedMarket } from '@/components/FeaturedMarket';
import { BreakingNewsBanner } from '@/components/BreakingNewsBanner';
import { HotTopicsSidebar } from '@/components/HotTopicsSidebar';
import { MobileHotbar } from '@/components/MobileHotbar';
import { Footer } from '@/components/Footer';
import { DemoModeBanner } from '@/components/DemoModeBanner';
import { GuidedTour } from '@/components/GuidedTour';
import { SportsHub } from '@/components/SportsHub';
import { NCAATournamentCard } from '@/components/NCAATournamentCard';
import { SportsMarketsFeed } from '@/components/SportsMarketsFeed';
import { SportsTradePanel } from '@/components/SportsTradePanel';
import { CryptoHub } from '@/components/CryptoHub';
import { CultureHub } from '@/components/CultureHub';
import { LiveHub } from '@/components/LiveHub';
import { MobileTradeBar } from '@/components/market/MobileTradeBar';
import { useIsMobile } from '@/hooks/use-mobile';
import { useDarkMode } from '@/hooks/useDarkMode';
import { useNews } from '@/hooks/useNews';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { useTranslatedMarkets } from '@/hooks/useTranslatedMarkets';
import { buildSportsSummary, buildSportsTrendingTopics, filterMarketsBySport, getSportsMarketPhase, type SportsBoardView } from '@/lib/sports';
import { ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';


const Index = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { isDark, toggleDarkMode } = useDarkMode();
  const { markets, getMarketsByCategory, trendingTopics, loading, error } = useNews();
  const loadingBar = useLoadingBar();
  const { isEnabled } = useFeatureFlags();
  const marketsEnabled = isEnabled('feature_markets');
  const [activeCategory, setActiveCategory] = useState('trending');
  const [activeSubcategory, setActiveSubcategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeHotbarItem, setActiveHotbarItem] = useState('home');
  const [activeSportsView, setActiveSportsView] = useState<SportsBoardView>('live');
  const [selectedSportsMarketId, setSelectedSportsMarketId] = useState<string | null>(null);


  const categoryPages: Record<string, string> = {
    politics: '/politics', crypto: '/crypto', finance: '/finance',
    geopolitics: '/geopolitics', tech: '/tech', economy: '/economy',
  };

  const handleCategoryChange = useCallback((categoryId: string) => {
    // Navigate to dedicated category page if available
    if (categoryPages[categoryId]) {
      navigate(categoryPages[categoryId]);
      return;
    }
    loadingBar.start();
    setActiveCategory(categoryId);
    setActiveSubcategory('all');
    if (categoryId === 'sports') {
      setActiveSportsView('live');
    }
    setTimeout(() => loadingBar.done(), 300);
  }, [loadingBar, navigate]);

  const sportsMarkets = useMemo(() => getMarketsByCategory('sports'), [getMarketsByCategory]);
  const sportsSummary = useMemo(() => buildSportsSummary(sportsMarkets), [sportsMarkets]);
  const sportsTopics = useMemo(() => buildSportsTrendingTopics(sportsMarkets), [sportsMarkets]);

  // Build dynamic categories sorted by volume (like Polymarket)
  // Fixed: Trending | Breaking | New | then sorted by volume + hot topic tabs
  const dynamicCategories = useMemo<Category[]>(() => {
    if (markets.length === 0) return [];

    const volumeMap: Record<string, number> = {};
    const countMap: Record<string, number> = {};
    const now = Date.now();
    let breakingCount = 0;
    let newCount = 0;

    for (const m of markets) {
      const cat = m.category;
      if (!cat || cat === 'trending') continue;
      volumeMap[cat] = (volumeMap[cat] || 0) + m.volume;
      countMap[cat] = (countMap[cat] || 0) + 1;

      // "Breaking" = high volume markets (top movers)
      if (m.volume > 5_000_000) breakingCount++;

      // "New" = markets created recently (endDate far in the future or freshly added)
      if (m.endDate) {
        const endMs = new Date(m.endDate).getTime();
        if (endMs - now > 30 * 24 * 60 * 60 * 1000) newCount++; // ends > 30 days out
      }
    }

    const sorted = Object.entries(volumeMap)
      .filter(([, vol]) => vol > 0)
      .sort(([, a], [, b]) => b - a);

    const result: Category[] = [
      { id: 'trending', labelKey: 'categories.trending', icon: categoryIconMap['trending'], count: markets.length },
      { id: 'live', labelKey: 'categories.live', icon: categoryIconMap['live'], count: markets.filter(m => {
        if (m.endDate) {
          const h = (new Date(m.endDate).getTime() - Date.now()) / 3600000;
          if (h > 0 && h <= 48) return true;
        }
        return m.volume > 2_000_000;
      }).length },
      { id: 'breaking', labelKey: 'categories.breaking', icon: categoryIconMap['breaking'], count: breakingCount },
      { id: 'new', labelKey: 'categories.new', icon: categoryIconMap['new'], count: newCount },
    ];

    // Add real categories sorted by volume
    for (const [catId] of sorted) {
      const icon = categoryIconMap[catId];
      if (icon) {
        result.push({
          id: catId,
          labelKey: `categories.${catId}`,
          icon,
          count: countMap[catId],
        });
      }
    }

    // Add top trending topics as dynamic tabs (like Polymarket shows Iran, Elections, etc.)
    const existingIds = new Set(result.map(c => c.id));
    const topTopics = trendingTopics.slice(0, 5);
    for (const topic of topTopics) {
      const topicId = topic.id.toLowerCase();
      if (!existingIds.has(topicId)) {
        const icon = categoryIconMap[topicId] || categoryIconMap['world'];
        result.push({
          id: topicId,
          labelKey: topic.label, // Use label directly since these are dynamic
          icon,
          isDynamic: true,
        });
        existingIds.add(topicId);
      }
    }

    return result;
  }, [markets, trendingTopics]);

  // Filter out topics already promoted to top category tabs so subcategories don't repeat
  const visibleTopics = useMemo(() => {
    const promotedIds = new Set(dynamicCategories.filter(c => c.isDynamic).map(c => c.id));
    const base = activeCategory === 'sports' ? sportsTopics : trendingTopics;
    return base.filter(t => !promotedIds.has(t.id.toLowerCase()));
  }, [activeCategory, sportsTopics, trendingTopics, dynamicCategories]);

  // Build category counts for badges
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const cat of dynamicCategories) {
      counts[cat.id] = cat.count || getMarketsByCategory(cat.id).length;
    }
    return counts;
  }, [dynamicCategories, getMarketsByCategory]);

  const filteredMarkets = useMemo(() => {
    let filtered: typeof markets = [];

    // Handle special category tabs
    if (activeCategory === 'breaking') {
      // Breaking = high volume markets sorted by volume
      filtered = [...markets].filter(m => m.volume > 5_000_000).sort((a, b) => b.volume - a.volume);
    } else if (activeCategory === 'new') {
      // New = markets with end dates far in the future
      const now = Date.now();
      filtered = markets.filter(m => {
        if (!m.endDate) return false;
        return new Date(m.endDate).getTime() - now > 30 * 24 * 60 * 60 * 1000;
      });
    } else {
      // Check if this is a dynamic topic tab (not a real category)
      const isDynamicTopic = dynamicCategories.find(c => c.id === activeCategory && c.isDynamic);
      if (isDynamicTopic) {
        // Filter all markets by topic keyword search
        const topicTerms = [activeCategory, ...activeCategory.split(/\s+/).filter(t => t.length >= 2)];
        filtered = markets.filter(m => {
          const text = `${m.question} ${m.originalQuestion || ''} ${m.subtitle} ${m.category}`.toLowerCase();
          return topicTerms.some(term => text.includes(term));
        });
      } else {
        filtered = getMarketsByCategory(activeCategory);
      }
    }

    if (activeSubcategory !== 'all') {
      if (activeCategory === 'sports') {
        filtered = filterMarketsBySport(filtered, activeSubcategory);
      } else {
        const sub = activeSubcategory.toLowerCase();
        // Expand subcategory into multiple search aliases (PT ↔ EN)
        const ALIASES: Record<string, string[]> = {
          'eleições': ['election', 'eleicao', 'eleição', 'presidential', 'presidente', 'governor', 'senate', 'nominee', 'primary', 'primaries', 'ballot', 'vote', 'candidat'],
          'inteligência artificial': ['artificial intelligence', 'ai ', 'openai', 'chatgpt', 'gpt', 'gemini', 'llm', 'machine learning', 'anthropic', 'claude', 'deepseek'],
          'copa': ['world cup', 'copa do mundo', 'fifa', 'copa america'],
          'irã': ['iran', 'ira ', 'iranian', 'tehran', 'persian'],
          'fed': ['federal reserve', 'interest rate', 'juros', 'fomc', 'rate cut', 'rate hike', 'powell', 'bps'],
          'bitcoin': ['bitcoin', 'btc', 'satoshi'],
          'ethereum': ['ethereum', 'eth ', 'ether'],
          'solana': ['solana', 'sol '],
          'xrp': ['xrp', 'ripple'],
          'dogecoin': ['doge', 'dogecoin'],
          'israel': ['israel', 'israeli', 'gaza', 'hamas', 'netanyahu', 'tel aviv'],
          'china': ['china', 'chinese', 'beijing', 'xi jinping', 'taiwan', 'ccp'],
          'ucrânia': ['ukraine', 'ukrainian', 'zelensky', 'kyiv', 'kiev'],
          'rússia': ['russia', 'russian', 'putin', 'moscow', 'kremlin'],
          'cuba': ['cuba', 'cuban', 'havana'],
          'nba': ['nba', 'lakers', 'celtics', 'warriors', 'knicks', 'nets', 'bulls', 'heat', 'suns', 'bucks', 'nuggets', 'cavaliers', 'mavericks', 'thunder', 'rockets', 'clippers', 'raptors', 'pacers', 'hawks', 'magic', '76ers', 'sixers', 'pistons', 'wizards', 'pelicans', 'timberwolves', 'hornets', 'kings', 'grizzlies', 'spurs', 'blazers', 'jazz'],
          'nfl': ['nfl', 'super bowl', 'chiefs', 'eagles', '49ers', 'cowboys', 'packers', 'ravens', 'bills', 'dolphins', 'steelers', 'bengals', 'lions', 'bears', 'saints', 'falcons', 'buccaneers', 'seahawks'],
          'nhl': ['nhl', 'stanley cup', 'penguins', 'rangers', 'bruins', 'maple leafs', 'capitals', 'hurricanes', 'avalanche', 'oilers', 'canucks', 'lightning', 'panthers', 'senators', 'devils', 'islanders', 'red wings', 'predators', 'stars', 'flames', 'jets', 'wild', 'kraken', 'blue jackets', 'sabres', 'blackhawks', 'blues', 'sharks', 'golden knights', 'flyers', 'canadiens'],
          'mlb': ['mlb', 'world series', 'yankees', 'dodgers', 'mets', 'cubs', 'red sox', 'braves', 'astros', 'phillies', 'padres', 'orioles', 'mariners', 'guardians', 'twins', 'rays', 'brewers', 'cardinals', 'diamondbacks', 'rangers', 'royals', 'tigers', 'reds', 'pirates', 'rockies', 'nationals', 'angels', 'white sox', 'marlins', 'athletics'],
          'ncaa': ['ncaa', 'march madness', 'ncaab', 'bulldogs', 'tar heels', 'blue devils', 'wildcats', 'buckeyes', 'spartans', 'wolverines', 'crimson tide', 'tigers', 'gators', 'seminoles', 'longhorns', 'sooners', 'bears', 'horned frogs', 'jayhawks', 'hoosiers', 'boilermakers', 'hawkeyes', 'badgers', 'fighting irish', 'cardinals'],
          'ucl': ['ucl', 'champions league', 'uefa', 'europa league', 'real madrid', 'barcelona', 'bayern', 'psg', 'man city', 'liverpool', 'arsenal', 'chelsea', 'juventus', 'inter', 'milan', 'napoli', 'dortmund', 'atletico', 'benfica', 'porto', 'ajax'],
          'f1': ['formula 1', 'f1', 'grand prix', 'verstappen', 'hamilton', 'leclerc', 'norris', 'sainz', 'alonso', 'perez', 'russell', 'red bull', 'ferrari', 'mclaren', 'mercedes'],
          'ufc': ['ufc', 'mma', 'octagon', 'fight night', 'lightweight', 'heavyweight', 'welterweight', 'middleweight', 'featherweight', 'bantamweight', 'flyweight'],
          'petróleo': ['oil', 'petroleum', 'crude', 'opec', 'brent', 'wti'],
          'openai': ['openai', 'chatgpt', 'gpt', 'sam altman'],
          'musk': ['musk', 'elon', 'doge ', 'spacex'],
          'tesla': ['tesla', 'tsla', 'cybertruck'],
          'trump': ['trump', 'maga', 'mar-a-lago'],
          'apple': ['apple', 'iphone', 'ipad', 'macos', 'tim cook', 'vision pro'],
          'google': ['google', 'alphabet', 'gemini', 'android', 'youtube'],
          'senate': ['senate', 'senator', 'senado'],
          'congress': ['congress', 'congressional', 'congresso', 'house of rep'],
          'dólar': ['dollar', 'usd', 'dólar', 'forex'],
          'ouro': ['gold', 'ouro', 'gold price'],
          'clima': ['weather', 'temperature', 'hurricane', 'storm', 'snow', 'flood', 'drought', 'wildfire', 'climate'],
          'twitter': ['tweet', 'twitter', 'x post', 'x.com'],
          'tiktok': ['tiktok', 'tik tok', 'bytedance'],
          'tariffs': ['tariff', 'tarifa', 'trade war', 'duty', 'duties'],
          'midterms': ['midterm', 'mid-term'],
          'oscars': ['oscar', 'academy award', 'best picture', 'best actor', 'best actress'],
          'covid': ['covid', 'pandemic', 'coronavirus', 'vaccine'],
          'tennis': ['tennis', 'wimbledon', 'roland garros', 'us open', 'australian open', 'atp', 'wta', 'miami open', 'indian wells', 'djokovic', 'alcaraz', 'sinner', 'swiatek', 'sabalenka', 'medvedev', 'rublev', 'zverev'],
          'golf': ['golf', 'pga', 'the masters', 'ryder cup', 'scheffler', 'mcilroy', 'rahm', 'koepka'],
          'boxing': ['boxing', 'boxe', 'title fight'],
          'cricket': ['cricket', 'ipl', 't20', 'icc', 'test match'],
        };
        const aliases = ALIASES[sub] || [];
        const terms = [sub, ...sub.split(/\s+/).filter(t => t.length >= 3), ...aliases];

        // For subcategory filtering, search across ALL markets (not just current category)
        // This ensures clicking "NBA" while on "trending" shows all NBA markets
        const searchPool = activeCategory === 'trending' || activeCategory === 'breaking' || activeCategory === 'new'
          ? filtered
          : markets; // Search all markets when on a specific category to find cross-category matches

        filtered = searchPool.filter((m) => {
          const text = `${m.question} ${m.subtitle} ${m.originalQuestion || ''} ${m.category}`.toLowerCase();
          // Also check sportKey for sports subcategories
          const sportKey = (m.sportKey || '').toLowerCase();
          return terms.some(term => text.includes(term) || sportKey.includes(term));
        });
      }
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((m) => m.question.toLowerCase().includes(query) || m.subtitle.toLowerCase().includes(query));
    }

    return filtered;
  }, [getMarketsByCategory, activeCategory, activeSubcategory, searchQuery, markets, dynamicCategories]);

  // Translate market questions via AI when user language is PT-BR
  const { translatedMarkets } = useTranslatedMarkets(filteredMarkets);
  const { translatedMarkets: translatedAllMarkets } = useTranslatedMarkets(markets);

  const showGrouped = activeCategory === 'trending' && !searchQuery && activeSubcategory === 'all';

  const visibleSportsMarkets = useMemo(() => {
    if (activeCategory !== 'sports') return [];
    return translatedMarkets.filter((market) => getSportsMarketPhase(market) === activeSportsView);
  }, [activeCategory, translatedMarkets, activeSportsView]);

  const selectedSportsMarket = useMemo(() => {
    if (!selectedSportsMarketId || visibleSportsMarkets.length === 0) return null;
    return visibleSportsMarkets.find((market) => market.id === selectedSportsMarketId) || null;
  }, [visibleSportsMarkets, selectedSportsMarketId]);

  useEffect(() => {
    if (activeCategory !== 'sports') return;
    setSelectedSportsMarketId((current) => {
      if (visibleSportsMarkets.length === 0) return null;
      // Only keep current selection if it still exists, don't auto-select first
      if (current && visibleSportsMarkets.some((market) => market.id === current)) {
        return current;
      }
      return null;
    });
  }, [activeCategory, visibleSportsMarkets]);


  const top3Markets = useMemo(() => {
    if (!showGrouped || translatedMarkets.length === 0) return [];
    // Ensure variety: pick from different market types (multi, crypto, binary)
    const sorted = [...translatedMarkets].sort((a, b) => b.volume - a.volume);
    const picked: typeof sorted = [];
    const types = new Set<string>();
    
    for (const m of sorted) {
      const q = (m.question + ' ' + (m.originalQuestion || '')).toLowerCase();
      const isCrypto = m.category === 'crypto' || /\b(btc|bitcoin|eth|ethereum|up or down|up down|5.min|5min)\b/i.test(q);
      const type = (isCrypto && m.endDate) ? 'crypto' : (m.isMultiOption && m.options && m.options.length > 2) ? 'multi' : 'binary';
      
      if (picked.length < 3) {
        // Prefer variety but fill up if needed
        if (!types.has(type) || picked.length >= sorted.length) {
          types.add(type);
          picked.push(m);
        }
      }
      if (picked.length >= 3) break;
    }
    
    // If we couldn't get 3 with variety, fill remaining from top volume
    if (picked.length < 3) {
      for (const m of sorted) {
        if (!picked.find(p => p.id === m.id)) {
          picked.push(m);
          if (picked.length >= 3) break;
        }
      }
    }
    
    return picked;
  }, [translatedMarkets, showGrouped]);

  const [featuredIndex, setFeaturedIndex] = useState(0);

  useEffect(() => {
    if (top3Markets.length <= 1) return;
    const timer = setInterval(() => {
      setFeaturedIndex((prev) => (prev + 1) % top3Markets.length);
    }, 30000);
    return () => clearInterval(timer);
  }, [top3Markets.length]);

  useEffect(() => {
    setFeaturedIndex(0);
  }, [top3Markets.length]);

  const featuredMarket = top3Markets[featuredIndex] || null;

  const handlePrev = useCallback(() => {
    setFeaturedIndex((prev) => (prev - 1 + top3Markets.length) % top3Markets.length);
  }, [top3Markets.length]);

  const handleNext = useCallback(() => {
    setFeaturedIndex((prev) => (prev + 1) % top3Markets.length);
  }, [top3Markets.length]);

  const remainingMarkets = useMemo(() => {
    if (!featuredMarket) return translatedMarkets;
    return translatedMarkets.filter((m) => m.id !== featuredMarket.id);
  }, [translatedMarkets, featuredMarket]);

  // Adjacent market names for prev/next
  const prevMarket = top3Markets.length > 1
    ? top3Markets[(featuredIndex - 1 + top3Markets.length) % top3Markets.length]
    : null;
  const nextMarket = top3Markets.length > 1
    ? top3Markets[(featuredIndex + 1) % top3Markets.length]
    : null;

  return (
    <div className="min-h-screen bg-background">
      {loadingBar.bar}
      <Header isDark={isDark} toggleDarkMode={toggleDarkMode} onSearch={setSearchQuery} onCategoryChange={handleCategoryChange} markets={markets} />
      <DemoModeBanner />

      {marketsEnabled ? (
        <>
          <Categories activeCategory={activeCategory} activeSubcategory={activeSubcategory} onCategoryChange={handleCategoryChange} onSubcategoryChange={setActiveSubcategory} trendingTopics={visibleTopics} showSubcategories={activeCategory !== 'sports'} categoryCounts={categoryCounts} dynamicCategories={dynamicCategories} />

          <main>
            <div className="container">
              {activeCategory === 'sports' ? (
                <>
                  <SportsHub
                    summaries={sportsSummary}
                    activeSport={activeSubcategory}
                    activeView={activeSportsView}
                    onSportChange={setActiveSubcategory}
                    onViewChange={setActiveSportsView}
                    tradePanel={<SportsTradePanel market={selectedSportsMarket} />}
                  >
                    <SportsMarketsFeed
                      markets={translatedMarkets}
                      activeSport={activeSubcategory}
                      view={activeSportsView}
                      selectedMarketId={selectedSportsMarket?.id ?? null}
                      onSelectMarket={setSelectedSportsMarketId}
                    />
                  </SportsHub>
                  {isMobile && selectedSportsMarket && (
                    <MobileTradeBar
                      marketId={selectedSportsMarket.id}
                      title={selectedSportsMarket.question}
                      imageUrl={selectedSportsMarket.imageUrl}
                      yesPrice={selectedSportsMarket.yesPrice}
                      yesLabel={selectedSportsMarket.outcomeLabels?.[0] || 'Sim'}
                      noLabel={selectedSportsMarket.outcomeLabels?.[1] || 'Não'}
                    />
                  )}
                </>
              ) : activeCategory === 'crypto' ? (
                <CryptoHub markets={translatedMarkets} loading={loading} />
              ) : activeCategory === 'culture' ? (
                <CultureHub markets={translatedMarkets} loading={loading} />
              ) : activeCategory === 'live' ? (
                <LiveHub markets={translatedAllMarkets} loading={loading} />
              ) : (
                <>
                  {/* Hero section: Featured market + sidebar */}
                  {featuredMarket && top3Markets.length > 0 && (
                    <div className="pt-3 pb-3">
                      <div className="flex flex-col lg:flex-row gap-4">
                        <div className="flex-1 min-w-0 bg-card border border-border rounded-lg p-4">
                          <FeaturedMarket market={featuredMarket} />
                          {top3Markets.length > 1 && (
                            <div className="flex items-center justify-center gap-1.5 mt-4">
                              {top3Markets.map((_, i) => (
                                <button
                                  key={i}
                                  onClick={() => setFeaturedIndex(i)}
                                  className={`rounded-full transition-all duration-300 ${
                                    i === featuredIndex ? 'w-6 h-1.5 bg-primary' : 'w-1.5 h-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                                  }`}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="hidden lg:flex flex-col gap-4 w-[260px] shrink-0">
                          <BreakingNewsBanner markets={translatedAllMarkets} />
                          <div className="border-t border-border pt-4">
                            <HotTopicsSidebar markets={translatedAllMarkets} onCategoryChange={handleCategoryChange} />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-4 gap-4">
                        <div className="flex items-center gap-3">
                          {prevMarket && (
                            <button
                              onClick={handlePrev}
                              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors bg-secondary/50 hover:bg-secondary rounded-full px-3 py-1.5"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                              <span className="max-w-[150px] truncate">{prevMarket.question}</span>
                            </button>
                          )}
                          {nextMarket && (
                            <button
                              onClick={handleNext}
                              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors bg-secondary/50 hover:bg-secondary rounded-full px-3 py-1.5"
                            >
                              <span className="max-w-[150px] truncate">{nextMarket.question}</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <button
                          onClick={() => navigate('/explore')}
                          className="text-sm font-semibold text-primary hover:text-primary-foreground border-2 border-primary rounded-full px-6 py-2 hover:bg-primary transition-all duration-200"
                        >
                          {t('common.exploreAll')}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* NCAA Tournament Card */}
                  <div className="my-4">
                    <NCAATournamentCard />
                  </div>

                  <div className="w-full">
                    <MarketsGrid markets={remainingMarkets} loading={loading} error={error} groupByCategory={showGrouped} />
                  </div>
                </>
              )}
            </div>
          </main>
        </>
      ) : (
        <main className="container py-20">
          <div className="text-center max-w-md mx-auto space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-amber-500" />
            </div>
             <h2 className="text-2xl font-bold text-foreground">{t('common.marketsUnavailable')}</h2>
             <p className="text-muted-foreground">{t('common.marketsUnavailableDesc')}</p>
          </div>
        </main>
      )}
      <Footer />
      <MobileHotbar activeItem={activeHotbarItem} onItemClick={setActiveHotbarItem} />
      <GuidedTour />
    </div>
  );
};

export default Index;
