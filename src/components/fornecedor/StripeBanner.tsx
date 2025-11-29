import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StripeConnectModal } from "./StripeConnectModal";

interface StripeBannerProps {
  isStripeConnected?: boolean;
}

export function StripeBanner({ isStripeConnected = false }: StripeBannerProps) {
  const [showModal, setShowModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Não mostrar se já conectou Stripe ou se dispensou temporariamente
  if (isStripeConnected || dismissed) {
    return null;
  }

  return (
    <>
      <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>⚠️ Para poder receber pagamentos e realizar saques, conecte sua conta Stripe.</strong>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="default"
            onClick={() => setShowModal(true)}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            Conectar agora
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-amber-600 hover:text-amber-800"
            onClick={() => setDismissed(true)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <StripeConnectModal open={showModal} onOpenChange={setShowModal} />
    </>
  );
}
