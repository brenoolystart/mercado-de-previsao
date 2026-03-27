import CategoryPage, { type CategoryPageConfig } from '@/pages/CategoryPage';

const config: CategoryPageConfig = {
  categoryId: 'politics',
  title: 'Política',
  sidebarFilters: [
    { id: 'all', label: 'Todos', keywords: [] },
    { id: 'trump', label: 'Trump', keywords: ['trump'] },
    { id: 'midterms', label: 'Midterms', keywords: ['midterm', '2026'] },
    { id: 'global-elections', label: 'Eleições Globais', keywords: ['election', 'eleição', 'eleições', 'voting'] },
    { id: 'congress', label: 'Congresso', keywords: ['congress', 'congresso', 'senate', 'senado', 'house'] },
    { id: 'brazil', label: 'Brasil', keywords: ['brazil', 'brasil', 'lula', 'bolsonaro'] },
    { id: 'china', label: 'China', keywords: ['china', 'xi', 'beijing'] },
    { id: 'courts', label: 'Tribunais', keywords: ['court', 'tribunal', 'supreme', 'judge'] },
    { id: 'venezuela', label: 'Venezuela', keywords: ['venezuela', 'maduro'] },
    { id: 'us-elections', label: 'Eleições nos EUA', keywords: ['us election', 'presidential', 'presidente eua', 'white house'] },
    { id: 'cabinet', label: 'Gabinete', keywords: ['cabinet', 'gabinete', 'secretary', 'minister'] },
  ],
};

export default function PoliticsPage() {
  return <CategoryPage config={config} />;
}
