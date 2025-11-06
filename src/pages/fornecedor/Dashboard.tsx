import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, TrendingUp, TrendingDown, Calendar as CalendarIcon, ArrowUpRight, Star } from "lucide-react";
import { useSupplierOrders } from "@/hooks/useSupplierOrders";
import { useNavigate } from "react-router-dom";
import { useReviews } from "@/hooks/useReviews";
import { useAuth } from "@/hooks/useAuth";
import { useStores } from "@/hooks/useStores";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

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
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Visão geral do seu desempenho</p>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* Total Revenue - Destaque */}
        <Card className="bg-gradient-to-br from-gray-900 to-gray-800 text-white p-4 sm:p-6 col-span-2">
          <p className="text-xs sm:text-sm opacity-80 mb-1 sm:mb-2">Receita Total</p>
          <p className="text-2xl sm:text-4xl font-bold mb-1">R$ {totalRevenue.toFixed(0)}</p>
        </Card>

        {/* Active Orders */}
        <Card className="p-4 sm:p-6">
          <p className="text-xs sm:text-sm text-muted-foreground mb-1 sm:mb-2">Pedidos Ativos</p>
          <p className="text-xl sm:text-3xl font-bold mb-1">{totalOrders - deliveredOrders}</p>
        </Card>

        {/* New Orders */}
        <Card className="p-4 sm:p-6">
          <p className="text-xs sm:text-sm text-muted-foreground mb-1 sm:mb-2">Novos Pedidos</p>
          <p className="text-xl sm:text-3xl font-bold mb-1">{pendingOrders}</p>
        </Card>

        {/* Total Delivered */}
        <Card className="p-4 sm:p-6 col-span-2 sm:col-span-1">
          <p className="text-xs sm:text-sm text-muted-foreground mb-1 sm:mb-2">Pedidos Entregues</p>
          <p className="text-xl sm:text-3xl font-bold mb-1">{deliveredOrders}</p>
        </Card>
      </div>

      {/* Gráficos Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Evolução de Vendas */}
        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-xl font-bold">Evolução de Vendas</h2>
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </div>
          
          {salesData.some(d => d.vendas > 0) ? (
            <ChartContainer
              config={{
                vendas: {
                  label: "Vendas",
                  color: "hsl(var(--primary))",
                },
              }}
              className="h-[200px] sm:h-[300px] w-full"
            >
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="month" 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => `R$${value}`}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area 
                  type="monotone" 
                  dataKey="vendas" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorVendas)" 
                />
              </AreaChart>
            </ChartContainer>
          ) : (
            <div className="h-[200px] sm:h-[300px] flex items-center justify-center">
              <p className="text-muted-foreground text-sm">Nenhuma venda registrada ainda</p>
            </div>
          )}
        </Card>

        {/* Distribuição de Avaliações */}
        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-xl font-bold">Distribuição de Avaliações</h2>
            <Star className="h-5 w-5 text-muted-foreground" />
          </div>
          
          {myStoreReviews.length > 0 ? (
            <ChartContainer
              config={{
                quantidade: {
                  label: "Avaliações",
                  color: "hsl(var(--primary))",
                },
              }}
              className="h-[200px] sm:h-[300px] w-full"
            >
              <BarChart data={ratingsDistribution}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="estrelas" 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  allowDecimals={false}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar 
                  dataKey="quantidade" 
                  fill="hsl(var(--primary))" 
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="h-[200px] sm:h-[300px] flex items-center justify-center">
              <p className="text-muted-foreground text-sm">Nenhuma avaliação recebida ainda</p>
            </div>
          )}
        </Card>
      </div>

      {/* Recent Orders */}
      <Card className="overflow-hidden">
        <div className="p-4 sm:p-6 border-b flex items-center justify-between">
          <h2 className="text-base sm:text-xl font-bold">Pedidos Recentes</h2>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8 sm:h-10 sm:w-10"
              onClick={() => navigate('/fornecedor/pedidos')}
              title="Filtrar por data"
            >
              <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8 sm:h-10 sm:w-10"
              onClick={() => navigate('/fornecedor/pedidos')}
              title="Ver todos os pedidos"
            >
              <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>
        
        <div className="divide-y">
          {orders.length === 0 ? (
            <div className="p-8 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum pedido recente</p>
            </div>
          ) : (
            orders.slice(0, 5).map((order) => (
              <div key={order.id} className="p-4 sm:p-6 hover:bg-muted/20 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <Package className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm sm:text-base mb-1">{order.product}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-2">{order.customerName}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-muted-foreground">ID: {order.id}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        order.status === 'delivered'
                          ? 'bg-gray-900 text-white'
                          : order.status === 'cancelled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status === 'delivered' ? 'Pago' : order.status === 'cancelled' ? 'Cancelado' : 'Pendente'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-sm sm:text-base">R$ {order.value.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;