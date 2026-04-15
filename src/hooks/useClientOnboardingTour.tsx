import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface ClientOnboardingTourContextType {
  shouldShowTour: boolean;
  startTour: () => void;
  endTour: () => void;
  forceRestart: boolean;
  triggerRestart: () => void;
}

const ClientOnboardingTourContext = createContext<ClientOnboardingTourContextType | null>(null);

export const ClientOnboardingTourProvider = ({ children }: { children: ReactNode }) => {
  const [shouldShowTour, setShouldShowTour] = useState(false);
  const [forceRestart, setForceRestart] = useState(false);

  const startTour = useCallback(() => setShouldShowTour(true), []);
  const endTour = useCallback(() => {
    setShouldShowTour(false);
    setForceRestart(false);
  }, []);
  const triggerRestart = useCallback(() => {
    setForceRestart(true);
    setShouldShowTour(true);
  }, []);

  return (
    <ClientOnboardingTourContext.Provider value={{ shouldShowTour, startTour, endTour, forceRestart, triggerRestart }}>
      {children}
    </ClientOnboardingTourContext.Provider>
  );
};

export const useClientOnboardingTour = () => {
  const ctx = useContext(ClientOnboardingTourContext);
  if (!ctx) {
    return {
      shouldShowTour: false,
      startTour: () => {},
      endTour: () => {},
      forceRestart: false,
      triggerRestart: () => {},
    };
  }
  return ctx;
};
