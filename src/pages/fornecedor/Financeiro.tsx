import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DollarSign, TrendingUp, Eye } from "lucide-react";
import { useSupplierOrders, SupplierOrder } from "@/hooks/useSupplierOrders";
import { toast } from "sonner";

const Financeiro = () => {
  const { orders } = useSupplierOrders();
  const [selectedOrder, setSelectedOrder] = useState<SupplierOrder | null>(null);

  const availableBalance = orders
    .filter(o => o.status === 'delivered')
    .reduce((sum, o) => sum + o.value, 0);

  const pendingBalance = orders
    .filter(o => o.status !== 'delivered' && o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.value, 0);

  const monthTotal = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.value, 0);

  const handleWithdraw = () => {
    toast.success("Solicitação de saque enviada! Você receberá em até 2 dias úteis.");
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      awaiting_payment: 'Pendente',
      preparing: 'Pendente',
      shipped: 'Pendente',
      delivered: 'Pago',
      cancelled: 'Cancelado',
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold">Financeiro</h1>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Saldo Disponível</p>
              <p className="text-2xl sm:text-3xl font-bold text-green-600">
                R$ {availableBalance.toFixed(2)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 sm:h-10 sm:w-10 text-green-600/20" />
          </div>
          <Button
            className="w-full mt-3 sm:mt-4 bg-green-600 hover:bg-green-700 text-sm"
            onClick={handleWithdraw}
            disabled={availableBalance === 0}
            size="sm"
          >
            Solicitar Saque
          </Button>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Saldo Pendente</p>
              <p className="text-2xl sm:text-3xl font-bold text-orange-600">
                R$ {pendingBalance.toFixed(2)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 sm:h-10 sm:w-10 text-orange-600/20" />
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Total Vendido no Mês</p>
              <p className="text-2xl sm:text-3xl font-bold text-primary">
                R$ {monthTotal.toFixed(2)}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 sm:h-10 sm:w-10 text-primary/20" />
          </div>
        </Card>
      </div>

      {/* Histórico de Transações */}
      <Card className="overflow-hidden">
        <div className="p-4 sm:p-6 border-b">
          <h2 className="text-base sm:text-xl font-bold">Histórico de Transações</h2>
        </div>
        <div className="divide-y">
          {orders.map((order) => (
            <div key={order.id} className="p-4 sm:p-6 hover:bg-muted/20 transition-colors">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm sm:text-base mb-1">Pedido #{order.id}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">{order.date}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                  order.status === 'delivered'
                    ? 'bg-green-100 text-green-800'
                    : order.status === 'cancelled'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-orange-100 text-orange-800'
                }`}>
                  {getStatusLabel(order.status)}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
                <div>
                  <p className="text-muted-foreground">Cliente</p>
                  <p className="font-medium">{order.customerName}</p>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground">Valor</p>
                  <p className="font-semibold text-base sm:text-lg text-primary">R$ {order.value.toFixed(2)}</p>
                </div>
              </div>
              
              <div className="mt-3 flex justify-end">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-xs sm:text-sm"
                  onClick={() => setSelectedOrder(order)}
                >
                  <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Ver Detalhes
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Modal de Detalhes */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Pedido {selectedOrder?.id}</DialogTitle>
            <DialogDescription>
              Informações completas do pedido
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Informações do Pedido */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Cliente</p>
                  <p className="font-medium">{selectedOrder.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedOrder.customerEmail}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Produto</p>
                  <p className="font-medium">{selectedOrder.product}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor</p>
                  <p className="font-medium text-lg">R$ {selectedOrder.value.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data</p>
                  <p className="font-medium">{selectedOrder.date}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium">{getStatusLabel(selectedOrder.status)}</p>
                </div>
              </div>

              {/* Comprovante */}
              {selectedOrder.paymentProof && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Comprovante de Pagamento</p>
                  <img 
                    src={selectedOrder.paymentProof} 
                    alt="Comprovante" 
                    className="max-w-full h-auto rounded-lg border"
                  />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Financeiro;
