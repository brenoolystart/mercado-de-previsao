import CategoryPage, { type CategoryPageConfig } from '@/pages/CategoryPage';

const config: CategoryPageConfig = {
  categoryId: 'finance',
  title: 'Finanças',
  sidebarFilters: [
    { id: 'all', label: 'Todos', keywords: [] },
    { id: 'stocks', label: 'Ações', keywords: ['stock', 'ação', 'share', 'nasdaq', 's&p', 'dow'] },
    { id: 'fed', label: 'Fed', keywords: ['fed', 'federal reserve', 'fomc', 'interest rate', 'taxa de juros'] },
    { id: 'inflation', label: 'Inflação', keywords: ['inflation', 'inflação', 'cpi', 'pce'] },
    { id: 'earnings', label: 'Resultados', keywords: ['earnings', 'revenue', 'profit', 'resultado'] },
    { id: 'ipo', label: 'IPO', keywords: ['ipo', 'listing', 'public offering'] },
    { id: 'bonds', label: 'Títulos', keywords: ['bond', 'treasury', 'yield', 'título'] },
    { id: 'forex', label: 'Câmbio', keywords: ['forex', 'dollar', 'dólar', 'eur', 'currency', 'câmbio'] },
    { id: 'commodities', label: 'Commodities', keywords: ['oil', 'gold', 'ouro', 'petróleo', 'commodity'] },
  ],
};

export default function FinancePage() {
  return <CategoryPage config={config} />;
}
