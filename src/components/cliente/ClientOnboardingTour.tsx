import { useState, useEffect, useCallback, useRef } from "react";
import {
  ChevronLeft,
  Compass,
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
}

const STEPS: TourStep[] = [
  {
    type: "modal",
    title: "Bem-vindo à Nellor! ✨",
    text: "A Nellor conecta você diretamente com fornecedores reais para comprar produtos em quantidade. Vamos te mostrar como funciona em menos de 1 minuto.",
    icon: Sparkles,
  },
  {
    type: "spotlight",
    title: "Busca e categorias",
    text: "Use a busca para encontrar produtos e fornecedores. Você também pode explorar por categorias.",
    icon: Search,
    targetSelector: "[data-tour='home-search-bar']",
  },
  {
    type: "spotlight",
    title: "Cards de produto",
    text: "Cada card mostra o produto, preço e tipo de venda. Toque em um para ver detalhes e negociar com o fornecedor.",
    icon: Package,
    targetSelector: "[data-tour='product-card']",
  },
  {
    type: "spotlight",
    title: "Aba de chat",
    text: "Todas as suas conversas ficam aqui. É onde você negocia, tira dúvidas e acompanha pedidos.",
    icon: MessageCircle,
    targetSelector: "[data-tour='chat-nav']",
  },
  {
    type: "modal",
    title: "Pronto para começar! 🚀",
    text: "Agora você já sabe como buscar e negociar. Se tiver dúvidas, toque no botão de ajuda a qualquer momento.",
    icon: Compass,
  },
];

export const ClientOnboardingTour = () => {
  const { shouldShowTour, endTour } = useClientOnboardingTour();
  const { user } = useSupabaseAuth();
  const [step, setStep] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const retryTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const animKey = useRef(0);

  const currentStep = STEPS[step];
  const progress = ((step + 1) / STEPS.length) * 100;
  const isFirstStep = step === 0;
  const isLastStep = step === STEPS.length - 1;
  const isMobile = typeof window !== "undefined" ? window.innerWidth < 768 : true;

  const clearTimers = useCallback(() => {
    retryTimers.current.forEach(clearTimeout);
    retryTimers.current = [];
  }, []);

  const findTarget = useCallback(
    (selector?: string) => {
      const sel = selector ?? currentStep?.targetSelector;
      if (!sel) return null;
      const matches = document.querySelectorAll(sel);
      for (let i = 0; i < matches.length; i++) {
        const el = matches[i] as HTMLElement;
        const rect = el.getBoundingClientRect();
        const styles = getComputedStyle(el);
        if (styles.display !== "none" && styles.visibility !== "hidden" && rect.width > 0 && rect.height > 0) {
          return el;
        }
      }
      return null;
    },
    [currentStep],
  );

  // Measure spotlight target
  useEffect(() => {
    clearTimers();
    if (!shouldShowTour || currentStep?.type !== "spotlight") {
      setSpotlightRect(null);
      return;
    }
    setSpotlightRect(null);

    const measure = (attempt = 0) => {
      const el = findTarget();
      if (el) {
        el.scrollIntoView({ block: "center", behavior: "smooth" });
        const t = setTimeout(() => {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0) setSpotlightRect(rect);
        }, 200);
        retryTimers.current.push(t);
        return;
      }
      if (attempt < 6) {
        const t = setTimeout(() => measure(attempt + 1), 400);
        retryTimers.current.push(t);
      }
    };

    const t = setTimeout(() => measure(), 150);
    retryTimers.current.push(t);
    return clearTimers;
  }, [shouldShowTour, step, findTarget, clearTimers, currentStep]);

  // Keep spotlight in sync with scroll/resize
  useEffect(() => {
    if (!shouldShowTour || !spotlightRect || currentStep?.type !== "spotlight") return;
    const update = () => {
      const el = findTarget();
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.width > 0) setSpotlightRect(rect);
    };
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [shouldShowTour, spotlightRect, currentStep, findTarget]);

  const finishTour = useCallback(() => {
    if (user) {
      void supabase.from("profiles").update({ client_onboarding_completed: true } as never).eq("id", user.id);
    }
    sessionStorage.setItem("nellor_tour_done", "1");
    clearTimers();
    setSpotlightRect(null);
    setStep(0);
    endTour();
  }, [user, endTour, clearTimers]);

  const changeStep = useCallback(
    (next: number) => {
      if (isAnimating) return;
      setIsAnimating(true);
      clearTimers();
      setSpotlightRect(null);
      animKey.current += 1;
      setStep(next);
      setTimeout(() => setIsAnimating(false), 300);
    },
    [isAnimating, clearTimers],
  );

  const handleNext = useCallback(() => {
    if (isLastStep) {
      finishTour();
      return;
    }
    changeStep(step + 1);
  }, [isLastStep, finishTour, changeStep, step]);

  const handlePrev = useCallback(() => {
    if (step > 0) changeStep(step - 1);
  }, [step, changeStep]);

  if (!shouldShowTour) return null;

  const showSpotlight = currentStep.type === "spotlight" && !!spotlightRect;
  const StepIcon = currentStep.icon;

  const desktopTooltipStyle =
    showSpotlight && spotlightRect && !isMobile
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
      {/* Overlay */}
      {showSpotlight ? (
        <svg className="absolute inset-0 h-full w-full transition-opacity duration-300" xmlns="http://www.w3.org/2000/svg">
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
                  style={{ transition: "all 200ms ease-out" }}
                />
              )}
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="rgba(15, 9, 26, 0.78)" mask="url(#client-tour-mask)" />
        </svg>
      ) : (
        <div className="absolute inset-0 bg-foreground/75 backdrop-blur-[2px] transition-opacity duration-300" />
      )}

      {/* Spotlight ring */}
      {showSpotlight && spotlightRect && (
        <div
          className="pointer-events-none absolute rounded-[22px] border-2 border-primary bg-primary/5 shadow-2xl"
          style={{
            left: spotlightRect.left - 10,
            top: spotlightRect.top - 10,
            width: spotlightRect.width + 20,
            height: spotlightRect.height + 20,
            transition: "all 200ms ease-out",
          }}
        />
      )}

      {/* Tooltip card */}
      <div
        key={animKey.current}
        className={`animate-tour-step-enter ${
          showSpotlight && !isMobile
            ? "absolute w-[368px]"
            : "absolute inset-x-4 bottom-24 md:bottom-8 md:left-auto md:right-8 md:w-[388px]"
        }`}
        style={showSpotlight && !isMobile ? desktopTooltipStyle : undefined}
      >
        <div className="overflow-hidden rounded-[28px] border border-border/60 bg-card/95 shadow-2xl backdrop-blur-xl">
          {/* Progress bar */}
          <div className="h-1.5 w-full bg-primary/15">
            <div
              className="h-full bg-primary"
              style={{ width: `${progress}%`, transition: "width 500ms ease-out" }}
            />
          </div>

          <div className="p-5 md:p-6">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                  <StepIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/75">
                    Tutorial Nellor
                  </p>
                  <h2 className="mt-1 text-lg font-bold leading-tight text-foreground">{currentStep.title}</h2>
                </div>
              </div>

              <button
                onClick={finishTour}
                className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Fechar tutorial"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-sm leading-6 text-muted-foreground">{currentStep.text}</p>

            {/* Fallback notice when spotlight target not found */}
            {!showSpotlight && currentStep.type === "spotlight" && (
              <div className="mt-4 rounded-2xl border border-dashed border-border bg-muted/35 px-3 py-2.5 text-xs leading-5 text-muted-foreground">
                Este elemento ainda não está visível — continue o tutorial normalmente.
              </div>
            )}

            <div className="mt-5 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Passo {step + 1} de {STEPS.length}
              </span>
              <span>{Math.round(progress)}%</span>
            </div>

            <div className="mt-5 flex items-center gap-2 md:gap-3">
              {!isFirstStep ? (
                <Button
                  variant="outline"
                  onClick={handlePrev}
                  disabled={isAnimating}
                  className="shrink-0 gap-1.5 rounded-full px-4"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Voltar
                </Button>
              ) : (
                <Button variant="ghost" onClick={finishTour} className="shrink-0 rounded-full px-4">
                  Pular
                </Button>
              )}

              <Button onClick={handleNext} disabled={isAnimating} className="flex-1 rounded-full">
                {isLastStep ? "Explorar a Nellor" : isFirstStep ? "Começar" : "Próximo"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
