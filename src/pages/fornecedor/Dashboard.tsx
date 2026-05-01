import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ShoppingBag, MessageSquare, Users, BarChart3, TrendingUp, TrendingDown,
  Package, Eye, Heart, ChevronRight, Hand,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/utils/formatCurrency";
import heroStore from "@/assets/dashboard-hero-store.png";

type ProductRow = {
  id: string;
  nome: string;
  preco: number;
  estoque: number;
  ativo: boolean;
  imagens: string[] | null;
  vendas_count: number | null;
  rating_medio: number | null;
  total_reviews: number | null;
  created_at: string;
};

type NegotiationRow = {
  id: string;
  product_id: string | null;
  product_name: string;
  buyer_id: string;
  agreed_price: number;
  quantity: number;
  status: string;
  created_at: string;
};

type ProductTab = "todos" | "ativos" | "pausados";

const statusBadge = (status: string) => {
  const map: Record<string, { label: string; className: string }> = {
    delivered: { label: "Pago", className: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" },
    shipped: { label: "Enviado", className: "bg-violet-100 text-violet-700 hover:bg-violet-100" },
    accepted: { label: "Aceita", className: "bg-blue-100 text-blue-700 hover:bg-blue-100" },
    pending: { label: "Pendente", className: "bg-amber-100 text-amber-700 hover:bg-amber-100" },
    cancelled: { label: "Cancelada", className: "bg-rose-100 text-rose-700 hover:bg-rose-100" },
  };
  const v = map[status] ?? { label: status, className: "bg-muted text-muted-foreground" };
  return <Badge variant="secondary" className={`rounded-full font-medium ${v.className}`}>{v.label}</Badge>;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { profile } = useSupabaseAuth();

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [negotiations, setNegotiations] = useState<NegotiationRow[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [productViews, setProductViews] = useState<Record<string, number>>({});
  const [productNegotiationsCount, setProductNegotiationsCount] = useState<Record<string, number>>({});
  const [productFavorites, setProductFavorites] = useState<Record<string, number>>({});
  const [buyersMap, setBuyersMap] = useState<Record<string, { nome: string; foto: string | null }>>({});
  const [activeTab, setActiveTab] = useState<ProductTab>("todos");

  useEffect(() => {
    if (!profile?.id) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const supplierId = profile.id;
        const now = new Date();
        const startCurrent = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const startPrev = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
        const endPrev = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

        const [
          { data: prods },
          { data: negs },
          { count: unread },
        ] = await Promise.all([
          supabase
            .from("products")
            .select("id, nome, preco, estoque, ativo, imagens, vendas_count, rating_medio, total_reviews, created_at")
            .eq("supplier_id", supplierId)
            .order("created_at", { ascending: false }),
          supabase
            .from("negotiations")
            .select("id, product_id, product_name, buyer_id, agreed_price, quantity, status, created_at")
            .eq("supplier_id", supplierId)
            .order("created_at", { ascending: false }),
          supabase
            .from("messages")
            .select("id", { count: "exact", head: true })
            .eq("to_user", supplierId)
            .eq("read", false),
        ]);

        if (cancelled) return;

        const productList = (prods || []) as ProductRow[];
        const negotiationList = (negs || []) as NegotiationRow[];
        setProducts(productList);
        setNegotiations(negotiationList);
        setUnreadMessages(unread || 0);

        // Buyer profiles for recent orders
        const buyerIds = Array.from(new Set(negotiationList.slice(0, 10).map(n => n.buyer_id))).filter(Boolean);
        if (buyerIds.length) {
          const { data: profs } = await supabase
            .from("profiles")
            .select("id, nome, foto_perfil_url")
            .in("id", buyerIds);
          const map: Record<string, { nome: string; foto: string | null }> = {};
          (profs || []).forEach((p: any) => { map[p.id] = { nome: p.nome, foto: p.foto_perfil_url }; });
          if (!cancelled) setBuyersMap(map);
        }

        // Per-product metrics
        const productIds = productList.map(p => p.id);
        if (productIds.length) {
          const [{ data: views }, { data: favs }] = await Promise.all([
            supabase.from("product_views").select("product_id").in("product_id", productIds),
            supabase.from("collection_items" as any).select("reference_id").in("reference_id", productIds).eq("type", "product" as any),
          ]);
          if (!cancelled) {
            const v: Record<string, number> = {};
            (views || []).forEach((row: any) => { v[row.product_id] = (v[row.product_id] || 0) + 1; });
            setProductViews(v);

            const f: Record<string, number> = {};
            (favs || []).forEach((row: any) => { f[row.reference_id] = (f[row.reference_id] || 0) + 1; });
            setProductFavorites(f);
          }
        }

        // Negotiations count per product
        const negCount: Record<string, number> = {};
        negotiationList.forEach(n => {
          if (n.product_id) negCount[n.product_id] = (negCount[n.product_id] || 0) + 1;
        });
        if (!cancelled) setProductNegotiationsCount(negCount);
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [profile?.id]);

  // KPIs
  const kpis = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const inRange = (d: Date, a: Date, b: Date) => d >= a && d <= b;

    const paid = negotiations.filter(n => n.status === "delivered" || n.status === "shipped");
    const monthRevenue = paid
      .filter(n => new Date(n.created_at) >= monthStart)
      .reduce((s, n) => s + Number(n.agreed_price || 0), 0);
    const prevRevenue = paid
      .filter(n => inRange(new Date(n.created_at), prevStart, prevEnd))
      .reduce((s, n) => s + Number(n.agreed_price || 0), 0);

    const monthOrders = negotiations.filter(n => new Date(n.created_at) >= monthStart).length;
    const prevOrders = negotiations.filter(n => inRange(new Date(n.created_at), prevStart, prevEnd)).length;

    const reviewsCount = products.reduce((s, p) => s + Number(p.total_reviews || 0), 0);
    const avgRating = (() => {
      const weighted = products.reduce((s, p) => s + Number(p.rating_medio || 0) * Number(p.total_reviews || 0), 0);
      return reviewsCount > 0 ? weighted / reviewsCount : 0;
    })();

    const pct = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Math.round(((curr - prev) / prev) * 100);
    };

    return {
      monthRevenue,
      revenueChange: pct(monthRevenue, prevRevenue),
      monthOrders,
      ordersChange: pct(monthOrders, prevOrders),
      avgRating,
      reviewsCount,
    };
  }, [negotiations, products]);

  const counts = useMemo(() => ({
    todos: products.length,
    ativos: products.filter(p => p.ativo).length,
    pausados: products.filter(p => !p.ativo).length,
  }), [products]);

  const filteredProducts = useMemo(() => {
    if (activeTab === "ativos") return products.filter(p => p.ativo);
    if (activeTab === "pausados") return products.filter(p => !p.ativo);
    return products;
  }, [products, activeTab]);

  const recentOrders = negotiations.slice(0, 6);
  const activeNegCount = negotiations.filter(n => ["pending", "accepted", "shipped"].includes(n.status)).length;

  const firstName = profile?.nome?.split(" ")[0] || "Fornecedor";

  return (
    <div className="space-y-6">
      {/* HERO BANNER - cor sólida #4621af */}
      <section
        className="relative overflow-hidden rounded-3xl text-white shadow-xl"
        style={{ backgroundColor: "#4621af" }}
      >
        <div className="relative z-10 flex flex-col gap-5 p-5 sm:p-7 lg:flex-row lg:items-center lg:gap-8">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">
              Olá, {firstName}! <span className="inline-block">👋</span>
            </h1>
            <p className="mt-1 text-sm text-white/80">Vamos vender hoje?</p>

            {/* Resumo do mês */}
            <div className="mt-5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold">Resumo do mês</p>
                <button
                  onClick={() => navigate("/fornecedor/estatisticas")}
                  className="text-xs font-medium text-white/80 hover:text-white"
                >
                  Ver detalhes
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <HeroStat
                  value={loading ? null : formatCurrency(kpis.monthRevenue)}
                  label="Vendas"
                  change={kpis.revenueChange}
                />
                <HeroStat
                  value={loading ? null : String(kpis.monthOrders)}
                  label="Pedidos"
                  change={kpis.ordersChange}
                />
                <HeroStat
                  value={loading ? null : `${kpis.avgRating.toFixed(1)} ★`}
                  label="Avaliação"
                  subtitle={`${kpis.reviewsCount} avaliações`}
                />
              </div>
            </div>
          </div>

          <div className="hidden lg:flex shrink-0 items-center justify-center">
            <img src={heroStore} alt="" className="h-44 w-44 object-contain drop-shadow-2xl" loading="lazy" width={176} height={176} />
          </div>
        </div>
        <div className="pointer-events-none absolute -right-10 -top-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      </section>

      {/* AÇÕES RÁPIDAS - ícones coloridos sem card */}
      <section>
        <h2 className="text-base sm:text-lg font-bold text-foreground mb-3">Ações rápidas</h2>
        <div className="grid grid-cols-4 gap-3 sm:gap-4">
          <QuickIcon icon={ShoppingBag} label="Pedidos" badge={activeNegCount > 0 ? activeNegCount : undefined} onClick={() => navigate("/fornecedor/negociacoes")} />
          <QuickIcon icon={MessageSquare} label="Conversas" badge={unreadMessages > 0 ? unreadMessages : undefined} onClick={() => navigate("/fornecedor/chat")} />
          <QuickIcon icon={BarChart3} label="Relatórios" onClick={() => navigate("/fornecedor/estatisticas")} />
          <QuickIcon icon={Users} label="Compradores" onClick={() => navigate("/fornecedor/negociacoes")} />
        </div>
      </section>


      {/* MEUS PRODUTOS */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base sm:text-lg font-bold text-foreground">Meus produtos</h2>
          <button onClick={() => navigate("/fornecedor/produtos")} className="text-xs sm:text-sm font-medium text-primary hover:underline">
            Ver todos os produtos
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
          {([
            { key: "todos", label: `Todos (${counts.todos})` },
            { key: "ativos", label: `Ativos (${counts.ativos})` },
            { key: "pausados", label: `Pausados (${counts.pausados})` },
          ] as { key: ProductTab; label: string }[]).map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                activeTab === t.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-2xl" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <Card className="rounded-2xl">
            <CardContent className="p-10 text-center">
              <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
              <p className="text-sm text-muted-foreground">Nenhum produto nesta categoria</p>
              <Button onClick={() => navigate("/fornecedor/produtos?novo=1")} className="mt-4 rounded-full">
                Criar produto
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {filteredProducts.slice(0, 5).map(p => (
              <ProductCard
                key={p.id}
                product={p}
                views={productViews[p.id] || 0}
                favorites={productFavorites[p.id] || 0}
                onClick={() => navigate("/fornecedor/produtos")}
              />
            ))}
          </div>
        )}
      </section>

      {/* PEDIDOS RECENTES */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base sm:text-lg font-bold text-foreground">Pedidos recentes</h2>
          <button onClick={() => navigate("/fornecedor/negociacoes")} className="text-xs sm:text-sm font-medium text-primary hover:underline">
            Ver todos os pedidos
          </button>
        </div>

        <Card className="rounded-2xl border-border overflow-hidden">
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="p-10 text-center">
              <Hand className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
              <p className="text-sm text-muted-foreground">Nenhuma negociação ainda</p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-muted/30">
                    <tr className="text-left text-xs font-semibold text-muted-foreground">
                      <th className="px-5 py-3">Pedido</th>
                      <th className="px-5 py-3">Comprador</th>
                      <th className="px-5 py-3">Produto</th>
                      <th className="px-5 py-3">Valor</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Data</th>
                      <th className="px-5 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map(n => {
                      const buyer = buyersMap[n.buyer_id];
                      return (
                        <tr key={n.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors cursor-pointer"
                          onClick={() => navigate("/fornecedor/negociacoes")}>
                          <td className="px-5 py-3 font-medium text-primary">#{n.id.slice(0, 5).toUpperCase()}</td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-full bg-muted overflow-hidden flex items-center justify-center text-[10px] font-semibold text-muted-foreground">
                                {buyer?.foto ? <img src={buyer.foto} alt="" className="h-full w-full object-cover" /> : (buyer?.nome?.[0] || "?")}
                              </div>
                              <span className="text-foreground">{buyer?.nome || "Comprador"}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-foreground truncate max-w-[200px]">{n.product_name}</td>
                          <td className="px-5 py-3 font-semibold text-foreground">{formatCurrency(n.agreed_price)}</td>
                          <td className="px-5 py-3">{statusBadge(n.status)}</td>
                          <td className="px-5 py-3 text-muted-foreground">{new Date(n.created_at).toLocaleDateString("pt-BR")}</td>
                          <td className="px-5 py-3 text-right"><ChevronRight className="h-4 w-4 text-muted-foreground inline" /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile list */}
              <div className="md:hidden divide-y divide-border">
                {recentOrders.map(n => {
                  const buyer = buyersMap[n.buyer_id];
                  return (
                    <button key={n.id} onClick={() => navigate("/fornecedor/negociacoes")}
                      className="w-full p-4 flex items-center gap-3 hover:bg-muted/20 transition-colors text-left">
                      <div className="h-10 w-10 rounded-full bg-muted overflow-hidden flex items-center justify-center text-xs font-semibold text-muted-foreground shrink-0">
                        {buyer?.foto ? <img src={buyer.foto} alt="" className="h-full w-full object-cover" /> : (buyer?.nome?.[0] || "?")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-primary">#{n.id.slice(0, 5).toUpperCase()}</span>
                          <span className="text-xs text-muted-foreground truncate">{buyer?.nome}</span>
                        </div>
                        <p className="text-sm font-medium truncate">{n.product_name}</p>
                        <p className="text-xs text-muted-foreground">{new Date(n.created_at).toLocaleDateString("pt-BR")}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-sm font-bold">{formatCurrency(n.agreed_price)}</span>
                        {statusBadge(n.status)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </Card>
      </section>
    </div>
  );
};

// ---------- Sub-components ----------

const HeroStat = ({ value, label, change, subtitle }: {
  value: string | null; label: string; change?: number; subtitle?: string;
}) => (
  <div className="min-w-0">
    {value === null ? (
      <Skeleton className="h-6 w-20 bg-white/20" />
    ) : (
      <p className="text-base sm:text-xl font-bold leading-tight truncate">{value}</p>
    )}
    <p className="text-[11px] text-white/70 mt-0.5">{label}</p>
    {typeof change === "number" && (
      <div className={`flex items-center gap-0.5 mt-0.5 text-[10px] font-medium ${change >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
        {change >= 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
        <span>{change >= 0 ? "+" : ""}{change}%</span>
      </div>
    )}
    {subtitle && <p className="text-[10px] text-white/60 mt-0.5 truncate">{subtitle}</p>}
  </div>
);

const QuickIcon = ({ icon: Icon, label, badge, onClick }: {
  icon: React.ElementType; label: string; badge?: number; onClick: () => void;
}) => (
  <button onClick={onClick} className="group flex flex-col items-center gap-2 text-center">
    <div className="relative h-14 w-14 rounded-full flex items-center justify-center bg-primary/10 group-hover:bg-primary/20 transition-colors">
      <Icon className="h-6 w-6" style={{ color: "#4621af" }} strokeWidth={2.2} />
      {badge !== undefined && (
        <span className="absolute -top-1 -right-1 min-w-[20px] h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </div>
    <span className="text-xs font-medium text-foreground">{label}</span>
  </button>
);

const ProductCard = ({ product, views, favorites, onClick }: {
  product: ProductRow; views: number; favorites: number; onClick: () => void;
}) => {
  const img = product.imagens?.[0];
  return (
    <button onClick={onClick}
      className="group flex flex-col rounded-2xl border border-border bg-card overflow-hidden text-left hover:shadow-lg hover:border-primary/40 transition-all">
      <div className="relative aspect-square bg-muted overflow-hidden">
        {img ? (
          <img src={img} alt={product.nome} loading="lazy" className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <Package className="h-10 w-10 text-muted-foreground/40" />
          </div>
        )}
        <Badge variant="secondary" className={`absolute top-2 left-2 rounded-md text-[10px] font-medium ${
          product.ativo ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
        }`}>
          {product.ativo ? "Ativo" : "Pausado"}
        </Badge>
      </div>
      <div className="p-3 flex flex-col gap-1.5">
        <p className="text-xs sm:text-sm font-medium text-foreground line-clamp-2 leading-tight min-h-[2.4em]">{product.nome}</p>
        <p className="text-sm font-bold text-foreground">{formatCurrency(product.preco)}</p>
        <p className="text-[11px] text-muted-foreground">Estoque: {product.estoque} un.</p>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-1 border-t border-border mt-1">
          <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {views}</span>
          <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {favorites}</span>
        </div>
      </div>
    </button>
  );
};

export default Dashboard;
