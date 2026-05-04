import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trophy, Share2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { toast } from "sonner";

const STORAGE_KEY = "nellor_first_sale_celebrated";

export const FirstSaleCelebration = () => {
  const { user, profile } = useSupabaseAuth();
  const [open, setOpen] = useState(false);
  const [revenue, setRevenue] = useState(0);

  useEffect(() => {
    if (!user?.id || profile?.tipo !== "fornecedor") return;
    const key = `${STORAGE_KEY}_${user.id}`;
    if (localStorage.getItem(key) === "1") return;

    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("negotiations" as any)
        .select("agreed_price, unit_price, quantity")
        .eq("supplier_id", user.id)
        .eq("status", "delivered")
        .order("delivery_confirmed_at", { ascending: true })
        .limit(1);

      if (cancelled || error || !data || data.length === 0) return;
      const n: any = data[0];
      const value = Number(n.agreed_price) > 0
        ? Number(n.agreed_price)
        : Number(n.unit_price || 0) * Number(n.quantity || 1);
      setRevenue(value);
      setOpen(true);
      localStorage.setItem(key, "1");
    })();

    return () => { cancelled = true; };
  }, [user?.id, profile?.tipo]);

  const handleShare = async () => {
    const text = `🎉 Acabei de fazer minha primeira venda na Nellor! Marketplace atacadista B2B com negociação direta no chat.`;
    const url = "https://nellor.app";
    try {
      if (navigator.share) {
        await navigator.share({ title: "Primeira venda na Nellor", text, url });
      } else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        toast.success("Texto copiado! Cole onde quiser compartilhar.");
      }
    } catch {
      // silently ignore - user cancelled share
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="max-w-md p-0 overflow-hidden border-0 rounded-3xl"
        data-testid="first-sale-modal"
      >
        {/* Confetti-ish header */}
        <div
          className="relative px-6 pt-10 pb-8 text-white text-center overflow-hidden"
          style={{
            background:
              "radial-gradient(circle at 30% 0%, #5b32d6 0%, #3e199e 50%, #1a0d4d 100%)",
          }}
        >
          <button
            onClick={() => setOpen(false)}
            className="absolute top-3 right-3 h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Decorative dots */}
          <span className="absolute top-4 left-6 h-2 w-2 rounded-full bg-yellow-300/80" />
          <span className="absolute top-12 left-14 h-1.5 w-1.5 rounded-full bg-pink-300/80" />
          <span className="absolute top-8 right-12 h-2 w-2 rounded-full bg-emerald-300/80" />
          <span className="absolute bottom-6 left-10 h-1.5 w-1.5 rounded-full bg-sky-300/80" />
          <span className="absolute bottom-10 right-8 h-2 w-2 rounded-full bg-violet-300/80" />

          <div className="relative z-10 inline-flex items-center justify-center h-20 w-20 rounded-3xl bg-gradient-to-br from-yellow-400 to-amber-500 shadow-2xl shadow-amber-500/40 mb-4">
            <Trophy className="h-10 w-10 text-white" strokeWidth={2.2} />
          </div>

          <h2 className="text-2xl font-extrabold tracking-tight">Sua primeira venda!</h2>
          <p className="mt-2 text-sm text-white/80 max-w-xs mx-auto">
            Parabéns, {profile?.nome?.split(" ")[0] || "vendedor"}! Você acabou de entrar
            no clube dos vendedores ativos da Nellor.
          </p>
          {revenue > 0 && (
            <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm ring-1 ring-white/20">
              <span className="text-xs font-semibold text-white/70">RECEITA DA 1ª VENDA</span>
              <span className="text-base font-bold tabular-nums">
                R$ {revenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </div>

        <div className="p-6 space-y-3">
          <p className="text-sm text-muted-foreground text-center leading-relaxed">
            Mantenha estoque atualizado, responda mensagens em até 5 minutos e capriche
            nas fotos — assim você dobra suas chances de fechar a 2ª venda nesta semana.
          </p>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)} className="flex-1 rounded-full">
              Continuar
            </Button>
            <Button
              onClick={handleShare}
              className="flex-1 rounded-full"
              data-testid="first-sale-share"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Compartilhar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FirstSaleCelebration;
