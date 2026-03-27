import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HelpCircle } from 'lucide-react';

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-secondary border-t border-border py-10 hidden md:block">
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h4 className="font-bold text-foreground mb-3">OnChoice</h4>
            <p className="text-sm text-muted-foreground">
              {t('footer.description')}
            </p>
          </div>
          <div>
            <h4 className="font-bold text-foreground mb-3">{t('footer.product')}</h4>
            <div className="space-y-2">
              <Link to="/" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                {t('footer.markets')}
              </Link>
              <Link to="/apis" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                {t('footer.api')}
              </Link>
              <Link to="/docs" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                {t('footer.documentation')}
              </Link>
            </div>
          </div>
          <div>
            <h4 className="font-bold text-foreground mb-3">{t('footer.community')}</h4>
            <div className="space-y-2">
              <Link to="/feed" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                {t('header.community', 'Comunidade')}
              </Link>
              <Link to="/leaderboard" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                {t('menuItems.leaderboard', 'Classificação')}
              </Link>
              <Link to="/support" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                {t('menuItems.support', 'Suporte')}
              </Link>
            </div>
          </div>
          <div>
            <h4 className="font-bold text-foreground mb-3">{t('footer.legal')}</h4>
            <div className="space-y-2">
              <Link to="/terms" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                {t('footer.termsOfService')}
              </Link>
              <Link to="/support" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                {t('footer.contact')}
              </Link>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between pt-6 border-t border-border">
          <p className="text-sm text-muted-foreground">
            {t('footer.copyright')}
          </p>
          <button
            onClick={() => window.dispatchEvent(new Event('start-guided-tour'))}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <HelpCircle className="h-4 w-4" />
            Como funciona?
          </button>
        </div>
      </div>
    </footer>
  );
}