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
  FileText,
  RefreshCw,
  ExternalLink
} from "lucide-react";
import { useClientDrop } from "@/hooks/useClientDrop";
import { cn } from "@/lib/utils";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// Mock data para gráficos (será substituído por dados reais)
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
  const { dropStats, dropOrders, myDropProducts, isLoading } = useClientDrop();

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return { icon: Clock, label: 'Pendente', color: 'text-drop-warning bg-drop-warning/10' };
      case 'paid':
        return { icon: CheckCircle, label: 'Pago', color: 'text-drop-success bg-drop-success/10' };
      case 'shipped':
        return { icon: Truck, label: 'Enviado', color: 'text-drop-accent bg-drop-accent/10' };
      case 'delivered':
        return { icon: CheckCircle, label: 'Entregue', color: 'text-drop-success bg-drop-success/10' };
      default:
        return { icon: AlertCircle, label: status, color: 'text-drop-text-muted bg-drop-surface' };
    }
  };

  const recentOrders = (dropOrders || []).slice(0, 5);
  
  // Calcular estatísticas
  const completedOrders = (dropOrders || []).filter((o: any) => o.order_status === 'delivered').length;
  const inProgressOrders = (dropOrders || []).filter((o: any) => ['pending', 'paid', 'shipped'].includes(o.order_status)).length;
  const syncedOrders = (dropOrders || []).filter((o: any) => o.external_marketplace).length;

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center px-6 py-3 rounded-full bg-drop-surface border border-drop-border">
          <span className="text-drop-text font-bold text-lg tracking-wide">DASHBOARD</span>
        </div>
        <div className="px-4 py-2 rounded-full bg-drop-surface/50 border border-drop-border text-drop-text-muted text-sm">
          Dados em tempo real
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Saldo Estimado - Card Principal */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-drop-card via-drop-surface to-drop-card border border-drop-accent/20 p-6">
          {/* Decorative border glow */}
          <div className="absolute inset-0 rounded-2xl border border-drop-accent/30" />
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-drop-accent/10 via-transparent to-drop-accent/10 blur-xl" />
          
          <div className="relative">
            <p className="text-drop-text-muted text-xs uppercase tracking-widest mb-4">
              Saldo Estimado
            </p>
            <p className="text-4xl lg:text-5xl font-bold text-drop-text mb-4">
              R$ {((dropStats?.total_sales || 0) - (dropStats?.total_profit || 0) * 0.1).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-drop-text-muted text-sm">
              Com base nos pedidos concluídos e em andamento
            </p>
          </div>
        </div>

        {/* Produtos importados */}
        <div className="rounded-2xl bg-gradient-to-br from-drop-card to-drop-surface border border-drop-border p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 rounded-lg bg-amber-500/20">
              <Package className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-drop-text-muted text-sm">Produtos importados no catálogo</p>
            </div>
          </div>
          <p className="text-4xl font-bold text-drop-text mb-2">
            {(myDropProducts || []).length.toLocaleString('pt-BR')}
          </p>
          <p className="text-drop-text-muted text-sm">
            Itens trazidos dos fornecedores para a base
          </p>
        </div>

        {/* Produtos ativos */}
        <div className="rounded-2xl bg-gradient-to-br from-drop-card to-drop-surface border border-drop-border p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 rounded-lg bg-drop-accent/20">
              <ShoppingBag className="h-5 w-5 text-drop-accent" />
            </div>
            <div>
              <p className="text-drop-text-muted text-sm">Produtos ativos para revenda</p>
            </div>
          </div>
          <p className="text-4xl font-bold text-drop-text mb-2">
            {(myDropProducts || []).filter((p: any) => p.is_active).length.toLocaleString('pt-BR')}
          </p>
          <p className="text-drop-text-muted text-sm">
            Disponíveis para publicar nos marketplaces
          </p>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pedidos externos sincronizados */}
        <div className="rounded-2xl bg-gradient-to-br from-drop-card to-drop-surface border border-drop-border p-5">
          <div className="flex items-center gap-2 mb-3">
            <RefreshCw className="h-4 w-4 text-drop-accent" />
            <p className="text-drop-text-muted text-sm">Pedidos externos sincronizados</p>
          </div>
          <p className="text-3xl font-bold text-drop-accent mb-1">
            {syncedOrders}
          </p>
          <p className="text-drop-text-muted text-xs">
            Pedidos importados dos canais conectados
          </p>
        </div>

        {/* Pedidos concluídos */}
        <div className="rounded-2xl bg-gradient-to-br from-drop-card to-drop-surface border border-drop-border p-5">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="h-4 w-4 text-drop-success" />
            <p className="text-drop-text-muted text-sm">Pedidos concluídos</p>
          </div>
          <p className="text-3xl font-bold text-drop-text mb-1">
            {completedOrders}
          </p>
          <p className="text-drop-text-muted text-xs">
            Entregues e finalizados nos marketplaces
          </p>
        </div>

        {/* Pedidos em andamento */}
        <div className="rounded-2xl bg-gradient-to-br from-drop-card to-drop-surface border border-drop-border p-5">
          <div className="flex items-center gap-2 mb-3">
            <Truck className="h-4 w-4 text-drop-warning" />
            <p className="text-drop-text-muted text-sm">Pedidos em andamento</p>
          </div>
          <p className="text-3xl font-bold text-drop-text mb-1">
            {inProgressOrders}
          </p>
          <p className="text-drop-text-muted text-xs">
            Aguardando envio, faturamento ou atualização
          </p>
        </div>

        {/* Faturas de fornecedor */}
        <div className="rounded-2xl bg-gradient-to-br from-drop-card to-drop-surface border border-drop-border p-5">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-4 w-4 text-drop-text-muted" />
            <p className="text-drop-text-muted text-sm">Faturas de fornecedor</p>
          </div>
          <p className="text-3xl font-bold text-drop-text mb-1">
            {dropStats?.pending_orders || 0}
          </p>
          <p className="text-drop-text-muted text-xs">
            Documentos pendentes de conferência interna
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Evolução de pedidos */}
        <div className="lg:col-span-2 rounded-2xl bg-gradient-to-br from-drop-card to-drop-surface border border-drop-border p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-drop-text font-semibold">Evolução de pedidos</h3>
              <p className="text-drop-text-muted text-sm">Últimos 6 meses em todos os marketplaces.</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-drop-success/10 text-drop-success text-sm">
              <ArrowUpRight className="h-4 w-4" />
              +38% vs. período anterior
            </div>
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={evolutionData}>
                <XAxis 
                  dataKey="name" 
                  stroke="#6b7280" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="#6b7280" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => value}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1a1625', 
                    border: '1px solid #2d2640',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#8B5CF6" 
                  strokeWidth={3}
                  dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#8B5CF6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribuição por marketplace */}
        <div className="rounded-2xl bg-gradient-to-br from-drop-card to-drop-surface border border-drop-border p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-drop-text font-semibold">Distribuição por marketplace</h3>
            <span className="px-3 py-1 rounded-full bg-drop-surface border border-drop-border text-drop-text-muted text-xs">
              Hoje
            </span>
          </div>
          
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
                    <span className="text-drop-text text-sm">{item.name}</span>
                  </div>
                  <span className="text-drop-text font-medium">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="rounded-2xl bg-gradient-to-br from-drop-card to-drop-surface border border-drop-border overflow-hidden">
        <div className="p-6 border-b border-drop-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-drop-text">Pedidos Recentes</h2>
              <p className="text-drop-text-muted text-sm">Últimas vendas do seu catálogo</p>
            </div>
            <button className="flex items-center gap-2 text-drop-accent text-sm hover:underline">
              Ver todos
              <ExternalLink className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {recentOrders.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="h-16 w-16 text-drop-text-muted mx-auto mb-4 opacity-50" />
            <p className="text-drop-text-muted">Nenhum pedido ainda</p>
            <p className="text-drop-text-muted text-sm mt-1">
              Seus pedidos aparecerão aqui quando clientes comprarem
            </p>
          </div>
        ) : (
          <div className="divide-y divide-drop-border">
            {recentOrders.map((order: any) => {
              const statusConfig = getStatusConfig(order.order_status);
              return (
                <div key={order.id} className="p-4 lg:p-5 hover:bg-drop-surface-hover transition-colors">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="h-12 w-12 rounded-xl bg-drop-surface flex items-center justify-center overflow-hidden flex-shrink-0 border border-drop-border">
                        {order.product?.imagens?.[0] ? (
                          <img 
                            src={order.product.imagens[0]} 
                            alt="" 
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Package className="h-5 w-5 text-drop-text-muted" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-drop-text font-medium truncate">
                          {order.product?.nome || 'Produto'}
                        </p>
                        <p className="text-drop-text-muted text-sm">
                          #{order.order_number} • {order.buyer_name}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-drop-text font-semibold">
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
      </div>
    </div>
  );
};

export default DropDashboard;