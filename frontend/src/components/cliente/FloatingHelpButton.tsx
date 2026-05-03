import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useClientOnboardingTour } from "@/hooks/useClientOnboardingTour";
import { HelpCircle, BookOpen, MessageCircle, GraduationCap } from "lucide-react";

const WHATSAPP_URL = "https://wa.me/5500000000000";

export const FloatingHelpButton = () => {
  const [open, setOpen] = useState(false);
  const [shouldPulse, setShouldPulse] = useState(false);
  const navigate = useNavigate();
  const { triggerRestart, shouldShowTour } = useClientOnboardingTour();

  useEffect(() => {
    const visits = parseInt(localStorage.getItem("nellor_help_visits") || "0", 10);
    if (visits < 3) {
      setShouldPulse(true);
      localStorage.setItem("nellor_help_visits", String(visits + 1));
    }
  }, []);

  // Hide when tour is active
  if (shouldShowTour) return null;

  return (
    <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50">
      {/* Menu */}
      {open && (
        <div className="absolute bottom-14 right-0 bg-card border rounded-xl shadow-xl p-2 space-y-1 min-w-[200px] animate-in fade-in slide-in-from-bottom-2 duration-200">
          <button
            onClick={() => { setOpen(false); triggerRestart(); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors text-sm"
          >
            <GraduationCap className="h-4 w-4 text-primary" />
            Ver Tutorial
          </button>
          <button
            onClick={() => { setOpen(false); navigate("/cliente/ajuda"); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors text-sm"
          >
            <BookOpen className="h-4 w-4 text-primary" />
            Perguntas Frequentes
          </button>
          <button
            onClick={() => { setOpen(false); window.open(WHATSAPP_URL, "_blank"); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors text-sm"
          >
            <MessageCircle className="h-4 w-4 text-primary" />
            Falar com Suporte
          </button>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setOpen(!open)}
        className={`w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 transition-transform ${shouldPulse ? "animate-pulse" : ""}`}
      >
        <HelpCircle className="h-6 w-6" />
      </button>
    </div>
  );
};
