import { useState, useEffect } from "react";
import { AlertTriangle, CreditCard, CheckCircle2, ExternalLink, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStripeConnect } from "@/hooks/useStripeConnect";
import { StripeConnectModal } from "./StripeConnectModal";

export function StripeStatusBanner() {
  const { loading, accountStatus, checkAccountStatus, startOnboarding } = useStripeConnect();
  const [showModal, setShowModal] = useState(false);
  const [checking, setChecking] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setChecking(true);
    checkAccountStatus().finally(() => setChecking(false));
  }, []);

  const handleConnect = async () => {
    const url = await startOnboarding(window.location.origin);
    if (url) {
      window.location.href = url;
    }
  };

  const isFullyConnected = accountStatus?.connected && 
    accountStatus?.chargesEnabled && 
    accountStatus?.payoutsEnabled;

  // Don't show anything while checking or if fully connected and dismissed
  if (checking) {
    return (
      <div className="bg-muted/50 border-b border-border px-4 py-2">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Verificando status do Stripe...</span>
        </div>
      </div>
    );
  }

  // Fully connected - show success banner briefly or allow dismiss
  if (isFullyConnected) {
    if (dismissed) return null;
    
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800 px-4 py-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm text-green-800 dark:text-green-300">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            <span className="font-medium">Stripe conectado!</span>
            <span className="hidden sm:inline text-green-600 dark:text-green-400">
              Você está pronto para receber pagamentos automáticos.
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-green-600 hover:text-green-800 hover:bg-green-100"
            onClick={() => setDismissed(true)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Partially connected - needs to complete setup
  if (accountStatus?.connected && !isFullyConnected) {
    return (
      <>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 px-4 py-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-start sm:items-center gap-2 text-sm text-yellow-800 dark:text-yellow-300">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <span className="font-medium">Configuração do Stripe incompleta!</span>
                <span className="hidden sm:inline ml-1 text-yellow-600 dark:text-yellow-400">
                  Complete a configuração para receber pagamentos.
                </span>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="border-yellow-300 text-yellow-800 hover:bg-yellow-100 dark:border-yellow-700 dark:text-yellow-300 dark:hover:bg-yellow-900/30 w-full sm:w-auto"
              onClick={handleConnect}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4 mr-2" />
              )}
              Continuar Configuração
            </Button>
          </div>
        </div>
        <StripeConnectModal open={showModal} onOpenChange={setShowModal} />
      </>
    );
  }

  // Not connected at all - show warning
  return (
    <>
      <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 px-4 py-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-start sm:items-center gap-2 text-sm text-red-800 dark:text-red-300">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <span className="font-medium">Stripe não conectado!</span>
              <span className="hidden sm:inline ml-1 text-red-600 dark:text-red-400">
                Você não pode receber pedidos sem conectar sua conta Stripe.
              </span>
              <span className="sm:hidden block text-xs text-red-600 dark:text-red-400 mt-0.5">
                Conecte para receber pedidos.
              </span>
            </div>
          </div>
          <Button
            size="sm"
            className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto"
            onClick={() => setShowModal(true)}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CreditCard className="h-4 w-4 mr-2" />
            )}
            Conectar Stripe
          </Button>
        </div>
      </div>
      <StripeConnectModal open={showModal} onOpenChange={setShowModal} />
    </>
  );
}
