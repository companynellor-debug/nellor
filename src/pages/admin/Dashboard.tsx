import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Store, DollarSign, ShoppingCart, Percent, Loader2, TrendingUp, Clock, CheckCircle } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, subMonths, startOfMonth, endOfMonth, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

const Dashboard = () => {
  const navigate = useNavigate();
  const [dateFilter, setDateFilter] = useState<'today' | '7days' | '14days' | '30days'>('30days');
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSuppliers: 0,
    gmvTotal: 0,
    gmvPeriod: 0,
    completedOrders: 0,
    pendingOrders: 0,
    commission: 0,
  });
  const [salesData, setSalesData] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [distributionData, setDistributionData] = useState<any[]>([]);
  const [topSuppliers, setTopSuppliers] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, [dateFilter]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const getStartDate = () => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        
        if (dateFilter === 'today') return now;
        else if (dateFilter === '7days') return subDays(now, 7);
        else if (dateFilter === '14days') return subDays(now, 14);
        else return subDays(now, 30);
      };

      const startDate = getStartDate();
      
      const { data: statsData } = await supabase.rpc('get_admin_stats');
      const { data: allOrders } = await supabase.rpc('get_admin_orders');
      const { data: allProfiles } = await supabase.rpc('get_admin_profiles');
      
      const stats_result = statsData?.[0] || { total_users: 0, active_suppliers: 0, paid_orders: 0, delivered_orders: 0, total_revenue: 0 };
      
      // Pedidos pagos totais (GMV)
      const paidOrders = (allOrders || []).filter((o: any) => 
        o.payment_status === 'paid' && o.order_status !== 'cancelled'
      );
      
      // Pedidos no período
      const filteredOrders = paidOrders.filter((o: any) => 
        new Date(o.created_at) >= startDate
      );
      
      // Pedidos pendentes
      const pendingOrders = (allOrders || []).filter((o: any) => 
        o.order_status === 'pending' && o.payment_status !== 'cancelled'
      );

      const gmvTotal = paidOrders.reduce((sum: number, order: any) => sum + Number(order.total), 0);
      const gmvPeriod = filteredOrders.reduce((sum: number, order: any) => sum + Number(order.total), 0);
      const commission = gmvPeriod * 0.075;

      // Dados de evolução dos últimos 30 dias
      const last30Days = [];
      for (let i = 29; i >= 0; i--) {
        const day = subDays(new Date(), i);
        const dayStart = new Date(day.setHours(0,0,0,0));
        const dayEnd = new Date(day.setHours(23,59,59,999));

        const dayOrders = paidOrders.filter((o: any) => {
          const orderDate = new Date(o.created_at);
          return orderDate >= dayStart && orderDate <= dayEnd;
        });

        last30Days.push({
          date: format(day, 'dd/MM'),
          pedidos: dayOrders.length,
          receita: dayOrders.reduce((sum: number, o: any) => sum + Number(o.total) * 0.075, 0)
        });
      }

      // Top 5 fornecedores
      const supplierRevenue: Record<string, { name: string; vendas: number }> = {};
      paidOrders.forEach((order: any) => {
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
      const fornecedorValue = gmvPeriod - (gmvPeriod * 0.075) - (gmvPeriod * 0.034);
      const distribution = [
        { name: "Fornecedores", value: fornecedorValue, color: "#3B82F6" },
        { name: "Comissão Nellor", value: gmvPeriod * 0.075, color: "#8B5CF6" },
        { name: "Taxa Stripe (est.)", value: gmvPeriod * 0.034, color: "#F59E0B" },
      ];

      // Pedidos recentes com mais detalhes
      const latestOrders = (allOrders || []).slice(0, 10).map((o: any) => ({
        ...o,
        clientName: o.buyer_name || 'Cliente',
        supplierName: o.supplier_name || 'Fornecedor'
      }));

      setStats({
        totalUsers: Number(stats_result.total_users) || 0,
        activeSuppliers: Number(stats_result.active_suppliers) || 0,
        gmvTotal,
        gmvPeriod,
        completedOrders: Number(stats_result.delivered_orders) || 0,
        pendingOrders: pendingOrders.length,
        commission,
      });

      setSalesData(last30Days);
      setRevenueData(last30Days);
      setDistributionData(distribution);
      setTopSuppliers(topSuppliersData);
      setRecentOrders(latestOrders);

    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    {
      title: "💰 Receita Nellor (Comissão)",
      value: `R$ ${stats.commission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      subtitle: "7,5% do GMV do período",
      icon: Percent,
      color: "from-violet-500 to-violet-600",
    },
    {
      title: "📊 GMV Total (Movimentado)",
      value: `R$ ${stats.gmvTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      subtitle: "Soma de todos os pedidos",
      icon: TrendingUp,
      color: "from-green-500 to-green-600",
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

  // Mostrar skeleton loading em vez de tela de carregamento completa
  const isInitialLoad = loading && salesData.length === 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Dashboard
          </h1>
          <p className="text-muted-foreground">Visão geral da plataforma Nellor</p>
        </div>
        <div className="flex items-center gap-3">
          {loading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          <div className="flex gap-2">
            {(['today', '7days', '14days', '30days'] as const).map(filter => (
              <Button
                key={filter}
                variant={dateFilter === filter ? 'default' : 'outline'}
                onClick={() => setDateFilter(filter)}
                size="sm"
              >
                {filter === 'today' ? 'Hoje' : filter === '7days' ? '7 dias' : filter === '14days' ? '14 dias' : '30 dias'}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statsCards.map(stat => (
          <Card key={stat.title} className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-border">
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`w-5 h-5 bg-gradient-to-br ${stat.color} bg-clip-text text-transparent`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stat.value}</div>
              {stat.subtitle && (
                <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolução de Pedidos */}
        <Card className="border-border hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">📈 Evolução de Pedidos (30 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="colorPedidos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" className="fill-muted-foreground" fontSize={10} />
                <YAxis className="fill-muted-foreground" />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
                <Area type="monotone" dataKey="pedidos" name="Pedidos" stroke="#8B5CF6" fillOpacity={1} fill="url(#colorPedidos)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Evolução de Receita (Comissão) */}
        <Card className="border-border hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">💰 Evolução de Receita Nellor (30 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" className="fill-muted-foreground" fontSize={10} />
                <YAxis className="fill-muted-foreground" />
                <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
                <Area type="monotone" dataKey="receita" name="Receita" stroke="#10B981" fillOpacity={1} fill="url(#colorReceita)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Suppliers */}
        <Card className="border-border hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">🏆 Top 5 Fornecedores por Volume</CardTitle>
          </CardHeader>
          <CardContent>
            {topSuppliers.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topSuppliers}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" className="fill-muted-foreground" fontSize={10} />
                  <YAxis className="fill-muted-foreground" />
                  <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
                  <Bar dataKey="vendas" name="Vendas" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center py-8 text-muted-foreground">Nenhum dado disponível</p>
            )}
          </CardContent>
        </Card>

        {/* Distribuição de Receita */}
        <Card className="border-border hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">🍰 Distribuição de Receita</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie 
                  data={distributionData} 
                  cx="50%" 
                  cy="50%" 
                  labelLine={false}
                  label={({ name, value }) => value > 0 ? `${name}: R$ ${value.toFixed(0)}` : ''}
                  outerRadius={100} 
                  dataKey="value"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Pedidos Recentes */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">🔔 Pedidos Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
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
                  recentOrders.map((order) => (
                    <tr key={order.id} className="border-b hover:bg-muted/20">
                      <td className="py-3 px-2 font-medium">#{order.order_number}</td>
                      <td className="py-3 px-2">{order.clientName}</td>
                      <td className="py-3 px-2">{order.supplierName}</td>
                      <td className="py-3 px-2 text-right">R$ {Number(order.total).toFixed(2)}</td>
                      <td className="py-3 px-2 text-center">
                        <Badge variant="outline" className="text-xs">
                          {order.order_status}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-right text-muted-foreground">
                        {format(new Date(order.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
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
