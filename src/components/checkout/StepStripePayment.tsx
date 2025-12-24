import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  ArrowLeft, 
  CreditCard, 
  Lock, 
  ShieldCheck, 
  Loader2,
  CheckCircle,
  AlertTriangle,
  Tag,
  X
} from "lucide-react";
import { CartItem } from "@/hooks/useCart";
import { BuyerData } from "./StepDadosComprador";
import { useStripeConnect } from "@/hooks/useStripeConnect";
import { useCoupons } from "@/hooks/useCoupons";
import { useSupabaseOrders } from "@/hooks/useSupabaseOrders";
import { toast } from "@/hooks/use-toast";

interface StepStripePaymentProps {
  cartItems: CartItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  couponId?: string;
  buyerData: BuyerData;
  onBack: () => void;
  onSuccess: (orderNumber: string) => void;
  onDiscountChange: (discount: number, couponId?: string) => void;
}

export const StepStripePayment = ({
  cartItems,
  subtotal,
  shipping,
  discount,
  couponId,
  buyerData,
  onBack,
  onSuccess,
  onDiscountChange,
}: StepStripePaymentProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCheckingSupplier, setIsCheckingSupplier] = useState(true);
  const [supplierReady, setSupplierReady] = useState(false);
  const [supplierError, setSupplierError] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState("");
  
  const { createPayment } = useStripeConnect();
  const { createOrder } = useSupabaseOrders();
  const { loading: couponLoading, appliedCoupon, validateCoupon, removeCoupon } = useCoupons();

  const total = subtotal + shipping - discount;
  const platformFee = total * 0.075; // 7.5% Nellor commission
  const supplierAmount = total - platformFee;

  // Get supplier info
  const supplierId = cartItems[0]?.storeId?.toString() || "";
  const storeName = cartItems[0]?.storeName || "Fornecedor";

  // Check if supplier has completed Stripe setup
  useEffect(() => {
    const checkSupplierStatus = async () => {
      if (!supplierId) {
        setSupplierError("Fornecedor não encontrado");
        setIsCheckingSupplier(false);
        return;
      }

      setIsCheckingSupplier(true);
      try {
        // Import supabase client and get session properly
        const { supabase } = await import("@/integrations/supabase/client");
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.access_token) {
          setSupplierReady(true);
          setIsCheckingSupplier(false);
          return;
        }

        const response = await supabase.functions.invoke('stripe-check-account', {
          body: { supplierId },
        });

        if (response.error) {
          console.log("Supplier check response:", response.error);
          // Don't block, let the payment attempt handle it
          setSupplierReady(true);
        } else if (response.data) {
          setSupplierReady(response.data.chargesEnabled === true);
          if (!response.data.chargesEnabled) {
            setSupplierError("O fornecedor ainda não finalizou o cadastro no sistema de pagamentos.");
          }
        } else {
          setSupplierReady(true);
        }
      } catch (error) {
        console.error("Error checking supplier status:", error);
        // Don't block, let the payment attempt handle it
        setSupplierReady(true);
      } finally {
        setIsCheckingSupplier(false);
      }
    };

    checkSupplierStatus();
  }, [supplierId]);

  // Handle coupon application
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    
    const productIds = cartItems.map(item => item.productId).filter(Boolean) as string[];
    const result = await validateCoupon(couponCode, supplierId, subtotal, productIds);
    
    if (result) {
      onDiscountChange(result.discount, result.coupon.id);
    }
    setCouponCode("");
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    onDiscountChange(0, undefined);
  };

  const handleStripePayment = async () => {
    if (!supplierId) {
      toast({
        title: "Erro",
        description: "Fornecedor não encontrado",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // CRÍTICO: cria o pedido PENDENTE antes do Stripe
      const pendingOrder = await createOrder({
        supplier_id: supplierId,
        payment_method: "cartao" as const,
        payment_status: "pending",
        order_status: "pending",
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
        tracking_code: null,
        proof_url: null,
        shipping_company: null,
        estimated_delivery: null,
        stripe_payment_amount: total,
        platform_fee: platformFee,
        supplier_amount: supplierAmount,
      });

      // ✅ DISPARA NOTIFICAÇÃO PUSH "PEDIDO PENDENTE" PARA O FORNECEDOR
      console.log("📨 Disparando notificação de pedido pendente para fornecedor:", supplierId);
      const { supabase } = await import("@/integrations/supabase/client");
      
      try {
        await supabase.functions.invoke("send-push-notification", {
          body: {
            user_id: supplierId,
            title: "🛒 Pedido Pendente",
            body: `Um cliente iniciou o pedido #${pendingOrder.order_number}. Aguardando pagamento.`,
            url: "/fornecedor/pedidos",
            tag: `order-pending-${pendingOrder.order_number}`,
            order_number: pendingOrder.order_number,
            total,
          },
        });
        console.log("✅ Notificação de pedido pendente enviada");
      } catch (pushError) {
        console.error("⚠️ Erro ao enviar push pendente:", pushError);
        // Não bloqueia o fluxo
      }

      const description = `Pedido Nellor - ${cartItems.length} item(s)`;

      const baseUrl = window.location.origin;
      const successUrl = `${baseUrl}/cliente/checkout/sucesso?order_id=${pendingOrder.id}`;
      const cancelUrl = `${baseUrl}/cliente/checkout?cancelled=true`;

      const result = await createPayment(
        pendingOrder.id,
        supplierId,
        total,
        description,
        successUrl,
        cancelUrl
      );

      if (!result?.url) {
        throw new Error("URL de pagamento não gerada");
      }

      // Salva contexto local para a página de sucesso (fallback)
      localStorage.setItem(
        "pendingOrder",
        JSON.stringify({
          orderId: pendingOrder.id,
          orderNumber: pendingOrder.order_number,
          stripeSessionId: result.sessionId,
          supplierId,
          subtotal,
          shipping,
          discount,
          total,
          platformFee,
          supplierAmount,
          cartItems,
          buyerData,
          couponId: appliedCoupon?.coupon.id,
        })
      );

      // Vincula session_id no pedido
      await supabase
        .from("orders")
        .update({
          stripe_session_id: result.sessionId,
        })
        .eq("id", pendingOrder.id);

      window.location.href = result.url;
    } catch (error: any) {
      console.error("Payment error:", error);

      const errorMessage = error?.message || "";
      if (
        errorMessage.includes("não completou") ||
        errorMessage.includes("não está habilitada") ||
        errorMessage.includes("missing the required capabilities")
      ) {
        setSupplierReady(false);
        setSupplierError(
          "O fornecedor ainda não finalizou o cadastro no sistema de pagamentos. Não é possível concluir a compra no momento."
        );
      } else {
        toast({
          title: "Erro no pagamento",
          description: "Não foi possível iniciar o pagamento. Tente novamente.",
          variant: "destructive",
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Show loading state while checking supplier
  if (isCheckingSupplier) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border shadow-lg">
          <CardContent className="p-12 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-lg font-medium">Verificando disponibilidade...</p>
            <p className="text-sm text-muted-foreground">Aguarde enquanto verificamos o fornecedor</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show alert if supplier is not ready
  if (!supplierReady || supplierError) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Alert variant="destructive" className="border-2">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle className="text-lg">Pagamento indisponível</AlertTitle>
          <AlertDescription className="mt-2">
            {supplierError || "O fornecedor ainda não finalizou o cadastro no sistema de pagamentos."}
            <p className="mt-3 text-sm">
              Infelizmente não é possível concluir a compra com este fornecedor no momento. 
              Entre em contato com o fornecedor ou tente novamente mais tarde.
            </p>
          </AlertDescription>
        </Alert>

        <Card className="border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">{storeName}</p>
                <p className="text-sm text-muted-foreground">Fornecedor</p>
              </div>
            </div>
            
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-4">
              <p className="text-sm text-amber-800">
                <strong>Por que isso acontece?</strong><br/>
                O fornecedor precisa completar o cadastro da conta de pagamentos para poder receber vendas. 
                Isso inclui verificação de identidade e dados bancários.
              </p>
            </div>

            <Button
              variant="outline"
              onClick={onBack}
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Coupon Section */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Tag className="h-5 w-5 text-primary" />
            Cupom de Desconto
          </CardTitle>
        </CardHeader>
        <CardContent>
          {appliedCoupon ? (
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-3">
                <Tag className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">{appliedCoupon.coupon.codigo}</p>
                  <p className="text-sm text-green-600">
                    {appliedCoupon.coupon.tipo === 'percentage' 
                      ? `${appliedCoupon.coupon.valor}% de desconto`
                      : `R$ ${appliedCoupon.coupon.valor.toFixed(2).replace('.', ',')} de desconto`
                    }
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleRemoveCoupon}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Digite o código do cupom"
                className="flex-1"
                onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
              />
              <Button 
                onClick={handleApplyCoupon} 
                disabled={couponLoading || !couponCode.trim()}
                variant="outline"
              >
                {couponLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Aplicar"
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Card */}
      <Card className="border shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 pb-6">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-primary rounded-lg">
              <CreditCard className="h-6 w-6 text-primary-foreground" />
            </div>
            Pagamento Seguro
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Você será redirecionado para o checkout seguro do Stripe
          </p>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6">
          {/* Security Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Lock className="h-3 w-3" />
              SSL Seguro
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" />
              Stripe Checkout
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <CreditCard className="h-3 w-3" />
              Cartão de Crédito
            </Badge>
          </div>

          <Separator />

          {/* Order Summary */}
          <div className="space-y-4">
            <h3 className="font-semibold">Resumo do Pagamento</h3>
            
            <div className="p-4 bg-muted/50 rounded-lg space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Fornecedor</span>
                <span className="font-medium">{storeName}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Itens</span>
                <span>{cartItems.length} produto(s)</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>R$ {subtotal.toFixed(2).replace(".", ",")}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Frete</span>
                <span>R$ {shipping.toFixed(2).replace(".", ",")}</span>
              </div>
              {discount > 0 && (
                <div className="flex items-center justify-between text-sm text-green-600">
                  <span className="flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    Desconto
                  </span>
                  <span>- R$ {discount.toFixed(2).replace(".", ",")}</span>
                </div>
              )}
              <Separator />
              <div className="flex items-center justify-between font-bold text-lg">
                <span>Total a Pagar</span>
                <span className="text-primary">
                  R$ {total.toFixed(2).replace(".", ",")}
                </span>
              </div>
            </div>
          </div>

          {/* Card Brands */}
          <div className="flex items-center justify-center gap-4 py-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="text-xs">Aceitamos:</span>
              <div className="flex gap-1">
                <div className="w-10 h-6 bg-blue-600 rounded flex items-center justify-center text-white text-[8px] font-bold">VISA</div>
                <div className="w-10 h-6 bg-red-500 rounded flex items-center justify-center text-white text-[8px] font-bold">MC</div>
                <div className="w-10 h-6 bg-blue-800 rounded flex items-center justify-center text-white text-[8px] font-bold">AMEX</div>
                <div className="w-10 h-6 bg-orange-500 rounded flex items-center justify-center text-white text-[8px] font-bold">ELO</div>
              </div>
            </div>
          </div>

          {/* Test Mode Notice */}
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Modo de Teste Ativo</p>
                <p className="text-xs text-yellow-700">
                  Ao clicar em "Pagar", você será redirecionado ao checkout seguro do Stripe onde poderá inserir os dados do cartão.
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  <strong>Para testar:</strong> Use 4242 4242 4242 4242, qualquer data futura (ex: 12/28) e CVC 123.
                </p>
              </div>
            </div>
          </div>

          {/* Pay Button */}
          <Button
            onClick={handleStripePayment}
            disabled={isProcessing}
            className="w-full h-14 text-lg font-semibold"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Redirecionando...
              </>
            ) : (
              <>
                <Lock className="h-5 w-5 mr-2" />
                Pagar R$ {total.toFixed(2).replace(".", ",")}
              </>
            )}
          </Button>

          <Button
            variant="ghost"
            onClick={onBack}
            disabled={isProcessing}
            className="w-full"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Resumo
          </Button>

          {/* Security Footer */}
          <div className="text-center text-xs text-muted-foreground pt-4 border-t">
            <Lock className="h-4 w-4 inline mr-1" />
            Pagamento processado com segurança pelo Stripe.
            <br />
            Seus dados estão protegidos com criptografia de ponta a ponta.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
