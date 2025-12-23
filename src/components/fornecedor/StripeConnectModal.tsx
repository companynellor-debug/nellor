import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CreditCard, Shield, Zap, CheckCircle2, ExternalLink, Loader2, AlertCircle } from "lucide-react";
import { useStripeConnect } from "@/hooks/useStripeConnect";
import { Badge } from "@/components/ui/badge";

interface StripeConnectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StripeConnectModal({ open, onOpenChange }: StripeConnectModalProps) {
  const { loading, accountStatus, startOnboarding, checkAccountStatus } = useStripeConnect();
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (open) {
      setChecking(true);
      checkAccountStatus().finally(() => setChecking(false));
    }
  }, [open]);

  const handleConnectStripe = async () => {
    const url = await startOnboarding(window.location.origin);
    if (url) {
      window.location.href = url;
    }
  };

  const isFullyConnected = accountStatus?.connected && 
    accountStatus?.chargesEnabled && 
    accountStatus?.payoutsEnabled;

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
          {/* Status da conta */}
          {checking ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Verificando status...</span>
            </div>
          ) : accountStatus?.connected ? (
            <div className={`p-4 rounded-lg border ${isFullyConnected ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'}`}>
              <div className="flex items-start gap-3">
                {isFullyConnected ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                )}
                <div className="flex-1">
                  <h4 className="font-medium text-sm">
                    {isFullyConnected ? 'Conta Stripe Conectada!' : 'Configuração Incompleta'}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isFullyConnected 
                      ? 'Você está pronto para receber pagamentos automáticos.'
                      : 'Complete a configuração da sua conta Stripe para receber pagamentos.'}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant={accountStatus.chargesEnabled ? "default" : "secondary"}>
                      {accountStatus.chargesEnabled ? "✓ Cobranças" : "✗ Cobranças"}
                    </Badge>
                    <Badge variant={accountStatus.payoutsEnabled ? "default" : "secondary"}>
                      {accountStatus.payoutsEnabled ? "✓ Saques" : "✗ Saques"}
                    </Badge>
                    <Badge variant={accountStatus.detailsSubmitted ? "default" : "secondary"}>
                      {accountStatus.detailsSubmitted ? "✓ Dados" : "✗ Dados"}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* Benefícios */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                <Zap className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h4 className="font-medium text-sm">Pagamentos Automáticos</h4>
                <p className="text-xs text-muted-foreground">
                  Receba seu dinheiro automaticamente, sem precisar solicitar saque.
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
                <h4 className="font-medium text-sm">Split Automático</h4>
                <p className="text-xs text-muted-foreground">
                  O valor da venda é transferido automaticamente para sua conta.
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
              <li>Pronto! Seus pagamentos serão automáticos com split de 7,5%</li>
            </ol>
          </div>

          {/* Informação sobre taxas */}
          <div className="text-xs text-muted-foreground bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <strong className="text-yellow-800 dark:text-yellow-300">Sobre as taxas:</strong>
            <p className="mt-1">
              • Comissão Nellor: 7,5% por venda (descontado automaticamente)
            </p>
            <p>
              • Taxa Stripe: ~3,99% + R$0,39 por transação
            </p>
          </div>

          {/* Botão de conexão */}
          <Button 
            className="w-full" 
            size="lg"
            onClick={handleConnectStripe}
            disabled={loading || isFullyConnected}
            data-test="connect-stripe-btn"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Conectando...
              </>
            ) : isFullyConnected ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Conta Conectada
              </>
            ) : accountStatus?.connected ? (
              <>
                <ExternalLink className="h-4 w-4 mr-2" />
                Continuar Configuração
              </>
            ) : (
              <>
                <ExternalLink className="h-4 w-4 mr-2" />
                Conectar com Stripe
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Ao conectar, você concorda com os{" "}
            <a href="https://stripe.com/br/legal" target="_blank" rel="noopener noreferrer" className="underline">
              Termos de Serviço
            </a> do Stripe
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
