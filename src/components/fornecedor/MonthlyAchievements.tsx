import { useState, useEffect } from "react";
import { X, TrendingUp, TrendingDown, Trophy, Eye, MessageSquare, Handshake, DollarSign, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useSupplierSubscription } from "@/hooks/useSupplierSubscription";
import { formatCurrency } from "@/utils/formatCurrency";

interface MonthlyStats {
  topProducts: { name: string; count: number }[];
  profileViews: number;
  chatsInitiated: number;
  closedNegotiations: number;
  totalSold: number;
  totalViews: number;
}

const STORAGE_KEY = "nellor_monthly_achievements_dismissed";

function getMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export const MonthlyAchievements = () => {
  const { user } = useSupabaseAuth();
  const { subscription } = useSupplierSubscription();
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState<MonthlyStats | null>(null);
  const [previous, setPrevious] = useState<MonthlyStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    const dismissed = localStorage.getItem(STORAGE_KEY);
    const monthKey = getMonthKey();
    // Show only if not dismissed this month and we're past the 25th
    const day = new Date().getDate();
    if (dismissed === monthKey || day < 25) {
      setVisible(false);
      return;
    }
    loadStats();
  }, [user?.id]);

  const loadStats = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const now = new Date();
      const startCurrent = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const startPrev = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      const endPrev = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

      const [negCurr, negPrev, viewsCurr, viewsPrev, msgCurr, msgPrev] = await Promise.all([
        supabase.from("negotiations").select("product_name, agreed_price, quantity, status").eq("supplier_id", user.id).gte("created_at", startCurrent),
        supabase.from("negotiations").select("product_name, agreed_price, quantity, status").eq("supplier_id", user.id).gte("created_at", startPrev).lte("created_at", endPrev),
        supabase.from("product_views").select("id", { count: "exact", head: true }).in("product_id", (await supabase.from("products").select("id").eq("supplier_id", user.id)).data?.map((p: any) => p.id) || []).gte("created_at", startCurrent),
        supabase.from("product_views").select("id", { count: "exact", head: true }).in("product_id", (await supabase.from("products").select("id").eq("supplier_id", user.id)).data?.map((p: any) => p.id) || []).gte("created_at", startPrev).lte("created_at", endPrev),
        supabase.from("messages").select("id", { count: "exact", head: true }).eq("to_user", user.id).gte("created_at", startCurrent),
        supabase.from("messages").select("id", { count: "exact", head: true }).eq("to_user", user.id).gte("created_at", startPrev).lte("created_at", endPrev),
      ]);

      const buildStats = (negs: any[]): MonthlyStats => {
        const productCounts: Record<string, number> = {};
        let totalSold = 0;
        let closedCount = 0;
        negs.forEach((n: any) => {
          productCounts[n.product_name] = (productCounts[n.product_name] || 0) + 1;
          if (n.status === "delivered") {
            totalSold += (n.agreed_price || 0);
            closedCount++;
          }
        });
        const topProducts = Object.entries(productCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([name, count]) => ({ name, count }));
        return { topProducts, profileViews: 0, chatsInitiated: 0, closedNegotiations: closedCount, totalSold, totalViews: 0 };
      };

      const currStats = buildStats(negCurr.data || []);
      currStats.totalViews = viewsCurr.count || 0;
      currStats.chatsInitiated = msgCurr.count || 0;

      const prevStats = buildStats(negPrev.data || []);
      prevStats.totalViews = viewsPrev.count || 0;
      prevStats.chatsInitiated = msgPrev.count || 0;

      setCurrent(currStats);
      setPrevious(prevStats);
      setVisible(true);
    } catch (err) {
      console.error("Monthly stats error:", err);
    } finally {
      setLoading(false);
    }
  };

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, getMonthKey());
    setVisible(false);
  };

  const pctChange = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100);
  };

  if (!visible || !current || loading) return null;

  const metrics = [
    { label: "Negociações Fechadas", value: current.closedNegotiations, prev: previous?.closedNegotiations || 0, icon: Handshake },
    { label: "Total Vendido", value: current.totalSold, prev: previous?.totalSold || 0, icon: DollarSign, isCurrency: true },
    { label: "Visualizações", value: current.totalViews, prev: previous?.totalViews || 0, icon: Eye },
    { label: "Conversas Iniciadas", value: current.chatsInitiated, prev: previous?.chatsInitiated || 0, icon: MessageSquare },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-md" onClick={dismiss} />
      <div className="relative z-10 w-full max-w-md rounded-3xl bg-card border border-border shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div className="bg-gradient-to-br from-purple-600 to-violet-700 p-6 text-white relative">
          <Button variant="ghost" size="icon" onClick={dismiss} className="absolute top-3 right-3 text-white/70 hover:text-white hover:bg-white/10">
            <X className="h-5 w-5" />
          </Button>
          <Trophy className="h-10 w-10 mb-3 text-yellow-300" />
          <h2 className="text-xl font-bold">Suas Conquistas do Mês 🎉</h2>
          <p className="text-sm text-purple-100 mt-1">Resumo de {new Date().toLocaleString("pt-BR", { month: "long" })}</p>
        </div>

        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Top Products */}
          {current.topProducts.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                <Package className="h-3.5 w-3.5" /> Top Produtos Negociados
              </p>
              <div className="space-y-1.5">
                {current.topProducts.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="font-bold text-purple-600 w-5">{i + 1}º</span>
                    <span className="truncate flex-1">{p.name}</span>
                    <span className="text-muted-foreground text-xs">{p.count} neg.</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            {metrics.map((m) => {
              const change = pctChange(m.value, m.prev);
              const Icon = m.icon;
              return (
                <div key={m.label} className="bg-muted/50 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-[10px] font-medium text-muted-foreground">{m.label}</span>
                  </div>
                  <p className="text-lg font-bold">{m.isCurrency ? formatCurrency(m.value) : m.value}</p>
                  {previous && (
                    <div className={`flex items-center gap-0.5 text-[10px] mt-0.5 ${change >= 0 ? "text-green-600" : "text-red-500"}`}>
                      {change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {change >= 0 ? "+" : ""}{change}% vs mês anterior
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Subscription CTA */}
          <div className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30 rounded-xl p-4 text-center border border-purple-200 dark:border-purple-800">
            <p className="text-sm font-medium">
              E tudo isso pagando apenas{" "}
              <span className="text-purple-600 font-bold text-lg">
                {subscription?.price ? formatCurrency(subscription.price) : "R$ 0"}/mês
              </span>
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">
              Plano {subscription?.plan_name || "Grátis"}
            </p>
          </div>
        </div>

        <div className="p-4 border-t">
          <Button onClick={dismiss} className="w-full rounded-xl">
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
};
