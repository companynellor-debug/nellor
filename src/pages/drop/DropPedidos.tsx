import { useState } from "react";
import { 
  Package, 
  Search, 
  Filter,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  Eye,
  ExternalLink
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useClientDrop } from "@/hooks/useClientDrop";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const DropPedidos = () => {
  const { dropOrders, isLoading } = useClientDrop();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const statusOptions = [
    { value: null, label: "Todos", count: dropOrders?.length || 0 },
    { value: "pending", label: "Pendentes", count: dropOrders?.filter((o: any) => o.order_status === 'pending').length || 0 },
    { value: "paid", label: "Pagos", count: dropOrders?.filter((o: any) => o.order_status === 'paid').length || 0 },
    { value: "shipped", label: "Enviados", count: dropOrders?.filter((o: any) => o.order_status === 'shipped').length || 0 },
    { value: "delivered", label: "Entregues", count: dropOrders?.filter((o: any) => o.order_status === 'delivered').length || 0 },
  ];

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return { icon: Clock, label: 'Pendente', color: 'bg-drop-warning/10 text-drop-warning border-drop-warning/20' };
      case 'paid':
        return { icon: CheckCircle, label: 'Pago', color: 'bg-drop-success/10 text-drop-success border-drop-success/20' };
      case 'shipped':
        return { icon: Truck, label: 'Enviado', color: 'bg-drop-accent/10 text-drop-accent border-drop-accent/20' };
      case 'delivered':
        return { icon: CheckCircle, label: 'Entregue', color: 'bg-drop-success/10 text-drop-success border-drop-success/20' };
      case 'cancelled':
        return { icon: XCircle, label: 'Cancelado', color: 'bg-destructive/10 text-destructive border-destructive/20' };
      default:
        return { icon: Clock, label: status, color: 'bg-drop-surface text-drop-text-muted border-drop-border' };
    }
  };

  const filteredOrders = (dropOrders || []).filter((order: any) => {
    const matchesSearch = !search || 
      order.order_number?.toLowerCase().includes(search.toLowerCase()) ||
      order.buyer_name?.toLowerCase().includes(search.toLowerCase()) ||
      order.product?.nome?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = !statusFilter || order.order_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-drop-text">Pedidos</h1>
        <p className="text-drop-text-muted mt-1">Gerencie suas vendas Nellor Drop</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-drop-text-muted" />
          <Input
            placeholder="Buscar por número, cliente ou produto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-drop-surface border-drop-border text-drop-text placeholder:text-drop-text-muted focus:border-drop-accent"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
          {statusOptions.map((option) => (
            <button
              key={option.value || 'all'}
              onClick={() => setStatusFilter(option.value)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all",
                statusFilter === option.value
                  ? "bg-drop-accent text-white"
                  : "bg-drop-surface text-drop-text-muted hover:bg-drop-surface-hover hover:text-drop-text"
              )}
            >
              {option.label}
              <span className={cn(
                "ml-2 text-xs",
                statusFilter === option.value ? "text-white/70" : "text-drop-text-muted"
              )}>
                {option.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-drop-card border border-drop-border rounded-2xl p-12 text-center">
          <Package className="h-16 w-16 text-drop-text-muted mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-drop-text mb-2">Nenhum pedido encontrado</h3>
          <p className="text-drop-text-muted max-w-md mx-auto">
            {search || statusFilter 
              ? "Tente ajustar os filtros de busca"
              : "Quando clientes comprarem seus produtos, os pedidos aparecerão aqui automaticamente"
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order: any) => {
            const statusConfig = getStatusConfig(order.order_status);
            const orderDate = order.created_at ? format(new Date(order.created_at), "dd MMM yyyy, HH:mm", { locale: ptBR }) : '';
            
            return (
              <div 
                key={order.id}
                className="bg-drop-card border border-drop-border rounded-2xl p-4 lg:p-6 hover:border-drop-accent/30 transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Product Image */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="h-16 w-16 lg:h-20 lg:w-20 rounded-xl bg-drop-surface overflow-hidden flex-shrink-0">
                      {order.product?.imagens?.[0] ? (
                        <img 
                          src={order.product.imagens[0]} 
                          alt="" 
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <Package className="h-6 w-6 text-drop-text-muted" />
                        </div>
                      )}
                    </div>
                    
                    {/* Order Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-drop-accent font-mono text-sm">#{order.order_number}</span>
                        {order.external_marketplace && (
                          <Badge variant="outline" className="border-drop-border text-drop-text-muted text-[10px]">
                            {order.external_marketplace}
                          </Badge>
                        )}
                      </div>
                      <h3 className="text-drop-text font-semibold truncate">
                        {order.product?.nome || 'Produto'}
                      </h3>
                      <p className="text-drop-text-muted text-sm">
                        {order.buyer_name} • {order.quantity}x
                      </p>
                      <p className="text-drop-text-muted text-xs mt-1">
                        {orderDate}
                      </p>
                    </div>
                  </div>

                  {/* Price & Status */}
                  <div className="flex items-center justify-between lg:flex-col lg:items-end gap-4">
                    <div className="text-right">
                      <p className="text-drop-text font-bold text-lg">
                        R$ {order.total?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-drop-success text-sm">
                        Lucro: R$ {order.client_margin?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    
                    <Badge 
                      variant="outline"
                      className={cn("flex items-center gap-1.5 px-3 py-1.5", statusConfig.color)}
                    >
                      <statusConfig.icon className="h-3.5 w-3.5" />
                      {statusConfig.label}
                    </Badge>
                  </div>
                </div>

                {/* Tracking Info */}
                {order.tracking_code && (
                  <div className="mt-4 pt-4 border-t border-drop-border flex items-center gap-2">
                    <Truck className="h-4 w-4 text-drop-text-muted" />
                    <span className="text-drop-text-muted text-sm">Rastreio:</span>
                    <code className="text-drop-accent font-mono text-sm">{order.tracking_code}</code>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DropPedidos;
