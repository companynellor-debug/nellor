import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Package, Truck, ClipboardList, Home } from "lucide-react";
import { ParticlesBackground } from "@/components/cliente/ParticlesBackground";
import { useSupabaseOrders } from "@/hooks/useSupabaseOrders";
import { useCoupons } from "@/hooks/useCoupons";
import { useCart } from "@/hooks/useCart";
import { toast } from "@/hooks/use-toast";
import confetti from "canvas-confetti";

const CheckoutSucesso = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { createOrder } = useSupabaseOrders();
  const { incrementCouponUsage } = useCoupons();
  const { clearCart } = useCart();
  
  const [showAnimation, setShowAnimation] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const processOrder = async () => {
      // Check if coming from Stripe success
      const orderId = searchParams.get('order_id');
      
      if (!orderId) {
        navigate('/cliente');
        return;
      }

      // Get pending order data from localStorage
      const pendingOrderStr = localStorage.getItem('pendingOrder');
      if (!pendingOrderStr) {
        toast({
          title: "Erro",
          description: "Dados do pedido não encontrados",
          variant: "destructive",
        });
        navigate('/cliente');
        return;
      }

      try {
        const pendingOrder = JSON.parse(pendingOrderStr);
        const { buyerData, cartItems, subtotal, shipping, discount, total, supplierId, stripeSessionId, couponId } = pendingOrder;

        // Calculate platform fee (7.5%)
        const platformFee = total * 0.075;
        const supplierAmount = total - platformFee;

        // Create the order in Supabase with Stripe payment data
        const order = await createOrder({
          supplier_id: supplierId,
          payment_method: "cartao" as const,
          subtotal,
          frete: shipping,
          desconto: discount,
          total,
          itens: cartItems.map((item: any) => ({
            product_id: item.productId || item.id.toString(),
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image,
          })),
          endereco_entrega: {
            name: buyerData.nome,
            document: buyerData.documento,
            street: buyerData.endereco.street,
            number: buyerData.endereco.number,
            complement: buyerData.endereco.complement || "",
            neighborhood: buyerData.endereco.neighborhood,
            city: buyerData.endereco.city,
            state: buyerData.endereco.state,
            zip_code: buyerData.endereco.zip_code,
          },
          payment_status: "paid" as const,
          order_status: "pending" as const,
          tracking_code: null,
          proof_url: null,
          shipping_company: null,
          estimated_delivery: null,
          // Stripe payment data
          stripe_session_id: stripeSessionId,
          stripe_payment_amount: total,
          platform_fee: platformFee,
          supplier_amount: supplierAmount,
        });

        setOrderNumber(order?.order_number || `#${Date.now().toString().slice(-8)}`);
        
        // Increment coupon usage if one was applied
        if (couponId) {
          await incrementCouponUsage(couponId);
        }
        
        // Clear cart and pending order
        clearCart();
        localStorage.removeItem('pendingOrder');
        
        setIsProcessing(false);
        setShowAnimation(true);

        // Trigger confetti
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        function randomInRange(min: number, max: number) {
          return Math.random() * (max - min) + min;
        }

        const interval = setInterval(function () {
          const timeLeft = animationEnd - Date.now();

          if (timeLeft <= 0) {
            return clearInterval(interval);
          }

          const particleCount = 50 * (timeLeft / duration);

          confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
            colors: ["#4B0082", "#6A0DAD", "#9370DB", "#DDA0DD", "#22c55e"],
          });
          confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
            colors: ["#4B0082", "#6A0DAD", "#9370DB", "#DDA0DD", "#22c55e"],
          });
        }, 250);

        return () => clearInterval(interval);
      } catch (error) {
        console.error("Error creating order:", error);
        toast({
          title: "Erro ao processar pedido",
          description: "Por favor, entre em contato com o suporte.",
          variant: "destructive",
        });
        setIsProcessing(false);
      }
    };

    processOrder();
  }, [searchParams, navigate, createOrder, clearCart]);

  const steps = [
    {
      icon: CheckCircle,
      title: "Pedido Aprovado",
      description: "Pagamento confirmado via Stripe",
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <ParticlesBackground />
        <div className="text-center relative z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-lg font-medium">Processando seu pedido...</p>
          <p className="text-sm text-muted-foreground">Aguarde um momento</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <ParticlesBackground />
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
                    Pagamento via cartão de crédito processado pelo Stripe
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
