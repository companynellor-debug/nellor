import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Store, DollarSign, ShoppingCart, Percent, Loader2, TrendingUp, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, subDays } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { useAdminOrders, useAdminProfiles, useAdminStats } from "@/hooks/useAdminPrefetch";
import { formatCurrency } from "@/utils/formatCurrency";

const Dashboard = () => {
  const navigate = useNavigate();
  const [dateFilter, setDateFilter] = useState<'today' | '7days' | '14days' | '30days'>('30days');
  
  const { orders: allOrders, loading: ordersLoading, error: ordersError, refetch: refetchOrders } = useAdminOrders();
  const { profiles: allProfiles, loading: profilesLoading, error: profilesError, refetch: refetchProfiles } = useAdminProfiles();
  const { stats: statsData, loading: statsLoading, error: statsError, refetch: refetchStats } = useAdminStats();
  
  const loading = ordersLoading || profilesLoading || statsLoading;
  const hasError = Boolean(ordersError || profilesError || statsError);
  const refetch = () => {
    refetchOrders();
    refetchProfiles();
    refetchStats();
  };

  // ✅ Calcular tudo com useMemo para evitar recálculos desnecessários
  const { stats, salesData, revenueData, distributionData, topSuppliers, recentOrders, paidOrdersCount } = useMemo(() => {
    const getStartDate = () => {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      
      if (dateFilter === 'today') return now;
      else if (dateFilter === '7days') return subDays(now, 7);
      else if (dateFilter === '14days') return subDays(now, 14);
      else return subDays(now, 30);
    };

    const startDate = getStartDate();
    const stats_result = statsData || { total_users: 0, active_suppliers: 0, paid_orders: 0, delivered_orders: 0, total_revenue: 0 };
    
    // Pedidos pagos totais (GMV)
    const paidOrders = allOrders.filter((o) => 
      o.payment_status === 'paid' && o.order_status !== 'cancelled'
    );
    
    // Pedidos no período
    const filteredOrders = paidOrders.filter((o) => 
      new Date(o.created_at) >= startDate
    );
    
    // Pedidos pendentes
    const pendingOrders = allOrders.filter((o) => 
      o.order_status === 'pending' && o.payment_status !== 'cancelled'
    );

    const gmvTotal = paidOrders.reduce((sum, order) => sum + Number(order.total), 0);
    const gmvPeriod = filteredOrders.reduce((sum, order) => sum + Number(order.total), 0);
    const commission = gmvPeriod * 0.075;

    // Dados de evolução baseados no filtro selecionado
    const daysToShow = dateFilter === 'today' ? 1 : dateFilter === '7days' ? 7 : dateFilter === '14days' ? 14 : 30;
    const chartDays = [];
    for (let i = daysToShow - 1; i >= 0; i--) {
      const day = subDays(new Date(), i);
      const dayStart = new Date(day);
      dayStart.setHours(0,0,0,0);
      const dayEnd = new Date(day);
      dayEnd.setHours(23,59,59,999);

      const dayOrders = paidOrders.filter((o) => {
        const orderDate = new Date(o.created_at);
        return orderDate >= dayStart && orderDate <= dayEnd;
      });

      chartDays.push({
        date: format(day, 'dd/MM'),
        pedidos: dayOrders.length,
        receita: dayOrders.reduce((sum, o) => sum + Number(o.total) * 0.075, 0)
      });
    }

    // Top 5 fornecedores
    const supplierRevenue: Record<string, { name: string; vendas: number }> = {};
    paidOrders.forEach((order) => {
      const supplierId = order.supplier_id;
      const supplierName = order.supplier_name || 'Fornecedor';
      if (!supplierRevenue[supplierId]) {
        supplierRevenue[supplierId] = { name: supplierName, vendas: 0 };
      }
      supplierRevenue[supplierId].vendas += Number(order.total);
    });

    const topSuppliersData = Object.values(supplierRevenue)
      .sort((a, b) => b.vendas - a.vendas)
      .slice(0, 5);

    // Distribuição de receita
    const fornecedorValue = gmvPeriod - (gmvPeriod * 0.075);
    const distribution = [
      { name: "Fornecedores", value: fornecedorValue, color: "#3B82F6" },
      { name: "Comissão Nellor", value: gmvPeriod * 0.075, color: "#8B5CF6" },
    ];

    // Pedidos recentes
    const latestOrders = allOrders.slice(0, 10).map((o) => ({
      ...o,
      clientName: o.buyer_name || 'Cliente',
      supplierName: o.supplier_name || 'Fornecedor'
    }));

    return {
      stats: {
        totalUsers: Number(stats_result.total_users) || 0,
        activeSuppliers: Number(stats_result.active_suppliers) || 0,
        gmvTotal,
        gmvPeriod,
        completedOrders: Number(stats_result.delivered_orders) || 0,
        pendingOrders: pendingOrders.length,
        commission,
      },
      salesData: chartDays,
      revenueData: chartDays,
      distributionData: distribution,
      topSuppliers: topSuppliersData,
      recentOrders: latestOrders,
      paidOrdersCount: filteredOrders.length,
    };
  }, [allOrders, statsData, dateFilter]);

  const statsCards = [
    {
      title: "💰 Receita Nellor (Comissão)",
      value: `R$ ${stats.commission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      subtitle: "7,5% do GMV do período",
      icon: Percent,
      color: "from-violet-500 to-violet-600",
    },
    {
      title: "📊 GMV do Período",
      value: `R$ ${stats.gmvPeriod.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      subtitle: `GMV dos últimos ${dateFilter === 'today' ? 'hoje' : dateFilter === '7days' ? '7 dias' : dateFilter === '14days' ? '14 dias' : '30 dias'}`,
      icon: TrendingUp,
      color: "from-green-500 to-green-600",
    },
    {
      title: "💳 Pedidos Pagos (período)",
      value: paidOrdersCount.toLocaleString('pt-BR'),
      subtitle: "Pagamentos confirmados",
      icon: DollarSign,
      color: "from-emerald-500 to-emerald-600",
    },
    {
      title: "✅ Pedidos Concluídos",
      value: stats.completedOrders.toLocaleString('pt-BR'),
      subtitle: "Status: entregue",
      icon: CheckCircle,
      color: "from-blue-500 to-blue-600",
    },
    {
      title: "⏳ Pedidos Pendentes",
      value: stats.pendingOrders.toLocaleString('pt-BR'),
      subtitle: "Aguardando processamento",
      icon: Clock,
      color: "from-orange-500 to-orange-600",
    },
    {
      title: "👥 Total de Usuários",
      value: stats.totalUsers.toLocaleString('pt-BR'),
      icon: Users,
      color: "from-indigo-500 to-indigo-600",
    },
    {
      title: "🏪 Fornecedores Ativos",
      value: stats.activeSuppliers.toLocaleString('pt-BR'),
      icon: Store,
      color: "from-purple-500 to-purple-600",
    }
  ];

  // Skeleton loading apenas se não tiver dados cacheados
  const isInitialLoad = loading && allOrders.length === 0;

  if (hasError && allOrders.length === 0 && !loading) {
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


  return (
    <div className="w-full max-w-full space-y-6 overflow-x-hidden">
      <div className="space-y-4 overflow-hidden">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-4xl font-bold text-foreground mb-1">
              Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">Visão geral da plataforma Nellor</p>
          </div>
          {loading && <Loader2 className="h-4 w-4 animate-spin text-primary self-start sm:self-auto" />}
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-2">
          {(['today', '7days', '14days', '30days'] as const).map(filter => (
            <Button
              key={filter}
              variant={dateFilter === filter ? 'default' : 'outline'}
              onClick={() => setDateFilter(filter)}
              size="sm"
              className="h-10 w-full px-3 text-sm whitespace-nowrap sm:w-auto"
            >
              {filter === 'today' ? 'Hoje' : filter === '7days' ? '7 dias' : filter === '14days' ? '14 dias' : '30 dias'}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        {statsCards.map(stat => (
          <Card key={stat.title} className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-border">
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
            <CardHeader className="flex flex-row items-center justify-between pb-1 px-3 pt-3 sm:px-6 sm:pt-6 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground leading-tight">
                {stat.title}
              </CardTitle>
              <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 bg-gradient-to-br ${stat.color} bg-clip-text text-transparent`} />
            </CardHeader>
            <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground leading-none">{stat.value}</div>
              {stat.subtitle && (
                <p className="text-xs text-muted-foreground mt-0.5 sm:mt-1">{stat.subtitle}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Evolução de Pedidos */}
        <Card className="min-w-0 overflow-hidden border-border hover:shadow-lg transition-shadow">
          <CardHeader className="px-3 pt-3 pb-1 sm:px-6 sm:pt-6 sm:pb-2">
            <CardTitle className="text-sm sm:text-lg text-foreground">📈 Pedidos ({dateFilter === 'today' ? 'Hoje' : dateFilter === '7days' ? '7d' : dateFilter === '14days' ? '14d' : '30d'})</CardTitle>
          </CardHeader>
          <CardContent className="overflow-hidden px-1 sm:px-6">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={salesData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPedidos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" className="fill-muted-foreground" fontSize={9} tick={{ fontSize: 9 }} />
                <YAxis className="fill-muted-foreground" width={30} tick={{ fontSize: 9 }} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))', fontSize: 12 }} />
                <Area type="monotone" dataKey="pedidos" name="Pedidos" stroke="#8B5CF6" fillOpacity={1} fill="url(#colorPedidos)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Evolução de Receita (Comissão) */}
        <Card className="min-w-0 overflow-hidden border-border hover:shadow-lg transition-shadow">
          <CardHeader className="px-3 pt-3 pb-1 sm:px-6 sm:pt-6 sm:pb-2">
            <CardTitle className="text-sm sm:text-lg text-foreground">💰 Receita Nellor ({dateFilter === 'today' ? 'Hoje' : dateFilter === '7days' ? '7d' : dateFilter === '14days' ? '14d' : '30d'})</CardTitle>
          </CardHeader>
          <CardContent className="overflow-hidden px-1 sm:px-6">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenueData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" className="fill-muted-foreground" fontSize={9} tick={{ fontSize: 9 }} />
                <YAxis className="fill-muted-foreground" width={30} tick={{ fontSize: 9 }} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))', fontSize: 12 }} />
                <Area type="monotone" dataKey="receita" name="Receita" stroke="#10B981" fillOpacity={1} fill="url(#colorReceita)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Suppliers */}
        <Card className="min-w-0 overflow-hidden border-border hover:shadow-lg transition-shadow">
          <CardHeader className="px-3 pt-3 pb-1 sm:px-6 sm:pt-6 sm:pb-2">
            <CardTitle className="text-sm sm:text-lg text-foreground">🏆 Top 5 Fornecedores</CardTitle>
          </CardHeader>
          <CardContent className="overflow-hidden px-1 sm:px-6">
            {topSuppliers.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={topSuppliers} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" className="fill-muted-foreground" fontSize={8} tick={{ fontSize: 8 }} tickFormatter={(value: string) => value.length > 10 ? `${value.slice(0, 10)}…` : value} />
                  <YAxis className="fill-muted-foreground" width={30} tick={{ fontSize: 9 }} />
                  <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))', fontSize: 12 }} />
                  <Bar dataKey="vendas" name="Vendas" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center py-8 text-muted-foreground text-sm">Nenhum dado disponível</p>
            )}
          </CardContent>
        </Card>

        {/* Distribuição de Receita */}
        <Card className="min-w-0 overflow-hidden border-border hover:shadow-lg transition-shadow">
          <CardHeader className="px-3 pt-3 pb-1 sm:px-6 sm:pt-6 sm:pb-2">
            <CardTitle className="text-sm sm:text-lg text-foreground">🍰 Distribuição de Receita</CardTitle>
          </CardHeader>
          <CardContent className="overflow-hidden px-1 sm:px-6">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie 
                  data={distributionData} 
                  cx="50%" 
                  cy="50%" 
                  labelLine={false}
                  label={false}
                  outerRadius={70} 
                  dataKey="value"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              {distributionData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                  <span className="break-words">{entry.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pedidos Recentes - Mobile: card list, Desktop: table */}
      <Card className="border-border">
        <CardHeader className="px-3 pt-3 pb-1 sm:px-6 sm:pt-6 sm:pb-2">
          <CardTitle className="text-sm sm:text-lg text-foreground">🔔 Pedidos Recentes</CardTitle>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          {/* Mobile card list */}
          <div className="block sm:hidden space-y-3">
            {recentOrders.length > 0 ? recentOrders.map((order: any) => (
              <div key={order.id} className="border border-border rounded-lg p-3 space-y-1.5 overflow-hidden">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-sm truncate">{order.order_number}</span>
                  <Badge 
                    variant={order.payment_status === 'paid' ? 'default' : 'secondary'}
                    className={`text-[10px] ${order.payment_status === 'paid' ? 'bg-green-100 text-green-800' : ''}`}
                  >
                    {order.payment_status === 'paid' ? 'Pago' : order.payment_status === 'pending' ? 'Pendente' : order.payment_status}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  <span>{order.clientName}</span> → <span>{order.supplierName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm">{formatCurrency(order.total)}</span>
                  <span className="text-xs text-muted-foreground">{format(new Date(order.created_at), 'dd/MM HH:mm')}</span>
                </div>
              </div>
            )) : (
              <p className="text-center py-6 text-muted-foreground text-sm">Nenhum pedido encontrado</p>
            )}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Pedido</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Cliente</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Fornecedor</th>
                  <th className="text-right py-3 px-2 font-medium text-muted-foreground">Valor</th>
                  <th className="text-center py-3 px-2 font-medium text-muted-foreground">Status</th>
                  <th className="text-right py-3 px-2 font-medium text-muted-foreground">Data</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length > 0 ? (
                  recentOrders.map((order: any) => (
                    <tr key={order.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-2 font-medium">{order.order_number}</td>
                      <td className="py-3 px-2">{order.clientName}</td>
                      <td className="py-3 px-2">{order.supplierName}</td>
                      <td className="py-3 px-2 text-right">{formatCurrency(order.total)}</td>
                      <td className="py-3 px-2 text-center">
                        <Badge 
                          variant={order.payment_status === 'paid' ? 'default' : 'secondary'}
                          className={order.payment_status === 'paid' ? 'bg-green-100 text-green-800' : ''}
                        >
                          {order.payment_status === 'paid' ? 'Pago' : order.payment_status === 'pending' ? 'Pendente' : order.payment_status}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-right text-muted-foreground">
                        {format(new Date(order.created_at), 'dd/MM HH:mm')}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum pedido encontrado
                    </td>
                  </tr>
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
