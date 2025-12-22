import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ParticlesBackground } from "@/components/cliente/ParticlesBackground";
import { BottomNav } from "@/components/cliente/BottomNav";
import { CheckoutSteps } from "@/components/checkout/CheckoutSteps";
import { StepDadosComprador, BuyerData } from "@/components/checkout/StepDadosComprador";
import { StepPagamento } from "@/components/checkout/StepPagamento";
import { StepConcluido } from "@/components/checkout/StepConcluido";
import { useCart } from "@/hooks/useCart";
import { useSupabaseOrders } from "@/hooks/useSupabaseOrders";
import { useCoupons } from "@/hooks/useCoupons";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type PaymentMethod = "cartao" | "pix";

const Checkout = () => {
  const navigate = useNavigate();
  const { cartItems, getTotal, clearCart } = useCart();
  const { createOrder } = useSupabaseOrders();
  const { incrementCouponUsage } = useCoupons();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [buyerData, setBuyerData] = useState<BuyerData | null>(null);
  const [orderNumber, setOrderNumber] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cartao");

  const subtotal = getTotal();
  const shipping = cartItems.length > 0 ? 15.0 : 0;

  if (cartItems.length === 0 && currentStep !== 3) {
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

  const handlePaymentFinish = async (method: PaymentMethod, discount: number = 0, couponId?: string) => {
    if (!buyerData || !buyerData.endereco) return;
    setPaymentMethod(method);

    try {
      const itemsBySupplier = cartItems.reduce((acc, item) => {
        const supplierId = item.storeId?.toString() || "";
        if (!acc[supplierId]) acc[supplierId] = [];
        acc[supplierId].push(item);
        return acc;
      }, {} as Record<string, typeof cartItems>);

      const orderPromises = Object.entries(itemsBySupplier).map(async ([supplierId, items]) => {
        const itemsSubtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const itemsShipping = shipping / Object.keys(itemsBySupplier).length;
        // Distribute discount proportionally among suppliers
        const supplierDiscount = (itemsSubtotal / subtotal) * discount;

        return createOrder({
          supplier_id: supplierId,
          payment_method: method as "pix" | "boleto" | "cartao",
          subtotal: itemsSubtotal,
          frete: itemsShipping,
          desconto: supplierDiscount,
          total: itemsSubtotal + itemsShipping - supplierDiscount,
          itens: items.map((item) => ({
            product_id: item.id.toString(),
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
        });
      });

      const orders = await Promise.all(orderPromises);
      const firstOrder = orders[0];
      setOrderNumber(firstOrder?.order_number || `#${Date.now().toString().slice(-8)}`);
      
      // Increment coupon usage if one was applied
      if (couponId) {
        await incrementCouponUsage(couponId);
      }
      
      clearCart();
      setCurrentStep(3);
      toast({ title: "Pedido realizado com sucesso!", description: "Você receberá uma confirmação por e-mail." });
    } catch (error) {
      console.error("Error creating order:", error);
      toast({ title: "Erro ao processar pedido", description: "Por favor, tente novamente.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <ParticlesBackground />
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          {currentStep < 3 && (
            <Button variant="ghost" size="icon" onClick={() => currentStep === 1 ? navigate("/cliente/carrinho") : setCurrentStep(1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <h1 className="text-xl font-bold text-primary">Checkout</h1>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6 relative z-10">
        <CheckoutSteps currentStep={currentStep} />
        <div className="mt-6">
          {currentStep === 1 && <StepDadosComprador onNext={handleBuyerDataSubmit} initialData={buyerData || undefined} />}
          {currentStep === 2 && buyerData && (
            <StepPagamento cartItems={cartItems} subtotal={subtotal} shipping={shipping} buyerData={buyerData} onBack={() => setCurrentStep(1)} onFinish={handlePaymentFinish} />
          )}
          {currentStep === 3 && <StepConcluido orderNumber={orderNumber} paymentMethod={paymentMethod} />}
        </div>
      </main>
      {currentStep < 3 && <BottomNav />}
    </div>
  );
};

export default Checkout;
