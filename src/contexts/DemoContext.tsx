import { createContext, useContext, ReactNode } from 'react';
import { useDemo, DemoState } from '@/hooks/useDemo';

interface DemoContextType {
  demoState: DemoState;
  loading: boolean;
  activateDemo: () => Promise<{ success: boolean; error?: string }>;
  deactivateDemo: () => Promise<void>;
  placeDemoBet: (amount: number) => Promise<{ success: boolean; error?: string }>;
  refetch: () => Promise<void>;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export function DemoProvider({ children }: { children: ReactNode }) {
  const demo = useDemo();

  return (
    <DemoContext.Provider value={demo}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemoContext() {
  const context = useContext(DemoContext);
  if (context === undefined) {
    throw new Error('useDemoContext must be used within a DemoProvider');
  }
  return context;
}
