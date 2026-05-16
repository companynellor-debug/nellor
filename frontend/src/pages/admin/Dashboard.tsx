import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users, Store, Loader2, TrendingUp, AlertTriangle, Handshake,
  ShieldAlert, CreditCard, UserPlus, HeadphonesIcon, Activity,
  Eye, ShoppingCart, Package, ArrowUpRight, ArrowDownRight, Clock,
  RefreshCw,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { format, subDays, startOfDay, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { useState, useMemo, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

/* ─── helpers ───────────────────────────────────────────────── */
const fmt = (n: number) => n.toLocaleString("pt-BR");
const fmtBRL = (n: number) =>
  `R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

const COLORS = ["#8B5CF6", "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#6366F1"];

/* ─── component ─────────────────────────────────────────────── */
const Dashboard = () => {
  const navigate = useNavigate();
  const [dateFilter, setDateFilter] = useState<"today" | "7days" | "14days" | "30days" | "all">("30days");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Raw data
  const [profiles, setProfiles] = useState<any[]>([]);
  const [negotiations, setNegotiations] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  /* ─── fetch all data ──────────────────────────────────────── */
  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [profRes, negRes, ordRes, subRes, tickRes, prodRes] = await Promise.all([
        supabase.rpc("get_admin_profiles"),
        supabase.from("negotiations" as any).select("*").order("created_at", { ascending: false }),
        supabase.rpc("get_admin_orders"),
        supabase.from("supplier_subscriptions" as any).select("*"),
        supabase.rpc("get_admin_support_tickets"),
        supabase.from("products").select("id, nome, preco, created_at, views_count, vendas_count, categoria_id, categories(nome)"),
      ]);
      setProfiles((profRes.data || []) as any[]);
      setNegotiations((negRes.data || []) as any[]);
      setOrders((ordRes.data || []) as any[]);
      setSubscriptions((subRes.data || []) as any[]);
      setSupportTickets((tickRes.data || []) as any[]);
      setProducts((prodRes.data || []) as any[]);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ─── realtime subscription for new profiles ──────────────── */
  useEffect(() => {
    const channel = supabase
      .channel("admin-dashboard-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "profiles" }, (payload) => {
        setProfiles((prev) => [payload.new as any, ...prev]);
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "negotiations" }, (payload) => {
        setNegotiations((prev) => [payload.new as any, ...prev]);
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_tickets" }, (payload) => {
        setSupportTickets((prev) => [payload.new as any, ...prev]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  /* ─── derived stats ───────────────────────────────────────── */
  const stats = useMemo(() => {
    const todayStart = startOfDay(new Date());
    const getStartDate = () => {
      if (dateFilter === "all") return null;
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      if (dateFilter === "today") return now;
      if (dateFilter === "7days") return subDays(now, 7);
      if (dateFilter === "14days") return subDays(now, 14);
      return subDays(now, 30);
    };
    const startDate = getStartDate();

    // Users
    const totalUsers = profiles.length;
    const clientes = profiles.filter((p) => p.tipo === "cliente");
    const fornecedores = profiles.filter((p) => p.tipo === "fornecedor");
    const usersToday = profiles.filter((p) => p.created_at && new Date(p.created_at) >= todayStart).length;
    const clientesToday = clientes.filter((p) => p.created_at && new Date(p.created_at) >= todayStart).length;
    const fornecedoresToday = fornecedores.filter((p) => p.created_at && new Date(p.created_at) >= todayStart).length;

    // Negotiations
    const filteredNeg = startDate
      ? negotiations.filter((n) => new Date(n.created_at) >= startDate)
      : negotiations;
    const negsToday = negotiations.filter((n) => n.created_at && new Date(n.created_at) >= todayStart).length;

    // Orders  
    const filteredOrders = startDate
      ? orders.filter((o) => new Date(o.created_at) >= startDate)
      : orders;
    const totalRevenue = filteredOrders.reduce((s, o) => s + (Number(o.total) || 0), 0);

    // Support
    const openTickets = supportTickets.filter((t) => t.status === "open" || t.status === "aberto").length;
    const ticketsToday = supportTickets.filter((t) => t.created_at && new Date(t.created_at) >= todayStart).length;

    // Subscriptions
    const activeSubs = subscriptions.filter((s: any) => s.status === "active");
    const pendingSubs = subscriptions.filter((s: any) => s.status === "pending");
    const mrr = activeSubs.reduce((acc: number, s: any) => acc + (Number(s.price) || 29), 0);

    // Products
    const totalViews = products.reduce((s, p) => s + (Number(p.views_count) || 0), 0);
    const totalSales = products.reduce((s, p) => s + (Number(p.vendas_count) || 0), 0);

    // Charts - registrations per day
    const daysToShow = dateFilter === "all" ? 30 : dateFilter === "today" ? 1 : dateFilter === "7days" ? 7 : dateFilter === "14days" ? 14 : 30;
    const registrationChart: { date: string; clientes: number; fornecedores: number; total: number }[] = [];
    for (let i = daysToShow - 1; i >= 0; i--) {
      const day = subDays(new Date(), i);
      const dayStart = startOfDay(day);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const dayClientes = clientes.filter((p) => {
        const d = new Date(p.created_at);
        return d >= dayStart && d <= dayEnd;
      }).length;
      const dayFornecedores = fornecedores.filter((p) => {
        const d = new Date(p.created_at);
        return d >= dayStart && d <= dayEnd;
      }).length;

      registrationChart.push({
        date: format(day, "dd/MM"),
        clientes: dayClientes,
        fornecedores: dayFornecedores,
        total: dayClientes + dayFornecedores,
      });
    }

    // Negotiations chart
    const negChart: { date: string; negociacoes: number }[] = [];
    for (let i = daysToShow - 1; i >= 0; i--) {
      const day = subDays(new Date(), i);
      const dayStart = startOfDay(day);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);
      const dayNegs = negotiations.filter((n) => {
        const d = new Date(n.created_at);
        return d >= dayStart && d <= dayEnd;
      }).length;
      negChart.push({ date: format(day, "dd/MM"), negociacoes: dayNegs });
    }

    // User type distribution
    const userDistribution = [
      { name: "Clientes", value: clientes.length, color: "#3B82F6" },
      { name: "Fornecedores", value: fornecedores.length, color: "#8B5CF6" },
    ];

    // Recent activities
    const recentActivities: { type: string; text: string; time: string; icon: string }[] = [];

    // Recent registrations
    profiles
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
      .forEach((p) => {
        recentActivities.push({
          type: "user",
          text: `${p.nome || "Usuário"} se cadastrou como ${p.tipo}`,
          time: p.created_at,
          icon: p.tipo === "fornecedor" ? "store" : "user",
        });
      });

    // Recent negotiations
    negotiations.slice(0, 5).forEach((n) => {
      recentActivities.push({
        type: "negotiation",
        text: `Negociação "${n.product_name || "Produto"}" — R$ ${Number(n.agreed_price || 0).toFixed(2)}`,
        time: n.created_at,
        icon: "handshake",
      });
    });

    // Recent tickets
    supportTickets
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3)
      .forEach((t: any) => {
        recentActivities.push({
          type: "ticket",
          text: `Ticket: "${t.assunto || "Suporte"}" — ${t.user_name || "Usuário"}`,
          time: t.created_at,
          icon: "headphones",
        });
      });

    recentActivities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    // Top products
    const topProducts = [...products]
      .sort((a, b) => (Number(b.vendas_count) || 0) - (Number(a.vendas_count) || 0))
      .slice(0, 5);

    return {
      totalUsers,
      clientes: clientes.length,
      fornecedores: fornecedores.length,
      usersToday,
      clientesToday,
      fornecedoresToday,
      totalNegotiations: filteredNeg.length,
      negsToday,
      totalOrders: filteredOrders.length,
      totalRevenue,
      openTickets,
      ticketsToday,
      activeSubs: activeSubs.length,
      pendingSubs: pendingSubs.length,
      mrr,
      totalViews,
      totalSales,
      totalProducts: products.length,
      registrationChart,
      negChart,
      userDistribution,
      recentActivities: recentActivities.slice(0, 10),
      topProducts,
    };
  }, [profiles, negotiations, orders, subscriptions, supportTickets, products, dateFilter]);

  /* ─── loading state ───────────────────────────────────────── */
  if (loading && profiles.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  /* ─── render ──────────────────────────────────────────────── */
  return (
    <div className="w-full max-w-full space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="space-y-4 overflow-hidden">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-4xl font-bold text-foreground mb-1">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Visão geral em tempo real da plataforma Nellor
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="gap-1"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
            <Badge variant="outline" className="text-emerald-600 border-emerald-300 gap-1">
              <Activity className="h-3 w-3" />
              Tempo real
            </Badge>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:gap-2">
          {(["today", "7days", "14days", "30days", "all"] as const).map((filter) => (
            <Button
              key={filter}
              variant={dateFilter === filter ? "default" : "outline"}
              onClick={() => setDateFilter(filter)}
              size="sm"
              className="h-10 w-full px-3 text-sm whitespace-nowrap sm:w-auto"
            >
              {filter === "today" ? "Hoje" : filter === "7days" ? "7 dias" : filter === "14days" ? "14 dias" : filter === "30days" ? "30 dias" : "Total"}
            </Button>
          ))}
        </div>
      </div>

      {/* ── Highlight Cards: Today's Activity ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="relative overflow-hidden border-blue-200/50 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <UserPlus className="h-5 w-5 text-blue-600" />
              <Badge className="bg-blue-100 text-blue-700 text-[10px] dark:bg-blue-900/30 dark:text-blue-300">Hoje</Badge>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-blue-700 dark:text-blue-300">{fmt(stats.usersToday)}</p>
            <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-0.5">Novos cadastros</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-purple-200/50 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/20 dark:to-purple-900/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Handshake className="h-5 w-5 text-purple-600" />
              <Badge className="bg-purple-100 text-purple-700 text-[10px] dark:bg-purple-900/30 dark:text-purple-300">Hoje</Badge>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-purple-700 dark:text-purple-300">{fmt(stats.negsToday)}</p>
            <p className="text-xs text-purple-600/70 dark:text-purple-400/70 mt-0.5">Negociações abertas</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-amber-200/50 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/20 dark:to-amber-900/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <HeadphonesIcon className="h-5 w-5 text-amber-600" />
              <Badge className="bg-amber-100 text-amber-700 text-[10px] dark:bg-amber-900/30 dark:text-amber-300">Abertos</Badge>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-amber-700 dark:text-amber-300">{fmt(stats.openTickets)}</p>
            <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-0.5">Tickets de suporte</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-emerald-200/50 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/20 dark:to-emerald-900/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              <Badge className="bg-emerald-100 text-emerald-700 text-[10px] dark:bg-emerald-900/30 dark:text-emerald-300">MRR</Badge>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-emerald-700 dark:text-emerald-300">{fmtBRL(stats.mrr)}</p>
            <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-0.5">{stats.activeSubs} assinaturas ativas</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Main KPI Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <Card className="group hover:shadow-lg transition-all border-border cursor-pointer" onClick={() => navigate("/admin/usuarios")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <Users className="h-4 w-4 text-indigo-500" />
              <ArrowUpRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-xl sm:text-2xl font-bold">{fmt(stats.totalUsers)}</p>
            <p className="text-[11px] text-muted-foreground">Total de usuários</p>
            <div className="flex gap-2 mt-1">
              <span className="text-[10px] text-blue-600">{stats.clientes} cli</span>
              <span className="text-[10px] text-purple-600">{stats.fornecedores} forn</span>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all border-border cursor-pointer" onClick={() => navigate("/admin/fornecedores")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <Store className="h-4 w-4 text-purple-500" />
              <ArrowUpRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-xl sm:text-2xl font-bold">{fmt(stats.fornecedores)}</p>
            <p className="text-[11px] text-muted-foreground">Fornecedores</p>
            <p className="text-[10px] text-emerald-600 mt-1">+{stats.fornecedoresToday} hoje</p>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <Handshake className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-xl sm:text-2xl font-bold">{fmt(stats.totalNegotiations)}</p>
            <p className="text-[11px] text-muted-foreground">Negociações</p>
            <p className="text-[10px] text-muted-foreground mt-1">{dateFilter === "all" ? "Total" : "No período"}</p>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all border-border cursor-pointer" onClick={() => navigate("/admin/vendas")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <ShoppingCart className="h-4 w-4 text-green-500" />
              <ArrowUpRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-xl sm:text-2xl font-bold">{fmt(stats.totalOrders)}</p>
            <p className="text-[11px] text-muted-foreground">Pedidos</p>
            <p className="text-[10px] text-emerald-600 mt-1">{fmtBRL(stats.totalRevenue)}</p>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <Package className="h-4 w-4 text-orange-500" />
            </div>
            <p className="text-xl sm:text-2xl font-bold">{fmt(stats.totalProducts)}</p>
            <p className="text-[11px] text-muted-foreground">Produtos</p>
            <p className="text-[10px] text-muted-foreground mt-1">
              <Eye className="h-3 w-3 inline mr-0.5" />
              {fmt(stats.totalViews)} views
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Registration chart */}
        <Card className="min-w-0 overflow-hidden border-border hover:shadow-lg transition-shadow">
          <CardHeader className="px-3 pt-3 pb-1 sm:px-6 sm:pt-6 sm:pb-2">
            <CardTitle className="text-sm sm:text-lg text-foreground flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-blue-500" />
              Cadastros por Dia
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-hidden px-1 sm:px-6">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={stats.registrationChart} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorClientes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorFornecedores" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" className="fill-muted-foreground" fontSize={9} tick={{ fontSize: 9 }} />
                <YAxis className="fill-muted-foreground" width={30} tick={{ fontSize: 9 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    color: "hsl(var(--foreground))",
                    fontSize: 12,
                  }}
                />
                <Area type="monotone" dataKey="clientes" name="Clientes" stroke="#3B82F6" fillOpacity={1} fill="url(#colorClientes)" />
                <Area type="monotone" dataKey="fornecedores" name="Fornecedores" stroke="#8B5CF6" fillOpacity={1} fill="url(#colorFornecedores)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Negotiations chart */}
        <Card className="min-w-0 overflow-hidden border-border hover:shadow-lg transition-shadow">
          <CardHeader className="px-3 pt-3 pb-1 sm:px-6 sm:pt-6 sm:pb-2">
            <CardTitle className="text-sm sm:text-lg text-foreground flex items-center gap-2">
              <Handshake className="h-4 w-4 text-purple-500" />
              Negociações por Dia
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-hidden px-1 sm:px-6">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={stats.negChart} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorNeg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" className="fill-muted-foreground" fontSize={9} tick={{ fontSize: 9 }} />
                <YAxis className="fill-muted-foreground" width={30} tick={{ fontSize: 9 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    color: "hsl(var(--foreground))",
                    fontSize: 12,
                  }}
                />
                <Area type="monotone" dataKey="negociacoes" name="Negociações" stroke="#8B5CF6" fillOpacity={1} fill="url(#colorNeg)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ── User Distribution + Subscriptions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* User type pie chart */}
        <Card className="min-w-0 overflow-hidden border-border hover:shadow-lg transition-shadow">
          <CardHeader className="px-3 pt-3 pb-1 sm:px-6 sm:pt-6 sm:pb-2">
            <CardTitle className="text-sm sm:text-lg text-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-500" />
              Distribuição de Usuários
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-hidden px-1 sm:px-6 flex items-center justify-center">
            {stats.userDistribution.some((d) => d.value > 0) ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={stats.userDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {stats.userDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm py-10">Sem dados</p>
            )}
          </CardContent>
        </Card>

        {/* Subscription summary */}
        <Card className="border-border hover:shadow-lg transition-shadow">
          <CardHeader className="px-3 pt-3 pb-1 sm:px-6 sm:pt-6 sm:pb-2">
            <CardTitle className="text-sm sm:text-lg text-foreground flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-emerald-500" />
              Assinaturas
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 space-y-4">
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/50">
              <p className="text-xs text-emerald-600 dark:text-emerald-400">MRR Mensal</p>
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{fmtBRL(stats.mrr)}</p>
              <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">ARR: {fmtBRL(stats.mrr * 12)}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Ativas</p>
                <p className="text-xl font-bold text-emerald-600">{stats.activeSubs}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Pendentes</p>
                <p className="text-xl font-bold text-amber-600">{stats.pendingSubs}</p>
              </div>
            </div>
            {stats.pendingSubs > 0 && (
              <Button
                size="sm"
                variant="outline"
                className="w-full gap-1"
                onClick={() => navigate("/admin/assinaturas")}
              >
                <Clock className="h-3.5 w-3.5" />
                Ver pendentes
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Top products */}
        <Card className="border-border hover:shadow-lg transition-shadow">
          <CardHeader className="px-3 pt-3 pb-1 sm:px-6 sm:pt-6 sm:pb-2">
            <CardTitle className="text-sm sm:text-lg text-foreground flex items-center gap-2">
              <Package className="h-4 w-4 text-orange-500" />
              Top Produtos
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            {stats.topProducts.length > 0 ? (
              <div className="space-y-3">
                {stats.topProducts.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-3">
                    <span className="text-sm font-bold text-muted-foreground w-5">{i + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.nome}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {(p.categories as any)?.nome || "Sem categoria"} · {fmtBRL(Number(p.preco) || 0)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-semibold">{Number(p.vendas_count) || 0} vendas</p>
                      <p className="text-[10px] text-muted-foreground">
                        <Eye className="h-3 w-3 inline mr-0.5" />
                        {Number(p.views_count) || 0}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-muted-foreground text-sm">Nenhum produto cadastrado</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Recent Activity Feed ── */}
      <Card className="border-border">
        <CardHeader className="px-3 pt-3 pb-1 sm:px-6 sm:pt-6 sm:pb-2">
          <CardTitle className="text-sm sm:text-lg text-foreground flex items-center gap-2">
            <Activity className="h-4 w-4 text-indigo-500" />
            Atividades Recentes
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          {stats.recentActivities.length > 0 ? (
            <div className="space-y-3">
              {stats.recentActivities.map((activity, i) => {
                const IconMap: Record<string, any> = {
                  user: UserPlus,
                  store: Store,
                  handshake: Handshake,
                  headphones: HeadphonesIcon,
                };
                const IconComponent = IconMap[activity.icon] || Activity;
                const colorMap: Record<string, string> = {
                  user: "text-blue-500 bg-blue-100 dark:bg-blue-900/30",
                  store: "text-purple-500 bg-purple-100 dark:bg-purple-900/30",
                  handshake: "text-indigo-500 bg-indigo-100 dark:bg-indigo-900/30",
                  headphones: "text-amber-500 bg-amber-100 dark:bg-amber-900/30",
                };
                return (
                  <div key={`${activity.type}-${i}`} className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${colorMap[activity.icon] || "bg-muted text-muted-foreground"}`}>
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{activity.text}</p>
                    </div>
                    <p className="text-[10px] text-muted-foreground shrink-0">
                      {activity.time ? format(new Date(activity.time), "dd/MM HH:mm", { locale: ptBR }) : ""}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center py-8 text-muted-foreground text-sm">Nenhuma atividade recente</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
