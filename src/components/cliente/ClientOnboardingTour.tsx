import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ChevronLeft,
  Compass,
  FileText,
  Handshake,
  MessageCircle,
  Package,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { useClientOnboardingTour } from "@/hooks/useClientOnboardingTour";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface TourStep {
  type: "modal" | "spotlight";
  title: string;
  text: string;
  icon: typeof Sparkles;
  targetSelector?: string;
  route?: string;
}

const STEPS: TourStep[] = [
  {
    type: "modal",
    title: "Bem-vindo à Nellor! ♊",
    text: "A Nellor conecta você diretamente com fornecedores reais para comprar produtos em quantidade. Vamos te mostrar como funciona em menos de 2 minutos.",
    icon: Sparkles,
  },
  {
    type: "spotlight",
    title: "Busca e categorias",
    text: "Use a busca para encontrar produtos e fornecedores com rapidez. Você também pode explorar por categorias e descobrir novas oportunidades de compra.",
    icon: Search,
    targetSelector: "[data-tour='home-search-bar']",
    route: "/cliente",
  },
  {
    type: "spotlight",
    title: "Cards de produto",
    text: "Cada card mostra o produto, o preço de referência e o tipo de venda. Toque em um item para abrir os detalhes e ver mais informações do fornecedor.",
    icon: Package,
    targetSelector: "[data-tour='product-card']",
    route: "/cliente",
  },
  {
    type: "spotlight",
    title: "Negociar com fornecedor",
    text: "Na Nellor você negocia direto com o fornecedor. É aqui que você inicia a conversa para combinar quantidade, preço e entrega.",
    icon: Handshake,
    targetSelector: "[data-tour='negotiate-btn']",
  },
  {
    type: "spotlight",
    title: "Aba de chat",
    text: "Todas as suas conversas ficam aqui. O chat é o coração da Nellor: é onde você tira dúvidas, negocia e acompanha tudo em um só lugar.",
    icon: MessageCircle,
    targetSelector: "[data-tour='chat-nav']",
  },
  {
    type: "spotlight",
    title: "Registrar negociação",
    text: "Depois de alinhar os detalhes com o fornecedor, use este botão para registrar o acordo e formalizar a negociação dentro da plataforma.",
    icon: FileText,
    targetSelector: "[data-tour='register-negotiation']",
    route: "/cliente/chat",
  },
  {
    type: "modal",
    title: "Pronto para começar! ♊",
    text: "Agora você já sabe como buscar, negociar e registrar acordos. Se bater qualquer dúvida, toque no botão ? a qualquer momento.",
    icon: Compass,
  },
];

export const ClientOnboardingTour = () => {
  const { shouldShowTour, endTour } = useClientOnboardingTour();
  const { user } = useSupabaseAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);
  const [productRoute, setProductRoute] = useState<string | null>(null);
  const [tutorialSupplierId, setTutorialSupplierId] = useState<string | null>(null);
  const retryTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const currentStep = STEPS[step];
  const progress = ((step + 1) / STEPS.length) * 100;
  const isFirstStep = step === 0;
  const isLastStep = step === STEPS.length - 1;
  const isMobile = typeof window !== "undefined" ? window.innerWidth < 768 : true;

  const resolvedRoute = useMemo(() => {
    if (currentStep.route) return currentStep.route;
    if (step === 3 || step === 4) return productRoute ?? undefined;
    if (step === 5) return "/cliente/chat";
    return undefined;
  }, [currentStep.route, step, productRoute]);

  const clearRetryTimers = useCallback(() => {
    retryTimers.current.forEach((timer) => clearTimeout(timer));
    retryTimers.current = [];
  }, []);

  const findTarget = useCallback(() => {
    if (!currentStep?.targetSelector) return null;

    const matches = Array.from(document.querySelectorAll(currentStep.targetSelector)) as HTMLElement[];
    if (matches.length === 0) return null;

    const visibleMatches = matches.filter((element) => {
      const rect = element.getBoundingClientRect();
      const styles = window.getComputedStyle(element);
      return styles.display !== "none" && styles.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    });

    return visibleMatches[0] ?? null;
  }, [currentStep]);

  useEffect(() => {
    if (!shouldShowTour || !currentStep?.route && !(step === 3 || step === 4 || step === 5)) return;
    if (!resolvedRoute || location.pathname === resolvedRoute) return;

    if (step === 5 && tutorialSupplierId) {
      navigate(resolvedRoute, { state: { supplierId: tutorialSupplierId, tutorialMode: true } });
      return;
    }

    navigate(resolvedRoute);
  }, [shouldShowTour, currentStep, resolvedRoute, location.pathname, navigate, step, tutorialSupplierId]);

  useEffect(() => {
    clearRetryTimers();

    if (!shouldShowTour || currentStep?.type !== "spotlight") {
      setSpotlightRect(null);
      return;
    }

    setSpotlightRect(null);

    const measureTarget = (attempt = 0) => {
      const element = findTarget();

      if (element) {
        element.scrollIntoView({ block: "center", inline: "nearest", behavior: attempt === 0 ? "smooth" : "auto" });

        const finalTimer = setTimeout(() => {
          const rect = element.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            setSpotlightRect(rect);
          }
        }, 220);

        retryTimers.current.push(finalTimer);
        return;
      }

      if (attempt < 8) {
        const retryTimer = setTimeout(() => measureTarget(attempt + 1), 350);
        retryTimers.current.push(retryTimer);
      }
    };

    const initialTimer = setTimeout(
      () => measureTarget(0),
      resolvedRoute && location.pathname !== resolvedRoute ? 450 : 120,
    );
    retryTimers.current.push(initialTimer);

    return clearRetryTimers;
  }, [shouldShowTour, currentStep, findTarget, location.pathname, resolvedRoute, clearRetryTimers]);

  useEffect(() => {
    if (!shouldShowTour || currentStep?.type !== "spotlight" || !spotlightRect) return;

    const updateRect = () => {
      const element = findTarget();
      if (!element) return;
      const rect = element.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setSpotlightRect(rect);
      }
    };

    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);

    return () => {
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [shouldShowTour, currentStep, spotlightRect, findTarget]);

  const finishTour = useCallback(() => {
    if (user) {
      void supabase.from("profiles").update({ client_onboarding_completed: true } as never).eq("id", user.id);
    }
    clearRetryTimers();
    setSpotlightRect(null);
    setProductRoute(null);
    setTutorialSupplierId(null);
    setStep(0);
    endTour();
    navigate("/cliente");
  }, [user, endTour, navigate, clearRetryTimers]);

  const handleSkip = useCallback(() => {
    finishTour();
  }, [finishTour]);

  const handlePrev = useCallback(() => {
    if (step === 0) return;
    clearRetryTimers();
    setSpotlightRect(null);
    setStep((prev) => Math.max(0, prev - 1));
  }, [step, clearRetryTimers]);

  const handleNext = useCallback(() => {
    if (step === 2) {
      const cardLink = findTarget() as HTMLAnchorElement | null;
      const href = cardLink?.getAttribute("href");
      if (href) setProductRoute(href);
    }

    if (step === 3) {
      const negotiateButton = findTarget();
      const supplierId = negotiateButton?.getAttribute("data-tour-supplier-id");
      if (supplierId) setTutorialSupplierId(supplierId);
    }

    if (isLastStep) {
      finishTour();
      return;
    }

    clearRetryTimers();
    setSpotlightRect(null);
    setStep((prev) => prev + 1);
  }, [step, isLastStep, finishTour, findTarget, clearRetryTimers]);

  if (!shouldShowTour) return null;

  const showSpotlight = currentStep.type === "spotlight" && !!spotlightRect;
  const StepIcon = currentStep.icon;

  const desktopTooltipStyle = showSpotlight && spotlightRect && !isMobile
    ? {
        top:
          spotlightRect.bottom + 20 + 240 < window.innerHeight
            ? spotlightRect.bottom + 20
            : Math.max(24, spotlightRect.top - 240),
        left: Math.max(24, Math.min(spotlightRect.left, window.innerWidth - 392)),
      }
    : undefined;

  return (
    <div className="fixed inset-0 z-[9999]">
      {showSpotlight ? (
        <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <mask id="client-tour-mask">
              <rect width="100%" height="100%" fill="white" />
              {spotlightRect && (
                <rect
                  x={spotlightRect.left - 10}
                  y={spotlightRect.top - 10}
                  width={spotlightRect.width + 20}
                  height={spotlightRect.height + 20}
                  rx={18}
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="rgba(15, 9, 26, 0.78)" mask="url(#client-tour-mask)" />
        </svg>
      ) : (
        <div className="absolute inset-0 bg-foreground/75 backdrop-blur-[2px]" />
      )}

      {showSpotlight && spotlightRect && (
        <div
          className="pointer-events-none absolute rounded-[22px] border-2 border-primary bg-primary/5 shadow-2xl"
          style={{
            left: spotlightRect.left - 10,
            top: spotlightRect.top - 10,
            width: spotlightRect.width + 20,
            height: spotlightRect.height + 20,
          }}
        />
      )}

      <div
        className={showSpotlight && !isMobile ? "absolute w-[368px]" : "absolute inset-x-4 bottom-24 md:bottom-8 md:left-auto md:right-8 md:w-[388px]"}
        style={showSpotlight && !isMobile ? desktopTooltipStyle : undefined}
      >
        <div className="overflow-hidden rounded-[28px] border border-border/60 bg-card/95 shadow-2xl backdrop-blur-xl">
          <div className="h-1.5 w-full bg-primary/15">
            <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>

          <div className="p-5 md:p-6">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                  <StepIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/75">Tutorial Nellor</p>
                  <h2 className="mt-1 text-lg font-bold leading-tight text-foreground">{currentStep.title}</h2>
                </div>
              </div>

              <button
                onClick={handleSkip}
                className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Fechar tutorial"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-sm leading-6 text-muted-foreground">{currentStep.text}</p>

            {!showSpotlight && currentStep.type === "spotlight" && (
              <div className="mt-4 rounded-2xl border border-dashed border-border bg-muted/35 px-3 py-2.5 text-xs leading-5 text-muted-foreground">
                Se esse elemento não estiver visível nesta tela, tudo bem — você ainda pode continuar o tutorial sem travar.
              </div>
            )}

            <div className="mt-5 flex items-center justify-between text-xs text-muted-foreground">
              <span>Passo {step + 1} de {STEPS.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>

            <div className="mt-5 flex items-center gap-2 md:gap-3">
              {!isFirstStep ? (
                <Button variant="outline" onClick={handlePrev} className="shrink-0 gap-1.5 rounded-full px-4">
                  <ChevronLeft className="h-4 w-4" />
                  Voltar
                </Button>
              ) : (
                <Button variant="ghost" onClick={handleSkip} className="shrink-0 rounded-full px-4">
                  Pular
                </Button>
              )}

              <Button onClick={handleNext} className="flex-1 rounded-full">
                {isLastStep ? "Explorar a Nellor" : isFirstStep ? "Começar" : "Próximo"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
