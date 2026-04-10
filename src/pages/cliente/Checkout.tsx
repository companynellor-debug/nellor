import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ParticlesBackground } from "@/components/cliente/ParticlesBackground";
import { BottomNav } from "@/components/cliente/BottomNav";
import { CheckoutSteps } from "@/components/checkout/CheckoutSteps";
import { StepDadosComprador, BuyerData } from "@/components/checkout/StepDadosComprador";
import { StepResumo } from "@/components/checkout/StepResumo";
import { StepConcluido } from "@/components/checkout/StepConcluido";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const Checkout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { cartItems, getTotal } = useCart();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [buyerData, setBuyerData] = useState<BuyerData | null>(null);
  const [discount, setDiscount] = useState(0);
  const [couponId, setCouponId] = useState<string | undefined>(undefined);

  // Load shipping data from cart page
  const [shippingData, setShippingData] = useState<{
    addressId: string | null;
    shippingPrice: number;
    isPickup: boolean;
    region: string | null;
  }>({ addressId: null, shippingPrice: 0, isPickup: false, region: null });

  useEffect(() => {
    try {
      const stored = localStorage.getItem('checkout_shipping');
      if (stored) {
        setShippingData(JSON.parse(stored));
      }
    } catch {}
  }, []);

  const handleDiscountChange = (newDiscount: number, newCouponId?: string) => {
    setDiscount(newDiscount);
    setCouponId(newCouponId);
  };

  const subtotal = getTotal();
  const shipping = shippingData.shippingPrice;

  // Check if payment was cancelled
  useEffect(() => {
    if (searchParams.get('cancelled') === 'true') {
      toast({
        title: "Pagamento cancelado",
        description: "Você pode tentar novamente quando quiser.",
        variant: "destructive",
      });
      navigate('/cliente/checkout', { replace: true });
    }
  }, [searchParams, navigate]);

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <ParticlesBackground />
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b shadow-sm">
          <div className="container mx-auto px-4 py-4 flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold text-primary">Checkout</h1>
          </div>
        </header>
        <main className="container mx-auto px-4 py-12 relative z-10 text-center">
          <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Seu carrinho está vazio</h2>
          <p className="text-muted-foreground mb-6">Adicione produtos ao carrinho para continuar</p>
          <Button onClick={() => navigate("/cliente/produtos")}>Ver Produtos</Button>
        </main>
        <BottomNav />
      </div>
    );
  }

  const handleBuyerDataSubmit = (data: BuyerData) => {
    setBuyerData(data);
    setCurrentStep(2);
  };

  const handlePaymentSuccess = (orderId: string) => {
    localStorage.removeItem('checkout_shipping');
    navigate(`/cliente/checkout/sucesso?order_id=${orderId}`);
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return "Dados do Cliente";
      case 2: return "Resumo do Pedido";
      case 3: return "Pagamento";
      default: return "Checkout";
    }
  };

  const handleBack = () => {
    if (currentStep === 1) navigate("/cliente/carrinho");
    else setCurrentStep(currentStep - 1);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <ParticlesBackground />
      
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-primary">Checkout</h1>
            <p className="text-sm text-muted-foreground">{getStepTitle()}</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 relative z-10">
        <CheckoutSteps currentStep={currentStep} />
        
        <div className="mt-8">
          {currentStep === 1 && (
            <StepDadosComprador 
              onNext={handleBuyerDataSubmit} 
              initialData={buyerData || undefined}
              isPickup={shippingData.isPickup}
            />
          )}
          
          {currentStep === 2 && buyerData && (
            <StepResumo
              cartItems={cartItems}
              subtotal={subtotal}
              shipping={shipping}
              discount={discount}
              buyerData={buyerData}
              onBack={() => setCurrentStep(1)}
              onNext={() => setCurrentStep(3)}
              isPickup={shippingData.isPickup}
            />
          )}
          
          {currentStep === 3 && buyerData && (
            <StepConcluido orderNumber="" paymentMethod="pix" />
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Checkout;
