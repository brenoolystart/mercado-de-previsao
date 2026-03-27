import CategoryPage, { type CategoryPageConfig } from '@/pages/CategoryPage';

const config: CategoryPageConfig = {
  categoryId: 'tech',
  title: 'Tecnologia',
  sidebarFilters: [
    { id: 'all', label: 'Todos', keywords: [] },
    { id: 'ai', label: 'Inteligência Artificial', keywords: ['ai', 'artificial intelligence', 'inteligência artificial', 'openai', 'chatgpt', 'gpt', 'llm'] },
    { id: 'apple', label: 'Apple', keywords: ['apple', 'iphone', 'ipad', 'mac', 'wwdc'] },
    { id: 'google', label: 'Google', keywords: ['google', 'alphabet', 'android', 'gemini'] },
    { id: 'meta', label: 'Meta', keywords: ['meta', 'facebook', 'instagram', 'whatsapp', 'zuckerberg'] },
    { id: 'microsoft', label: 'Microsoft', keywords: ['microsoft', 'windows', 'azure', 'copilot'] },
    { id: 'tesla', label: 'Tesla', keywords: ['tesla', 'musk', 'spacex', 'neuralink'] },
    { id: 'startups', label: 'Startups', keywords: ['startup', 'unicorn', 'funding', 'vc', 'venture'] },
    { id: 'social', label: 'Redes Sociais', keywords: ['twitter', 'x.com', 'tiktok', 'youtube', 'social media'] },
    { id: 'gaming', label: 'Gaming', keywords: ['game', 'gaming', 'esport', 'playstation', 'xbox', 'nintendo'] },
  ],
};

export default function TechPage() {
  return <CategoryPage config={config} />;
}
