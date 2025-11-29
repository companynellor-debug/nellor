import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CreditCard, Shield, Zap, CheckCircle2, ExternalLink } from "lucide-react";

interface StripeConnectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StripeConnectModal({ open, onOpenChange }: StripeConnectModalProps) {
  const handleConnectStripe = () => {
    // TODO: Integração real com Stripe Connect
    // Aqui será chamado: create-connect-link endpoint
    console.log("TODO: Chamar endpoint create-connect-link para redirecionar ao Stripe Connect");
    
    // Por enquanto, apenas simula o fluxo
    alert("Funcionalidade em desenvolvimento. Em breve você poderá conectar sua conta Stripe.");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <CreditCard className="h-6 w-6 text-primary" />
            Conectar com Stripe
          </DialogTitle>
          <DialogDescription>
            Conecte sua conta Stripe para receber pagamentos automaticamente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Benefícios */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                <Zap className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h4 className="font-medium text-sm">Pagamentos Automáticos</h4>
                <p className="text-xs text-muted-foreground">
                  Receba seu dinheiro automaticamente toda semana, sem precisar solicitar saque.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h4 className="font-medium text-sm">Segurança Total</h4>
                <p className="text-xs text-muted-foreground">
                  Stripe é líder mundial em pagamentos online, usado por milhões de empresas.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                <CheckCircle2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h4 className="font-medium text-sm">Sem Saque Manual</h4>
                <p className="text-xs text-muted-foreground">
                  Não existe mais necessidade de solicitar saque. Tudo é automático!
                </p>
              </div>
            </div>
          </div>

          {/* Como funciona */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium text-sm mb-2">Como funciona?</h4>
            <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Clique em "Conectar com Stripe" abaixo</li>
              <li>Você será redirecionado para criar ou conectar sua conta Stripe</li>
              <li>Preencha seus dados bancários no Stripe</li>
              <li>Pronto! Seus pagamentos serão automáticos</li>
            </ol>
          </div>

          {/* Informação sobre taxas */}
          <div className="text-xs text-muted-foreground bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <strong className="text-yellow-800 dark:text-yellow-300">Sobre as taxas:</strong>
            <p className="mt-1">
              • Plano Grátis: 7,5% de comissão + taxa Stripe por transação
            </p>
            <p>
              • Plano Premium (R$79/mês): Apenas taxa Stripe, sem comissão
            </p>
          </div>

          {/* Botão de conexão */}
          <Button 
            className="w-full" 
            size="lg"
            onClick={handleConnectStripe}
            data-test="connect-stripe-btn"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Conectar com Stripe
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Ao conectar, você concorda com os{" "}
            <a href="#" className="underline">Termos de Serviço</a> do Stripe
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
