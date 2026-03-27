import { useState } from 'react';
import { Download, X, Share, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';

export function InstallPromptBanner() {
  const { isInstallable, isInstalled, platform, promptInstall } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(() => {
    return sessionStorage.getItem('install-banner-dismissed') === 'true';
  });

  // Hide on mobile devices
  const isMobile = /iPad|iPhone|iPod|Android/i.test(navigator.userAgent);
  if (isMobile) return null;

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('install-banner-dismissed', 'true');
  };

  if (isInstalled || dismissed) return null;

  // iOS - show manual instructions
  if (platform === 'ios') {
    return (
      <div className="bg-primary/10 border-b border-primary/20 px-4 py-3">
        <div className="container flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Download className="h-5 w-5 text-primary shrink-0" />
            <p className="text-sm text-foreground truncate">
              Instale o OnChoice: toque em <Share className="inline h-4 w-4 text-primary" /> e depois <strong>"Adicionar à Tela de Início"</strong> <Plus className="inline h-4 w-4 text-primary" />
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleDismiss} className="shrink-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Android / Desktop - native prompt available
  if (isInstallable) {
    return (
      <div className="bg-primary/10 border-b border-primary/20 px-4 py-3">
        <div className="container flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Download className="h-5 w-5 text-primary shrink-0" />
            <p className="text-sm text-foreground truncate">
              Instale o OnChoice como app para acesso rápido!
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" onClick={promptInstall}>
              Instalar
            </Button>
            <Button variant="ghost" size="icon" onClick={handleDismiss}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
