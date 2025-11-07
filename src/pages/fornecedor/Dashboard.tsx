import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, TrendingUp, Calendar as CalendarIcon, ArrowUpRight, Star, DollarSign, ShoppingCart } from "lucide-react";
import { useSupplierOrders } from "@/hooks/useSupplierOrders";
import { useNavigate } from "react-router-dom";
import { useReviews } from "@/hooks/useReviews";
import { useAuth } from "@/hooks/useAuth";
import { useStores } from "@/hooks/useStores";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

const Dashboard = () => {
  const { orders } = useSupplierOrders();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { stores } = useStores();
  const { storeReviews } = useReviews();

  const pendingOrders = orders.filter(o => o.status === 'awaiting_payment').length;
  const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
  const totalOrders = orders.length;
  const totalRevenue = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.value, 0);

  // Encontrar a loja do fornecedor
  const supplierStore = stores.find(s => s.name === user?.name);
  const myStoreReviews = supplierStore ? storeReviews.filter(r => r.storeId === supplierStore.id) : [];

  // Dados de vendas ao longo do tempo (últimos 6 meses)
  const salesData = (() => {
    const monthsData: { [key: string]: number } = {};
    const now = new Date();
    
    // Inicializar últimos 6 meses com 0
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toLocaleDateString('pt-BR', { month: 'short' });
      monthsData[monthKey] = 0;
    }

    // Contar vendas entregues por mês
    orders.filter(o => o.status === 'delivered').forEach(order => {
      const orderDate = new Date(order.date);
      const monthKey = orderDate.toLocaleDateString('pt-BR', { month: 'short' });
      if (monthsData.hasOwnProperty(monthKey)) {
        monthsData[monthKey] += order.value;
      }
    });

    return Object.entries(monthsData).map(([month, value]) => ({
      month,
      vendas: value
    }));
  })();

  // Distribuição de avaliações (1-5 estrelas)
  const ratingsDistribution = (() => {
    const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    myStoreReviews.forEach(review => {
      dist[review.rating as 1 | 2 | 3 | 4 | 5]++;
    });
    return Object.entries(dist).map(([stars, count]) => ({
      estrelas: `${stars}★`,
      quantidade: count
    }));
  })();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-900 to-violet-900 bg-clip-text text-transparent dark:text-white dark:bg-none mb-2">
          Dashboard
        </h1>
        <p className="text-muted-foreground">Visão geral do seu desempenho</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-purple-100">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-green-600 opacity-0 group-hover:opacity-5 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Receita Total
            </CardTitle>
            <DollarSign className="w-5 h-5 bg-gradient-to-br from-green-500 to-green-600 bg-clip-text text-transparent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">R$ {totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-purple-100">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-orange-600 opacity-0 group-hover:opacity-5 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pedidos Ativos
            </CardTitle>
            <ShoppingCart className="w-5 h-5 bg-gradient-to-br from-orange-500 to-orange-600 bg-clip-text text-transparent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalOrders - deliveredOrders}</div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-purple-100">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 opacity-0 group-hover:opacity-5 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Novos Pedidos
            </CardTitle>
            <Package className="w-5 h-5 bg-gradient-to-br from-blue-500 to-blue-600 bg-clip-text text-transparent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pendingOrders}</div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-purple-100">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-purple-600 opacity-0 group-hover:opacity-5 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pedidos Entregues
            </CardTitle>
            <TrendingUp className="w-5 h-5 bg-gradient-to-br from-purple-500 to-purple-600 bg-clip-text text-transparent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{deliveredOrders}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolução de Vendas */}
        <Card className="border-purple-100 hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg">📈 Evolução de Vendas</CardTitle>
          </CardHeader>
          <CardContent>
            {salesData.some(d => d.vendas > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={salesData}>
                  <defs>
                    <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" tickFormatter={(value) => `R$${value}`} />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="vendas" 
                    stroke="#8B5CF6" 
                    fillOpacity={1} 
                    fill="url(#colorVendas)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center">
                <p className="text-muted-foreground text-sm">Nenhuma venda registrada ainda</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Distribuição de Avaliações */}
        <Card className="border-purple-100 hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg">⭐ Distribuição de Avaliações</CardTitle>
          </CardHeader>
          <CardContent>
            {myStoreReviews.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ratingsDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="estrelas" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="quantidade" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center">
                <p className="text-muted-foreground text-sm">Nenhuma avaliação recebida ainda</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card className="border-purple-100 hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">📦 Pedidos Recentes</CardTitle>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/fornecedor/pedidos')}
              >
                Ver Todos
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {orders.length === 0 ? (
              <div className="p-8 text-center">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum pedido recente</p>
              </div>
            ) : (
              orders.slice(0, 5).map((order) => (
                <div key={order.id} className="p-6 hover:bg-muted/20 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <Package className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium mb-1">{order.product}</p>
                      <p className="text-sm text-muted-foreground mb-2">{order.customerName}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-muted-foreground">#{order.id}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          order.status === 'delivered'
                            ? 'bg-green-100 text-green-800'
                            : order.status === 'cancelled'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.status === 'delivered' ? 'Entregue' : order.status === 'cancelled' ? 'Cancelado' : 'Pendente'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-semibold">R$ {order.value.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;