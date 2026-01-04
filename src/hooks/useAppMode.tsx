import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

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

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  const setMode = (newMode: AppMode) => {
    setModeState(newMode);
    
    // Navigate to the appropriate root when switching modes
    if (newMode === 'drop') {
      navigate('/drop');
    } else {
      navigate('/cliente');
    }
  };

  const toggleMode = () => {
    setMode(mode === 'cliente' ? 'drop' : 'cliente');
  };

  // Sync mode with current route
  useEffect(() => {
    if (location.pathname.startsWith('/drop')) {
      setModeState('drop');
    } else if (location.pathname.startsWith('/cliente')) {
      setModeState('cliente');
    }
  }, [location.pathname]);

  return (
    <AppModeContext.Provider 
      value={{ 
        mode, 
        setMode, 
        toggleMode, 
        isDropMode: mode === 'drop' 
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
