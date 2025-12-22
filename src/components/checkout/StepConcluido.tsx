import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Package, Truck, ClipboardList } from "lucide-react";
import { useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";

interface StepConcluidoProps {
  orderNumber: string;
  paymentMethod: "cartao" | "pix";
}

export const StepConcluido = ({ orderNumber, paymentMethod }: StepConcluidoProps) => {
  const navigate = useNavigate();
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    setShowAnimation(true);
    
    // Trigger confetti
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: ReturnType<typeof setInterval> = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ["#4B0082", "#6A0DAD", "#9370DB", "#DDA0DD"],
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ["#4B0082", "#6A0DAD", "#9370DB", "#DDA0DD"],
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  const steps = [
    {
      icon: CheckCircle,
      title: "Pedido Confirmado",
      description: "Seu pedido foi recebido com sucesso",
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

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="border shadow-lg overflow-hidden">
        {/* Success Header */}
        <div className="bg-gradient-to-br from-primary to-secondary p-8 text-center text-white">
          <div
            className={`transform transition-all duration-700 ${
              showAnimation ? "scale-100 opacity-100" : "scale-50 opacity-0"
            }`}
          >
            <div className="w-20 h-20 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-12 w-12" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Pedido Confirmado!</h1>
            <p className="text-white/80">
              Obrigado por comprar na Nellor
            </p>
          </div>
        </div>

        <CardContent className="p-6 space-y-6">
          {/* Order Number */}
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Número do Pedido</p>
            <p className="text-xl font-bold text-primary">{orderNumber}</p>
          </div>

          {/* Payment Status */}
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div>
              <p className="font-medium text-green-800">Pagamento Aprovado</p>
              <p className="text-sm text-green-600">
                {paymentMethod === "cartao"
                  ? "Pagamento via cartão de crédito confirmado"
                  : "Pagamento via Pix confirmado"}
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
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        step.status === "done"
                          ? "bg-primary text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <step.icon className="h-5 w-5" />
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={`w-0.5 h-8 mt-2 ${
                          step.status === "done" ? "bg-primary" : "bg-muted"
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
              Continuar Comprando
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
