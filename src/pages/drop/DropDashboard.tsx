import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  ShoppingBag,
  ArrowUpRight,
  Clock,
  CheckCircle,
  Truck,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Wallet,
  Percent
} from "lucide-react";
import { useClientDrop } from "@/hooks/useClientDrop";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  Area,
  AreaChart, 
  CartesianGrid,
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useState } from "react";

// Mock data para gráficos
const evolutionData = [
  { name: 'Jan', value: 30 },
  { name: 'Fev', value: 35 },
  { name: 'Mar', value: 28 },
  { name: 'Abr', value: 45 },
  { name: 'Mai', value: 55 },
  { name: 'Jun', value: 68 },
];

const marketplaceData = [
  { name: 'Shopee', value: 52, color: '#EE4D2D' },
  { name: 'Mercado Livre', value: 31, color: '#FFE600' },
  { name: 'Amazon', value: 17, color: '#FF9900' },
];

const DropDashboard = () => {
  const navigate = useNavigate();
  const { dropStats, dropOrders, myDropProducts, isLoading } = useClientDrop();
  const [dateFilter, setDateFilter] = useState<'today' | '7days' | '14days' | '30days'>('today');

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return { icon: Clock, label: 'Pendente', color: 'text-amber-500 bg-amber-500/10' };
      case 'paid':
        return { icon: CheckCircle, label: 'Pago', color: 'text-emerald-500 bg-emerald-500/10' };
      case 'shipped':
        return { icon: Truck, label: 'Enviado', color: 'text-cyan-500 bg-cyan-500/10' };
      case 'delivered':
        return { icon: CheckCircle, label: 'Entregue', color: 'text-emerald-500 bg-emerald-500/10' };
      default:
        return { icon: AlertCircle, label: status, color: 'text-slate-400 bg-slate-400/10' };
    }
  };

  const recentOrders = (dropOrders || []).slice(0, 5);
  
  // Calcular estatísticas
  const completedOrders = (dropOrders || []).filter((o: any) => o.order_status === 'delivered').length;
  const inProgressOrders = (dropOrders || []).filter((o: any) => ['pending', 'paid', 'shipped'].includes(o.order_status)).length;
  const syncedOrders = (dropOrders || []).filter((o: any) => o.external_marketplace).length;

  // Cálculos financeiros
  const totalSales = dropStats?.total_sales || 0;
  const totalProfit = dropStats?.total_profit || 0;
  const platformFee = totalSales * 0.075;
  const avgCommission = dropStats?.avg_commission || 0;

  return (
    <div className="w-full max-w-full space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Visão geral do seu desempenho no Drop</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button 
            variant={dateFilter === 'today' ? 'default' : 'outline'} 
            onClick={() => setDateFilter('today')} 
            size="sm" 
            className="text-xs sm:text-sm h-8"
          >
            Hoje
          </Button>
          <Button 
            variant={dateFilter === '7days' ? 'default' : 'outline'} 
            onClick={() => setDateFilter('7days')} 
            size="sm" 
            className="text-xs sm:text-sm h-8"
          >
            7 dias
          </Button>
          <Button 
            variant={dateFilter === '14days' ? 'default' : 'outline'} 
            onClick={() => setDateFilter('14days')} 
            size="sm" 
            className="text-xs sm:text-sm h-8"
          >
            14 dias
          </Button>
          <Button 
            variant={dateFilter === '30days' ? 'default' : 'outline'} 
            onClick={() => setDateFilter('30days')} 
            size="sm" 
            className="text-xs sm:text-sm h-8"
          >
            30 dias
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80 opacity-0 group-hover:opacity-5 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Vendas Total
            </CardTitle>
            <DollarSign className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-foreground">R$ {totalSales.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-emerald-600 opacity-0 group-hover:opacity-5 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Lucro Líquido
            </CardTitle>
            <Wallet className="w-5 h-5 text-emerald-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-emerald-600">R$ {totalProfit.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Após custos e taxas</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-violet-600 opacity-0 group-hover:opacity-5 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Margem Média
            </CardTitle>
            <Percent className="w-5 h-5 text-violet-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-violet-600">{avgCommission.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">Sua margem de lucro</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-amber-600 opacity-0 group-hover:opacity-5 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Produtos Ativos
            </CardTitle>
            <ShoppingBag className="w-5 h-5 text-amber-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-foreground">
              {(myDropProducts || []).filter((p: any) => p.is_active).length}
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 opacity-0 group-hover:opacity-5 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pedidos Pendentes
            </CardTitle>
            <Package className="w-5 h-5 text-blue-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-foreground">{inProgressOrders}</div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-500 to-teal-600 opacity-0 group-hover:opacity-5 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pedidos Concluídos
            </CardTitle>
            <CheckCircle className="w-5 h-5 text-teal-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-foreground">{completedOrders}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Evolução de vendas */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-foreground">Evolução de Vendas</CardTitle>
                <p className="text-muted-foreground text-sm mt-1">Últimos 6 meses</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 text-sm">
                <ArrowUpRight className="h-4 w-4" />
                +38%
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={evolutionData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis 
                    dataKey="name" 
                    className="text-muted-foreground"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    className="text-muted-foreground"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorValue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Distribuição por marketplace */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-foreground">Por Marketplace</CardTitle>
              <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs">
                Hoje
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <div className="h-40 w-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={marketplaceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {marketplaceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-6 space-y-3 w-full">
                {marketplaceData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="h-3 w-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-foreground text-sm">{item.name}</span>
                    </div>
                    <span className="text-foreground font-medium">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-foreground">Pedidos Recentes</CardTitle>
              <p className="text-muted-foreground text-sm mt-1">Últimas vendas do seu catálogo</p>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/drop/pedidos')}
              className="text-primary hover:text-primary/80"
            >
              Ver todos
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <div className="py-12 text-center">
              <Package className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum pedido ainda</p>
              <p className="text-muted-foreground/70 text-sm mt-1">
                Seus pedidos aparecerão aqui quando clientes comprarem
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentOrders.map((order: any) => {
                const statusConfig = getStatusConfig(order.order_status);
                return (
                  <div key={order.id} className="py-4 first:pt-0 last:pb-0 hover:bg-muted/50 transition-colors -mx-4 px-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center overflow-hidden flex-shrink-0 border border-border">
                          {order.product?.imagens?.[0] ? (
                            <img 
                              src={order.product.imagens[0]} 
                              alt="" 
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Package className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-foreground font-medium truncate">
                            {order.product?.nome || 'Produto'}
                          </p>
                          <p className="text-muted-foreground text-sm">
                            #{order.order_number} • {order.buyer_name}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-foreground font-semibold">
                          R$ {order.total?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <div className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs mt-1",
                          statusConfig.color
                        )}>
                          <statusConfig.icon className="h-3 w-3" />
                          {statusConfig.label}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DropDashboard;