import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, Moon, Sun, User, LogOut, Shield, FlaskConical, Trophy, Gift, Plug, Target, MessageCircle, FileText, ScrollText, ChevronDown, Globe, Users, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuthContext } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useDemoContext } from '@/contexts/DemoContext';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { useToast } from '@/hooks/use-toast';
import { WalletDisplay } from './WalletDisplay';
import { NotificationBell } from './NotificationBell';
import { SearchDropdown } from './SearchDropdown';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useAdminCashAlert } from '@/hooks/useAdminCashAlert';
import logoLight from '@/assets/logo.png';
import logoDark from '@/assets/logo-dark.png';

interface HeaderProps {
  isDark: boolean;
  toggleDarkMode: () => void;
  onSearch?: (query: string) => void;
  onCategoryChange?: (category: string) => void;
  markets?: import('@/hooks/useNews').PredictionMarket[];
}

export function Header({ isDark, toggleDarkMode, onSearch, onCategoryChange, markets = [] }: HeaderProps) {
  const { t, i18n } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDemoDialog, setShowDemoDialog] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [hamburgerOpen, setHamburgerOpen] = useState(false);
  const { user, profile, signOut, isAuthenticated } = useAuthContext();
  const { isAdmin } = useIsAdmin();
  const { demoState, activateDemo, deactivateDemo } = useDemoContext();
  const { isEnabled } = useFeatureFlags();
  useAdminCashAlert();
  const { toast } = useToast();
  const navigate = useNavigate();

  const menuItems = [
    ...(isEnabled('feature_leaderboard') ? [{ label: t('menuItems.leaderboard'), icon: Trophy, route: '/leaderboard' }] : []),
    { label: t('menuItems.rewards'), icon: Gift, route: '/rewards' },
    { label: 'Indique Amigo', icon: Users, route: '/referral' },
    { label: t('menuItems.apis'), icon: Plug, route: '/apis' },
    { label: t('menuItems.accuracy'), icon: Target, route: '/accuracy' },
    { label: t('menuItems.support'), icon: MessageCircle, route: '/support' },
    { label: t('menuItems.docs'), icon: FileText, route: '/docs' },
    { label: t('menuItems.terms'), icon: ScrollText, route: '/terms' },
    { label: 'Como funciona?', icon: HelpCircle, route: '#how-it-works', onClick: () => window.dispatchEvent(new Event('start-guided-tour')) },
  ];

  const handleSignOut = async () => {
    await signOut();
  };

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return user?.email?.slice(0, 2).toUpperCase() || 'U';
  };

  const getAvatarGradient = () => {
    const id = user?.id || user?.email || 'default';
    const hash = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const hue1 = hash % 360;
    const hue2 = (hash * 7 + 137) % 360;
    return `linear-gradient(135deg, hsl(${hue1}, 70%, 55%), hsl(${hue2}, 80%, 50%))`;
  };

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border">
      <div className="container">
        <div className="flex items-center gap-3 py-2 md:py-3">
          {/* Logo */}
          <Link to="/" className="flex items-center shrink-0">
            <img
              src={isDark ? logoDark : logoLight}
              alt="OnChoice"
              className="h-7 md:h-8 w-auto"
            />
          </Link>

          {/* Search — Polymarket proportions */}
          <div className="flex-1 hidden sm:block" data-tour="search">
            <SearchDropdown onSearch={onSearch} onCategoryChange={onCategoryChange} markets={markets} />
          </div>

          {/* How it works — like Polymarket, visible in header */}
          <button
            onClick={() => window.dispatchEvent(new Event('start-guided-tour'))}
            className="hidden md:flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
          >
            <HelpCircle className="h-4 w-4 text-primary" />
            Como funciona
          </button>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Right side actions */}
          <div className="flex items-center gap-2 md:gap-3">
            {isAuthenticated ? (
              <>
                <div data-tour="wallet"><WalletDisplay /></div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-lg"
                  onClick={() => navigate('/referral')}
                  title="Indicações"
                >
                  <Gift className="h-4.5 w-4.5" />
                </Button>
                <div data-tour="notifications"><NotificationBell /></div>
                <DropdownMenu open={avatarOpen} onOpenChange={setAvatarOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative flex items-center gap-1 rounded-full p-0 pr-1"
                      onMouseEnter={() => setAvatarOpen(true)}
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || 'Avatar'} />
                        <AvatarFallback className="text-white font-bold text-xs" style={{ background: getAvatarGradient() }}>
                          {getInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64" align="end" sideOffset={8} onMouseLeave={() => setAvatarOpen(false)}>
                    <div className="flex items-center gap-3 p-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={profile?.avatar_url || undefined} />
                        <AvatarFallback className="text-white font-bold text-xs" style={{ background: getAvatarGradient() }}>
                          {getInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col leading-none">
                        {profile?.full_name && (
                          <p className="font-medium text-sm">{profile.full_name}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-0.5">{user?.email}</p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        {t('header.myProfile')}
                      </Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="cursor-pointer">
                          <Shield className="mr-2 h-4 w-4" />
                          {t('header.adminPanel')}
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {isEnabled('feature_feed') && (
                      <DropdownMenuItem asChild>
                        <Link to="/feed" className="cursor-pointer">
                          <MessageCircle className="mr-2 h-4 w-4" />
                          {t('header.community')}
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    {menuItems.map((item: any) => {
                      const Icon = item.icon;
                      if (item.onClick) {
                        return (
                          <DropdownMenuItem key={item.label} onClick={item.onClick} className="cursor-pointer">
                            <Icon className="mr-2 h-4 w-4" />
                            {item.label}
                          </DropdownMenuItem>
                        );
                      }
                      return (
                        <DropdownMenuItem key={item.label} asChild>
                          <Link to={item.route} className="cursor-pointer">
                            <Icon className="mr-2 h-4 w-4" />
                            {item.label}
                          </Link>
                        </DropdownMenuItem>
                      );
                    })}
                    <DropdownMenuSeparator />
                    <div className="flex items-center justify-between px-2 py-1.5">
                      <div className="flex items-center gap-2">
                        {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                        <span className="text-sm">{t('header.darkMode')}</span>
                      </div>
                      <Switch checked={isDark} onCheckedChange={toggleDarkMode} />
                    </div>
                    <div className="flex items-center justify-between px-2 py-1.5">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        <span className="text-sm">{t('header.language', 'Idioma')}</span>
                      </div>
                      <button
                        onClick={() => i18n.changeLanguage(i18n.language === 'pt-BR' ? 'en' : 'pt-BR')}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        {i18n.language === 'pt-BR' ? '🇧🇷 PT' : '🇺🇸 EN'}
                      </button>
                    </div>
                    <DropdownMenuSeparator />
                    {demoState.isActive ? (
                      <DropdownMenuItem onClick={deactivateDemo} className="text-amber-600 dark:text-amber-400">
                        <FlaskConical className="mr-2 h-4 w-4" />
                        {t('demo.exitDemo')}
                      </DropdownMenuItem>
                    ) : !demoState.expired && !demoState.startedAt ? (
                      <DropdownMenuItem onClick={() => setShowDemoDialog(true)}>
                        <FlaskConical className="mr-2 h-4 w-4" />
                        {t('demo.tryDemo')}
                      </DropdownMenuItem>
                    ) : null}
                    <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      {t('header.logout')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <AlertDialog open={showDemoDialog} onOpenChange={setShowDemoDialog}>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <FlaskConical className="h-5 w-5 text-primary" />
                        {t('demo.title')}
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-left space-y-3">
                        <p>
                          {t('demo.description')}{' '}
                          <strong className="text-foreground">R$ 5.000,00</strong> {t('demo.virtualMoney')}
                        </p>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          <li>{t('demo.validFor')} <strong className="text-foreground">7 {t('demo.days')}</strong></li>
                          <li>{t('demo.noRealRisk')}</li>
                          <li>{t('demo.oncePerAccount')}</li>
                          <li>{t('demo.canReturn')}</li>
                        </ul>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('demo.cancel')}</AlertDialogCancel>
                      <AlertDialogAction onClick={async () => {
                        const result = await activateDemo();
                        if (result.success) {
                          toast({ title: t('demo.activated'), description: t('demo.activatedDesc') });
                        } else {
                          toast({ title: t('common.error'), description: result.error, variant: 'destructive' });
                        }
                      }}>
                        {t('demo.activate')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            ) : (
              /* Not logged in — Polymarket style: Entrar + Cadastre-se + hamburger dropdown */
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="text-sm font-medium text-foreground hover:text-foreground/80 transition-colors hidden sm:block"
                >
                  {t('header.login')}
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors hidden sm:block"
                >
                  {t('header.signup')}
                </Link>

                {/* Hamburger dropdown — hover to open, same options as avatar menu */}
                <DropdownMenu open={hamburgerOpen} onOpenChange={setHamburgerOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onMouseEnter={() => setHamburgerOpen(true)}
                    >
                      <Menu className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" sideOffset={8} onMouseLeave={() => setHamburgerOpen(false)}>
                    <DropdownMenuItem asChild className="sm:hidden">
                      <Link to="/login" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        {t('header.login')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="sm:hidden">
                      <Link to="/signup" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        {t('header.signup')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="sm:hidden" />
                    {menuItems.map((item: any) => {
                      const Icon = item.icon;
                      if (item.onClick) {
                        return (
                          <DropdownMenuItem key={item.label} onClick={item.onClick} className="cursor-pointer">
                            <Icon className="mr-2 h-4 w-4" />
                            {item.label}
                          </DropdownMenuItem>
                        );
                      }
                      return (
                        <DropdownMenuItem key={item.label} asChild>
                          <Link to={item.route} className="cursor-pointer">
                            <Icon className="mr-2 h-4 w-4" />
                            {item.label}
                          </Link>
                        </DropdownMenuItem>
                      );
                    })}
                    <DropdownMenuSeparator />
                    <div className="flex items-center justify-between px-2 py-1.5">
                      <div className="flex items-center gap-2">
                        {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                        <span className="text-sm">{t('header.darkMode')}</span>
                      </div>
                      <Switch checked={isDark} onCheckedChange={toggleDarkMode} />
                    </div>
                    <div className="flex items-center justify-between px-2 py-1.5">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        <span className="text-sm">{t('header.language', 'Idioma')}</span>
                      </div>
                      <button
                        onClick={() => i18n.changeLanguage(i18n.language === 'pt-BR' ? 'en' : 'pt-BR')}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        {i18n.language === 'pt-BR' ? '🇧🇷 PT' : '🇺🇸 EN'}
                      </button>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </div>

        {/* Mobile search */}
        <div className="pb-2 sm:hidden">
          <SearchDropdown onSearch={onSearch} onCategoryChange={onCategoryChange} />
        </div>
      </div>
    </header>
  );
}