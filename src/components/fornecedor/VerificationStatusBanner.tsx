import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIdentityVerification } from "@/hooks/useIdentityVerification";

export function VerificationStatusBanner() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data, statusLabel, canSell } = useIdentityVerification();
  const [dismissed, setDismissed] = useState(false);

  const isOnFinanceiro = location.pathname.startsWith("/fornecedor/financeiro");

  const tone = useMemo(() => {
    if (data.status === "verified") return "success";
    if (data.status === "review") return "warning";
    return "danger";
  }, [data.status]);

  if (dismissed) return null;

  if (tone === "success") {
    return (
      <div className="border-b border-border bg-muted/30 px-4 py-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4" />
            <span>
              Status da conta: <span className="font-medium text-foreground">{statusLabel}</span>
            </span>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setDismissed(true)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // warning / danger
  const Icon = tone === "warning" ? Clock : AlertTriangle;
  const bgClass =
    tone === "warning"
      ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
      : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
  const textClass = tone === "warning" ? "text-yellow-800 dark:text-yellow-300" : "text-red-800 dark:text-red-300";

  return (
    <div className={`border-b px-4 py-3 ${bgClass}`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className={`flex items-start sm:items-center gap-2 text-sm ${textClass}`}>
          <Icon className="h-4 w-4 flex-shrink-0 mt-0.5 sm:mt-0" />
          <div>
            <span className="font-medium">Status da conta: {statusLabel}.</span>
            <span className="hidden sm:inline ml-1">
              Enquanto não verificar, você não pode <strong>vender</strong> nem <strong>sacar</strong>.
            </span>
            <span className="sm:hidden block text-xs mt-0.5 opacity-90">
              Bloqueado para vender e sacar.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {!isOnFinanceiro && (
            <Button size="sm" className="w-full sm:w-auto" onClick={() => navigate("/fornecedor/financeiro")}
              aria-disabled={false}
            >
              Verificar agora
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDismissed(true)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
