import { ParticlesBackground } from "@/components/cliente/ParticlesBackground";
import { BottomNav } from "@/components/cliente/BottomNav";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ArrowLeft, Package, Truck, CheckCircle, Clock, XCircle, AlertCircle, MessageSquare, Star, Download, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSupabaseOrders } from "@/hooks/useSupabaseOrders";
import { useReviews } from "@/hooks/useReviews";
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const MeusPedidos = () => {
  const navigate = useNavigate();
  const { orders } = useSupabaseOrders();
  const { hasReviewedOrder } = useReviews();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [trackingDialog, setTrackingDialog] = useState(false);

  // Separar pedidos ativos e histórico
  const activeOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.order_status));
  const historyOrders = orders.filter(o => ['delivered', 'cancelled'].includes(o.order_status));

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "delivered":
        return { label: "Entregue", variant: "default" as const, icon: CheckCircle, color: "bg-green-100 text-green-700" };
      case "shipped":
        return { label: "Enviado", variant: "secondary" as const, icon: Truck, color: "bg-blue-100 text-blue-700" };
      case "preparing":
        return { label: "Preparando", variant: "secondary" as const, icon: Package, color: "bg-purple-100 text-purple-700" };
      case "pending":
        return { label: "Pendente", variant: "outline" as const, icon: Clock, color: "bg-yellow-100 text-yellow-700" };
      case "cancelled":
        return { label: "Cancelado", variant: "destructive" as const, icon: XCircle, color: "bg-red-100 text-red-700" };
      default:
        return { label: "Pendente", variant: "outline" as const, icon: Package, color: "bg-gray-100 text-gray-700" };
    }
  };

  const renderOrderCard = (order: any) => {
    const statusInfo = getStatusInfo(order.order_status);
    const StatusIcon = statusInfo.icon;
    const items = Array.isArray(order.itens) ? order.itens : [];
    
    return (
      <Card key={order.id} className="bg-white border shadow-sm p-4 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-lg">Pedido #{order.order_number}</h3>
                    <p className="text-sm text-muted-foreground">{format(new Date(order.created_at), 'dd/MM/yyyy', { locale: ptBR })}</p>
                  </div>
                  <Badge variant={statusInfo.variant} className={`gap-1 ${statusInfo.color}`}>
                    <StatusIcon className="h-3 w-3" />
                    {statusInfo.label}
                  </Badge>
                </div>

                <div className="space-y-2 mb-3">
                  {items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">• {item.name} (x{item.quantity})</span>
                      <span className="font-medium">R$ {(Number(item.price) * Number(item.quantity)).toFixed(2).replace('.', ',')}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-3 border-t mb-3">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {items.reduce((sum: number, item: any) => sum + Number(item.quantity), 0)} {items.reduce((sum: number, item: any) => sum + Number(item.quantity), 0) === 1 ? 'item' : 'itens'}
                    </span>
                  </div>
                  <p className="font-bold text-lg text-primary">
                    R$ {Number(order.total).toFixed(2).replace('.', ',')}
                  </p>
                </div>

        <div className="flex gap-2 flex-wrap">
          {order.tracking_code && (
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 gap-1"
              onClick={() => {
                setSelectedOrder(order);
                setTrackingDialog(true);
              }}
            >
              <Truck className="h-4 w-4" />
              Rastreio
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 gap-1"
            onClick={() => navigate('/cliente/chat', { state: { storeId: order.supplier_id } })}
          >
            <MessageSquare className="h-4 w-4" />
            Chat
          </Button>
          {order.order_status === 'delivered' && (
            <Button 
              size="sm" 
              className="flex-1 gap-1 bg-primary hover:bg-primary/90 text-white"
              onClick={() => navigate(`/cliente/avaliar-pedido/${order.id}`)}
            >
              <Star className="h-4 w-4" />
              Avaliar
            </Button>
          )}
          {['delivered', 'cancelled'].includes(order.order_status) && (
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 gap-1"
              onClick={() => setSelectedOrder(order)}
            >
              <Download className="h-4 w-4" />
              Nota
            </Button>
          )}
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
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="active">Ativos ({activeOrders.length})</TabsTrigger>
            <TabsTrigger value="history">Histórico ({historyOrders.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="active" className="space-y-4">
            {activeOrders.map(renderOrderCard)}
            {activeOrders.length === 0 && (
              <Card className="bg-white border shadow-sm p-8 text-center">
                <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-bold text-lg mb-2">Nenhum pedido ativo</h3>
                <p className="text-sm text-muted-foreground">Seus pedidos em andamento aparecerão aqui</p>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="history" className="space-y-4">
            {historyOrders.map(renderOrderCard)}
            {historyOrders.length === 0 && (
              <Card className="bg-white border shadow-sm p-8 text-center">
                <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-bold text-lg mb-2">Nenhum histórico</h3>
                <p className="text-sm text-muted-foreground">Pedidos concluídos aparecerão aqui</p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Dialog de Rastreio */}
      <Dialog open={trackingDialog} onOpenChange={setTrackingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rastreamento do Pedido</DialogTitle>
            <DialogDescription>Pedido #{selectedOrder?.order_number}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Código de Rastreio</p>
              <p className="font-mono font-bold text-lg">{selectedOrder?.tracking_code}</p>
            </div>
            <div className="space-y-2">
              <p className="font-semibold">Status: {getStatusInfo(selectedOrder?.order_status).label}</p>
              <Button 
                className="w-full gap-2" 
                onClick={() => window.open(`https://rastreamento.correios.com.br/app/index.php?codigo=${selectedOrder?.tracking_code}`, '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
                Rastrear nos Correios
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Nota/Comprovante */}
      <Dialog open={!!selectedOrder && !trackingDialog} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Comprovante de Compra</DialogTitle>
            <DialogDescription>Pedido #{selectedOrder?.order_number}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-muted p-6 rounded-lg text-center space-y-2">
              <Package className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Data: {selectedOrder?.created_at && format(new Date(selectedOrder.created_at), 'dd/MM/yyyy', { locale: ptBR })}</p>
              <p className="text-lg font-bold text-primary">R$ {selectedOrder?.total && Number(selectedOrder.total).toFixed(2)}</p>
            </div>
            <Button className="w-full" onClick={() => window.print()}>
              <Download className="h-4 w-4 mr-2" />
              Baixar Comprovante
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

export default MeusPedidos;
