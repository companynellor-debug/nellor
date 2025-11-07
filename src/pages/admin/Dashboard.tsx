import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Users, Store, DollarSign, ShoppingCart, TrendingUp, Percent, AlertCircle } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useBanners } from "@/hooks/useBanners";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
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

  return <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-900 to-violet-900 bg-clip-text text-transparent dark:text-white dark:bg-none mb-2">
          Dashboard
        </h1>
        <p className="text-muted-foreground">Visão geral da plataforma Nellor</p>
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
              <p className="text-xs text-green-600 mt-1">{stat.change} vs mês anterior</p>
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

        {/* Recent Activities */}
        <Card className="border-purple-100 hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg">🔔 Atividades Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => <div key={index} className="flex items-start gap-3 p-3 rounded-lg transition-colors bg-violet-700">
                  <div className="w-2 h-2 rounded-full bg-purple-600 mt-2" />
                  <div className="flex-1">
                    <p className="text-sm">{activity.text}</p>
                    <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                  </div>
                </div>)}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
};
export default Dashboard;