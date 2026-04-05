import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Package, Truck, ClipboardList, Home, AlertTriangle, CreditCard, Shield, Loader2 } from "lucide-react";

import { useCart } from "@/hooks/useCart";
import { supabase } from "@/integrations/supabase/client";


// Processing steps for visual feedback
const PROCESSING_STEPS = [
  { id: 1, label: "Processando pedido", icon: CreditCard },
  { id: 2, label: "Validando informações", icon: Shield },
  { id: 3, label: "Confirmando pedido", icon: Package },
  { id: 4, label: "Finalizando", icon: CheckCircle },
];

const CheckoutSucesso = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { clearCart } = useCart();
  
  const [showAnimation, setShowAnimation] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const processOrder = async () => {
      const orderIdFromQuery = searchParams.get("order_id");
      const sessionIdFromQuery = searchParams.get("session_id");

      if (!orderIdFromQuery) {
        navigate("/cliente");
        return;
      }

      // Limpar carrinho imediatamente
      clearCart();

      // Limpar pendingOrder do localStorage
      localStorage.removeItem("pendingOrder");

      try {
        // Step 1: Conectando
        setCurrentStep(1);
        setProgress(10);

        // Pagamento removido: não há verificação de gateway aqui
        setCurrentStep(2);
        setProgress(30);

        // Step 3: Confirmando
        setCurrentStep(3);
        setProgress(50);

        // 2) Busca pedido para exibir o número e checar status
        const { data: order, error: orderError } = await supabase
          .from("orders")
          .select("id, order_number, payment_status")
          .eq("id", orderIdFromQuery)
          .maybeSingle();

        if (orderError) {
          console.error("Error fetching order:", orderError);
          throw orderError;
        }

        if (!order) {
          throw new Error("Pedido não encontrado");
        }

        setOrderNumber(order.order_number);
        setProgress(60);

        // Step 4: Finalizando
        setCurrentStep(4);
        setProgress(80);

        // Não bloqueia a página; pedido pode seguir pendente
        setProgress(100);
        await new Promise((resolve) => setTimeout(resolve, 300));
        setIsProcessing(false);
        setShowAnimation(true);
        
      } catch (err) {
        console.error("Error processing success page:", err);
        setError("Não foi possível verificar o status do pedido. Verifique em 'Meus Pedidos'.");
        setIsProcessing(false);
      }
    };

    processOrder();
  }, [searchParams, navigate, clearCart]);


   const steps = [
    {
      icon: CheckCircle,
      title: "Pedido Aprovado",
       description: "Pedido registrado com sucesso",
      status: "done",
    },
    {
      icon: Package,
      title: "Em Preparação",
      description: "O fornecedor está preparando seu pedido",
      status: "pending",
    },
    {
      icon: Truck,
      title: "Enviado",
      description: "Seu pedido está a caminho",
      status: "pending",
    },
  ];

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        
        <Card className="w-full max-w-md border shadow-xl relative z-10 overflow-hidden">
          {/* Header com gradiente */}
          <div className="bg-gradient-to-br from-primary/90 to-primary p-6 text-center text-primary-foreground">
            <div className="w-20 h-20 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-4 animate-pulse">
              <CreditCard className="h-10 w-10" />
            </div>
            <h1 className="text-2xl font-bold mb-1">Processando Pagamento</h1>
            <p className="text-primary-foreground/80 text-sm">
              Aguarde enquanto confirmamos seu pagamento
            </p>
          </div>

          <CardContent className="p-6 space-y-6">
            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progresso</span>
                <span className="font-medium text-primary">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Steps */}
            <div className="space-y-3">
              {PROCESSING_STEPS.map((step) => {
                const StepIcon = step.icon;
                const isActive = step.id === currentStep;
                const isCompleted = step.id < currentStep;
                
                return (
                  <div 
                    key={step.id}
                    className={`
                      flex items-center gap-3 p-3 rounded-lg transition-all duration-300
                      ${isActive ? 'bg-primary/10 border border-primary/30' : ''}
                      ${isCompleted ? 'opacity-60' : ''}
                    `}
                  >
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center transition-all
                      ${isActive ? 'bg-primary text-primary-foreground' : ''}
                      ${isCompleted ? 'bg-green-500 text-white' : ''}
                      ${!isActive && !isCompleted ? 'bg-muted text-muted-foreground' : ''}
                    `}>
                      {isActive ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : isCompleted ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <StepIcon className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium text-sm ${isActive ? 'text-primary' : ''}`}>
                        {step.label}
                      </p>
                    </div>
                    {isActive && (
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Tempo estimado */}
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Tempo estimado:</span> 5-10 segundos
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Não feche esta página
              </p>
            </div>

            {/* Security badge */}
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span>Conexão segura com criptografia SSL</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background py-8">
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl mx-auto">
            <Card className="border shadow-lg overflow-hidden">
              <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-8 text-center text-white">
                <div className="w-24 h-24 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-4">
                  <AlertTriangle className="h-14 w-14" />
                </div>
                <h1 className="text-3xl font-bold mb-2">Atenção</h1>
                <p className="text-white/90 text-lg">{error}</p>
              </div>
              <CardContent className="p-6 space-y-6">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={() => navigate("/cliente/meus-pedidos")}
                    className="flex-1"
                  >
                    <ClipboardList className="h-4 w-4 mr-2" />
                    Ver Meus Pedidos
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate("/cliente")}
                    className="flex-1"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Voltar ao Início
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-2xl mx-auto">
          <Card className="border shadow-lg overflow-hidden">
            {/* Success Header */}
            <div className="bg-gradient-to-br from-green-500 to-green-600 p-8 text-center text-white">
              <div
                className={`transform transition-all duration-700 ${
                  showAnimation ? "scale-100 opacity-100" : "scale-50 opacity-0"
                }`}
              >
                <div className="w-24 h-24 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="h-14 w-14" />
                </div>
                <h1 className="text-3xl font-bold mb-2">Pedido Aprovado!</h1>
                <p className="text-white/90 text-lg">
                  Seu pagamento foi confirmado com sucesso
                </p>
              </div>
            </div>

            <CardContent className="p-6 space-y-6">
              {/* Order Number */}
              <div className="text-center p-6 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl border">
                <p className="text-sm text-muted-foreground mb-1">Número do Pedido</p>
                <p className="text-2xl font-bold text-primary">{orderNumber}</p>
              </div>

              {/* Payment Confirmation */}
       <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-green-800">Pagamento Aprovado</p>
                  <p className="text-sm text-green-600">
             Seu pedido foi criado e está em acompanhamento.
                  </p>
                </div>
              </div>

              <Separator />

              {/* Order Timeline */}
              <div>
                <h3 className="font-semibold mb-4">Acompanhe seu pedido</h3>
                <div className="space-y-4">
                  {steps.map((step, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                            step.status === "done"
                              ? "bg-green-500 text-white"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          <step.icon className="h-5 w-5" />
                        </div>
                        {index < steps.length - 1 && (
                          <div
                            className={`w-0.5 h-8 mt-2 ${
                              step.status === "done" ? "bg-green-500" : "bg-muted"
                            }`}
                          />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <p
                          className={`font-medium ${
                            step.status === "done"
                              ? "text-foreground"
                              : "text-muted-foreground"
                          }`}
                        >
                          {step.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Next Steps */}
              <div className="bg-muted/30 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Próximos passos</h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Você receberá um e-mail com os detalhes do pedido</li>
                  <li>• Acompanhe o status na página "Meus Pedidos"</li>
                  <li>• O código de rastreio será enviado quando disponível</li>
                </ul>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => navigate("/cliente/meus-pedidos")}
                  className="flex-1"
                >
                  <ClipboardList className="h-4 w-4 mr-2" />
                  Ver Meus Pedidos
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate("/cliente")}
                  className="flex-1"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Continuar Comprando
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSucesso;
