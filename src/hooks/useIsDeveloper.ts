import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

export function useIsDeveloper() {
  const { user } = useAuthContext();
  const [isDeveloper, setIsDeveloper] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      if (!user) {
        setIsDeveloper(false);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (!error && data) {
        setIsDeveloper(data.role === 'developer');
      } else {
        setIsDeveloper(false);
      }
      setLoading(false);
    };

    check();
  }, [user]);

  return { isDeveloper, loading };
}
