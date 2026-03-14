import { useState, useRef } from "react";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, CheckCircle, Truck, Package, XCircle, Search, Tag, Plus, Info, DollarSign } from "lucide-react";
import { useSupabaseOrders, Order } from "@/hooks/useSupabaseOrders";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "@/utils/formatCurrency";

const Pedidos = () => {
  const navigate = useNavigate();
  const { orders, loading, updateOrderStatus, updateTrackingCode } = useSupabaseOrders();
  const printRef = useRef<HTMLDivElement>(null);
  
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [trackingCode, setTrackingCode] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

  const predefinedTags = [
    { label: "Urgente", color: "bg-red-100 text-red-800 border-red-300" },
    { label: "Frágil", color: "bg-orange-100 text-orange-800 border-orange-300" },
    { label: "Presente", color: "bg-pink-100 text-pink-800 border-pink-300" },
    { label: "Prioritário", color: "bg-purple-100 text-purple-800 border-purple-300" },
  ];

  const getTagColor = (tag: string) => {
    const predefined = predefinedTags.find(t => t.label === tag);
    return predefined?.color || "bg-gray-100 text-gray-800 border-gray-300";
  };

  const filteredOrders = orders.filter(order => {
    const customerName = (order.endereco_entrega as any)?.name || '';
    const matchesSearch = 
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.order_status === statusFilter;
    const orderTags = ((order.itens as any)?.tags || []) as string[];
    const matchesTags = selectedTags.length === 0 || selectedTags.every(tag => orderTags.includes(tag));
    const orderDate = new Date(order.created_at);
    const matchesDateFrom = !dateFrom || orderDate >= dateFrom;
    const matchesDateTo = !dateTo || orderDate <= new Date(dateTo.getTime() + 86400000 - 1);
    return matchesSearch && matchesStatus && matchesTags && matchesDateFrom && matchesDateTo;
  });

  const getStatusBadge = (status: Order['order_status']) => {
    const statusMap = {
      pending: { label: "Aguardando Pagamento", color: "bg-yellow-100 text-yellow-800" },
      preparing: { label: "Em Preparação", color: "bg-blue-100 text-blue-800" },
      shipped: { label: "Enviado", color: "bg-purple-100 text-purple-800" },
      delivered: { label: "Entregue", color: "bg-green-100 text-green-800" },
      cancelled: { label: "Cancelado", color: "bg-red-100 text-red-800" },
    };
    return statusMap[status] || { label: status, color: "bg-gray-100 text-gray-800" };
  };

  const getPaymentStatusBadge = (status: string | null) => {
    const map: Record<string, { label: string; color: string }> = {
      pending: { label: "Aguardando pagamento", color: "bg-yellow-100 text-yellow-800" },
      paid: { label: "Pago", color: "bg-green-100 text-green-800" },
      cancelled: { label: "Cancelado", color: "bg-red-100 text-red-800" },
      refunded: { label: "Reembolsado", color: "bg-gray-100 text-gray-800" }
    };
    return map[status || 'pending'] || { label: status, color: "bg-gray-100 text-gray-800" };
  };

  const getTransferStatus = (order: Order) => {
    if (order.payment_status === 'paid') {
      return { label: "Repasse ao fornecedor", color: "bg-green-100 text-green-800", icon: CheckCircle };
    }

    return { label: "Aguardando pagamento", color: "bg-gray-100 text-gray-800", icon: null };
  };

  const calculateOrderBreakdown = (order: Order) => {
    const total = Number(order.total);
    const taxaPlataforma = Number(order.platform_fee ?? total * 0.075);
    const valorLiquidoFornecedor = Number(order.supplier_amount ?? (total - taxaPlataforma));

    return { total, taxaPlataforma, valorLiquidoFornecedor };
  };

  const handleStatusChange = async (orderId: string, newStatus: Order['order_status']) => {
    await updateOrderStatus(orderId, newStatus);
  };

  const handleAddTrackingCode = async () => {
    if (!selectedOrder || !trackingCode.trim()) { toast.error("Digite um código de rastreio válido"); return; }
    await updateTrackingCode(selectedOrder.id, trackingCode);
    setTrackingCode("");
  };

  const handleAddTag = async (orderId: string, tag: string) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;
      const currentTags = (order.itens as any)?.tags || [];
      if (currentTags.includes(tag)) { toast.error("Tag já adicionada"); return; }
      const { error } = await supabase.from('orders').update({ itens: { ...(order.itens as any), tags: [...currentTags, tag] } }).eq('id', orderId);
      if (error) throw error;
      toast.success("Tag adicionada!");
      setNewTag("");
    } catch { toast.error("Erro ao adicionar tag"); }
  };

  const handleRemoveTag = async (orderId: string, tag: string) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;
      const currentTags = ((order.itens as any)?.tags || []).filter((t: string) => t !== tag);
      const { error } = await supabase.from('orders').update({ itens: { ...(order.itens as any), tags: currentTags } }).eq('id', orderId);
      if (error) throw error;
      toast.success("Tag removida!");
    } catch { toast.error("Erro ao remover tag"); }
  };

  const toggleTagFilter = (tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  // Get order items with total pieces
  const getOrderItems = (order: Order) => {
    const items = Array.isArray(order.itens) ? order.itens as any[] : [];
    const totalPieces = items.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
    return { items, totalPieces };
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">Pedidos</h1>
        
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-3 sm:mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por número ou cliente..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 h-9 sm:h-10 text-sm sm:text-base" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[200px] h-9 sm:h-10 text-sm sm:text-base"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Aguardando</SelectItem>
              <SelectItem value="preparing">Preparando</SelectItem>
              <SelectItem value="shipped">Enviado</SelectItem>
              <SelectItem value="delivered">Entregue</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap gap-2 mb-3 sm:mb-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("h-9 text-sm justify-start font-normal", !dateFrom && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFrom ? format(dateFrom, "dd/MM/yyyy", { locale: ptBR }) : "Data início"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("h-9 text-sm justify-start font-normal", !dateTo && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateTo ? format(dateTo, "dd/MM/yyyy", { locale: ptBR }) : "Data fim"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
          {(dateFrom || dateTo) && (
            <Button variant="ghost" size="sm" className="h-9 text-sm text-muted-foreground" onClick={() => { setDateFrom(undefined); setDateTo(undefined); }}>Limpar datas</Button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
          {predefinedTags.map((tag) => (
            <Badge key={tag.label} variant="outline"
              className={cn("cursor-pointer transition-all border text-xs sm:text-sm", selectedTags.includes(tag.label) ? tag.color + " font-semibold" : "bg-white hover:bg-muted")}
              onClick={() => toggleTagFilter(tag.label)}>
              <Tag className="h-3 w-3 mr-1" />{tag.label}
            </Badge>
          ))}
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="divide-y">
          {filteredOrders.length === 0 ? (
            <div className="p-6 sm:p-8 text-center">
              <Package className="h-10 sm:h-12 w-10 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
              <p className="text-sm sm:text-base text-muted-foreground">Nenhum pedido encontrado</p>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const badge = getStatusBadge(order.order_status);
              const paymentBadge = getPaymentStatusBadge(order.payment_status);
              const transferStatus = getTransferStatus(order);
              const orderTags = ((order.itens as any)?.tags || []) as string[];
              const breakdown = calculateOrderBreakdown(order);
              const { totalPieces } = getOrderItems(order);
              
              return (
                <div key={order.id} className="p-3 sm:p-4 md:p-6 hover:bg-muted/20 transition-colors">
                  <div className="flex items-start justify-between gap-2 sm:gap-3 mb-2 sm:mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm sm:text-base mb-1 truncate">Pedido #{order.order_number}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(order.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        {totalPieces > 0 && <span className="ml-2">• {totalPieces} peças</span>}
                      </p>
                      {orderTags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5 sm:mt-2">
                          {orderTags.map((tag) => (
                            <Badge key={tag} variant="outline" className={cn("text-[10px] sm:text-xs border", getTagColor(tag))}>
                              <Tag className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />{tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge className={cn(badge.color, "text-xs sm:text-sm whitespace-nowrap")}>{badge.label}</Badge>
                      <Badge className={cn(paymentBadge.color, "text-[10px] sm:text-xs whitespace-nowrap")}>{paymentBadge.label}</Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-2 sm:mb-3 text-xs sm:text-sm">
                    <div>
                      <p className="text-muted-foreground text-[10px] sm:text-xs">Cliente</p>
                      <p className="font-medium text-xs sm:text-sm truncate">{(order.endereco_entrega as any)?.name || 'Cliente'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-[10px] sm:text-xs">Valor Total</p>
                      <p className="font-semibold text-primary text-sm sm:text-base">R$ {Number(order.total).toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="bg-muted/30 rounded-lg p-2 mb-3 text-xs">
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium text-muted-foreground">Resumo financeiro:</span>
                      </div>
                      <Badge className={cn(transferStatus.color, "text-[10px] sm:text-xs")}>
                        {transferStatus.icon && <transferStatus.icon className="h-3 w-3 mr-1" />}
                        {transferStatus.label}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] sm:text-xs">
                      <div><span className="text-muted-foreground">Bruto:</span><p className="font-medium">R$ {breakdown.total.toFixed(2)}</p></div>
                      <div><span className="text-muted-foreground">Comissão (7,5%):</span><p className="font-medium text-purple-600">-R$ {breakdown.comissaoNellor.toFixed(2)}</p></div>
                      <div><span className="text-muted-foreground">{order.payment_method === 'cartao' ? 'Taxa Stripe:' : 'Taxa:'}</span><p className="font-medium text-orange-600">-R$ {breakdown.taxaStripe.toFixed(2)}</p></div>
                      <div><span className="text-muted-foreground">Líquido:</span><p className="font-semibold text-green-600">R$ {breakdown.valorLiquido.toFixed(2)}</p></div>
                    </div>
                  </div>
                  
                  <Button size="sm" variant="outline" onClick={() => setSelectedOrder(order)} className="w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-9">
                    <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />Ver Detalhes
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* Modal de Detalhes */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pedido #{selectedOrder?.order_number}</DialogTitle>
          </DialogHeader>

          {selectedOrder && (() => {
            const { items, totalPieces } = getOrderItems(selectedOrder);
            const breakdown = calculateOrderBreakdown(selectedOrder);

            return (
              <div className="space-y-6">
                {/* Payment details */}
                <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-900/20">
                  <div className="p-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2"><DollarSign className="h-4 w-4" />Detalhes do Pagamento</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div><p className="text-sm text-muted-foreground">Valor total</p><p className="text-xl font-bold">R$ {Number(selectedOrder.total).toFixed(2)}</p></div>
                      <div><p className="text-sm text-muted-foreground">Status</p><Badge className={cn(getPaymentStatusBadge(selectedOrder.payment_status).color)}>{getPaymentStatusBadge(selectedOrder.payment_status).label}</Badge></div>
                    </div>
                    <div className="mt-4 pt-4 border-t space-y-2">
                      <div className="flex justify-between text-sm"><span>Comissão Nellor (7,5%)</span><span className="text-purple-600">- R$ {breakdown.comissaoNellor.toFixed(2)}</span></div>
                      <div className="flex justify-between text-sm"><span>Taxa Stripe (est. ~3,4%)</span><span className="text-orange-600">- R$ {breakdown.taxaStripe.toFixed(2)}</span></div>
                      <div className="flex justify-between font-bold text-lg pt-2 border-t"><span>Valor líquido estimado</span><span className="text-green-600">R$ {breakdown.valorLiquido.toFixed(2)}</span></div>
                    </div>
                  </div>
                </Card>

                {/* Client info */}
                <div>
                  <h3 className="font-semibold mb-3">Informações do Cliente</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div><p className="text-sm text-muted-foreground">Nome</p><p className="font-medium">{(selectedOrder.endereco_entrega as any)?.name}</p></div>
                    <div><p className="text-sm text-muted-foreground">Documento</p><p className="font-medium">{(selectedOrder.endereco_entrega as any)?.document}</p></div>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <h3 className="font-semibold mb-3">Endereço de Entrega</h3>
                  {(selectedOrder.endereco_entrega as any)?.is_pickup ? (
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                      <Package className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium text-sm">Retirada na fonte</p>
                        <p className="text-xs text-muted-foreground">O cliente irá buscar o pedido</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm">
                      {(selectedOrder.endereco_entrega as any)?.street}, {(selectedOrder.endereco_entrega as any)?.number}
                      {(selectedOrder.endereco_entrega as any)?.complement && ` - ${(selectedOrder.endereco_entrega as any)?.complement}`}
                      <br />{(selectedOrder.endereco_entrega as any)?.neighborhood} - {(selectedOrder.endereco_entrega as any)?.city}/{(selectedOrder.endereco_entrega as any)?.state}
                      <br />CEP: {(selectedOrder.endereco_entrega as any)?.zip_code}
                    </p>
                  )}
                </div>

                {/* Tracking */}
                <div>
                  <h3 className="font-semibold mb-3">Rastreamento</h3>
                  {selectedOrder.tracking_code ? (
                    <p className="text-sm font-mono bg-muted p-2 rounded">{selectedOrder.tracking_code}</p>
                  ) : (
                    <div className="flex gap-2">
                      <Input placeholder="Digite o código de rastreio" value={trackingCode} onChange={(e) => setTrackingCode(e.target.value)} />
                      <Button onClick={handleAddTrackingCode}>Adicionar</Button>
                    </div>
                  )}
                </div>

                {/* Tags */}
                <div>
                  <h3 className="font-semibold mb-3">Etiquetas</h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {((selectedOrder.itens as any)?.tags || []).map((tag: string) => (
                      <Badge key={tag} variant="outline" className={cn("border", getTagColor(tag))}>
                        {tag}
                        <button onClick={() => handleRemoveTag(selectedOrder.id, tag)} className="ml-2 hover:text-destructive">×</button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    {predefinedTags.map(tag => (
                      <Button key={tag.label} size="sm" variant="outline" onClick={() => handleAddTag(selectedOrder.id, tag.label)}>
                        <Plus className="h-3 w-3 mr-1" />{tag.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Order Items - Enhanced Grid */}
                <div>
                  <h3 className="font-semibold mb-3">Itens do Pedido</h3>
                  <div className="space-y-2">
                    {items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-muted rounded">
                        <div className="flex items-center gap-3">
                          {item.image && <img src={item.image} alt={item.name} className="w-12 h-12 rounded object-cover" />}
                          <div>
                            <p className="font-medium text-sm">{item.name}</p>
                            <div className="flex gap-2 mt-0.5 flex-wrap">
                              <p className="text-sm text-muted-foreground">Qtd: {item.quantity}</p>
                              {item.selectedColor && <Badge variant="outline" className="text-xs">🎨 {item.selectedColor}</Badge>}
                              {item.selectedSize && <Badge variant="outline" className="text-xs">📏 {item.selectedSize}</Badge>}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{item.price ? `R$ ${Number(item.price).toFixed(2)}/un` : ''}</p>
                          </div>
                        </div>
                        <p className="font-semibold">R$ {Number((item.price || 0) * (item.quantity || 0)).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                  {totalPieces > 0 && (
                    <div className="flex justify-between items-center mt-3 pt-3 border-t">
                      <span className="text-sm font-medium">Total de peças: <span className="font-bold">{totalPieces}</span></span>
                      <span className="text-lg font-bold text-primary">R$ {Number(selectedOrder.total).toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {/* Update Status */}
                <div>
                  <h3 className="font-semibold mb-3">Atualizar Status</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" onClick={() => handleStatusChange(selectedOrder.id, 'preparing')} disabled={selectedOrder.order_status === 'preparing'}>
                      <Package className="h-4 w-4 mr-2" />Preparando
                    </Button>
                    <Button variant="outline" onClick={() => handleStatusChange(selectedOrder.id, 'shipped')} disabled={selectedOrder.order_status === 'shipped'}>
                      <Truck className="h-4 w-4 mr-2" />Enviado
                    </Button>
                    <Button variant="outline" onClick={() => handleStatusChange(selectedOrder.id, 'delivered')} disabled={selectedOrder.order_status === 'delivered'}>
                      <CheckCircle className="h-4 w-4 mr-2" />Entregue
                    </Button>
                    <Button variant="outline" onClick={() => handleStatusChange(selectedOrder.id, 'cancelled')} disabled={selectedOrder.order_status === 'cancelled'}>
                      <XCircle className="h-4 w-4 mr-2" />Cancelar
                    </Button>
                  </div>
                </div>

                <div className="bg-muted/50 p-3 rounded-lg text-xs text-muted-foreground">
                  <Info className="h-4 w-4 inline mr-1" />
                  Os pagamentos são processados automaticamente via Stripe. Não há opção de saque manual.
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Pedidos;
