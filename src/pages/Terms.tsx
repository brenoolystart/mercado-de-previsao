import { Header } from '@/components/Header';
import { MobileHotbar } from '@/components/MobileHotbar';
import { Footer } from '@/components/Footer';
import { useDarkMode } from '@/hooks/useDarkMode';
import { ScrollText } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Terms = () => {
  const { isDark, toggleDarkMode } = useDarkMode();
  const { t } = useTranslation();

  const sections = Array.from({ length: 9 }, (_, i) => ({
    title: t(`terms.section${i + 1}Title`),
    text: t(`terms.section${i + 1}Text`),
  }));

  return (
    <div className="min-h-screen bg-background">
      <Header isDark={isDark} toggleDarkMode={toggleDarkMode} />
      <main className="max-w-2xl mx-auto px-4 py-6 pb-24">
        <div className="flex items-center gap-3 mb-6">
          <ScrollText className="w-7 h-7 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">{t('terms.title')}</h1>
        </div>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
          {sections.map((section, i) => (
            <section key={i} className="bg-card border border-border rounded-2xl p-5">
              <h2 className="text-lg font-semibold text-foreground mb-2">{section.title}</h2>
              <p className="text-sm text-muted-foreground">{section.text}</p>
            </section>
          ))}
          <p className="text-xs text-muted-foreground text-center pt-4">{t('terms.lastUpdate')}</p>
        </div>
      </main>
      <Footer />
      <MobileHotbar />
    </div>
  );
};

export default Terms;