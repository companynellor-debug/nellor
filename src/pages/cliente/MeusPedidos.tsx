import { ParticlesBackground } from "@/components/cliente/ParticlesBackground";
import { BottomNav } from "@/components/cliente/BottomNav";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  ArrowLeft,
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  MessageSquare,
  Star,
  Download,
  ExternalLink,
  CreditCard,
  MapPin,
  ChefHat,
  PackageCheck,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSupabaseOrders } from "@/hooks/useSupabaseOrders";
import { useReviews } from "@/hooks/useReviews";
import { useAutoStripeRevalidation } from "@/hooks/useAutoStripeRevalidation";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

const ORDER_STEPS = [
  { key: 'pending', label: 'Pedido Recebido', icon: Package },
  { key: 'preparing', label: 'Em Preparação', icon: ChefHat },
  { key: 'shipped', label: 'Enviado', icon: Truck },
  { key: 'delivered', label: 'Entregue', icon: PackageCheck },
];

const MeusPedidos = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { orders, refetch } = useSupabaseOrders();
  const { hasReviewedOrder } = useReviews();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [trackingDialog, setTrackingDialog] = useState(false);
  const [detailsDialog, setDetailsDialog] = useState(false);

  // Se o usuário voltar do Stripe, confirma o pagamento imediatamente aqui (sem precisar “entrar na aba”).
  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (!sessionId) return;

    (async () => {
      try {
        await supabase.functions.invoke("stripe-verify-payment", {
          body: { sessionId },
        });
      } catch (e) {
        console.warn("stripe-verify-payment failed on /meus-pedidos:", e);
      } finally {
        refetch();
      }
    })();
  }, [searchParams, refetch]);

  // Fallback automático do webhook: revalida pagamentos pendentes via Stripe (backend)
  useAutoStripeRevalidation({ orders, intervalMs: 120_000 });

  // Realtime subscription for order updates
  useEffect(() => {
    const channel = supabase
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  // Separar pedidos ativos e histórico
  const activeOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.order_status));
  const historyOrders = orders.filter(o => ['delivered', 'cancelled'].includes(o.order_status));

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "delivered":
        return { label: "Entregue", variant: "default" as const, icon: CheckCircle, color: "bg-green-100 text-green-700 border-green-200" };
      case "shipped":
        return { label: "Enviado", variant: "secondary" as const, icon: Truck, color: "bg-blue-100 text-blue-700 border-blue-200" };
      case "preparing":
        return { label: "Em Preparação", variant: "secondary" as const, icon: ChefHat, color: "bg-purple-100 text-purple-700 border-purple-200" };
      case "pending":
        return { label: "Aguardando", variant: "outline" as const, icon: Clock, color: "bg-yellow-100 text-yellow-700 border-yellow-200" };
      case "cancelled":
        return { label: "Cancelado", variant: "destructive" as const, icon: XCircle, color: "bg-red-100 text-red-700 border-red-200" };
      default:
        return { label: "Aguardando", variant: "outline" as const, icon: Package, color: "bg-gray-100 text-gray-700 border-gray-200" };
    }
  };

  const getPaymentStatusInfo = (status: string) => {
    switch (status) {
      case "paid":
        return { label: "Pago", color: "bg-green-100 text-green-700", icon: CheckCircle };
      case "pending":
        return { label: "Pendente", color: "bg-yellow-100 text-yellow-700", icon: Clock };
      case "refunded":
        return { label: "Reembolsado", color: "bg-blue-100 text-blue-700", icon: CreditCard };
      case "cancelled":
        return { label: "Cancelado", color: "bg-red-100 text-red-700", icon: XCircle };
      default:
        return { label: "Pendente", color: "bg-gray-100 text-gray-700", icon: Clock };
    }
  };

  const getCurrentStepIndex = (status: string) => {
    if (status === 'cancelled') return -1;
    const index = ORDER_STEPS.findIndex(step => step.key === status);
    return index === -1 ? 0 : index;
  };

  const OrderTimeline = ({ order }: { order: any }) => {
    const currentIndex = getCurrentStepIndex(order.order_status);
    
    if (order.order_status === 'cancelled') {
      return (
        <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
          <XCircle className="h-8 w-8 text-red-500" />
          <div>
            <p className="font-semibold text-red-700">Pedido Cancelado</p>
            <p className="text-sm text-red-600">Este pedido foi cancelado</p>
          </div>
        </div>
      );
    }

    return (
      <div className="relative">
        <div className="flex justify-between items-center">
          {ORDER_STEPS.map((step, index) => {
            const isCompleted = index <= currentIndex;
            const isCurrent = index === currentIndex;
            const StepIcon = step.icon;
            
            return (
              <div key={step.key} className="flex flex-col items-center relative z-10">
                <div 
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                    ${isCompleted 
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30' 
                      : 'bg-muted text-muted-foreground'
                    }
                    ${isCurrent ? 'ring-4 ring-primary/20 scale-110' : ''}
                  `}
                >
                  <StepIcon className="h-5 w-5" />
                </div>
                <span className={`text-xs mt-2 text-center max-w-[70px] ${isCompleted ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
        {/* Progress line */}
        <div className="absolute top-5 left-[10%] right-[10%] h-1 bg-muted -z-0">
          <div 
            className="h-full bg-primary transition-all duration-500 rounded-full"
            style={{ width: `${(currentIndex / (ORDER_STEPS.length - 1)) * 100}%` }}
          />
        </div>
      </div>
    );
  };

  const renderOrderCard = (order: any) => {
    const statusInfo = getStatusInfo(order.order_status);
    const paymentInfo = getPaymentStatusInfo(order.payment_status);
    const StatusIcon = statusInfo.icon;
    const PaymentIcon = paymentInfo.icon;
    const items = Array.isArray(order.itens) ? order.itens : [];
    const firstImage = items[0]?.image || items[0]?.imagem;
    
    return (
      <Card key={order.id} className="bg-white border shadow-sm overflow-hidden hover:shadow-md transition-all">
        {/* Header com status */}
        <div className={`px-4 py-3 ${statusInfo.color} border-b flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <StatusIcon className="h-4 w-4" />
            <span className="font-medium text-sm">{statusInfo.label}</span>
          </div>
          <span className="text-xs opacity-80">
            {format(new Date(order.created_at), "dd 'de' MMMM", { locale: ptBR })}
          </span>
        </div>

        <div className="p-4">
          {/* Info principal */}
          <div className="flex gap-4 mb-4">
            {firstImage && (
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                <img src={firstImage} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-base mb-1">Pedido #{order.order_number}</h3>
              <p className="text-sm text-muted-foreground truncate">
                {items.length === 1 
                  ? items[0].name 
                  : `${items[0]?.name || 'Item'} e mais ${items.length - 1} ${items.length - 1 === 1 ? 'item' : 'itens'}`
                }
              </p>
              <div className="flex items-center gap-3 mt-2">
                <Badge variant="outline" className={`text-xs ${paymentInfo.color} border-0`}>
                  <PaymentIcon className="h-3 w-3 mr-1" />
                  {paymentInfo.label}
                </Badge>
                <span className="font-bold text-primary">
                  R$ {Number(order.total).toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>
          </div>

          {/* Timeline mini para pedidos ativos */}
          {!['delivered', 'cancelled'].includes(order.order_status) && (
            <div className="mb-4 p-3 bg-muted/50 rounded-xl">
              <OrderTimeline order={order} />
            </div>
          )}

          {/* Tracking code se disponível */}
          {order.tracking_code && order.order_status === 'shipped' && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-xs text-blue-600">Código de rastreio</p>
                  <p className="font-mono font-bold text-blue-800">{order.tracking_code}</p>
                </div>
              </div>
              <Button 
                size="sm" 
                variant="ghost" 
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                onClick={() => window.open(`https://rastreamento.correios.com.br/app/index.php?codigo=${order.tracking_code}`, '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          )}


          {/* Pagamento é atualizado automaticamente via webhook (sem ação manual do cliente) */}

          {/* Botões de ação */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => {
                setSelectedOrder(order);
                setDetailsDialog(true);
              }}
            >
              Ver detalhes
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => navigate('/cliente/chat', { state: { supplierId: order.supplier_id } })}
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              Chat
            </Button>
            {order.order_status === 'delivered' && !hasReviewedOrder(order.id) && (
              <Button 
                size="sm" 
                className="flex-1 bg-primary hover:bg-primary/90"
                onClick={() => navigate(`/cliente/avaliar-pedido/${order.id}`)}
              >
                <Star className="h-4 w-4 mr-1" />
                Avaliar
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <ParticlesBackground />

      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate("/cliente/perfil")} className="hover:bg-accent p-2 rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-primary">Meus Pedidos</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 relative z-10">
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-white border shadow-sm">
            <TabsTrigger value="active" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Ativos ({activeOrders.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Histórico ({historyOrders.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="active" className="space-y-4">
            {activeOrders.map(renderOrderCard)}
            {activeOrders.length === 0 && (
              <Card className="bg-white border shadow-sm p-8 text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                  <Package className="h-10 w-10 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2">Nenhum pedido ativo</h3>
                <p className="text-sm text-muted-foreground mb-4">Seus pedidos em andamento aparecerão aqui</p>
                <Button onClick={() => navigate('/cliente/produtos')}>
                  Explorar produtos
                </Button>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="history" className="space-y-4">
            {historyOrders.map(renderOrderCard)}
            {historyOrders.length === 0 && (
              <Card className="bg-white border shadow-sm p-8 text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                  <Package className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="font-bold text-lg mb-2">Nenhum histórico</h3>
                <p className="text-sm text-muted-foreground">Pedidos concluídos aparecerão aqui</p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Dialog de Detalhes do Pedido */}
      <Dialog open={detailsDialog} onOpenChange={setDetailsDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Pedido</DialogTitle>
            <DialogDescription>Pedido #{selectedOrder?.order_number}</DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              {/* Timeline completa */}
              <div className="p-4 bg-muted/50 rounded-xl">
                <h4 className="font-semibold mb-4 text-sm">Status do Pedido</h4>
                <OrderTimeline order={selectedOrder} />
              </div>

              {/* Informações de pagamento */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Pagamento
                </h4>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Método</span>
                    <span className="font-medium capitalize">
                      {selectedOrder.payment_method === 'cartao' ? 'Cartão de Crédito' : 
                       selectedOrder.payment_method === 'pix' ? 'Pix' : 'Boleto'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge className={`${getPaymentStatusInfo(selectedOrder.payment_status).color} border-0`}>
                      {getPaymentStatusInfo(selectedOrder.payment_status).label}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Endereço de entrega */}
              {selectedOrder.endereco_entrega && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Endereço de Entrega
                  </h4>
                  <div className="p-3 bg-muted/50 rounded-lg text-sm">
                    <p>{selectedOrder.endereco_entrega.street}, {selectedOrder.endereco_entrega.number}</p>
                    {selectedOrder.endereco_entrega.complement && (
                      <p>{selectedOrder.endereco_entrega.complement}</p>
                    )}
                    <p>{selectedOrder.endereco_entrega.neighborhood}</p>
                    <p>{selectedOrder.endereco_entrega.city} - {selectedOrder.endereco_entrega.state}</p>
                    <p>CEP: {selectedOrder.endereco_entrega.zip_code}</p>
                  </div>
                </div>
              )}

              {/* Itens do pedido */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Itens do Pedido
                </h4>
                <div className="space-y-2">
                  {Array.isArray(selectedOrder.itens) && selectedOrder.itens.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      {(item.image || item.imagem) && (
                        <img 
                          src={item.image || item.imagem} 
                          alt={item.name} 
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">Qtd: {item.quantity}</p>
                      </div>
                      <p className="font-semibold text-sm">
                        R$ {(Number(item.price) * Number(item.quantity)).toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resumo de valores */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>R$ {Number(selectedOrder.subtotal).toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Frete</span>
                  <span>R$ {Number(selectedOrder.frete || 0).toFixed(2).replace('.', ',')}</span>
                </div>
                {selectedOrder.desconto > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Desconto</span>
                    <span>- R$ {Number(selectedOrder.desconto).toFixed(2).replace('.', ',')}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span className="text-primary">R$ {Number(selectedOrder.total).toFixed(2).replace('.', ',')}</span>
                </div>
              </div>

              {/* Rastreio */}
              {selectedOrder.tracking_code && (
                <Button 
                  className="w-full gap-2" 
                  onClick={() => window.open(`https://rastreamento.correios.com.br/app/index.php?codigo=${selectedOrder.tracking_code}`, '_blank')}
                >
                  <Truck className="h-4 w-4" />
                  Rastrear Pedido
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

export default MeusPedidos;
