import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { Sparkles, Store, Package, Palette, DollarSign, Trophy, X } from "lucide-react";

interface TourStep {
  id: number;
  title: string;
  description: string;
  selector?: string;
  route?: string;
  isModal?: boolean;
  icon?: any;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 1,
    title: "Bem-vindo à Nellor! 🎉",
    description: "Vamos te guiar pelos primeiros passos para deixar sua loja pronta para receber negociações. Isso leva menos de 5 minutos.",
    isModal: true,
    icon: Sparkles,
  },
  {
    id: 2,
    title: "Seu Dashboard",
    description: "Aqui é o seu Dashboard. Você acompanha suas negociações, conversas e desempenho em tempo real.",
    selector: "[data-tour='stats-cards']",
    route: "/fornecedor/dashboard",
  },
  {
    id: 3,
    title: "Personalize sua Loja",
    description: "Comece personalizando sua loja. Adicione uma foto de perfil e um banner atraente para conquistar mais clientes.",
    selector: "[data-tour='store-images']",
    route: "/fornecedor/editar-loja",
    icon: Store,
  },
  {
    id: 4,
    title: "Adicione seu Primeiro Produto",
    description: "Agora vamos cadastrar seu primeiro produto. Clique no botão 'Adicionar Produto' para começar.",
    selector: "[data-tour='add-product']",
    route: "/fornecedor/produtos",
    icon: Package,
  },
  {
    id: 5,
    title: "Variações de Produto",
    description: "Produtos com variações de cor e tamanho aparecem muito mais nas buscas. Não esqueça de adicionar fotos para cada cor!",
    selector: "[data-tour='variations-section']",
    icon: Palette,
  },
  {
    id: 6,
    title: "Você está pronto para negociar! 🚀",
    description: "Sua loja está configurada. Agora é só aguardar as primeiras negociações. Quanto mais completo seu perfil e produtos, maior sua visibilidade no marketplace.",
    isModal: true,
    icon: Trophy,
  },
];

interface OnboardingTourProps {
  onComplete?: () => void;
  forceStart?: boolean;
}

const OnboardingTour = ({ onComplete, forceStart = false }: OnboardingTourProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSupabaseAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isActive, setIsActive] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const step = TOUR_STEPS.find((s) => s.id === currentStep);
  const progress = (currentStep / TOUR_STEPS.length) * 100;

  // Check if tour should start
  useEffect(() => {
    if (forceStart) {
      setIsActive(true);
      setCurrentStep(1);
      return;
    }

    const checkTourStatus = () => {
      if (!user) return;

      // Inicia automaticamente apenas após concluir o onboarding inicial
      const showTour = localStorage.getItem(`nellor_show_tour_${user.id}`);
      if (showTour === 'true') {
        localStorage.removeItem(`nellor_show_tour_${user.id}`);
        setTimeout(() => setIsActive(true), 1000);
      }
    };

    checkTourStatus();
  }, [user, forceStart]);

  // Navigate to the correct route for each step
  useEffect(() => {
    if (!isActive || !step?.route) return;
    
    if (location.pathname !== step.route) {
      navigate(step.route);
    }
  }, [isActive, step, location.pathname, navigate]);

  // Find and highlight the target element
  useEffect(() => {
    if (!isActive || !step?.selector || step.isModal) {
      setTargetRect(null);
      return;
    }

    const findElement = () => {
      const el = document.querySelector(step.selector!);
      if (el) {
        const rect = el.getBoundingClientRect();
        setTargetRect(rect);
      } else {
        setTargetRect(null);
      }
    };

    const timer = setTimeout(findElement, 500);
    window.addEventListener("scroll", findElement);
    window.addEventListener("resize", findElement);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", findElement);
      window.removeEventListener("resize", findElement);
    };
  }, [isActive, step, location.pathname]);

  const completeTour = useCallback(async () => {
    if (user) {
      await (supabase
        .from("profiles")
        .update({ tour_completed: true } as any)
        .eq("id", user.id) as any);
    }
    setIsActive(false);
    onComplete?.();
    navigate("/fornecedor/dashboard");
  }, [user, onComplete, navigate]);

  const skipTour = useCallback(async () => {
    await completeTour();
  }, [completeTour]);

  const nextStep = useCallback(() => {
    if (currentStep >= TOUR_STEPS.length) {
      completeTour();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep, completeTour]);

  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  if (!isActive || !step) return null;

  // Render modal step (no spotlight)
  if (step.isModal) {
    const Icon = step.icon;
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
        <div className="relative bg-card border border-border rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-8 text-center">
            {Icon && (
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                <Icon className="w-10 h-10 text-primary" />
              </div>
            )}
            <h2 className="text-2xl font-bold text-foreground">{step.title}</h2>
          </div>
          <div className="p-6 text-center">
            <p className="text-muted-foreground mb-6">{step.description}</p>
            <div className="mb-6">
              <div className="flex justify-between text-xs text-muted-foreground mb-2">
                <span>Passo {currentStep} de {TOUR_STEPS.length}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            <div className="flex gap-3 justify-center">
              {currentStep === 1 ? (
                <>
                  <Button variant="outline" onClick={skipTour}>Pular Tour</Button>
                  <Button onClick={nextStep} className="gap-2">
                    <Sparkles className="w-4 h-4" />Começar
                  </Button>
                </>
              ) : (
                <Button onClick={completeTour} className="gap-2">
                  <Trophy className="w-4 h-4" />Ir para o Dashboard
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render spotlight step
  const tooltipStyle: React.CSSProperties = targetRect
    ? {
        position: "fixed",
        top: targetRect.bottom + 16,
        left: Math.max(16, Math.min(targetRect.left, window.innerWidth - 400)),
        zIndex: 10000,
      }
    : {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 10000,
      };

  return (
    <div className="fixed inset-0 z-[9999]">
      {/* Dark overlay with spotlight hole */}
      <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: "none" }}>
        <defs>
          <mask id="spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={targetRect.left - 8}
                y={targetRect.top - 8}
                width={targetRect.width + 16}
                height={targetRect.height + 16}
                rx="12"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0" y="0" width="100%" height="100%"
          fill="rgba(0,0,0,0.75)"
          mask="url(#spotlight-mask)"
          style={{ pointerEvents: "auto" }}
          onClick={(e) => e.stopPropagation()}
        />
      </svg>

      {/* Highlight border around target */}
      {targetRect && (
        <div
          className="absolute border-2 border-primary rounded-xl shadow-[0_0_20px_rgba(139,92,246,0.5)] pointer-events-none animate-pulse"
          style={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
          }}
        />
      )}

      {/* Tooltip */}
      <div style={tooltipStyle}
        className="bg-card border border-border rounded-xl shadow-2xl w-[380px] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
        <button onClick={skipTour} className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted transition-colors">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
        <div className="p-5">
          <h3 className="font-bold text-lg text-foreground mb-2">{step.title}</h3>
          <p className="text-sm text-muted-foreground mb-4">{step.description}</p>
          <div className="mb-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
              <span>Passo {currentStep} de {TOUR_STEPS.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
          <div className="flex gap-2 justify-between">
            <Button variant="ghost" size="sm" onClick={skipTour} className="text-muted-foreground">Pular Tour</Button>
            <div className="flex gap-2">
              {currentStep > 1 && (
                <Button variant="outline" size="sm" onClick={prevStep}>Anterior</Button>
              )}
              <Button size="sm" onClick={nextStep}>
                {currentStep === TOUR_STEPS.length ? "Concluir" : "Próximo"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingTour;
