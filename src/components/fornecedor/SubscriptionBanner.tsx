import { useSupplierSubscription } from "@/hooks/useSupplierSubscription";
import { AlertTriangle, Clock, XCircle, CreditCard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const SubscriptionBanner = () => {
  const { subscription, isLoading, isActive, isPending, isExpired, needsSubscription, daysRemaining } = useSupplierSubscription();
  const navigate = useNavigate();

  if (isLoading) return null;

  // No subscription at all
  if (needsSubscription && !isPending) {
    return (
      <div className="bg-destructive/10 border-b border-destructive/30 px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <CreditCard className="w-4 h-4 text-destructive flex-shrink-0" />
          <p className="text-sm text-destructive truncate">
            Sua loja precisa de uma assinatura ativa. Escolha um plano a partir de R$ 0/mês.
          </p>
        </div>
        <Button size="sm" variant="destructive" onClick={() => navigate("/fornecedor/planos")} className="flex-shrink-0">
          Ver Planos
        </Button>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800 px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-200 truncate">
            Sua assinatura está pendente de confirmação pelo administrador.
          </p>
        </div>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="bg-destructive/10 border-b border-destructive/30 px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <XCircle className="w-4 h-4 text-destructive flex-shrink-0" />
          <p className="text-sm text-destructive truncate">
            Sua assinatura expirou. Seus produtos estão ocultos. Renove agora.
          </p>
        </div>
        <Button size="sm" variant="destructive" onClick={() => navigate("/fornecedor/assinatura")} className="flex-shrink-0">
          Renovar
        </Button>
      </div>
    );
  }

  if (isActive && daysRemaining !== null && daysRemaining <= 7) {
    const isUrgent = daysRemaining <= 3;
    return (
      <div className={`${isUrgent ? "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800" : "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800"} border-b px-4 py-3 flex items-center justify-between gap-3`}>
        <div className="flex items-center gap-2 min-w-0">
          <AlertTriangle className={`w-4 h-4 flex-shrink-0 ${isUrgent ? "text-orange-600" : "text-amber-600"}`} />
          <p className={`text-sm truncate ${isUrgent ? "text-orange-800 dark:text-orange-200" : "text-amber-800 dark:text-amber-200"}`}>
            Sua assinatura vence em {daysRemaining} dia{daysRemaining !== 1 ? "s" : ""}. Renove para manter sua loja ativa.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => navigate("/fornecedor/assinatura")} className="flex-shrink-0">
          Renovar
        </Button>
      </div>
    );
  }

  return null;
};
