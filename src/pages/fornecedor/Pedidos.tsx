import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Eye, CheckCircle, Truck, Package, XCircle, CalendarIcon, X } from "lucide-react";
import { useSupplierOrders, OrderStatus, SupplierOrder } from "@/hooks/useSupplierOrders";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

const Pedidos = () => {
  const { orders, updateOrderStatus } = useSupplierOrders();
  const [selectedOrder, setSelectedOrder] = useState<SupplierOrder | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  // Filtrar pedidos por data
  const filteredOrders = orders.filter(order => {
    if (!dateRange?.from) return true;
    
    const orderDate = new Date(order.date.split('/').reverse().join('-'));
    const fromDate = dateRange.from;
    const toDate = dateRange.to || dateRange.from;
    
    return orderDate >= fromDate && orderDate <= toDate;
  });

  const getStatusBadge = (status: OrderStatus) => {
    const badges = {
      awaiting_payment: { label: 'Aguardando Pagamento', class: 'bg-yellow-100 text-yellow-800' },
      preparing: { label: 'Preparando', class: 'bg-blue-100 text-blue-800' },
      shipped: { label: 'Enviado', class: 'bg-purple-100 text-purple-800' },
      delivered: { label: 'Entregue', class: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Cancelado', class: 'bg-red-100 text-red-800' },
    };
    return badges[status];
  };

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    updateOrderStatus(orderId, newStatus);
    
    // Atualizar o estado local do pedido selecionado também
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: newStatus });
    }
    
    toast.success("Status do pedido atualizado!");
    
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixi0ezVhTgIHm7A7+OZRQ0PVqzn77BfGgU7ltrzxnkqBil+zPDajTsJGGS36+ikUBELTKXh8LdjHAU7kdfy0YU2Bh1tv+/mnEgND1as5++wXxoFO5ba88Z5KgYpfsz02o07CRhkt+vopFARCUyi4PG3YxwFO5HX8tGFNgYdbb/v5pxIDQ9WrOfvsF8aBTuW2vPGeSoGKX7M9NqNOwkYZLfr6KRQEQlMouDxt2McBTuR1/LRhTYGHW2/7+acSA0PVqzn77BfGgU7ltrzxnkqBil+zPDajTsJGGS36+ikUBEJTKLg8bdjHAU7kdfyzoQzBhxrv+/omkYMD1Wr5u+vYBoEOpbZ88Z5KgYpf8zw2o07CRhkt+vopFARCUyi4PG3YxwFO5HX8s6EMwYca7/v6JpGDA9Vq+bvr2AaBDqW2fPGeSoGKX/M8NqNOwkYZLfr6KRQEQlMouDxt2McBTuR1/LOhDMGHGu/7+iaRgwPVavm769gGgQ6ltnzxnkqBil/zPDajTsJGGS36+ikUBEJTKLg8bdjHAU7kdfyzoQzBhxrv+/omkYMD1Wr5u+vYBoEOpbZ88Z5KgYpf8zw2o07CRhkt+vopFARCUyi4PG3YxwFO5HX8s6EMwYca7/v6JpGDA9Vq+bvr2AaBDqW2fPGeSoGKX/M8NqNOwkYZLfr6KRQEQlMouDxt2McBTuR1/LOhDMGHGu/7+iaRgwPVavm769gGgQ6ltnzxnkqBil/zPDajTsJGGS36+ikUBEJTKLg8bdjHAU7kdfyzoQzBhxrv+/omkYMD1Wr5u+vYBoEOpbZ88Z5KgYpf8zw2o07CRhkt+vopFARCUyi4PG3YxwFO5HX8s6EMwYca7/v6JpGDA9Vq+bvr2AaBDqW2fPGeSoGKX/M8NqNOwkYZLfr6KRQEQ==');
    audio.play();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Pedidos</h1>
        
        {/* Filtro de Data */}
        <div className="flex gap-2 items-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                      {format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
                    </>
                  ) : (
                    format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })
                  )
                ) : (
                  <span>Filtrar por data</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
                locale={ptBR}
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
          
          {dateRange && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDateRange(undefined)}
              title="Limpar filtro"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="divide-y">
          {filteredOrders.length === 0 ? (
            <div className="p-8 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {dateRange ? "Nenhum pedido encontrado neste período" : "Nenhum pedido no momento"}
              </p>
            </div>
          ) : (
            filteredOrders.map((order) => {
            const badge = getStatusBadge(order.status);
            return (
              <div key={order.id} className="p-4 sm:p-6 hover:bg-muted/20 transition-colors">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="font-semibold text-sm sm:text-base mb-1">{order.product}</p>
                    <p className="text-xs text-muted-foreground">Pedido #{order.id}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${badge.class}`}>
                    {badge.label}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-3 text-xs sm:text-sm">
                  <div>
                    <p className="text-muted-foreground">Cliente</p>
                    <p className="font-medium">{order.customerName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Data</p>
                    <p className="font-medium">{order.date}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Valor</p>
                    <p className="font-semibold text-primary">R$ {order.value.toFixed(2)}</p>
                  </div>
                  <div className="flex items-end justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedOrder(order)}
                      className="text-xs sm:text-sm"
                    >
                      <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      Detalhes
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
          )}
        </div>
      </Card>

      {/* Modal de Detalhes */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Pedido {selectedOrder?.id}</DialogTitle>
            <DialogDescription>
              Visualize e gerencie os detalhes do pedido
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

              {/* Alterar Status */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">Alterar Status</p>
                <Select
                  value={selectedOrder.status}
                  onValueChange={(value: OrderStatus) => handleStatusChange(selectedOrder.id, value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="awaiting_payment">Aguardando Pagamento</SelectItem>
                    <SelectItem value="preparing">Preparando Envio</SelectItem>
                    <SelectItem value="shipped">Enviado</SelectItem>
                    <SelectItem value="delivered">Entregue</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Botões de Ação */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={() => handleStatusChange(selectedOrder.id, 'preparing')}
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={selectedOrder.status !== 'awaiting_payment'}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirmar Pagamento
                </Button>
                <Button
                  onClick={() => handleStatusChange(selectedOrder.id, 'shipped')}
                  className="bg-purple-600 hover:bg-purple-700"
                  disabled={selectedOrder.status !== 'preparing'}
                >
                  <Truck className="h-4 w-4 mr-2" />
                  Marcar como Enviado
                </Button>
                <Button
                  onClick={() => handleStatusChange(selectedOrder.id, 'delivered')}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={selectedOrder.status !== 'shipped'}
                >
                  <Package className="h-4 w-4 mr-2" />
                  Marcar como Entregue
                </Button>
                <Button
                  onClick={() => handleStatusChange(selectedOrder.id, 'cancelled')}
                  variant="destructive"
                  disabled={selectedOrder.status === 'delivered'}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancelar Pedido
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Pedidos;
