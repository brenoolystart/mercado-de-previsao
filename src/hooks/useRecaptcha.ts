import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useFingerprint } from './useFingerprint';

function isTokenInvalidError(message: string) {
  return message.includes('invalid-input-response') || message.includes('timeout-or-duplicate');
}

export function useRecaptcha() {
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaResetTrigger, setCaptchaResetTrigger] = useState(0);
  const fingerprint = useFingerprint();

  const resetCaptcha = useCallback(() => {
    setCaptchaToken(null);
    setCaptchaResetTrigger((prev) => prev + 1);
  }, []);

  const verifyCaptcha = useCallback(async (action: 'login' | 'signup' | 'deposit') => {
    if (!captchaToken) {
      return { success: false, error: 'Complete o reCAPTCHA para continuar.' };
    }

    try {
      const { data, error } = await supabase.functions.invoke('verify-recaptcha', {
        body: { token: captchaToken, action, fingerprint },
      });

      if (error) {
        if (isTokenInvalidError(error.message || '')) {
          resetCaptcha();
          return { success: false, error: 'O reCAPTCHA expirou. Marque novamente “Não sou um robô”.' };
        }
        throw error;
      }

      if (!data?.success) {
        const details = Array.isArray(data?.details) ? data.details : [];
        if (details.includes('invalid-input-response') || details.includes('timeout-or-duplicate')) {
          resetCaptcha();
          return { success: false, error: 'O reCAPTCHA expirou. Marque novamente “Não sou um robô”.' };
        }

        return { success: false, error: data?.error || 'Verificação falhou.' };
      }

      return { success: true, error: null };
    } catch (err: any) {
      const message = err?.message || 'Erro na verificação.';
      if (isTokenInvalidError(message)) {
        resetCaptcha();
        return { success: false, error: 'O reCAPTCHA expirou. Marque novamente “Não sou um robô”.' };
      }
      return { success: false, error: message };
    }
  }, [captchaToken, fingerprint, resetCaptcha]);

  return { captchaToken, setCaptchaToken, verifyCaptcha, fingerprint, captchaResetTrigger, resetCaptcha };
}
