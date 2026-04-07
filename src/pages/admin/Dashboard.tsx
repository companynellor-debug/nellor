import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Store, Loader2, TrendingUp, Clock, AlertTriangle, MessageSquare, Handshake, ShieldAlert, CreditCard } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, subDays } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
import { useAdminProfiles, useAdminStats } from "@/hooks/useAdminPrefetch";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const navigate = useNavigate();
  const [dateFilter, setDateFilter] = useState<'today' | '7days' | '14days' | '30days' | 'all'>('30days');
  
  const { profiles: allProfiles, loading: profilesLoading, error: profilesError, refetch: refetchProfiles } = useAdminProfiles();
  const { stats: statsData, loading: statsLoading, error: statsError, refetch: refetchStats } = useAdminStats();

  // Fetch negotiations, disputes, conversations, subscriptions
  const [negotiations, setNegotiations] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [conversations, setConversations] = useState(0);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setDataLoading(true);
      try {
        const [negRes, dispRes, convRes, subRes] = await Promise.all([
          supabase.from('negotiations' as any).select('*').order('created_at', { ascending: false }),
          supabase.from('disputes').select('*'),
          supabase.rpc('get_admin_conversations' as any),
          supabase.from('supplier_subscriptions' as any).select('*'),
        ]);
        setNegotiations((negRes.data || []) as any[]);
        setDisputes((dispRes.data || []) as any[]);
        setConversations(Array.isArray(convRes.data) ? convRes.data.length : 0);
        setSubscriptions((subRes.data || []) as any[]);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setDataLoading(false);
      }
    };
    fetchData();
  }, []);
  
  const loading = profilesLoading || statsLoading || dataLoading;
  const hasError = Boolean(profilesError || statsError);
  const refetch = () => {
    refetchProfiles();
    refetchStats();
  };

  const { stats, negotiationChartData, topSuppliers, recentNegotiations } = useMemo(() => {
    const getStartDate = () => {
      if (dateFilter === 'all') return null;
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      if (dateFilter === 'today') return now;
      if (dateFilter === '7days') return subDays(now, 7);
      if (dateFilter === '14days') return subDays(now, 14);
      return subDays(now, 30);
    };

    const startDate = getStartDate();
    const stats_result = statsData || { total_users: 0, active_suppliers: 0 };

    const filteredNegotiations = startDate
      ? negotiations.filter(n => new Date(n.created_at) >= startDate)
      : negotiations;

    const openDisputes = disputes.filter(d => d.status === 'open').length;
    const activeSubscriptions = subscriptions.filter((s: any) => s.status === 'active').length;
    const pendingSubscriptions = subscriptions.filter((s: any) => s.status === 'pending').length;

    // Chart data
    const daysToShow = dateFilter === 'all' ? 90 : dateFilter === 'today' ? 1 : dateFilter === '7days' ? 7 : dateFilter === '14days' ? 14 : 30;
    const chartDays = [];
    for (let i = daysToShow - 1; i >= 0; i--) {
      const day = subDays(new Date(), i);
      const dayStart = new Date(day); dayStart.setHours(0,0,0,0);
      const dayEnd = new Date(day); dayEnd.setHours(23,59,59,999);

      const dayNegs = negotiations.filter(n => {
        const d = new Date(n.created_at);
        return d >= dayStart && d <= dayEnd;
      });

      chartDays.push({
        date: format(day, 'dd/MM'),
        negociacoes: dayNegs.length,
      });
    }

    // Top suppliers by negotiation count
    const supplierCounts: Record<string, { name: string; negociacoes: number }> = {};
    negotiations.forEach(n => {
      const sid = n.supplier_id;
      if (!supplierCounts[sid]) {
        const profile = allProfiles.find((p: any) => p.id === sid);
        supplierCounts[sid] = { name: profile?.nome || 'Fornecedor', negociacoes: 0 };
      }
      supplierCounts[sid].negociacoes += 1;
    });
    const topSuppliersData = Object.values(supplierCounts).sort((a, b) => b.negociacoes - a.negociacoes).slice(0, 5);

    // Recent negotiations with names
    const recent = filteredNegotiations.slice(0, 10).map(n => {
      const buyer = allProfiles.find((p: any) => p.id === n.buyer_id);
      const supplier = allProfiles.find((p: any) => p.id === n.supplier_id);
      return { ...n, buyerName: buyer?.nome || 'Comprador', supplierName: supplier?.nome || 'Fornecedor' };
    });

    return {
      stats: {
        totalUsers: Number(stats_result.total_users) || 0,
        activeSuppliers: Number(stats_result.active_suppliers) || 0,
        totalNegotiations: filteredNegotiations.length,
        totalConversations: conversations,
        openDisputes,
        activeSubscriptions,
        pendingSubscriptions,
      },
      negotiationChartData: chartDays,
      topSuppliers: topSuppliersData,
      recentNegotiations: recent,
    };
  }, [negotiations, disputes, subscriptions, conversations, statsData, allProfiles, dateFilter]);

  const statsCards = [
    { title: "👥 Total de Usuários", value: stats.totalUsers.toLocaleString('pt-BR'), icon: Users, color: "from-indigo-500 to-indigo-600" },
    { title: "🏪 Fornecedores Ativos", value: stats.activeSuppliers.toLocaleString('pt-BR'), icon: Store, color: "from-purple-500 to-purple-600" },
    { title: "🤝 Negociações", value: stats.totalNegotiations.toLocaleString('pt-BR'), subtitle: dateFilter === 'all' ? 'Total da plataforma' : 'No período', icon: Handshake, color: "from-blue-500 to-blue-600" },
    { title: "💬 Conversas Ativas", value: stats.totalConversations.toLocaleString('pt-BR'), icon: MessageSquare, color: "from-green-500 to-green-600" },
    { title: "⚠️ Disputas Abertas", value: stats.openDisputes.toLocaleString('pt-BR'), icon: ShieldAlert, color: "from-red-500 to-red-600" },
    { title: "✅ Assinaturas Ativas", value: stats.activeSubscriptions.toLocaleString('pt-BR'), subtitle: `${stats.pendingSubscriptions} pendentes`, icon: CreditCard, color: "from-emerald-500 to-emerald-600" },
  ];

  const isInitialLoad = loading && negotiations.length === 0;

  if (hasError && !loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
          <p className="text-muted-foreground">Não foi possível carregar o dashboard agora.</p>
          <Button onClick={refetch} variant="outline">Tentar novamente</Button>
        </div>
      </div>
    );
  }

  if (isInitialLoad) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando dados do dashboard...</p>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="secondary" className="text-[10px]">Pendente</Badge>;
      case 'accepted': return <Badge className="bg-blue-100 text-blue-800 text-[10px]">Aceita</Badge>;
      case 'shipped': return <Badge className="bg-orange-100 text-orange-800 text-[10px]">Enviada</Badge>;
      case 'delivered': return <Badge className="bg-green-100 text-green-800 text-[10px]">Entregue</Badge>;
      case 'cancelled': return <Badge variant="destructive" className="text-[10px]">Cancelada</Badge>;
      case 'disputed': return <Badge className="bg-red-100 text-red-800 text-[10px]">Disputada</Badge>;
      default: return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
    }
  };

  return (
    <div className="w-full max-w-full space-y-6 overflow-x-hidden">
      <div className="space-y-4 overflow-hidden">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-4xl font-bold text-foreground mb-1">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Visão geral da plataforma Nellor</p>
          </div>
          {loading && <Loader2 className="h-4 w-4 animate-spin text-primary self-start sm:self-auto" />}
        </div>
        <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:gap-2">
          {(['today', '7days', '14days', '30days', 'all'] as const).map(filter => (
            <Button key={filter} variant={dateFilter === filter ? 'default' : 'outline'} onClick={() => setDateFilter(filter)} size="sm" className="h-10 w-full px-3 text-sm whitespace-nowrap sm:w-auto">
              {filter === 'today' ? 'Hoje' : filter === '7days' ? '7 dias' : filter === '14days' ? '14 dias' : filter === '30days' ? '30 dias' : 'Total'}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {statsCards.map(stat => (
          <Card key={stat.title} className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-border">
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
            <CardHeader className="flex flex-row items-center justify-between pb-1 px-3 pt-3 sm:px-6 sm:pt-6 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground leading-tight">{stat.title}</CardTitle>
              <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 bg-gradient-to-br ${stat.color} bg-clip-text text-transparent`} />
            </CardHeader>
            <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground leading-none">{stat.value}</div>
              {stat.subtitle && <p className="text-xs text-muted-foreground mt-0.5 sm:mt-1">{stat.subtitle}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="min-w-0 overflow-hidden border-border hover:shadow-lg transition-shadow">
          <CardHeader className="px-3 pt-3 pb-1 sm:px-6 sm:pt-6 sm:pb-2">
            <CardTitle className="text-sm sm:text-lg text-foreground">📈 Negociações por Dia</CardTitle>
          </CardHeader>
          <CardContent className="overflow-hidden px-1 sm:px-6">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={negotiationChartData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorNeg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" className="fill-muted-foreground" fontSize={9} tick={{ fontSize: 9 }} />
                <YAxis className="fill-muted-foreground" width={30} tick={{ fontSize: 9 }} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))', fontSize: 12 }} />
                <Area type="monotone" dataKey="negociacoes" name="Negociações" stroke="#8B5CF6" fillOpacity={1} fill="url(#colorNeg)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="min-w-0 overflow-hidden border-border hover:shadow-lg transition-shadow">
          <CardHeader className="px-3 pt-3 pb-1 sm:px-6 sm:pt-6 sm:pb-2">
            <CardTitle className="text-sm sm:text-lg text-foreground">🏆 Top 5 Fornecedores (Negociações)</CardTitle>
          </CardHeader>
          <CardContent className="overflow-hidden px-1 sm:px-6">
            {topSuppliers.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={topSuppliers} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" className="fill-muted-foreground" fontSize={8} tick={{ fontSize: 8 }} tickFormatter={(v: string) => v.length > 10 ? `${v.slice(0, 10)}…` : v} />
                  <YAxis className="fill-muted-foreground" width={30} tick={{ fontSize: 9 }} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))', fontSize: 12 }} />
                  <Bar dataKey="negociacoes" name="Negociações" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center py-8 text-muted-foreground text-sm">Nenhum dado disponível</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Negotiations */}
      <Card className="border-border">
        <CardHeader className="px-3 pt-3 pb-1 sm:px-6 sm:pt-6 sm:pb-2">
          <CardTitle className="text-sm sm:text-lg text-foreground">🤝 Negociações Recentes</CardTitle>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          <div className="block sm:hidden space-y-3">
            {recentNegotiations.length > 0 ? recentNegotiations.map((neg: any) => (
              <div key={neg.id} className="border border-border rounded-lg p-3 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-sm truncate">{neg.product_name}</span>
                  {getStatusBadge(neg.status)}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  <span>{neg.buyerName}</span> → <span>{neg.supplierName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm">R$ {Number(neg.agreed_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  <span className="text-xs text-muted-foreground">{format(new Date(neg.created_at), 'dd/MM HH:mm')}</span>
                </div>
              </div>
            )) : (
              <p className="text-center py-6 text-muted-foreground text-sm">Nenhuma negociação encontrada</p>
            )}
          </div>

          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Produto</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Comprador</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Fornecedor</th>
                  <th className="text-right py-3 px-2 font-medium text-muted-foreground">Valor</th>
                  <th className="text-center py-3 px-2 font-medium text-muted-foreground">Qtd</th>
                  <th className="text-center py-3 px-2 font-medium text-muted-foreground">Status</th>
                  <th className="text-right py-3 px-2 font-medium text-muted-foreground">Data</th>
                </tr>
              </thead>
              <tbody>
                {recentNegotiations.length > 0 ? recentNegotiations.map((neg: any) => (
                  <tr key={neg.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-2 font-medium truncate max-w-[150px]">{neg.product_name}</td>
                    <td className="py-3 px-2">{neg.buyerName}</td>
                    <td className="py-3 px-2">{neg.supplierName}</td>
                    <td className="py-3 px-2 text-right">R$ {Number(neg.agreed_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className="py-3 px-2 text-center">{neg.quantity}</td>
                    <td className="py-3 px-2 text-center">{getStatusBadge(neg.status)}</td>
                    <td className="py-3 px-2 text-right text-muted-foreground">{format(new Date(neg.created_at), 'dd/MM HH:mm')}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">Nenhuma negociação encontrada</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
