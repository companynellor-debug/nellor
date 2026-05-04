import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendingUp, DollarSign, Eye, Heart, Star, Package, ShoppingBag, MessageSquare,
  Loader2, ArrowUpRight, Award, Users,
} from "lucide-react";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Line, LineChart, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";

type Stats = {
  totalRevenue: number;
  totalDelivered: number;
  totalNegotiations: number;
  conversionRate: number;
  averageTicket: number;
  totalViews: number;
  totalFavorites: number;
  productsActive: number;
  averageRating: number;
  ratingsCount: number;
  uniqueBuyers: number;
  monthlyData: { month: string; negociacoes: number; receita: number }[];
  viewsLast30: { day: string; views: number }[];
  topProducts: { id: string; nome: string; views: number; favorites: number }[];
};

const empty: Stats = {
  totalRevenue: 0,
  totalDelivered: 0,
  totalNegotiations: 0,
  conversionRate: 0,
  averageTicket: 0,
  totalViews: 0,
  totalFavorites: 0,
  productsActive: 0,
  averageRating: 0,
  ratingsCount: 0,
  uniqueBuyers: 0,
  monthlyData: [],
  viewsLast30: [],
  topProducts: [],
};

const fmtBRL = (v: number) =>
  `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtNum = (v: number) => v.toLocaleString("pt-BR");

const Estatisticas = () => {
  const [loading, setLoading] = useState(true);
  const [s, setS] = useState<Stats>(empty);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch products first; reviews depend on product_ids
      const [
        { data: negotiations },
        { data: products },
      ] = await Promise.all([
        supabase.from("negotiations" as any).select("*").eq("supplier_id", user.id),
        supabase.from("products").select("id, nome, ativo, vendas_count").eq("supplier_id", user.id),
      ]);

      const negs = (negotiations || []) as any[];
      const prods = (products || []) as any[];
      const productIds = prods.map((p) => p.id).filter(Boolean);

      // Reviews: table is `reviews` (no supplier_id). Filter by product_id IN supplier products.
      let revs: any[] = [];
      if (productIds.length) {
        const { data: rev } = await supabase
          .from("reviews" as any)
          .select("rating")
          .in("product_id", productIds);
        revs = (rev || []) as any[];
      }

      // Views (last 30 days + total)
      let totalViews = 0;
      const viewsByDay: Record<string, number> = {};
      const productViewsCount: Record<string, number> = {};
      if (productIds.length) {
        const since = new Date(); since.setDate(since.getDate() - 30);
        const { data: views } = await supabase
          .from("product_views")
          .select("product_id, created_at")
          .in("product_id", productIds);
        const allViews = (views || []) as any[];
        totalViews = allViews.length;
        // Initialize last 30 days with zero
        for (let i = 29; i >= 0; i--) {
          const d = new Date(); d.setDate(d.getDate() - i);
          viewsByDay[d.toISOString().slice(5, 10)] = 0;
        }
        allViews.forEach((v) => {
          const d = new Date(v.created_at);
          if (d >= since) {
            const k = d.toISOString().slice(5, 10);
            if (k in viewsByDay) viewsByDay[k] += 1;
          }
          productViewsCount[v.product_id] = (productViewsCount[v.product_id] || 0) + 1;
        });
      }

      // Favorites total + per-product
      let totalFavorites = 0;
      const productFavCount: Record<string, number> = {};
      if (productIds.length) {
        const { data: favs } = await (supabase.rpc(
          "get_product_favorites_counts" as any,
          { product_ids: productIds }
        ) as any);
        (favs || []).forEach((row: any) => {
          productFavCount[row.product_id] = Number(row.count) || 0;
          totalFavorites += Number(row.count) || 0;
        });
      }

      // Negotiation metrics — agreed_price IS the deal total; do NOT multiply by quantity
      // Fallback: if agreed_price missing, compute from unit_price * quantity
      const dealValue = (n: any) => {
        const ap = Number(n.agreed_price);
        if (Number.isFinite(ap) && ap > 0) return ap;
        const up = Number(n.unit_price || 0);
        const qty = Number(n.quantity || 1);
        return up * qty;
      };
      const delivered = negs.filter((n) => n.status === "delivered");
      const totalRevenue = delivered.reduce((sum, n) => sum + dealValue(n), 0);
      const totalNegotiations = negs.length;
      const totalDelivered = delivered.length;
      const conversionRate = totalNegotiations > 0
        ? (totalDelivered / totalNegotiations) * 100
        : 0;
      const averageTicket = totalDelivered > 0 ? totalRevenue / totalDelivered : 0;
      const uniqueBuyers = new Set(negs.map((n) => n.buyer_id)).size;

      // Rating
      const ratingsCount = revs.length;
      const averageRating = ratingsCount > 0
        ? revs.reduce((sum, r) => sum + Number(r.rating || 0), 0) / ratingsCount
        : 0;

      // Monthly data (last 6 months)
      const now = new Date();
      const monthKeys: { key: string; label: string }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        monthKeys.push({
          key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
          label: d.toLocaleDateString("pt-BR", { month: "short" }),
        });
      }
      const monthlyMap: Record<string, { negociacoes: number; receita: number }> = {};
      monthKeys.forEach((m) => {
        monthlyMap[m.key] = { negociacoes: 0, receita: 0 };
      });
      negs.forEach((n) => {
        const d = new Date(n.created_at);
        const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (k in monthlyMap) {
          monthlyMap[k].negociacoes += 1;
          if (n.status === "delivered") {
            monthlyMap[k].receita += dealValue(n);
          }
        }
      });

      // Top products by views
      const topProducts = prods
        .map((p) => ({
          id: p.id,
          nome: p.nome,
          views: productViewsCount[p.id] || 0,
          favorites: productFavCount[p.id] || 0,
        }))
        .sort((a, b) => b.views + b.favorites - (a.views + a.favorites))
        .slice(0, 5);

      setS({
        totalRevenue,
        totalDelivered,
        totalNegotiations,
        conversionRate,
        averageTicket,
        totalViews,
        totalFavorites,
        productsActive: prods.filter((p) => p.ativo !== false).length,
        averageRating,
        ratingsCount,
        uniqueBuyers,
        monthlyData: monthKeys.map((m) => ({
          month: m.label,
          negociacoes: monthlyMap[m.key].negociacoes,
          receita: monthlyMap[m.key].receita,
        })),
        viewsLast30: Object.entries(viewsByDay).map(([day, views]) => ({ day, views })),
        topProducts,
      });
    } catch (e) {
      console.error("Error fetching stats:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-baseline gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Relatórios</h1>
        <p className="text-sm text-muted-foreground">
          Métricas em tempo real da sua loja
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        <KPI icon={DollarSign} label="Receita total" value={fmtBRL(s.totalRevenue)} />
        <KPI icon={ShoppingBag} label="Vendas concluídas" value={fmtNum(s.totalDelivered)} />
        <KPI icon={MessageSquare} label="Negociações" value={fmtNum(s.totalNegotiations)} />
        <KPI icon={ArrowUpRight} label="Taxa de conversão" value={`${s.conversionRate.toFixed(1)}%`} />
        <KPI icon={Eye} label="Visualizações" value={fmtNum(s.totalViews)} />
        <KPI icon={Heart} label="Favoritos" value={fmtNum(s.totalFavorites)} />
        <KPI icon={Star} label="Avaliação média" value={s.ratingsCount ? s.averageRating.toFixed(1) : "—"} sub={s.ratingsCount ? `${s.ratingsCount} avaliações` : "Sem avaliações"} />
        <KPI icon={Users} label="Compradores únicos" value={fmtNum(s.uniqueBuyers)} />
        <KPI icon={Package} label="Produtos ativos" value={fmtNum(s.productsActive)} />
        <KPI icon={Award} label="Ticket médio" value={fmtBRL(s.averageTicket)} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Receita & Negociações (últimos 6 meses)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              className="h-[260px]"
              config={{
                negociacoes: { label: "Negociações", color: "hsl(var(--primary))" },
                receita: { label: "Receita", color: "#10b981" },
              }}
            >
              <BarChart data={s.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="negociacoes" fill="var(--color-negociacoes)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Visualizações (últimos 30 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={s.viewsLast30}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={10} interval={4} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Line type="monotone" dataKey="views" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Top 5 produtos mais visualizados</CardTitle>
        </CardHeader>
        <CardContent>
          {s.topProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Cadastre produtos para começar a coletar métricas
            </p>
          ) : (
            <div className="space-y-2">
              {s.topProducts.map((p, idx) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 hover:bg-muted transition-colors"
                  data-testid={`top-product-${p.id}`}
                >
                  <span className="h-8 w-8 rounded-lg bg-primary/15 text-primary text-sm font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <p className="flex-1 text-sm font-medium truncate">{p.nome}</p>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Eye className="h-3 w-3" /> {p.views}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Heart className="h-3 w-3" /> {p.favorites}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const ACCENT_BG: Record<string, string> = {
  emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
  violet: "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400",
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  sky: "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400",
  rose: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400",
  yellow: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400",
  indigo: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400",
  teal: "bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400",
  fuchsia: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950/40 dark:text-fuchsia-400",
};

const KPI = ({
  icon: Icon, label, value, sub,
}: {
  icon: typeof TrendingUp; label: string; value: string; sub?: string; accent?: string;
}) => (
  <Card className="rounded-xl border-border/60 hover:border-foreground/20 transition-colors">
    <CardContent className="p-4">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className="h-3.5 w-3.5 text-muted-foreground/70 stroke-[1.8]" />
        <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-[1.65rem] font-bold leading-tight tracking-tight truncate">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground/70 mt-0.5 truncate">{sub}</p>}
    </CardContent>
  </Card>
);

export default Estatisticas;
