import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  CreditCard, 
  Lock, 
  ShieldCheck, 
  Loader2,
  CheckCircle
} from "lucide-react";
import { CartItem } from "@/hooks/useCart";
import { BuyerData } from "./StepDadosComprador";
import { useStripeConnect } from "@/hooks/useStripeConnect";
import { toast } from "@/hooks/use-toast";

interface StepStripePaymentProps {
  cartItems: CartItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  buyerData: BuyerData;
  onBack: () => void;
  onSuccess: (orderNumber: string) => void;
}

export const StepStripePayment = ({
  cartItems,
  subtotal,
  shipping,
  discount,
  buyerData,
  onBack,
  onSuccess,
}: StepStripePaymentProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { createPayment } = useStripeConnect();

  const total = subtotal + shipping - discount;
  const platformFee = total * 0.075; // 7.5% Nellor commission
  const supplierAmount = total - platformFee;

  // Get supplier info
  const supplierId = cartItems[0]?.storeId?.toString() || "";
  const storeName = cartItems[0]?.storeName || "Fornecedor";

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
      // Generate temporary order ID for Stripe
      const tempOrderId = `temp_${Date.now()}`;
      const description = `Pedido Nellor - ${cartItems.length} item(s)`;
      
      // Current URL for redirect
      const baseUrl = window.location.origin;
      const successUrl = `${baseUrl}/cliente/checkout/sucesso?order_id=${tempOrderId}`;
      const cancelUrl = `${baseUrl}/cliente/checkout?cancelled=true`;

      const result = await createPayment(
        tempOrderId,
        supplierId,
        total,
        description,
        successUrl,
        cancelUrl
      );

      if (result?.url) {
        // Store checkout data in localStorage for success page
        localStorage.setItem('pendingOrder', JSON.stringify({
          buyerData,
          cartItems,
          subtotal,
          shipping,
          discount,
          total,
          supplierId,
          stripeSessionId: result.sessionId,
        }));
        
        // Redirect to Stripe Checkout
        window.location.href = result.url;
      } else {
        throw new Error("URL de pagamento não gerada");
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      
      // Check for specific error about supplier not configured
      const errorMessage = error?.message || "";
      if (errorMessage.includes("não completou") || errorMessage.includes("não está habilitada")) {
        toast({
          title: "Fornecedor não configurado",
          description: "O fornecedor ainda não finalizou a configuração de pagamentos. Tente novamente mais tarde ou entre em contato.",
          variant: "destructive",
        });
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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
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
                  <span>Desconto</span>
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
                <p className="text-sm font-medium text-yellow-800">Modo de Teste</p>
                <p className="text-xs text-yellow-700">
                  Use o cartão 4242 4242 4242 4242 com qualquer data futura e CVC para testar.
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
