import CategoryPage, { type CategoryPageConfig } from '@/pages/CategoryPage';

const config: CategoryPageConfig = {
  categoryId: 'economy',
  title: 'Economia',
  sidebarFilters: [
    { id: 'all', label: 'Todos', keywords: [] },
    { id: 'gdp', label: 'PIB', keywords: ['gdp', 'pib', 'growth', 'crescimento'] },
    { id: 'inflation', label: 'Inflação', keywords: ['inflation', 'inflação', 'cpi', 'ipca'] },
    { id: 'recession', label: 'Recessão', keywords: ['recession', 'recessão', 'downturn'] },
    { id: 'employment', label: 'Emprego', keywords: ['employment', 'emprego', 'jobs', 'unemployment', 'desemprego', 'labor'] },
    { id: 'housing', label: 'Imóveis', keywords: ['housing', 'real estate', 'imóvel', 'mortgage', 'rent'] },
    { id: 'energy', label: 'Energia', keywords: ['energy', 'energia', 'oil', 'petróleo', 'gas', 'renewable'] },
    { id: 'trade', label: 'Comércio', keywords: ['trade', 'comércio', 'tariff', 'export', 'import'] },
    { id: 'debt', label: 'Dívida', keywords: ['debt', 'dívida', 'deficit', 'spending'] },
  ],
};

export default function EconomyPage() {
  return <CategoryPage config={config} />;
}
