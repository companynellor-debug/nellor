import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useClientOnboardingTour } from "@/hooks/useClientOnboardingTour";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface TourStep {
  type: "modal" | "spotlight";
  title?: string;
  text: string;
  targetSelector?: string;
  route?: string;
}

const STEPS: TourStep[] = [
  {
    type: "modal",
    title: "Bem-vindo à Nellor! 🎉",
    text: "A Nellor conecta você diretamente com fornecedores reais para comprar produtos em quantidade. Vamos te mostrar como funciona em menos de 2 minutos.",
  },
  {
    type: "spotlight",
    targetSelector: "#home-search-bar",
    route: "/cliente",
    text: "Use a busca ou navegue pelas categorias para encontrar fornecedores e produtos. Você pode filtrar por tipo de produto, região e fornecedores verificados.",
  },
  {
    type: "spotlight",
    targetSelector: "[data-tour='product-card']",
    route: "/cliente",
    text: "Cada card mostra o produto, o preço de referência por quantidade e o badge do tipo de venda — unidade, caixa fechada, fardo ou kit. Clique para ver mais detalhes.",
  },
  {
    type: "spotlight",
    targetSelector: "[data-tour='negotiate-btn']",
    text: "Na Nellor você não compra direto — você negocia. Clique aqui para abrir o chat com o fornecedor e combinar quantidade, preço e entrega.",
  },
  {
    type: "spotlight",
    targetSelector: "[data-tour='chat-nav']",
    text: "Todas as suas conversas ficam aqui. O chat é o coração da Nellor — é onde você negocia, tira dúvidas e fecha acordos com os fornecedores.",
  },
  {
    type: "spotlight",
    targetSelector: "[data-tour='register-negotiation']",
    text: "Quando chegar a um acordo com o fornecedor, registre a negociação aqui. Isso gera um PDF oficial do acordo que protege as duas partes.",
  },
  {
    type: "spotlight",
    targetSelector: "[data-tour='cotacoes-menu']",
    route: "/cliente/perfil",
    text: "Publique cotações detalhando o que precisa e receba propostas de vários fornecedores. É a forma mais rápida de encontrar o melhor preço.",
  },
  {
    type: "spotlight",
    targetSelector: "[data-tour='comparar-menu']",
    route: "/cliente/perfil",
    text: "Compare até 3 fornecedores lado a lado — preço, avaliação e localização — para tomar a melhor decisão de compra.",
  },
  {
    type: "modal",
    title: "Pronto para começar! 🎉",
    text: "Agora você sabe como usar a Nellor. Explore os fornecedores, negocie pelo chat e feche bons acordos. Se tiver dúvidas, clique no botão ? a qualquer momento.",
  },
];

export const ClientOnboardingTour = () => {
  const { shouldShowTour, endTour } = useClientOnboardingTour();
  const { user } = useSupabaseAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null);
  const waitingForRoute = useRef(false);

  const currentStep = STEPS[step];

  const findTarget = useCallback(() => {
    if (!currentStep?.targetSelector) return null;
    return document.querySelector(currentStep.targetSelector) as HTMLElement | null;
  }, [currentStep]);

  // Measure spotlight target
  useEffect(() => {
    if (!shouldShowTour || currentStep?.type !== "spotlight") {
      setSpotlightRect(null);
      setTooltipPos(null);
      return;
    }

    const measure = () => {
      const el = findTarget();
      if (el) {
        const rect = el.getBoundingClientRect();
        setSpotlightRect(rect);
        const tooltipTop = rect.bottom + 16;
        const tooltipLeft = Math.max(16, Math.min(rect.left, window.innerWidth - 340));
        setTooltipPos({ top: tooltipTop > window.innerHeight - 200 ? rect.top - 180 : tooltipTop, left: tooltipLeft });
        waitingForRoute.current = false;
      } else {
        setSpotlightRect(null);
        setTooltipPos(null);
      }
    };

    // Wait a tick for route transitions
    const t = setTimeout(measure, 400);
    return () => clearTimeout(t);
  }, [shouldShowTour, step, currentStep, findTarget, location.pathname]);

  // Navigate to step route if needed
  useEffect(() => {
    if (!shouldShowTour || !currentStep?.route) return;
    if (location.pathname !== currentStep.route) {
      waitingForRoute.current = true;
      navigate(currentStep.route);
    }
  }, [shouldShowTour, step, currentStep, location.pathname, navigate]);

  const handleNext = useCallback(() => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      // Complete
      if (user) {
        supabase.from("profiles").update({ client_onboarding_completed: true } as any).eq("id", user.id).then();
      }
      endTour();
      setStep(0);
      navigate("/cliente");
    }
  }, [step, user, endTour, navigate]);

  const handleSkip = useCallback(() => {
    if (user) {
      supabase.from("profiles").update({ client_onboarding_completed: true } as any).eq("id", user.id).then();
    }
    endTour();
    setStep(0);
  }, [user, endTour]);

  if (!shouldShowTour) return null;

  const isModal = currentStep?.type === "modal";
  const isLastStep = step === STEPS.length - 1;
  const isFirstStep = step === 0;
  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="fixed inset-0 z-[9999]">
      {/* Overlay */}
      {isModal ? (
        <div className="absolute inset-0 bg-black/70" />
      ) : (
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <mask id="tour-mask">
              <rect width="100%" height="100%" fill="white" />
              {spotlightRect && (
                <rect
                  x={spotlightRect.left - 8}
                  y={spotlightRect.top - 8}
                  width={spotlightRect.width + 16}
                  height={spotlightRect.height + 16}
                  rx={12}
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="rgba(0,0,0,0.7)" mask="url(#tour-mask)" />
        </svg>
      )}

      {/* Spotlight ring */}
      {!isModal && spotlightRect && (
        <div
          className="absolute border-2 border-primary rounded-xl pointer-events-none animate-pulse"
          style={{
            left: spotlightRect.left - 8,
            top: spotlightRect.top - 8,
            width: spotlightRect.width + 16,
            height: spotlightRect.height + 16,
          }}
        />
      )}

      {/* Tooltip / Modal */}
      {isModal ? (
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <div className="bg-card text-card-foreground rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4 relative">
            <button onClick={handleSkip} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
            {currentStep.title && <h2 className="text-xl font-bold">{currentStep.title}</h2>}
            <p className="text-sm text-muted-foreground leading-relaxed">{currentStep.text}</p>
            <div className="w-full bg-muted rounded-full h-1.5">
              <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-muted-foreground text-center">Passo {step + 1} de {STEPS.length}</p>
            <div className="flex gap-3">
              {isFirstStep && (
                <Button variant="ghost" onClick={handleSkip} className="flex-1">Pular</Button>
              )}
              <Button onClick={handleNext} className="flex-1">
                {isLastStep ? "Explorar a Nellor" : isFirstStep ? "Começar" : "Próximo"}
              </Button>
            </div>
          </div>
        </div>
      ) : tooltipPos ? (
        <div
          className="absolute bg-card text-card-foreground rounded-xl p-4 max-w-xs shadow-2xl space-y-3 border"
          style={{ top: tooltipPos.top, left: tooltipPos.left }}
        >
          <p className="text-sm leading-relaxed">{currentStep.text}</p>
          <div className="w-full bg-muted rounded-full h-1.5">
            <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-muted-foreground">Passo {step + 1} de {STEPS.length}</p>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleSkip}>Pular</Button>
            <Button size="sm" onClick={handleNext} className="flex-1">
              {step === STEPS.length - 2 ? "Próximo" : "Próximo"}
            </Button>
          </div>
        </div>
      ) : (
        // Waiting for element to appear
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-card text-card-foreground rounded-xl p-4 shadow-2xl space-y-3 border max-w-xs">
            <p className="text-sm leading-relaxed">{currentStep.text}</p>
            <div className="w-full bg-muted rounded-full h-1.5">
              <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-muted-foreground">Passo {step + 1} de {STEPS.length}</p>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handleSkip}>Pular</Button>
              <Button size="sm" onClick={handleNext} className="flex-1">Próximo</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
