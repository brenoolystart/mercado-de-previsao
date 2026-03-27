import { ReactNode } from 'react';
import { useMaintenanceMode } from '@/hooks/useMaintenanceMode';
import { useIsDeveloper } from '@/hooks/useIsDeveloper';
import { MaintenancePage } from '@/components/MaintenancePage';

export function AppWithMaintenance({ children }: { children: ReactNode }) {
  const { isMaintenanceMode, loading: maintenanceLoading } = useMaintenanceMode();
  const { isDeveloper, loading: devLoading } = useIsDeveloper();

  if (maintenanceLoading || devLoading) return <>{children}</>;

  // Only developer bypasses maintenance - admins see maintenance too
  if (isMaintenanceMode && !isDeveloper) {
    return <MaintenancePage />;
  }

  return <>{children}</>;
}
