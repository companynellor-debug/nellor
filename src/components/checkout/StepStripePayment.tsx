import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ShoppingBag,
  Lock,
  ShieldCheck,
  Loader2,
  CheckCircle,
  Tag,
  X,
  TestTube,
  Zap,
} from "lucide-react";
import { CartItem } from "@/hooks/useCart";
import { BuyerData } from "./StepDadosComprador";
import { useCoupons } from "@/hooks/useCoupons";
import { useSupabaseOrders } from "@/hooks/useSupabaseOrders";
import { supabase } from "@/integrations/supabase/client";
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
  isPickup?: boolean;
  shippingRegion?: string | null;
}

export const StepStripePayment = ({
  cartItems,
  subtotal,
  shipping,
  discount,
  buyerData,
  onBack,
  onSuccess,
  onDiscountChange,
}: StepStripePaymentProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [couponCode, setCouponCode] = useState("");

  const { createOrder } = useSupabaseOrders();
  const { loading: couponLoading, appliedCoupon, validateCoupon, removeCoupon } = useCoupons();

  const total = subtotal + shipping - discount;
  const platformFee = total * 0.075;
  const supplierAmount = total - platformFee;

  const supplierId = cartItems[0]?.storeId?.toString() || "";
  const storeName = cartItems[0]?.storeName || "Fornecedor";

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    const productIds = cartItems.map((item) => item.productId).filter(Boolean) as string[];
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

  const handleFinalizarPedido = async () => {
    if (!supplierId) {
      toast({ title: "Erro", description: "Fornecedor não encontrado", variant: "destructive" });
      return;
    }

    setIsProcessing(true);

    try {
      // Simula breve delay de "processamento"
      await new Promise((r) => setTimeout(r, 1200));

      // Cria pedido como PAGO (simulação de teste sem gateway)
      const newOrder = await createOrder({
        supplier_id: supplierId,
        payment_method: "cartao" as const,
        payment_status: "paid",
        order_status: "pending",
        status_label: "AGUARDANDO_PREPARACAO",
        payment_status_label: "PAGO",
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
        platform_fee: platformFee,
        supplier_amount: supplierAmount,
      });

      // Dispara notificação push + insere no banco (via edge function com service role)
      try {
        await supabase.functions.invoke("send-push-notification", {
          body: {
            user_id: supplierId,
            title: "🛍️ Novo Pedido Recebido!",
            body: `Pedido ${newOrder.order_number} de ${buyerData.nome} — R$ ${total.toFixed(2).replace(".", ",")} confirmado!`,
            url: "/fornecedor/pedidos",
            type: "order_update",
            order_number: newOrder.order_number,
            data: { order_id: newOrder.id, order_number: newOrder.order_number },
          },
        });
      } catch (pushErr) {
        console.warn("Push notification failed (non-blocking):", pushErr);
      }

      // Salva contexto local para a página de sucesso
      localStorage.setItem(
        "pendingOrder",
        JSON.stringify({
          orderId: newOrder.id,
          orderNumber: newOrder.order_number,
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

      onSuccess(newOrder.id);
    } catch (error: any) {
      console.error("Order creation error:", error);
      toast({
        title: "Erro ao finalizar pedido",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Test Mode Banner */}
      <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
        <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
          <TestTube className="h-5 w-5 text-yellow-700" />
        </div>
        <div>
          <p className="font-semibold text-yellow-800 text-sm">Modo de Teste Ativo</p>
          <p className="text-xs text-yellow-700">
            Pedidos são criados como pagos instantaneamente. Notificações são enviadas normalmente.
          </p>
        </div>
        <Badge variant="outline" className="border-yellow-400 text-yellow-800 ml-auto flex-shrink-0">
          <Zap className="h-3 w-3 mr-1" />
          Simulado
        </Badge>
      </div>

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
                    {appliedCoupon.coupon.tipo === "percentage"
                      ? `${appliedCoupon.coupon.valor}% de desconto`
                      : `R$ ${appliedCoupon.coupon.valor.toFixed(2).replace(".", ",")} de desconto`}
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
                onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
              />
              <Button onClick={handleApplyCoupon} disabled={couponLoading || !couponCode.trim()} variant="outline">
                {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aplicar"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Summary Card */}
      <Card className="border shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 pb-6">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-primary rounded-lg">
              <ShoppingBag className="h-6 w-6 text-primary-foreground" />
            </div>
            Confirmação do Pedido
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Revise os valores e clique em finalizar para criar o pedido.
          </p>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Security Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Lock className="h-3 w-3" />
              Dados Seguros
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" />
              Pedido Protegido
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Aprovação Imediata
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
                <span>Total</span>
                <span className="text-primary">R$ {total.toFixed(2).replace(".", ",")}</span>
              </div>
            </div>
          </div>

          {/* Finalize Button */}
          <Button
            onClick={handleFinalizarPedido}
            disabled={isProcessing}
            className="w-full h-14 text-lg font-semibold"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Processando pedido...
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 mr-2" />
                Finalizar Pedido — R$ {total.toFixed(2).replace(".", ",")}
              </>
            )}
          </Button>

          <Button variant="ghost" onClick={onBack} disabled={isProcessing} className="w-full">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Resumo
          </Button>

          <div className="text-center text-xs text-muted-foreground pt-4 border-t">
            <Lock className="h-4 w-4 inline mr-1" />
            Seus dados estão protegidos.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
