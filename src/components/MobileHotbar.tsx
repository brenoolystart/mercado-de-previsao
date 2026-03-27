import {
  Home,
  TrendingUp,
  User,
  Users,
  MoreHorizontal,
  Trophy,
  Gift,
  Plug,
  Target,
  MessageCircle,
  MessageSquare,
  FileText,
  ScrollText,
  type LucideIcon
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

interface MobileHotbarProps {
  activeItem?: string;
  onItemClick?: (id: string) => void;
}

export function MobileHotbar({ activeItem = 'home', onItemClick }: MobileHotbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const hotbarItems = [
    { id: 'home', icon: Home, label: t('hotbar.home') },
    { id: 'feed', icon: MessageSquare, label: t('hotbar.social') },
    { id: 'markets', icon: TrendingUp, label: t('hotbar.markets') },
    { id: 'profile', icon: User, label: t('hotbar.profile') },
  ];

  const moreMenuItems = [
    { label: t('menuItems.leaderboard'), icon: Trophy, route: '/leaderboard' },
    { label: t('menuItems.rewards'), icon: Gift, route: '/rewards' },
    { label: 'Indique Amigo', icon: Users, route: '/referral' },
    { label: t('menuItems.apis'), icon: Plug, route: '/apis' },
    { label: t('menuItems.accuracy'), icon: Target, route: '/accuracy' },
    { label: t('menuItems.support'), icon: MessageCircle, route: '/support' },
    { label: t('menuItems.docs'), icon: FileText, route: '/docs' },
    { label: t('menuItems.terms'), icon: ScrollText, route: '/terms' },
  ];

  const handleItemClick = (id: string) => {
    onItemClick?.(id);
    if (id === 'feed') navigate('/feed');
    else if (id === 'home') navigate('/');
    else if (id === 'profile') navigate('/profile');
  };

  return (
    <nav className="mobile-hotbar">
      {hotbarItems.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => handleItemClick(item.id)}
            className={`hotbar-item ${activeItem === item.id ? 'active' : ''}`}
          >
            <Icon className="hotbar-item-icon" />
            <span className="hotbar-item-label">{item.label}</span>
          </button>
        );
      })}

      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <SheetTrigger asChild>
          <button className="hotbar-item">
            <MoreHorizontal className="hotbar-item-icon" />
            <span className="hotbar-item-label">{t('hotbar.more')}</span>
          </button>
        </SheetTrigger>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>{t('hotbar.moreOptions')}</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-3 gap-4 py-6">
            {moreMenuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-muted transition-colors"
                  onClick={() => { setIsMenuOpen(false); navigate(item.route); }}
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-xs font-medium text-center">{item.label}</span>
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}