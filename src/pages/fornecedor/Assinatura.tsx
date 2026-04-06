import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Copy, Clock, CreditCard, MessageCircle, ShieldCheck, Store, Package, Headphones } from "lucide-react";
import { toast } from "sonner";
import { useSupplierSubscription } from "@/hooks/useSupplierSubscription";

const PIX_KEY = "contato@nellor.com.br";
const WHATSAPP_NUMBER = "(11) 99999-9999";

const Assinatura = () => {
  const { subscription, isPending, isExpired, needsSubscription, createSubscription } = useSupplierSubscription();
  const [showPix, setShowPix] = useState(false);

  const handlePayPix = () => {
    setShowPix(true);
  };

  const handleCopyPix = () => {
    navigator.clipboard.writeText(PIX_KEY);
    toast.success("Chave PIX copiada!");
  };

  const handleConfirmPending = async () => {
    try {
      await createSubscription.mutateAsync("PIX");
      toast.success("Pagamento registrado! Aguarde a confirmação do admin.");
    } catch {
      toast.error("Erro ao registrar pagamento.");
    }
  };

  const benefits = [
    { icon: Store, text: "Loja ativa no marketplace" },
    { icon: Package, text: "Cadastro ilimitado de produtos" },
    { icon: MessageCircle, text: "Chat com compradores" },
    { icon: Headphones, text: "Suporte prioritário" },
    { icon: ShieldCheck, text: "Badge de fornecedor verificado" },
  ];

  if (isPending) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto">
            <Clock className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Aguardando Confirmação</h2>
          <p className="text-muted-foreground text-sm">
            Seu pagamento está sendo verificado. Assim que confirmado, sua loja será ativada automaticamente.
          </p>
          <Badge variant="outline" className="border-amber-500 text-amber-600">
            Status: Pendente
          </Badge>
          <p className="text-xs text-muted-foreground">
            Em caso de dúvida, entre em contato pelo WhatsApp: {WHATSAPP_NUMBER}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-lg w-full space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Ative sua Loja na Nellor</h1>
          <p className="text-muted-foreground text-sm">
            Para ativar sua loja no marketplace é necessário assinar o plano mensal.
          </p>
        </div>

        <Card className="p-6 space-y-6 border-2 border-primary/20">
          <div className="text-center">
            <Badge className="bg-primary/10 text-primary border-primary/20 mb-3">Plano Único</Badge>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-4xl font-bold text-primary">R$ 29</span>
              <span className="text-muted-foreground">/mês</span>
            </div>
          </div>

          <ul className="space-y-3">
            {benefits.map((b, i) => (
              <li key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <b.icon className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm text-foreground">{b.text}</span>
              </li>
            ))}
          </ul>

          {!showPix ? (
            <Button onClick={handlePayPix} className="w-full" size="lg">
              <CreditCard className="w-4 h-4 mr-2" />
              Pagar via PIX
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-4 space-y-3">
                <p className="text-sm font-medium text-foreground">Chave PIX (Email):</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-background rounded px-3 py-2 text-sm text-foreground border">
                    {PIX_KEY}
                  </code>
                  <Button variant="outline" size="icon" onClick={handleCopyPix}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• Valor: <strong>R$ 29,00</strong></p>
                  <p>• Após o pagamento, envie o comprovante pelo WhatsApp para <strong>{WHATSAPP_NUMBER}</strong> com seu email cadastrado.</p>
                </div>
              </div>

              <Button
                onClick={handleConfirmPending}
                className="w-full"
                variant="outline"
                disabled={createSubscription.isPending}
              >
                <Check className="w-4 h-4 mr-2" />
                {createSubscription.isPending ? "Registrando..." : "Já paguei, aguardando confirmação"}
              </Button>
            </div>
          )}
        </Card>

        {isExpired && (
          <p className="text-center text-sm text-destructive">
            Sua assinatura anterior expirou. Renove para reativar sua loja.
          </p>
        )}
      </div>
    </div>
  );
};

export default Assinatura;
