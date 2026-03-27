import CategoryPage, { type CategoryPageConfig } from '@/pages/CategoryPage';

const config: CategoryPageConfig = {
  categoryId: 'geopolitics',
  title: 'Geopolítica',
  sidebarFilters: [
    { id: 'all', label: 'Todos', keywords: [] },
    { id: 'ukraine', label: 'Ucrânia', keywords: ['ukraine', 'ucrânia', 'zelensky', 'kyiv'] },
    { id: 'russia', label: 'Rússia', keywords: ['russia', 'rússia', 'putin', 'moscow'] },
    { id: 'middle-east', label: 'Oriente Médio', keywords: ['iran', 'irã', 'israel', 'gaza', 'hamas', 'hezbollah', 'middle east'] },
    { id: 'china-taiwan', label: 'China-Taiwan', keywords: ['taiwan', 'china', 'strait', 'xi jinping'] },
    { id: 'nato', label: 'OTAN', keywords: ['nato', 'otan', 'alliance'] },
    { id: 'sanctions', label: 'Sanções', keywords: ['sanction', 'sanção', 'embargo', 'trade war', 'guerra comercial'] },
    { id: 'nuclear', label: 'Nuclear', keywords: ['nuclear', 'missile', 'weapon'] },
    { id: 'africa', label: 'África', keywords: ['africa', 'áfrica', 'sahel'] },
    { id: 'latam', label: 'América Latina', keywords: ['latin america', 'américa latina', 'mexico', 'argentina', 'colombia'] },
  ],
};

export default function GeopoliticsPage() {
  return <CategoryPage config={config} />;
}
