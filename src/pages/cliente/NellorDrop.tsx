import { useState } from "react";
import { useClientDrop } from "@/hooks/useClientDrop";
import { BottomNav } from "@/components/cliente/BottomNav";
import { ParticlesBackground } from "@/components/cliente/ParticlesBackground";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft, 
  Package, 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Plus, 
  Eye, 
  Pencil,
  Trash2,
  Store,
  Truck,
  Clock,
  Percent,
  Zap,
  BarChart3,
  Settings,
  Power,
  PowerOff,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

export default function NellorDrop() {
  const {
    dropProfile,
    dropStats,
    dropCatalog,
    myDropProducts,
    dropOrders,
    isDropEnabled,
    isLoading,
    activateDropMode,
    deactivateDropMode,
    addProductToDrop,
    updateMyDropProduct,
    removeFromDrop,
    createDropOrder,
  } = useClientDrop();

  const [businessName, setBusinessName] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedProduct, setSelectedProduct] = useState<typeof dropCatalog[0] | null>(null);
  const [addProductForm, setAddProductForm] = useState({
    customPrice: 0,
    marginType: "fixed" as "fixed" | "percentage",
    marginValue: 0,
  });
  const [editingProduct, setEditingProduct] = useState<typeof myDropProducts[0] | null>(null);
  const [newOrderForm, setNewOrderForm] = useState({
    productId: "",
    buyerName: "",
    buyerEmail: "",
    buyerPhone: "",
    buyerDocument: "",
    quantity: 1,
    externalMarketplace: "",
    externalOrderId: "",
    street: "",
    number: "",
    neighborhood: "",
    city: "",
    state: "",
    zipCode: "",
  });
  const [showNewOrderDialog, setShowNewOrderDialog] = useState(false);

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  // Calculate custom price based on margin
  const calculateCustomPrice = (basePrice: number, marginType: "fixed" | "percentage", marginValue: number) => {
    if (marginType === "fixed") {
      return basePrice + marginValue;
    }
    return basePrice * (1 + marginValue / 100);
  };

  // Handle activate drop
  const handleActivate = () => {
    if (!businessName.trim()) {
      toast.error("Informe o nome do seu negócio");
      return;
    }
    activateDropMode.mutate(businessName);
  };

  // Handle add product to drop
  const handleAddProduct = () => {
    if (!selectedProduct) return;
    
    const customPrice = calculateCustomPrice(
      selectedProduct.base_price,
      addProductForm.marginType,
      addProductForm.marginValue
    );

    addProductToDrop.mutate({
      productId: selectedProduct.product_id,
      customPrice,
      marginType: addProductForm.marginType,
      marginValue: addProductForm.marginValue,
    }, {
      onSuccess: () => {
        setSelectedProduct(null);
        setAddProductForm({ customPrice: 0, marginType: "fixed", marginValue: 0 });
      },
    });
  };

  // Handle create order
  const handleCreateOrder = () => {
    if (!newOrderForm.productId || !newOrderForm.buyerName) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    createDropOrder.mutate({
      clientDropProductId: newOrderForm.productId,
      buyerName: newOrderForm.buyerName,
      buyerEmail: newOrderForm.buyerEmail || undefined,
      buyerPhone: newOrderForm.buyerPhone || undefined,
      buyerDocument: newOrderForm.buyerDocument || undefined,
      quantity: newOrderForm.quantity,
      externalMarketplace: newOrderForm.externalMarketplace || undefined,
      externalOrderId: newOrderForm.externalOrderId || undefined,
      shippingAddress: {
        street: newOrderForm.street,
        number: newOrderForm.number,
        neighborhood: newOrderForm.neighborhood,
        city: newOrderForm.city,
        state: newOrderForm.state,
        zip_code: newOrderForm.zipCode,
      },
    }, {
      onSuccess: () => {
        setShowNewOrderDialog(false);
        setNewOrderForm({
          productId: "",
          buyerName: "",
          buyerEmail: "",
          buyerPhone: "",
          buyerDocument: "",
          quantity: 1,
          externalMarketplace: "",
          externalOrderId: "",
          street: "",
          number: "",
          neighborhood: "",
          city: "",
          state: "",
          zipCode: "",
        });
      },
    });
  };

  // Get order status badge
  const getOrderStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending: { label: "Pendente", variant: "secondary" },
      paid: { label: "Pago", variant: "default" },
      shipped: { label: "Enviado", variant: "default" },
      delivered: { label: "Entregue", variant: "default" },
      cancelled: { label: "Cancelado", variant: "destructive" },
    };
    const s = statusMap[status] || { label: status, variant: "outline" };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  // Activation Screen
  if (!isDropEnabled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-20">
        <ParticlesBackground />
        
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b">
          <div className="flex items-center gap-3 p-4">
            <Link to="/cliente/perfil" className="p-2 hover:bg-muted rounded-full transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-lg font-bold">Nellor Drop</h1>
          </div>
        </div>

        <div className="p-4 space-y-6">
          {/* Hero */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="p-6 text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-primary/20 rounded-full flex items-center justify-center">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2">Ative o Nellor Drop</h2>
                <p className="text-muted-foreground text-sm">
                  Venda produtos de fornecedores parceiros em seus canais de venda (Shopee, Mercado Livre, Instagram, etc.) e ganhe comissão em cada venda!
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Benefits */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-4 text-center">
                <Package className="h-6 w-6 mx-auto text-primary mb-2" />
                <p className="text-xs font-medium">Sem estoque</p>
                <p className="text-[10px] text-muted-foreground">O fornecedor envia</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <DollarSign className="h-6 w-6 mx-auto text-green-500 mb-2" />
                <p className="text-xs font-medium">Defina seu lucro</p>
                <p className="text-[10px] text-muted-foreground">Você escolhe a margem</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Truck className="h-6 w-6 mx-auto text-blue-500 mb-2" />
                <p className="text-xs font-medium">Envio direto</p>
                <p className="text-[10px] text-muted-foreground">Para seu cliente</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-6 w-6 mx-auto text-purple-500 mb-2" />
                <p className="text-xs font-medium">Escale vendas</p>
                <p className="text-[10px] text-muted-foreground">Sem limites</p>
              </CardContent>
            </Card>
          </div>

          {/* Activation Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Comece agora</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nome do seu negócio</Label>
                <Input
                  placeholder="Ex: Loja da Maria"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Esse nome aparecerá em seus pedidos e relatórios
                </p>
              </div>
              
              <Button 
                className="w-full" 
                size="lg"
                onClick={handleActivate}
                disabled={activateDropMode.isPending}
              >
                <Zap className="h-4 w-4 mr-2" />
                {activateDropMode.isPending ? "Ativando..." : "Ativar Nellor Drop"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <BottomNav />
      </div>
    );
  }

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b">
          <div className="flex items-center gap-3 p-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-6 w-32" />
          </div>
        </div>
        <div className="p-4 space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-20">
      <ParticlesBackground />
      
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Link to="/cliente/perfil" className="p-2 hover:bg-muted rounded-full transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-lg font-bold">Nellor Drop</h1>
              <p className="text-xs text-muted-foreground">{dropProfile?.business_name}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => deactivateDropMode.mutate()}
            className="text-red-500 hover:text-red-600 hover:bg-red-50"
          >
            <PowerOff className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="sticky top-[73px] z-30 bg-background/80 backdrop-blur-lg px-4 py-2">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="dashboard" className="text-xs">
              <BarChart3 className="h-4 w-4 mr-1" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="catalog" className="text-xs">
              <Store className="h-4 w-4 mr-1" />
              Catálogo
            </TabsTrigger>
            <TabsTrigger value="products" className="text-xs">
              <Package className="h-4 w-4 mr-1" />
              Meus
            </TabsTrigger>
            <TabsTrigger value="orders" className="text-xs">
              <ShoppingCart className="h-4 w-4 mr-1" />
              Pedidos
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="p-4 space-y-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-green-600 mb-1">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-xs font-medium">Vendas</span>
                </div>
                <p className="text-xl font-bold">{formatCurrency(dropStats?.total_sales || 0)}</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-purple-600 mb-1">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-xs font-medium">Lucro</span>
                </div>
                <p className="text-xl font-bold">{formatCurrency(dropStats?.total_profit || 0)}</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-blue-600 mb-1">
                  <Package className="h-4 w-4" />
                  <span className="text-xs font-medium">Produtos</span>
                </div>
                <p className="text-xl font-bold">{dropStats?.active_products || 0}</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-orange-600 mb-1">
                  <Clock className="h-4 w-4" />
                  <span className="text-xs font-medium">Pendentes</span>
                </div>
                <p className="text-xl font-bold">{dropStats?.pending_orders || 0}</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" onClick={() => setActiveTab("catalog")}>
                <Plus className="h-4 w-4 mr-1" />
                Adicionar Produto
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowNewOrderDialog(true)}>
                <ShoppingCart className="h-4 w-4 mr-1" />
                Novo Pedido
              </Button>
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Pedidos Recentes</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setActiveTab("orders")}>
                Ver todos
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {dropOrders && dropOrders.length > 0 ? (
                dropOrders.slice(0, 3).map((order: { id: string; order_number: string; buyer_name: string; total: number; order_status: string; created_at: string }) => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">#{order.order_number}</p>
                      <p className="text-xs text-muted-foreground">{order.buyer_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatCurrency(order.total)}</p>
                      {getOrderStatusBadge(order.order_status)}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum pedido ainda
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Catalog Tab */}
        <TabsContent value="catalog" className="p-4 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Catálogo Drop</h2>
            <Badge variant="secondary">{dropCatalog?.length || 0} produtos</Badge>
          </div>

          {dropCatalog && dropCatalog.length > 0 ? (
            <div className="space-y-3">
              {dropCatalog.map((product) => (
                <Card key={product.product_id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex gap-3 p-3">
                      <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                        {product.product_images?.[0] ? (
                          <img 
                            src={product.product_images[0]} 
                            alt={product.product_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm line-clamp-2">{product.product_name}</h3>
                        <p className="text-xs text-muted-foreground">{product.supplier_name}</p>
                        
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            <DollarSign className="h-3 w-3 mr-1" />
                            {formatCurrency(product.base_price)}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            <Percent className="h-3 w-3 mr-1" />
                            {product.commission_percent}%
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            <Truck className="h-3 w-3 mr-1" />
                            {product.shipping_days}d
                          </Badge>
                        </div>
                      </div>
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            onClick={() => {
                              setSelectedProduct(product);
                              setAddProductForm({
                                customPrice: product.base_price,
                                marginType: "fixed",
                                marginValue: 10,
                              });
                            }}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Adicionar ao Drop</DialogTitle>
                            <DialogDescription>
                              Configure sua margem de lucro para este produto
                            </DialogDescription>
                          </DialogHeader>
                          
                          {selectedProduct && (
                            <div className="space-y-4">
                              <div className="flex gap-3 p-3 bg-muted rounded-lg">
                                <div className="w-16 h-16 bg-background rounded overflow-hidden">
                                  {selectedProduct.product_images?.[0] ? (
                                    <img 
                                      src={selectedProduct.product_images[0]} 
                                      alt={selectedProduct.product_name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Package className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <h4 className="font-medium text-sm">{selectedProduct.product_name}</h4>
                                  <p className="text-xs text-muted-foreground">
                                    Preço base: {formatCurrency(selectedProduct.base_price)}
                                  </p>
                                </div>
                              </div>

                              <div className="space-y-3">
                                <div className="space-y-2">
                                  <Label>Tipo de Margem</Label>
                                  <Select
                                    value={addProductForm.marginType}
                                    onValueChange={(value: "fixed" | "percentage") => 
                                      setAddProductForm(prev => ({ ...prev, marginType: value }))
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                                      <SelectItem value="percentage">Porcentagem (%)</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-2">
                                  <Label>
                                    {addProductForm.marginType === "fixed" ? "Margem (R$)" : "Margem (%)"}
                                  </Label>
                                  <Input
                                    type="number"
                                    value={addProductForm.marginValue}
                                    onChange={(e) => 
                                      setAddProductForm(prev => ({ 
                                        ...prev, 
                                        marginValue: parseFloat(e.target.value) || 0 
                                      }))
                                    }
                                  />
                                </div>

                                <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                                  <p className="text-xs text-muted-foreground">Preço de venda:</p>
                                  <p className="text-lg font-bold text-green-600">
                                    {formatCurrency(
                                      calculateCustomPrice(
                                        selectedProduct.base_price,
                                        addProductForm.marginType,
                                        addProductForm.marginValue
                                      )
                                    )}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Lucro por venda: {formatCurrency(
                                      addProductForm.marginType === "fixed" 
                                        ? addProductForm.marginValue 
                                        : selectedProduct.base_price * addProductForm.marginValue / 100
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <DialogFooter>
                            <Button 
                              onClick={handleAddProduct}
                              disabled={addProductToDrop.isPending}
                              className="w-full"
                            >
                              {addProductToDrop.isPending ? "Adicionando..." : "Adicionar ao Meu Drop"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Store className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">Nenhum produto disponível</h3>
                <p className="text-sm text-muted-foreground">
                  Aguarde fornecedores liberarem produtos para o Drop
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* My Products Tab */}
        <TabsContent value="products" className="p-4 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Meus Produtos Drop</h2>
            <Badge variant="secondary">{myDropProducts?.length || 0} produtos</Badge>
          </div>

          {myDropProducts && myDropProducts.length > 0 ? (
            <div className="space-y-3">
              {myDropProducts.map((product: {
                id: string;
                product?: { nome: string; preco: number; imagens?: string[] | null };
                supplier?: { nome: string } | null;
                custom_price: number;
                margin_type: string;
                margin_value: number;
                is_active: boolean;
              }) => (
                <Card key={product.id} className={!product.is_active ? "opacity-60" : ""}>
                  <CardContent className="p-0">
                    <div className="flex gap-3 p-3">
                      <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                        {product.product?.imagens?.[0] ? (
                          <img 
                            src={product.product.imagens[0]} 
                            alt={product.product?.nome}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-medium text-sm line-clamp-2">{product.product?.nome}</h3>
                            <p className="text-xs text-muted-foreground">{product.supplier?.nome}</p>
                          </div>
                          <Switch
                            checked={product.is_active}
                            onCheckedChange={(checked) => 
                              updateMyDropProduct.mutate({ id: product.id, isActive: checked })
                            }
                          />
                        </div>
                        
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                            {formatCurrency(product.custom_price)}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            +{product.margin_type === "fixed" 
                              ? formatCurrency(product.margin_value) 
                              : `${product.margin_value}%`
                            }
                          </Badge>
                        </div>
                        
                        <div className="flex gap-2 mt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingProduct(product as typeof myDropProducts[0])}
                          >
                            <Pencil className="h-3 w-3 mr-1" />
                            Editar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500"
                            onClick={() => removeFromDrop.mutate(product.id)}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Remover
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">Nenhum produto adicionado</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Adicione produtos do catálogo para começar a vender
                </p>
                <Button onClick={() => setActiveTab("catalog")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ver Catálogo
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="p-4 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Pedidos Drop</h2>
            <Button size="sm" onClick={() => setShowNewOrderDialog(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Novo Pedido
            </Button>
          </div>

          {dropOrders && dropOrders.length > 0 ? (
            <div className="space-y-3">
              {dropOrders.map((order: {
                id: string;
                order_number: string;
                buyer_name: string;
                total: number;
                client_margin: number;
                order_status: string;
                payment_status: string;
                external_marketplace?: string;
                created_at: string;
                product?: { nome: string; imagens?: string[] | null };
              }) => (
                <Card key={order.id}>
                  <CardContent className="p-3">
                    <div className="flex gap-3">
                      <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                        {order.product?.imagens?.[0] ? (
                          <img 
                            src={order.product.imagens[0]} 
                            alt={order.product?.nome}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-sm">#{order.order_number}</p>
                            <p className="text-xs text-muted-foreground">{order.buyer_name}</p>
                          </div>
                          {getOrderStatusBadge(order.order_status)}
                        </div>
                        
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                          {order.product?.nome}
                        </p>
                        
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{formatCurrency(order.total)}</span>
                            <Badge variant="outline" className="text-xs text-green-600">
                              +{formatCurrency(order.client_margin)}
                            </Badge>
                          </div>
                          {order.external_marketplace && (
                            <Badge variant="secondary" className="text-xs">
                              {order.external_marketplace}
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {new Date(order.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">Nenhum pedido ainda</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Crie pedidos quando seus clientes comprarem em seus canais de venda
                </p>
                <Button onClick={() => setShowNewOrderDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Pedido
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* New Order Dialog */}
      <Dialog open={showNewOrderDialog} onOpenChange={setShowNewOrderDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Pedido Drop</DialogTitle>
            <DialogDescription>
              Registre uma venda feita em marketplace externo
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Product Selection */}
            <div className="space-y-2">
              <Label>Produto *</Label>
              <Select
                value={newOrderForm.productId}
                onValueChange={(value) => setNewOrderForm(prev => ({ ...prev, productId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o produto" />
                </SelectTrigger>
                <SelectContent>
                  {myDropProducts?.filter((p: { is_active: boolean }) => p.is_active).map((product: { id: string; product?: { nome: string }; custom_price: number }) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.product?.nome} - {formatCurrency(product.custom_price)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Marketplace */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Marketplace</Label>
                <Select
                  value={newOrderForm.externalMarketplace}
                  onValueChange={(value) => setNewOrderForm(prev => ({ ...prev, externalMarketplace: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mercado_livre">Mercado Livre</SelectItem>
                    <SelectItem value="shopee">Shopee</SelectItem>
                    <SelectItem value="amazon">Amazon</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>ID do Pedido</Label>
                <Input
                  placeholder="Opcional"
                  value={newOrderForm.externalOrderId}
                  onChange={(e) => setNewOrderForm(prev => ({ ...prev, externalOrderId: e.target.value }))}
                />
              </div>
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <Label>Quantidade</Label>
              <Input
                type="number"
                min={1}
                value={newOrderForm.quantity}
                onChange={(e) => setNewOrderForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
              />
            </div>

            {/* Buyer Info */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Dados do Comprador</h4>
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input
                  placeholder="Nome completo"
                  value={newOrderForm.buyerName}
                  onChange={(e) => setNewOrderForm(prev => ({ ...prev, buyerName: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    placeholder="email@exemplo.com"
                    value={newOrderForm.buyerEmail}
                    onChange={(e) => setNewOrderForm(prev => ({ ...prev, buyerEmail: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input
                    placeholder="(00) 00000-0000"
                    value={newOrderForm.buyerPhone}
                    onChange={(e) => setNewOrderForm(prev => ({ ...prev, buyerPhone: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>CPF/CNPJ</Label>
                <Input
                  placeholder="000.000.000-00"
                  value={newOrderForm.buyerDocument}
                  onChange={(e) => setNewOrderForm(prev => ({ ...prev, buyerDocument: e.target.value }))}
                />
              </div>
            </div>

            {/* Shipping Address */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Endereço de Entrega</h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-2">
                  <Label>Rua *</Label>
                  <Input
                    placeholder="Rua, Avenida..."
                    value={newOrderForm.street}
                    onChange={(e) => setNewOrderForm(prev => ({ ...prev, street: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Número</Label>
                  <Input
                    placeholder="123"
                    value={newOrderForm.number}
                    onChange={(e) => setNewOrderForm(prev => ({ ...prev, number: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Bairro *</Label>
                <Input
                  placeholder="Bairro"
                  value={newOrderForm.neighborhood}
                  onChange={(e) => setNewOrderForm(prev => ({ ...prev, neighborhood: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Cidade *</Label>
                  <Input
                    placeholder="Cidade"
                    value={newOrderForm.city}
                    onChange={(e) => setNewOrderForm(prev => ({ ...prev, city: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Input
                    placeholder="UF"
                    maxLength={2}
                    value={newOrderForm.state}
                    onChange={(e) => setNewOrderForm(prev => ({ ...prev, state: e.target.value.toUpperCase() }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>CEP</Label>
                <Input
                  placeholder="00000-000"
                  value={newOrderForm.zipCode}
                  onChange={(e) => setNewOrderForm(prev => ({ ...prev, zipCode: e.target.value }))}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewOrderDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateOrder}
              disabled={createDropOrder.isPending}
            >
              {createDropOrder.isPending ? "Criando..." : "Criar Pedido"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
