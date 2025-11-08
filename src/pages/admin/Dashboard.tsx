import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Users, Store, DollarSign, ShoppingCart, TrendingUp, Percent, AlertCircle, Loader2 } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useBanners } from "@/hooks/useBanners";
import { format, differenceInDays, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
const statsCards = [{
  title: "Total de Usuários",
  value: "2,847",
  icon: Users,
  color: "from-blue-500 to-blue-600",
  change: "+12%"
}, {
  title: "Fornecedores Ativos",
  value: "184",
  icon: Store,
  color: "from-purple-500 to-purple-600",
  change: "+8%"
}, {
  title: "Receita (30 dias)",
  value: "R$ 127.430",
  icon: DollarSign,
  color: "from-green-500 to-green-600",
  change: "+23%"
}, {
  title: "Pedidos Concluídos",
  value: "1,523",
  icon: ShoppingCart,
  color: "from-orange-500 to-orange-600",
  change: "+18%"
}, {
  title: "Crescimento Mensal",
  value: "15.8%",
  icon: TrendingUp,
  color: "from-pink-500 to-pink-600",
  change: "+3%"
}, {
  title: "Comissão Nellor",
  value: "R$ 6,372",
  icon: Percent,
  color: "from-violet-500 to-violet-600",
  change: "+21%"
}];
const salesData = [{
  month: "Jun",
  pedidos: 420,
  receita: 45000
}, {
  month: "Jul",
  pedidos: 580,
  receita: 62000
}, {
  month: "Ago",
  pedidos: 720,
  receita: 78000
}, {
  month: "Set",
  pedidos: 950,
  receita: 95000
}, {
  month: "Out",
  pedidos: 1200,
  receita: 112000
}, {
  month: "Nov",
  pedidos: 1523,
  receita: 127430
}];
const categoryData = [{
  name: "Streetwear",
  value: 35,
  color: "#8B5CF6"
}, {
  name: "Techwear",
  value: 25,
  color: "#6366F1"
}, {
  name: "Acessórios",
  value: 20,
  color: "#A855F7"
}, {
  name: "Calçados",
  value: 15,
  color: "#C084FC"
}, {
  name: "Outros",
  value: 5,
  color: "#E9D5FF"
}];
const topSuppliers = [{
  name: "UrbanCloth",
  vendas: 12500
}, {
  name: "DriftWear",
  vendas: 8900
}, {
  name: "TechStyle",
  vendas: 7200
}, {
  name: "StreetVibe",
  vendas: 6800
}, {
  name: "NeonWear",
  vendas: 5400
}];
const recentActivities = [{
  text: "Novo pedido confirmado: #2048 — R$230,00",
  time: "2 min atrás"
}, {
  text: "Fornecedor DriftWear atingiu R$10.000 em vendas",
  time: "15 min atrás"
}, {
  text: "Usuário Lucas S. fez 3 pedidos hoje",
  time: "1 hora atrás"
}, {
  text: "Novo fornecedor TechStyle aprovado",
  time: "2 horas atrás"
}, {
  text: "Cliente Maria F. deixou avaliação 5★",
  time: "3 horas atrás"
}];
const Dashboard = () => {
  const navigate = useNavigate();
  const { getExpiringBanners } = useBanners();
  const expiringBanners = getExpiringBanners(5);
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
      
      // Total de usuários
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Fornecedores ativos
      const { count: activeSuppliers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('tipo', 'fornecedor')
        .eq('ativo', true);
      
      const { data: recentOrders } = await supabase
        .from('orders')
        .select('total, created_at')
        .eq('payment_status', 'paid')
        .gte('created_at', startDate.toISOString());

      const revenue30Days = recentOrders?.reduce((sum, order) => sum + Number(order.total), 0) || 0;

      // Pedidos concluídos
      const { count: completedOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('order_status', 'delivered');

      // Comissão Nellor (5% da receita)
      const commission = revenue30Days * 0.05;

      // Dados de vendas dos últimos 6 meses
      const salesByMonth = [];
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(new Date(), i);
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);

        const { data: monthOrders } = await supabase
          .from('orders')
          .select('total')
          .eq('payment_status', 'paid')
          .gte('created_at', monthStart.toISOString())
          .lte('created_at', monthEnd.toISOString());

        salesByMonth.push({
          month: format(monthDate, 'MMM', { locale: ptBR }),
          pedidos: monthOrders?.length || 0,
          receita: monthOrders?.reduce((sum, order) => sum + Number(order.total), 0) || 0
        });
      }

      // Top 5 fornecedores
      const { data: suppliers } = await supabase
        .from('analytics')
        .select('supplier_id, total_vendas, profiles(nome)')
        .order('total_vendas', { ascending: false })
        .limit(5);

      const topSuppliersData = suppliers?.map(s => ({
        name: (s.profiles as any)?.nome || 'Fornecedor',
        vendas: Number(s.total_vendas)
      })) || [];

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
      const { data: latestOrders } = await supabase
        .from('orders')
        .select('order_number, total, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      setStats({
        totalUsers: totalUsers || 0,
        activeSuppliers: activeSuppliers || 0,
        revenue30Days,
        completedOrders: completedOrders || 0,
        monthlyGrowth: 0, // Pode calcular comparando com mês anterior
        commission,
      });

      setSalesData(salesByMonth);
      setTopSuppliers(topSuppliersData);
      setCategoryData(categoryDataFormatted);
      setRecentOrders(latestOrders || []);

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
      title: "Comissão Nellor (5%)",
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

      {/* Alertas de Banners Expirando */}
      {expiringBanners.length > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-5 w-5 text-orange-600" />
          <AlertTitle className="text-orange-900 font-semibold">
            {expiringBanners.length} {expiringBanners.length === 1 ? 'banner está' : 'banners estão'} próximo{expiringBanners.length === 1 ? '' : 's'} de expirar
          </AlertTitle>
          <AlertDescription className="text-orange-800">
            <div className="mt-2 space-y-2">
              {expiringBanners.map(banner => {
                const daysLeft = differenceInDays(new Date(banner.endDate!), new Date());
                return (
                  <div key={banner.id} className="flex items-center justify-between p-2 bg-white rounded">
                    <div>
                      <p className="font-medium">{banner.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Expira em {daysLeft} {daysLeft === 1 ? 'dia' : 'dias'} 
                        ({format(new Date(banner.endDate!), "dd/MM/yyyy", { locale: ptBR })})
                      </p>
                    </div>
                    <button
                      onClick={() => navigate('/admin/banners')}
                      className="text-sm text-orange-700 hover:text-orange-900 underline"
                    >
                      Gerenciar
                    </button>
                  </div>
                );
              })}
            </div>
          </AlertDescription>
        </Alert>
      )}

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