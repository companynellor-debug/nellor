import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { CreditCard, QrCode, ArrowLeft, Lock, ShieldCheck, Tag, X, Loader2 } from "lucide-react";
import { CartItem } from "@/hooks/useCart";
import { BuyerData } from "./StepDadosComprador";
import { useCoupons, AppliedCoupon } from "@/hooks/useCoupons";

type PaymentMethod = "cartao" | "pix";

interface StepPagamentoProps {
  cartItems: CartItem[];
  subtotal: number;
  shipping: number;
  buyerData: BuyerData;
  onBack: () => void;
  onFinish: (paymentMethod: PaymentMethod, discount: number, couponId?: string) => void;
}

export const StepPagamento = ({
  cartItems,
  subtotal,
  shipping,
  buyerData,
  onBack,
  onFinish,
}: StepPagamentoProps) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cartao");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [cardData, setCardData] = useState({
    number: "",
    name: "",
    expiry: "",
    cvv: "",
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  
  const { loading: couponLoading, appliedCoupon, validateCoupon, removeCoupon } = useCoupons();

  const discount = appliedCoupon?.discount || 0;
  const total = subtotal + shipping - discount;

  // Group items by supplier
  const itemsBySupplier = cartItems.reduce((acc, item) => {
    const supplierId = item.storeId?.toString() || "unknown";
    if (!acc[supplierId]) {
      acc[supplierId] = {
        storeName: item.storeName || "Loja",
        items: [],
        subtotal: 0,
      };
    }
    acc[supplierId].items.push(item);
    acc[supplierId].subtotal += item.price * item.quantity;
    return acc;
  }, {} as Record<string, { storeName: string; items: CartItem[]; subtotal: number }>);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    
    // Get first supplier ID from cart
    const supplierIds = Object.keys(itemsBySupplier);
    if (supplierIds.length === 0) return;
    
    // For now, apply to first supplier - could be improved to select supplier
    const supplierId = supplierIds[0];
    const supplierSubtotal = itemsBySupplier[supplierId].subtotal;
    const productIds = itemsBySupplier[supplierId].items.map(item => item.productId).filter(Boolean) as string[];
    
    await validateCoupon(couponCode, supplierId, supplierSubtotal, productIds);
    setCouponCode("");
  };

  const formatCardNumber = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers
      .replace(/(\d{4})(\d)/, "$1 $2")
      .replace(/(\d{4})(\d)/, "$1 $2")
      .replace(/(\d{4})(\d)/, "$1 $2")
      .slice(0, 19);
  };

  const formatExpiry = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers.replace(/(\d{2})(\d)/, "$1/$2").slice(0, 5);
  };

  const handleCardChange = (field: string, value: string) => {
    let formattedValue = value;

    if (field === "number") {
      formattedValue = formatCardNumber(value);
    } else if (field === "expiry") {
      formattedValue = formatExpiry(value);
    } else if (field === "cvv") {
      formattedValue = value.replace(/\D/g, "").slice(0, 4);
    }

    setCardData((prev) => ({ ...prev, [field]: formattedValue }));
  };

  const handleFinish = async () => {
    if (!acceptedTerms) return;

    setIsProcessing(true);
    
    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    onFinish(paymentMethod, discount, appliedCoupon?.coupon.id);
  };

  const isCardValid =
    paymentMethod === "pix" ||
    (cardData.number.replace(/\s/g, "").length === 16 &&
      cardData.name.length >= 3 &&
      cardData.expiry.length === 5 &&
      cardData.cvv.length >= 3);

  const canFinish = acceptedTerms && isCardValid;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Payment Column */}
      <div className="lg:col-span-3 space-y-6">
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
                <Button variant="ghost" size="sm" onClick={removeCoupon}>
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

        {/* Payment Methods */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Forma de Pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={paymentMethod}
              onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
              className="space-y-3"
            >
              <label
                htmlFor="cartao"
                className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                  paymentMethod === "cartao"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <RadioGroupItem value="cartao" id="cartao" />
                <CreditCard className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <span className="font-medium">Cartão de Crédito</span>
                  <p className="text-xs text-muted-foreground">
                    Parcele em até 12x
                  </p>
                </div>
              </label>

              <label
                htmlFor="pix"
                className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                  paymentMethod === "pix"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <RadioGroupItem value="pix" id="pix" />
                <QrCode className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <span className="font-medium">Pix</span>
                  <p className="text-xs text-muted-foreground">
                    Aprovação instantânea
                  </p>
                </div>
              </label>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Card Form */}
        {paymentMethod === "cartao" && (
          <Card className="border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="h-5 w-5 text-primary" />
                Dados do Cartão
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cardNumber">Número do Cartão</Label>
                <Input
                  id="cardNumber"
                  value={cardData.number}
                  onChange={(e) => handleCardChange("number", e.target.value)}
                  placeholder="0000 0000 0000 0000"
                  className="font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cardName">Nome no Cartão</Label>
                <Input
                  id="cardName"
                  value={cardData.name}
                  onChange={(e) =>
                    handleCardChange("name", e.target.value.toUpperCase())
                  }
                  placeholder="NOME COMO ESTÁ NO CARTÃO"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cardExpiry">Validade</Label>
                  <Input
                    id="cardExpiry"
                    value={cardData.expiry}
                    onChange={(e) => handleCardChange("expiry", e.target.value)}
                    placeholder="MM/AA"
                    className="font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cardCvv">CVV</Label>
                  <Input
                    id="cardCvv"
                    value={cardData.cvv}
                    onChange={(e) => handleCardChange("cvv", e.target.value)}
                    placeholder="000"
                    className="font-mono"
                    type="password"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                <Lock className="h-4 w-4" />
                <span>Seus dados estão protegidos com criptografia SSL</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pix Placeholder */}
        {paymentMethod === "pix" && (
          <Card className="border shadow-sm">
            <CardContent className="py-8 text-center">
              <QrCode className="h-16 w-16 mx-auto text-primary mb-4" />
              <h3 className="font-semibold text-lg mb-2">Pagamento via Pix</h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                Após finalizar, você receberá um QR Code para pagamento.
                A confirmação é instantânea!
              </p>
            </CardContent>
          </Card>
        )}

        {/* Terms */}
        <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
          <Checkbox
            id="terms"
            checked={acceptedTerms}
            onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
          />
          <label htmlFor="terms" className="text-sm cursor-pointer">
            Li e aceito os{" "}
            <a href="#" className="text-primary hover:underline">
              Termos de Uso
            </a>{" "}
            e a{" "}
            <a href="#" className="text-primary hover:underline">
              Política de Privacidade
            </a>
          </label>
        </div>

        {/* Action Buttons - Mobile */}
        <div className="lg:hidden space-y-3">
          <Button
            onClick={handleFinish}
            disabled={!canFinish || isProcessing}
            className="w-full h-14 text-lg font-semibold"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                Processando...
              </>
            ) : (
              <>
                <ShieldCheck className="h-5 w-5 mr-2" />
                Finalizar Pedido
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={onBack}
            className="w-full"
            disabled={isProcessing}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>

      {/* Summary Column */}
      <div className="lg:col-span-2">
        <Card className="border shadow-sm sticky top-24">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Resumo do Pedido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Items by Supplier */}
            {Object.entries(itemsBySupplier).map(([supplierId, { storeName, items }]) => (
              <div key={supplierId} className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase">
                  {storeName}
                </p>
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-12 h-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Qtd: {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-medium">
                      R$ {(item.price * item.quantity).toFixed(2).replace(".", ",")}
                    </p>
                  </div>
                ))}
              </div>
            ))}

            <Separator />

            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>R$ {subtotal.toFixed(2).replace(".", ",")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Frete</span>
                <span>R$ {shipping.toFixed(2).replace(".", ",")}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span className="flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    Desconto
                  </span>
                  <span>- R$ {discount.toFixed(2).replace(".", ",")}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-primary">
                  R$ {total.toFixed(2).replace(".", ",")}
                </span>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="pt-2">
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Entregar em:
              </p>
              <p className="text-sm">
                {buyerData.endereco?.street}, {buyerData.endereco?.number}
              </p>
              <p className="text-xs text-muted-foreground">
                {buyerData.endereco?.neighborhood} - {buyerData.endereco?.city}/
                {buyerData.endereco?.state}
              </p>
            </div>

            {/* Action Buttons - Desktop */}
            <div className="hidden lg:block space-y-3 pt-4">
              <Button
                onClick={handleFinish}
                disabled={!canFinish || isProcessing}
                className="w-full h-12 font-semibold"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                    Processando...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-5 w-5 mr-2" />
                    Finalizar Pedido
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                onClick={onBack}
                className="w-full"
                disabled={isProcessing}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
