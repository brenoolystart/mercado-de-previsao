import CategoryPage, { type CategoryPageConfig } from '@/pages/CategoryPage';

const config: CategoryPageConfig = {
  categoryId: 'crypto',
  title: 'Criptomoedas',
  subTabs: [
    { id: 'all', label: 'Todos' },
    { id: 'up-down', label: 'Up / Down' },
    { id: 'above-below', label: 'Above / Below' },
    { id: 'price-range', label: 'Price Range' },
    { id: 'hit-price', label: 'Hit Price' },
  ],
  sidebarFilters: [
    { id: 'all', label: 'Todos', keywords: [] },
    { id: 'bitcoin', label: 'Bitcoin', keywords: ['bitcoin', 'btc'] },
    { id: 'ethereum', label: 'Ethereum', keywords: ['ethereum', 'eth'] },
    { id: 'solana', label: 'Solana', keywords: ['solana', 'sol'] },
    { id: 'xrp', label: 'XRP', keywords: ['xrp', 'ripple'] },
    { id: 'dogecoin', label: 'Dogecoin', keywords: ['dogecoin', 'doge'] },
    { id: 'bnb', label: 'BNB', keywords: ['bnb', 'binance'] },
    { id: 'etf', label: 'ETF', keywords: ['etf'] },
    { id: 'defi', label: 'DeFi', keywords: ['defi', 'dao', 'swap', 'liquidity'] },
    { id: 'weekly', label: 'Semanalmente', keywords: ['weekly', 'week', 'semana'] },
    { id: 'monthly', label: 'Mensalmente', keywords: ['monthly', 'month', 'mês'] },
  ],
};

export default function CryptoPage() {
  return <CategoryPage config={config} />;
}
