import { ParticlesBackground } from "@/components/cliente/ParticlesBackground";
import { BottomNav } from "@/components/cliente/BottomNav";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ArrowLeft, Package, Truck, CheckCircle, Clock, XCircle, AlertCircle, MessageSquare, Star, Download, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useOrders, OrderStatus } from "@/hooks/useOrders";
import { useReviews } from "@/hooks/useReviews";
import { useState } from "react";

const MeusPedidos = () => {
  const navigate = useNavigate();
  const { orders } = useOrders();
  const { hasReviewedOrder } = useReviews();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [trackingDialog, setTrackingDialog] = useState(false);

  // Separar pedidos ativos e histórico
  const activeOrders = orders.filter(o => !['entregue', 'recusado'].includes(o.status));
  const historyOrders = orders.filter(o => ['entregue', 'recusado'].includes(o.status));

  const getStatusInfo = (status: OrderStatus) => {
    switch (status) {
      case "entregue":
        return { label: "Entregue", variant: "default" as const, icon: CheckCircle, color: "bg-green-100 text-green-700" };
      case "enviado":
        return { label: "Enviado", variant: "secondary" as const, icon: Truck, color: "bg-blue-100 text-blue-700" };
      case "preparando":
        return { label: "Preparando", variant: "secondary" as const, icon: Package, color: "bg-purple-100 text-purple-700" };
      case "aguardando_confirmacao":
        return { label: "Aguardando Confirmação", variant: "outline" as const, icon: Clock, color: "bg-yellow-100 text-yellow-700" };
      case "pendente_pagamento":
        return { label: "Pendente Pagamento", variant: "outline" as const, icon: AlertCircle, color: "bg-orange-100 text-orange-700" };
      case "recusado":
        return { label: "Recusado", variant: "destructive" as const, icon: XCircle, color: "bg-red-100 text-red-700" };
      default:
        return { label: "Pendente", variant: "outline" as const, icon: Package, color: "bg-gray-100 text-gray-700" };
    }
  };

  const renderOrderCard = (order: any) => {
    const statusInfo = getStatusInfo(order.status);
    const StatusIcon = statusInfo.icon;
    
    return (
      <Card key={order.id} className="bg-white border shadow-sm p-4 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-lg">Pedido #{order.id}</h3>
                    <p className="text-sm text-muted-foreground">{order.date}</p>
                    <p className="text-sm font-medium text-primary mt-1">{order.storeName}</p>
                  </div>
                  <Badge variant={statusInfo.variant} className={`gap-1 ${statusInfo.color}`}>
                    <StatusIcon className="h-3 w-3" />
                    {statusInfo.label}
                  </Badge>
                </div>

                <div className="space-y-2 mb-3">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">• {item.name} (x{item.quantity})</span>
                      <span className="font-medium">R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-3 border-t mb-3">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {order.items.reduce((sum, item) => sum + item.quantity, 0)} {order.items.reduce((sum, item) => sum + item.quantity, 0) === 1 ? 'item' : 'itens'}
                    </span>
                  </div>
                  <p className="font-bold text-lg text-primary">
                    R$ {order.total.toFixed(2).replace('.', ',')}
                  </p>
                </div>

        <div className="flex gap-2 flex-wrap">
          {order.trackingCode && (
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
            onClick={() => navigate('/cliente/chat', { state: { storeId: order.storeId } })}
          >
            <MessageSquare className="h-4 w-4" />
            Chat
          </Button>
          {order.canReview && !hasReviewedOrder(order.id) && (
            <Button 
              size="sm" 
              className="flex-1 gap-1 bg-primary hover:bg-primary/90 text-white"
              onClick={() => navigate('/cliente/avaliar-pedido', { state: { order } })}
            >
              <Star className="h-4 w-4" />
              Avaliar
            </Button>
          )}
          {['entregue', 'recusado'].includes(order.status) && (
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
            <DialogDescription>Pedido #{selectedOrder?.id}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Código de Rastreio</p>
              <p className="font-mono font-bold text-lg">{selectedOrder?.trackingCode}</p>
            </div>
            <div className="space-y-2">
              <p className="font-semibold">Status: {getStatusInfo(selectedOrder?.status).label}</p>
              <Button 
                className="w-full gap-2" 
                onClick={() => window.open(`https://rastreamento.correios.com.br/app/index.php?codigo=${selectedOrder?.trackingCode}`, '_blank')}
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
            <DialogDescription>Pedido #{selectedOrder?.id}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-muted p-6 rounded-lg text-center space-y-2">
              <Package className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="font-bold">{selectedOrder?.storeName}</p>
              <p className="text-sm text-muted-foreground">Data: {selectedOrder?.date}</p>
              <p className="text-lg font-bold text-primary">R$ {selectedOrder?.total.toFixed(2)}</p>
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
