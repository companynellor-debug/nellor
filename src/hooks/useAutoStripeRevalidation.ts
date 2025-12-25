import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

type OrderLike = {
  id: string;
  payment_method?: string | null;
  payment_status?: string | null;
  stripe_session_id?: string | null;
};

interface Options {
  orders: OrderLike[];
  enabled?: boolean;
  intervalMs?: number;
}

/**
 * Fallback automático do webhook: tenta revalidar pagamentos pendentes via Stripe
 * chamando a edge function `stripe-verify-payment`.
 *
 * IMPORTANT: o frontend não atualiza status; ele apenas dispara a verificação no backend.
 */
export function useAutoStripeRevalidation({
  orders,
  enabled = true,
  intervalMs = 15_000, // Verificar a cada 15 segundos para atualização mais rápida
}: Options) {
  const runningRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const tick = async () => {
      if (runningRef.current) return;
      runningRef.current = true;
      try {
        const candidates = (orders || []).filter(
          (o) =>
            o.payment_method === "cartao" &&
            o.payment_status === "pending" &&
            !!o.stripe_session_id
        );

        if (candidates.length === 0) return;

        await Promise.allSettled(
          candidates.map((o) =>
            supabase.functions.invoke("stripe-verify-payment", {
              body: { sessionId: o.stripe_session_id },
            })
          )
        );
      } finally {
        runningRef.current = false;
      }
    };

    // dispara 1x imediatamente, depois em intervalos
    tick();
    const id = window.setInterval(tick, intervalMs);

    return () => {
      window.clearInterval(id);
    };
  }, [enabled, intervalMs, orders]);
}
