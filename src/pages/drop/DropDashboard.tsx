import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  ShoppingBag,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
  Truck,
  AlertCircle
} from "lucide-react";
import { useClientDrop } from "@/hooks/useClientDrop";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const DropDashboard = () => {
  const { dropStats, dropOrders, myDropProducts, isLoading } = useClientDrop();

  const stats = [
    {
      title: "Vendas Totais",
      value: `R$ ${(dropStats?.total_sales || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      change: "+12.5%",
      trend: "up",
      icon: TrendingUp,
      color: "drop-accent"
    },
    {
      title: "Lucro Líquido",
      value: `R$ ${(dropStats?.total_profit || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      change: "+8.2%",
      trend: "up",
      icon: DollarSign,
      color: "drop-success"
    },
    {
      title: "Pedidos Pendentes",
      value: String(dropStats?.pending_orders || 0),
      change: dropStats?.pending_orders ? "Aguardando" : "Nenhum",
      trend: "neutral",
      icon: Package,
      color: "drop-warning"
    },
    {
      title: "Produtos Ativos",
      value: String(dropStats?.active_products || 0),
      change: "Em catálogo",
      trend: "neutral",
      icon: ShoppingBag,
      color: "drop-accent"
    },
  ];

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

  return (
    <div className="p-4 lg:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-drop-text">Dashboard</h1>
        <p className="text-drop-text-muted mt-1">Visão geral do seu negócio Nellor Drop</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-drop-card border border-drop-border rounded-2xl p-4 lg:p-6 hover:border-drop-accent/30 transition-all duration-300 group"
          >
            <div className="flex items-start justify-between">
              <div className={cn(
                "p-2 lg:p-3 rounded-xl",
                stat.color === "drop-accent" && "bg-drop-accent/10",
                stat.color === "drop-success" && "bg-drop-success/10",
                stat.color === "drop-warning" && "bg-drop-warning/10"
              )}>
                <stat.icon className={cn(
                  "h-5 w-5 lg:h-6 lg:w-6",
                  stat.color === "drop-accent" && "text-drop-accent",
                  stat.color === "drop-success" && "text-drop-success",
                  stat.color === "drop-warning" && "text-drop-warning"
                )} />
              </div>
              {stat.trend === "up" && (
                <div className="flex items-center gap-1 text-drop-success text-xs">
                  <ArrowUpRight className="h-3 w-3" />
                  {stat.change}
                </div>
              )}
              {stat.trend === "down" && (
                <div className="flex items-center gap-1 text-destructive text-xs">
                  <ArrowDownRight className="h-3 w-3" />
                  {stat.change}
                </div>
              )}
            </div>
            <div className="mt-4">
              <p className="text-drop-text-muted text-xs lg:text-sm">{stat.title}</p>
              <p className="text-drop-text text-xl lg:text-2xl font-bold mt-1">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-drop-card border border-drop-border rounded-2xl overflow-hidden">
          <div className="p-4 lg:p-6 border-b border-drop-border">
            <h2 className="text-lg font-semibold text-drop-text">Pedidos Recentes</h2>
            <p className="text-drop-text-muted text-sm">Últimas vendas do seu catálogo</p>
          </div>
          
          {recentOrders.length === 0 ? (
            <div className="p-8 text-center">
              <Package className="h-12 w-12 text-drop-text-muted mx-auto mb-4" />
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
                        <div className="h-12 w-12 rounded-xl bg-drop-surface flex items-center justify-center overflow-hidden flex-shrink-0">
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

        {/* Quick Stats */}
        <div className="space-y-4">
          {/* Avg Commission */}
          <div className="bg-drop-card border border-drop-border rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-drop-accent/10">
                <TrendingUp className="h-5 w-5 text-drop-accent" />
              </div>
              <div>
                <p className="text-drop-text font-medium">Margem Média</p>
                <p className="text-drop-text-muted text-sm">Por produto vendido</p>
              </div>
            </div>
            <p className="text-3xl font-bold text-drop-success">
              {(dropStats?.avg_commission || 0).toFixed(1)}%
            </p>
          </div>

          {/* Active Products Preview */}
          <div className="bg-drop-card border border-drop-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-drop-text font-medium">Produtos Ativos</h3>
              <span className="text-drop-accent text-sm font-medium">
                {myDropProducts?.filter((p: any) => p.is_active).length || 0}
              </span>
            </div>
            
            {(myDropProducts || []).slice(0, 3).map((product: any) => (
              <div key={product.id} className="flex items-center gap-3 py-2">
                <div className="h-10 w-10 rounded-lg bg-drop-surface overflow-hidden flex-shrink-0">
                  {product.product?.imagens?.[0] ? (
                    <img 
                      src={product.product.imagens[0]} 
                      alt="" 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <ShoppingBag className="h-4 w-4 text-drop-text-muted" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-drop-text text-sm font-medium truncate">
                    {product.product?.nome}
                  </p>
                  <p className="text-drop-success text-xs">
                    R$ {product.custom_price?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            ))}
            
            {(!myDropProducts || myDropProducts.length === 0) && (
              <p className="text-drop-text-muted text-sm text-center py-4">
                Adicione produtos ao seu catálogo
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DropDashboard;
