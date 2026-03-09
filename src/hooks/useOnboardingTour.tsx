import { createContext, useContext, useState, ReactNode } from "react";

interface OnboardingTourContextType {
  shouldShowTour: boolean;
  startTour: () => void;
  endTour: () => void;
  forceRestart: boolean;
  triggerRestart: () => void;
}

const OnboardingTourContext = createContext<OnboardingTourContextType | null>(null);

export const OnboardingTourProvider = ({ children }: { children: ReactNode }) => {
  const [shouldShowTour, setShouldShowTour] = useState(false);
  const [forceRestart, setForceRestart] = useState(false);

  const startTour = () => setShouldShowTour(true);
  const endTour = () => {
    setShouldShowTour(false);
    setForceRestart(false);
  };
  const triggerRestart = () => {
    setForceRestart(true);
    setShouldShowTour(true);
  };

  return (
    <OnboardingTourContext.Provider
      value={{ shouldShowTour, startTour, endTour, forceRestart, triggerRestart }}
    >
      {children}
    </OnboardingTourContext.Provider>
  );
};

export const useOnboardingTour = () => {
  const ctx = useContext(OnboardingTourContext);
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
