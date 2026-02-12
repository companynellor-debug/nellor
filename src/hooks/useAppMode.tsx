import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

export type AppMode = 'cliente' | 'drop';

interface AppModeContextType {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  toggleMode: () => void;
  isDropMode: boolean;
}

const AppModeContext = createContext<AppModeContextType | undefined>(undefined);

const STORAGE_KEY = 'nellor-app-mode';

export function AppModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<AppMode>(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return (stored === 'drop' ? 'drop' : 'cliente') as AppMode;
  });

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  const setMode = useCallback((newMode: AppMode) => {
    setModeState(newMode);
  }, []);

  const toggleMode = useCallback(() => {
    setModeState((prev) => (prev === 'cliente' ? 'drop' : 'cliente'));
  }, []);

  // Sync mode with current URL path
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/drop')) {
      setModeState('drop');
    } else if (path.startsWith('/cliente')) {
      setModeState('cliente');
    }
  }, []);

  return (
    <AppModeContext.Provider
      value={{
        mode,
        setMode,
        toggleMode,
        isDropMode: mode === 'drop',
      }}
    >
      {children}
    </AppModeContext.Provider>
  );
}

export function useAppMode() {
  const context = useContext(AppModeContext);
  if (context === undefined) {
    throw new Error('useAppMode must be used within an AppModeProvider');
  }
  return context;
}
