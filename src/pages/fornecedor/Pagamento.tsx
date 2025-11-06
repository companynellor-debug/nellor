import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CreditCard, QrCode, Barcode, Lock } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const Pagamento = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const { planoData, selectedPlan } = location.state || {};
  
  const [paymentMethod, setPaymentMethod] = useState("credit-card");
  const [isProcessing, setIsProcessing] = useState(false);

  if (!planoData || !selectedPlan) {
    navigate("/login-fornecedor");
    return null;
  }

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // Simular processamento de pagamento
    setTimeout(() => {
      // Criar conta do fornecedor
      login(planoData.email, planoData.password, planoData.companyName, 'fornecedor');
      
      toast.success("Pagamento confirmado! Bem-vindo à nellor!");
      
      setTimeout(() => {
        navigate("/fornecedor");
      }, 1000);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent via-secondary to-primary p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Finalizar Assinatura
          </h1>
          <p className="text-white/80">
            Complete o pagamento para ativar sua conta
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Resumo do Pedido */}
          <Card className="md:col-span-1 p-6 h-fit">
            <h2 className="text-xl font-bold mb-4">Resumo</h2>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Plano</p>
                <p className="font-semibold text-lg">{selectedPlan.name}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Empresa</p>
                <p className="font-medium">{planoData.companyName}</p>
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-between items-baseline mb-2">
                  <span className="text-sm text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{selectedPlan.price}</span>
                </div>
                <div className="flex justify-between items-baseline mb-4">
                  <span className="text-sm text-muted-foreground">Taxa de setup</span>
                  <span className="font-medium text-green-600">Grátis</span>
                </div>
                <div className="flex justify-between items-baseline pt-4 border-t">
                  <span className="font-bold">Total</span>
                  <span className="text-2xl font-bold text-primary">{selectedPlan.price}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Cobrança mensal recorrente
                </p>
              </div>
            </div>
          </Card>

          {/* Formulário de Pagamento */}
          <Card className="md:col-span-2 p-6">
            <form onSubmit={handlePayment} className="space-y-6">
              <div>
                <h2 className="text-xl font-bold mb-4">Método de Pagamento</h2>
                
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="space-y-3">
                    <Label
                      htmlFor="credit-card"
                      className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        paymentMethod === "credit-card"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <RadioGroupItem value="credit-card" id="credit-card" />
                      <CreditCard className="w-5 h-5" />
                      <span className="font-medium">Cartão de Crédito</span>
                    </Label>

                    <Label
                      htmlFor="pix"
                      className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        paymentMethod === "pix"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <RadioGroupItem value="pix" id="pix" />
                      <QrCode className="w-5 h-5" />
                      <span className="font-medium">PIX</span>
                      <span className="ml-auto text-sm text-green-600">Aprovação instantânea</span>
                    </Label>

                    <Label
                      htmlFor="boleto"
                      className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        paymentMethod === "boleto"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <RadioGroupItem value="boleto" id="boleto" />
                      <Barcode className="w-5 h-5" />
                      <span className="font-medium">Boleto Bancário</span>
                      <span className="ml-auto text-sm text-muted-foreground">Até 3 dias úteis</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {paymentMethod === "credit-card" && (
                <div className="space-y-4 pt-4 border-t">
                  <div>
                    <Label htmlFor="card-number">Número do Cartão</Label>
                    <Input
                      id="card-number"
                      placeholder="1234 5678 9012 3456"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expiry">Validade</Label>
                      <Input
                        id="expiry"
                        placeholder="MM/AA"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="cvv">CVV</Label>
                      <Input
                        id="cvv"
                        placeholder="123"
                        maxLength={4}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="card-name">Nome no Cartão</Label>
                    <Input
                      id="card-name"
                      placeholder="Nome como está no cartão"
                      required
                    />
                  </div>
                </div>
              )}

              {paymentMethod === "pix" && (
                <div className="pt-4 border-t">
                  <div className="bg-muted p-6 rounded-lg text-center">
                    <QrCode className="w-16 h-16 mx-auto mb-4 text-primary" />
                    <p className="text-sm text-muted-foreground">
                      Após clicar em confirmar, você receberá o QR Code para pagamento via PIX
                    </p>
                  </div>
                </div>
              )}

              {paymentMethod === "boleto" && (
                <div className="pt-4 border-t">
                  <div className="bg-muted p-6 rounded-lg text-center">
                    <Barcode className="w-16 h-16 mx-auto mb-4 text-primary" />
                    <p className="text-sm text-muted-foreground">
                      Após clicar em confirmar, você receberá o boleto por email
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm text-muted-foreground pt-4">
                <Lock className="w-4 h-4" />
                <span>Pagamento 100% seguro e criptografado</span>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full bg-primary"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processando...
                  </span>
                ) : (
                  `Confirmar Pagamento - ${selectedPlan.price}`
                )}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Pagamento;
