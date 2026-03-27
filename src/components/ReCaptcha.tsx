import { useRef, useCallback, useEffect } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { useDarkMode } from '@/hooks/useDarkMode';
import { ShieldCheck } from 'lucide-react';

const RECAPTCHA_SITE_KEY = '6LcV8owsAAAAAMrK9xa_Tf5n6h68CHfNmU0zNas0';

interface ReCaptchaWidgetProps {
  onVerify: (token: string | null) => void;
  resetTrigger?: number;
}

export function ReCaptchaWidget({ onVerify, resetTrigger = 0 }: ReCaptchaWidgetProps) {
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const { isDark } = useDarkMode();

  const handleChange = useCallback((token: string | null) => {
    onVerify(token);
  }, [onVerify]);

  const handleExpired = useCallback(() => {
    onVerify(null);
  }, [onVerify]);

  useEffect(() => {
    recaptchaRef.current?.reset();
  }, [resetTrigger]);

  return (
    <div className="flex flex-col items-center gap-2">
      <ReCAPTCHA
        ref={recaptchaRef}
        sitekey={RECAPTCHA_SITE_KEY}
        onChange={handleChange}
        onExpired={handleExpired}
        theme={isDark ? 'dark' : 'light'}
        hl="pt-BR"
      />
    </div>
  );
}

// No-op provider — not needed for v2 but keeps App.tsx unchanged
export function ReCaptchaProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function ReCaptchaBadge() {
  return (
    <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground mt-1">
      <ShieldCheck className="h-3.5 w-3.5 text-primary" />
      <span>Protegido por reCAPTCHA Google</span>
    </div>
  );
}
