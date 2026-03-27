import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useMaintenanceMode() {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMode = async () => {
      const { data } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', 'maintenance_mode')
        .single();

      if (data) {
        const val = data.value;
        // Handle both boolean and string values
        setIsMaintenanceMode(val === true || val === 'true' || val === '"true"');
      }
      setLoading(false);
    };

    fetchMode();

    // Poll every 10s for faster response
    const interval = setInterval(fetchMode, 10000);
    return () => clearInterval(interval);
  }, []);

  const toggleMaintenanceMode = async (enabled: boolean) => {
    const { error } = await supabase
      .from('platform_settings')
      .update({ value: enabled })
      .eq('key', 'maintenance_mode');

    if (!error) setIsMaintenanceMode(enabled);
    return { error };
  };

  return { isMaintenanceMode, loading, toggleMaintenanceMode };
}
