import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Store, DollarSign, ShoppingCart, Percent, Loader2 } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { fetchAllRows } from "@/lib/fetchAllRows";

const Dashboard = () => {
  const navigate = useNavigate();
  const [dateFilter, setDateFilter] = useState<'today' | '7days' | '14days' | '30days'>('30days');
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSuppliers: 0,
    revenue30Days: 0,
    completedOrders: 0,
    monthlyGrowth: 0,
    commission: 0,
  });
  const [salesData, setSalesData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [topSuppliers, setTopSuppliers] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, [dateFilter]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Calcular data de início baseado no filtro
      const getStartDate = () => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        
        if (dateFilter === 'today') {
          return now;
        } else if (dateFilter === '7days') {
          const sevenDaysAgo = new Date(now);
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          return sevenDaysAgo;
        } else if (dateFilter === '14days') {
          const fourteenDaysAgo = new Date(now);
          fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
          return fourteenDaysAgo;
        } else {
          const thirtyDaysAgo = new Date(now);
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return thirtyDaysAgo;
        }
      };

      const startDate = getStartDate();
      
      // Use SECURITY DEFINER functions to bypass RLS
      const { data: statsData } = await supabase.rpc('get_admin_stats');
      const { data: allOrders } = await supabase.rpc('get_admin_orders');
      const { data: allProfiles } = await supabase.rpc('get_admin_profiles');
      
      const stats_result = statsData?.[0] || { total_users: 0, active_suppliers: 0, paid_orders: 0, delivered_orders: 0, total_revenue: 0 };
      
      // Filter orders by date for revenue calculation
      const filteredOrders = (allOrders || []).filter((o: any) => 
        o.payment_status === 'paid' && 
        o.order_status !== 'cancelled' &&
        new Date(o.created_at) >= startDate
      );
      
      const revenue30Days = filteredOrders.reduce((sum: number, order: any) => sum + Number(order.total), 0);
      const commission = revenue30Days * 0.075;

      // Dados de vendas dos últimos 6 meses
      const salesByMonth = [];
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(new Date(), i);
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);

        const monthOrders = (allOrders || []).filter((o: any) => {
          const orderDate = new Date(o.created_at);
          return o.payment_status === 'paid' && 
                 orderDate >= monthStart && 
                 orderDate <= monthEnd;
        });

        salesByMonth.push({
          month: format(monthDate, 'MMM', { locale: ptBR }),
          pedidos: monthOrders.length,
          receita: monthOrders.reduce((sum: number, order: any) => sum + Number(order.total), 0)
        });
      }

      // Top 5 fornecedores baseado em pedidos pagos
      const paidOrders = (allOrders || []).filter((o: any) => 
        o.payment_status === 'paid' && o.order_status !== 'cancelled'
      );
      
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

      // Distribuição por categoria
      const { data: products } = await supabase
        .from('products')
        .select('categoria_id, categories(nome)');

      const categoryCount: Record<string, number> = {};
      products?.forEach(p => {
        const catName = (p.categories as any)?.nome || 'Outros';
        categoryCount[catName] = (categoryCount[catName] || 0) + 1;
      });

      const colors = ['#8B5CF6', '#6366F1', '#A855F7', '#C084FC', '#E9D5FF', '#DDD6FE'];
      const categoryDataFormatted = Object.entries(categoryCount).map(([name, value], index) => ({
        name,
        value,
        color: colors[index % colors.length]
      }));

      // Pedidos recentes
      const latestOrders = (allOrders || []).slice(0, 5);

      setStats({
        totalUsers: Number(stats_result.total_users) || 0,
        activeSuppliers: Number(stats_result.active_suppliers) || 0,
        revenue30Days,
        completedOrders: Number(stats_result.delivered_orders) || 0,
        monthlyGrowth: 0,
        commission,
      });

      setSalesData(salesByMonth);
      setTopSuppliers(topSuppliersData);
      setCategoryData(categoryDataFormatted);
      setRecentOrders(latestOrders);

    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    {
      title: "Total de Usuários",
      value: stats.totalUsers.toLocaleString('pt-BR'),
      icon: Users,
      color: "from-blue-500 to-blue-600",
    },
    {
      title: "Fornecedores Ativos",
      value: stats.activeSuppliers.toLocaleString('pt-BR'),
      icon: Store,
      color: "from-purple-500 to-purple-600",
    },
    {
      title: `Receita (${dateFilter === 'today' ? 'hoje' : dateFilter === '7days' ? '7 dias' : dateFilter === '14days' ? '14 dias' : '30 dias'})`,
      value: `R$ ${stats.revenue30Days.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: "from-green-500 to-green-600",
    },
    {
      title: "Pedidos Concluídos",
      value: stats.completedOrders.toLocaleString('pt-BR'),
      icon: ShoppingCart,
      color: "from-orange-500 to-orange-600",
    },
    {
      title: "Comissão Nellor (7,5%)",
      value: `R$ ${stats.commission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: Percent,
      color: "from-violet-500 to-violet-600",
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-900 to-violet-900 bg-clip-text text-transparent dark:text-white dark:bg-none mb-2">
            Dashboard
          </h1>
          <p className="text-muted-foreground">Visão geral da plataforma Nellor</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={dateFilter === 'today' ? 'default' : 'outline'}
            onClick={() => setDateFilter('today')}
            size="sm"
          >
            Hoje
          </Button>
          <Button
            variant={dateFilter === '7days' ? 'default' : 'outline'}
            onClick={() => setDateFilter('7days')}
            size="sm"
          >
            7 dias
          </Button>
          <Button
            variant={dateFilter === '14days' ? 'default' : 'outline'}
            onClick={() => setDateFilter('14days')}
            size="sm"
          >
            14 dias
          </Button>
          <Button
            variant={dateFilter === '30days' ? 'default' : 'outline'}
            onClick={() => setDateFilter('30days')}
            size="sm"
          >
            30 dias
          </Button>
        </div>
      </div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statsCards.map(stat => <Card key={stat.title} className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-purple-100">
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`w-5 h-5 bg-gradient-to-br ${stat.color} bg-clip-text text-transparent`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>)}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Evolution */}
        <Card className="border-purple-100 hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg">📈 Evolução de Pedidos e Receita</CardTitle>
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
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Area type="monotone" dataKey="pedidos" stroke="#8B5CF6" fillOpacity={1} fill="url(#colorPedidos)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card className="border-purple-100 hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg">🍩 Distribuição por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                  {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Suppliers */}
        <Card className="border-purple-100 hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg">🏆 Top 5 Fornecedores</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topSuppliers}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Bar dataKey="vendas" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card className="border-purple-100 hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg">🔔 Pedidos Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <div key={order.order_number} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="w-2 h-2 rounded-full bg-purple-600 mt-2" />
                    <div className="flex-1">
                      <p className="text-sm">
                        Pedido #{order.order_number} — R$ {Number(order.total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(order.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum pedido recente
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
};
export default Dashboard;