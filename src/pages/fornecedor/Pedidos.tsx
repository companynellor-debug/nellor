import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";
import { Eye, CheckCircle, Truck, Package, XCircle, CalendarIcon, X, Search, Filter, MapPin, Phone, Mail, CreditCard, ShoppingCart, Printer, Clock, Tag, Plus } from "lucide-react";
import { useSupplierOrders, OrderStatus, SupplierOrder } from "@/hooks/useSupplierOrders";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

const Pedidos = () => {
  const { orders, updateOrderStatus, updateTrackingCode, addTag, removeTag } = useSupplierOrders();
  const printRef = useRef<HTMLDivElement>(null);

  // Etiquetas pré-definidas
  const predefinedTags = [
    { label: "Urgente", color: "bg-red-100 text-red-800 border-red-300" },
    { label: "Frágil", color: "bg-orange-100 text-orange-800 border-orange-300" },
    { label: "Presente", color: "bg-pink-100 text-pink-800 border-pink-300" },
    { label: "Prioritário", color: "bg-purple-100 text-purple-800 border-purple-300" },
    { label: "Grande Volume", color: "bg-blue-100 text-blue-800 border-blue-300" },
    { label: "Primeira Compra", color: "bg-green-100 text-green-800 border-green-300" },
  ];

  const getTagColor = (tag: string) => {
    const predefined = predefinedTags.find(t => t.label === tag);
    return predefined?.color || "bg-gray-100 text-gray-800 border-gray-300";
  };
  const [selectedOrder, setSelectedOrder] = useState<SupplierOrder | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [trackingCode, setTrackingCode] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");

  // Filtrar pedidos por data, busca, status e tags
  const filteredOrders = orders.filter(order => {
    // Filtro de data
    if (dateRange?.from) {
      const orderDate = new Date(order.date.split('/').reverse().join('-'));
      const fromDate = dateRange.from;
      const toDate = dateRange.to || dateRange.from;
      
      if (!(orderDate >= fromDate && orderDate <= toDate)) {
        return false;
      }
    }
    
    // Filtro de busca
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesId = order.id.toLowerCase().includes(query);
      const matchesCustomer = order.customerName.toLowerCase().includes(query);
      const matchesProduct = order.product.toLowerCase().includes(query);
      
      if (!matchesId && !matchesCustomer && !matchesProduct) {
        return false;
      }
    }
    
    // Filtro de status
    if (statusFilter !== "all" && order.status !== statusFilter) {
      return false;
    }

    // Filtro de tags
    if (selectedTags.length > 0) {
      const hasAllTags = selectedTags.every(tag => order.tags.includes(tag));
      if (!hasAllTags) {
        return false;
      }
    }
    
    return true;
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

  const handlePrint = () => {
    if (printRef.current) {
      const printContent = printRef.current.innerHTML;
      const originalContent = document.body.innerHTML;
      
      document.body.innerHTML = printContent;
      window.print();
      document.body.innerHTML = originalContent;
      window.location.reload(); // Recarrega para restaurar event listeners
    }
  };

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    updateOrderStatus(orderId, newStatus);
    
    // Atualizar o estado local do pedido selecionado também
    if (selectedOrder && selectedOrder.id === orderId) {
      const now = new Date();
      const newHistoryEntry = {
        status: newStatus,
        date: now.toLocaleDateString('pt-BR'),
        time: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };
      setSelectedOrder({ 
        ...selectedOrder, 
        status: newStatus,
        statusHistory: [...selectedOrder.statusHistory, newHistoryEntry]
      });
    }
    
    toast.success("Status do pedido atualizado!");
    
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixi0ezVhTgIHm7A7+OZRQ0PVqzn77BfGgU7ltrzxnkqBil+zPDajTsJGGS36+ikUBELTKXh8LdjHAU7kdfy0YU2Bh1tv+/mnEgND1as5++wXxoFO5ba88Z5KgYpfsz02o07CRhkt+vopFARCUyi4PG3YxwFO5HX8tGFNgYdbb/v5pxIDQ9WrOfvsF8aBTuW2vPGeSoGKX7M9NqNOwkYZLfr6KRQEQlMouDxt2McBTuR1/LRhTYGHW2/7+acSA0PVqzn77BfGgU7ltrzxnkqBil+zPDajTsJGGS36+ikUBEJTKLg8bdjHAU7kdfyzoQzBhxrv+/omkYMD1Wr5u+vYBoEOpbZ88Z5KgYpf8zw2o07CRhkt+vopFARCUyi4PG3YxwFO5HX8s6EMwYca7/v6JpGDA9Vq+bvr2AaBDqW2fPGeSoGKX/M8NqNOwkYZLfr6KRQEQlMouDxt2McBTuR1/LOhDMGHGu/7+iaRgwPVavm769gGgQ6ltnzxnkqBil/zPDajTsJGGS36+ikUBEJTKLg8bdjHAU7kdfyzoQzBhxrv+/omkYMD1Wr5u+vYBoEOpbZ88Z5KgYpf8zw2o07CRhkt+vopFARCUyi4PG3YxwFO5HX8s6EMwYca7/v6JpGDA9Vq+bvr2AaBDqW2fPGeSoGKX/M8NqNOwkYZLfr6KRQEQlMouDxt2McBTuR1/LOhDMGHGu/7+iaRgwPVavm769gGgQ6ltnzxnkqBil/zPDajTsJGGS36+ikUBEJTKLg8bdjHAU7kdfyzoQzBhxrv+/omkYMD1Wr5u+vYBoEOpbZ88Z5KgYpf8zw2o07CRhkt+vopFARCUyi4PG3YxwFO5HX8s6EMwYca7/v6JpGDA9Vq+bvr2AaBDqW2fPGeSoGKX/M8NqNOwkYZLfr6KRQEQ==');
    audio.play();
  };

  const handleAddTrackingCode = () => {
    if (selectedOrder && trackingCode.trim()) {
      updateTrackingCode(selectedOrder.id, trackingCode.trim());
      setSelectedOrder({ ...selectedOrder, trackingCode: trackingCode.trim() });
      toast.success("Código de rastreamento adicionado!");
      setTrackingCode("");
    }
  };

  const handleAddTag = (orderId: string, tag: string) => {
    if (tag.trim()) {
      addTag(orderId, tag.trim());
      toast.success("Etiqueta adicionada!");
    }
  };

  const handleRemoveTag = (orderId: string, tag: string) => {
    removeTag(orderId, tag);
    toast.success("Etiqueta removida!");
  };

  const toggleTagFilter = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-4">Pedidos</h1>
        
        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Campo de Busca */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por número, cliente ou produto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Filtro de Status */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="awaiting_payment">Aguardando</SelectItem>
              <SelectItem value="preparing">Preparando</SelectItem>
              <SelectItem value="shipped">Enviado</SelectItem>
              <SelectItem value="delivered">Entregue</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Filtro de Data */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full sm:w-auto justify-start text-left font-normal",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "dd/MM/yy", { locale: ptBR })} -{" "}
                      {format(dateRange.to, "dd/MM/yy", { locale: ptBR })}
                    </>
                  ) : (
                    format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })
                  )
                ) : (
                  <span>Período</span>
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
          
          {/* Botão Limpar Filtros */}
          {(dateRange || searchQuery || statusFilter !== "all" || selectedTags.length > 0) && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setDateRange(undefined);
                setSearchQuery("");
                setStatusFilter("all");
                setSelectedTags([]);
              }}
              title="Limpar todos os filtros"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Filtro de Etiquetas */}
        <div className="flex flex-wrap gap-2">
          {predefinedTags.map((tag) => (
            <Badge
              key={tag.label}
              variant="outline"
              className={cn(
                "cursor-pointer transition-all border",
                selectedTags.includes(tag.label) 
                  ? tag.color + " font-semibold"
                  : "bg-white hover:bg-muted"
              )}
              onClick={() => toggleTagFilter(tag.label)}
            >
              <Tag className="h-3 w-3 mr-1" />
              {tag.label}
            </Badge>
          ))}
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="divide-y">
          {filteredOrders.length === 0 ? (
            <div className="p-8 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchQuery || dateRange || statusFilter !== "all" 
                  ? "Nenhum pedido encontrado com os filtros aplicados" 
                  : "Nenhum pedido no momento"}
              </p>
              {(searchQuery || dateRange || statusFilter !== "all") && (
                <Button
                  variant="link"
                  onClick={() => {
                  setSearchQuery("");
                  setDateRange(undefined);
                  setStatusFilter("all");
                  setSelectedTags([]);
                  }}
                  className="mt-2"
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          ) : (
            filteredOrders.map((order) => {
              const badge = getStatusBadge(order.status);
              return (
                <div key={order.id} className="p-4 sm:p-6 hover:bg-muted/20 transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <p className="font-semibold text-sm sm:text-base mb-1">{order.product}</p>
                      <p className="text-xs text-muted-foreground">Pedido #{order.id}</p>
                      
                      {/* Etiquetas do Pedido */}
                      {order.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {order.tags.map((tag) => (
                            <Badge 
                              key={tag} 
                              variant="outline" 
                              className={cn("text-xs border", getTagColor(tag))}
                            >
                              <Tag className="h-3 w-3 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
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
      <Dialog open={!!selectedOrder} onOpenChange={(open) => {
        if (!open) {
          setSelectedOrder(null);
          setTrackingCode("");
          setNewTag("");
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl">Pedido #{selectedOrder?.id}</DialogTitle>
                <DialogDescription>
                  Todas as informações do pedido
                </DialogDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="gap-2"
              >
                <Printer className="h-4 w-4" />
                Imprimir Nota
              </Button>
            </div>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Informações do Cliente */}
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  Informações do Cliente
                </h3>
                <Card className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Nome</p>
                      <p className="font-medium">{selectedOrder.customerName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Email</p>
                      <p className="font-medium">{selectedOrder.customerEmail}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Telefone</p>
                      <p className="font-medium flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {selectedOrder.customerPhone}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Data do Pedido</p>
                      <p className="font-medium">{selectedOrder.date}</p>
                    </div>
                  </div>
                </Card>
              </div>

              <Separator />

              {/* Endereço de Entrega */}
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Endereço de Entrega
                </h3>
                <Card className="p-4">
                  <div className="space-y-2">
                    <p className="font-medium">
                      {selectedOrder.shippingAddress.street}, {selectedOrder.shippingAddress.number}
                    </p>
                    {selectedOrder.shippingAddress.complement && (
                      <p className="text-sm text-muted-foreground">
                        Complemento: {selectedOrder.shippingAddress.complement}
                      </p>
                    )}
                    <p className="text-sm">
                      {selectedOrder.shippingAddress.neighborhood}
                    </p>
                    <p className="text-sm">
                      {selectedOrder.shippingAddress.city} - {selectedOrder.shippingAddress.state}
                    </p>
                    <p className="text-sm font-medium">
                      CEP: {selectedOrder.shippingAddress.zipCode}
                    </p>
                  </div>
                </Card>
              </div>

              <Separator />

              {/* Código de Rastreamento */}
              {selectedOrder.status === 'shipped' && (
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Truck className="h-5 w-5 text-primary" />
                    Rastreamento
                  </h3>
                  <Card className="p-4">
                    {selectedOrder.trackingCode ? (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Código de Rastreamento</p>
                        <p className="font-mono font-semibold text-lg">{selectedOrder.trackingCode}</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">Adicione o código de rastreamento</p>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Ex: BR123456789BR"
                            value={trackingCode}
                            onChange={(e) => setTrackingCode(e.target.value)}
                            className="flex-1"
                          />
                          <Button onClick={handleAddTrackingCode} disabled={!trackingCode.trim()}>
                            Adicionar
                          </Button>
                        </div>
                      </div>
                    )}
                  </Card>
                </div>
              )}

              {selectedOrder.status === 'shipped' && <Separator />}

              {/* Histórico de Status */}
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Histórico do Pedido
                </h3>
                <Card className="p-4">
                  <div className="space-y-3">
                    {selectedOrder.statusHistory.map((entry, index) => {
                      const badge = getStatusBadge(entry.status);
                      return (
                        <div key={index} className="flex items-center gap-3 pb-3 border-b last:border-0 last:pb-0">
                          <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                          <div className="flex-1">
                            <p className="font-medium">{badge.label}</p>
                            <p className="text-sm text-muted-foreground">
                              {entry.date} às {entry.time}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>

              <Separator />

              {/* Gerenciar Etiquetas */}
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Tag className="h-5 w-5 text-primary" />
                  Etiquetas
                </h3>
                <Card className="p-4">
                  <div className="space-y-4">
                    {/* Etiquetas Atuais */}
                    {selectedOrder.tags.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Etiquetas do pedido</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedOrder.tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className={cn("border cursor-pointer hover:opacity-70", getTagColor(tag))}
                              onClick={() => {
                                handleRemoveTag(selectedOrder.id, tag);
                                setSelectedOrder({
                                  ...selectedOrder,
                                  tags: selectedOrder.tags.filter(t => t !== tag)
                                });
                              }}
                            >
                              <Tag className="h-3 w-3 mr-1" />
                              {tag}
                              <X className="h-3 w-3 ml-1" />
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Adicionar Etiquetas Pré-definidas */}
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Adicionar etiqueta</p>
                      <div className="flex flex-wrap gap-2">
                        {predefinedTags
                          .filter(tag => !selectedOrder.tags.includes(tag.label))
                          .map((tag) => (
                            <Badge
                              key={tag.label}
                              variant="outline"
                              className={cn("cursor-pointer border", tag.color, "hover:opacity-80")}
                              onClick={() => {
                                handleAddTag(selectedOrder.id, tag.label);
                                setSelectedOrder({
                                  ...selectedOrder,
                                  tags: [...selectedOrder.tags, tag.label]
                                });
                              }}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              {tag.label}
                            </Badge>
                          ))}
                      </div>
                    </div>

                    {/* Criar Etiqueta Personalizada */}
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Criar etiqueta personalizada</p>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Nome da etiqueta..."
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          maxLength={20}
                          className="flex-1"
                          onKeyPress={(e) => {
                            if (e.key === "Enter" && newTag.trim()) {
                              handleAddTag(selectedOrder.id, newTag.trim());
                              setSelectedOrder({
                                ...selectedOrder,
                                tags: [...selectedOrder.tags, newTag.trim()]
                              });
                              setNewTag("");
                            }
                          }}
                        />
                        <Button
                          onClick={() => {
                            if (newTag.trim()) {
                              handleAddTag(selectedOrder.id, newTag.trim());
                              setSelectedOrder({
                                ...selectedOrder,
                                tags: [...selectedOrder.tags, newTag.trim()]
                              });
                              setNewTag("");
                            }
                          }}
                          disabled={!newTag.trim()}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              <Separator />

              {/* Itens do Pedido */}
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                  Itens do Pedido
                </h3>
                <Card className="overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left p-3 text-sm font-semibold">Produto</th>
                          <th className="text-center p-3 text-sm font-semibold">Quantidade</th>
                          <th className="text-right p-3 text-sm font-semibold">Preço Unit.</th>
                          <th className="text-right p-3 text-sm font-semibold">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {selectedOrder.items.map((item) => (
                          <tr key={item.id} className="hover:bg-muted/20">
                            <td className="p-3">{item.productName}</td>
                            <td className="p-3 text-center font-medium">{item.quantity}x</td>
                            <td className="p-3 text-right">R$ {item.unitPrice.toFixed(2)}</td>
                            <td className="p-3 text-right font-semibold">R$ {item.subtotal.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Resumo do Pedido */}
                  <div className="border-t bg-muted/30 p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium">R$ {selectedOrder.value.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Frete</span>
                      <span className="font-medium">R$ {selectedOrder.shippingCost.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="font-semibold text-lg">Total</span>
                      <span className="font-bold text-lg text-primary">R$ {selectedOrder.totalValue.toFixed(2)}</span>
                    </div>
                  </div>
                </Card>
              </div>

              <Separator />

              {/* Informações de Pagamento */}
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Pagamento
                </h3>
                <Card className="p-4">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Método de Pagamento</p>
                      <p className="font-medium">{selectedOrder.paymentMethod}</p>
                    </div>
                    
                    {selectedOrder.paymentProof && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Comprovante de Pagamento</p>
                        <img 
                          src={selectedOrder.paymentProof} 
                          alt="Comprovante" 
                          className="max-w-full h-auto rounded-lg border max-h-96 object-contain"
                        />
                      </div>
                    )}
                    
                    {selectedOrder.notes && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Observações</p>
                        <p className="text-sm bg-muted p-3 rounded-md">{selectedOrder.notes}</p>
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              <Separator />
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

      {/* Conteúdo para Impressão (invisível) */}
      <div className="hidden">
        <div ref={printRef} className="p-8 bg-white text-black">
          {selectedOrder && (
            <div className="space-y-6">
              {/* Cabeçalho */}
              <div className="text-center border-b-2 border-black pb-4">
                <h1 className="text-3xl font-bold mb-2">NOTA DE ENVIO</h1>
                <p className="text-lg">Pedido #{selectedOrder.id}</p>
                <p className="text-sm">Data: {selectedOrder.date}</p>
              </div>

              {/* Destinatário */}
              <div className="border-2 border-black p-4">
                <h2 className="font-bold text-xl mb-3">DESTINATÁRIO</h2>
                <div className="space-y-1">
                  <p className="font-semibold text-lg">{selectedOrder.customerName}</p>
                  <p>{selectedOrder.customerPhone}</p>
                  <p>{selectedOrder.customerEmail}</p>
                </div>
              </div>

              {/* Endereço de Entrega */}
              <div className="border-2 border-black p-4">
                <h2 className="font-bold text-xl mb-3">ENDEREÇO DE ENTREGA</h2>
                <div className="space-y-1">
                  <p className="font-semibold">
                    {selectedOrder.shippingAddress.street}, {selectedOrder.shippingAddress.number}
                  </p>
                  {selectedOrder.shippingAddress.complement && (
                    <p>Complemento: {selectedOrder.shippingAddress.complement}</p>
                  )}
                  <p>{selectedOrder.shippingAddress.neighborhood}</p>
                  <p>
                    {selectedOrder.shippingAddress.city} - {selectedOrder.shippingAddress.state}
                  </p>
                  <p className="font-bold text-lg">CEP: {selectedOrder.shippingAddress.zipCode}</p>
                </div>
              </div>

              {/* Itens */}
              <div className="border-2 border-black p-4">
                <h2 className="font-bold text-xl mb-3">ITENS DO PEDIDO</h2>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-2 border-black">
                      <th className="text-left p-2">Produto</th>
                      <th className="text-center p-2">Qtd</th>
                      <th className="text-right p-2">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items.map((item) => (
                      <tr key={item.id} className="border-b border-gray-300">
                        <td className="p-2">{item.productName}</td>
                        <td className="text-center p-2">{item.quantity}</td>
                        <td className="text-right p-2">R$ {item.subtotal.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total */}
              <div className="border-2 border-black p-4 bg-gray-100">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-semibold">R$ {selectedOrder.value.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Frete:</span>
                    <span className="font-semibold">R$ {selectedOrder.shippingCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold border-t-2 border-black pt-2">
                    <span>TOTAL:</span>
                    <span>R$ {selectedOrder.totalValue.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Rastreamento */}
              {selectedOrder.trackingCode && (
                <div className="border-2 border-black p-4">
                  <h2 className="font-bold text-xl mb-2">CÓDIGO DE RASTREAMENTO</h2>
                  <p className="font-mono text-2xl font-bold text-center py-2">
                    {selectedOrder.trackingCode}
                  </p>
                </div>
              )}

              {/* Observações */}
              {selectedOrder.notes && (
                <div className="border-2 border-black p-4">
                  <h2 className="font-bold text-xl mb-2">OBSERVAÇÕES</h2>
                  <p>{selectedOrder.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Pedidos;
