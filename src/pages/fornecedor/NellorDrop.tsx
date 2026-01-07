import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Package, TrendingUp, Users, ShoppingCart, Settings, Percent, Clock, Check, X, Eye } from 'lucide-react';
import { useSupplierDrop } from '@/hooks/useSupplierDrop';
import { SupplierProductDropModal } from '@/components/fornecedor/SupplierProductDropModal';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const NellorDrop = () => {
  const {
    dropSettings,
    dropStats,
    productsWithDrop,
    dropOrders,
    isLoading,
    toggleDropMode,
    updateDropSettings,
    toggleProductDrop,
    updateProductDropSettings,
    updateDropOrderStatus,
  } = useSupplierDrop();

  const [settingsForm, setSettingsForm] = useState({
    default_commission_percent: dropSettings?.default_commission_percent || 10,
    allow_affiliates_on_drop: dropSettings?.allow_affiliates_on_drop ?? true,
    allow_service_providers_on_drop: dropSettings?.allow_service_providers_on_drop ?? true,
    min_order_value: dropSettings?.min_order_value || 0,
  });

  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showProductModal, setShowProductModal] = useState(false);

  const [trackingModal, setTrackingModal] = useState<{ orderId: string; isOpen: boolean }>({ orderId: '', isOpen: false });
  const [trackingCode, setTrackingCode] = useState('');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isDropEnabled = dropSettings?.drop_enabled ?? false;

  const handleToggleDrop = async () => {
    await toggleDropMode.mutateAsync(!isDropEnabled);
  };

  const handleSaveSettings = async () => {
    await updateDropSettings.mutateAsync(settingsForm);
  };

  const handleSaveProductDropSettings = async (productId: string, settings: Record<string, unknown>) => {
    await updateProductDropSettings.mutateAsync({ productId, settings });
  };

  const handleShipOrder = async () => {
    if (!trackingModal.orderId || !trackingCode) {
      toast.error('Informe o código de rastreio');
      return;
    }
    
    await updateDropOrderStatus.mutateAsync({
      orderId: trackingModal.orderId,
      status: 'shipped',
      trackingCode,
    });
    
    setTrackingModal({ orderId: '', isOpen: false });
    setTrackingCode('');
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-500/20 text-yellow-500',
      paid: 'bg-blue-500/20 text-blue-500',
      preparing: 'bg-purple-500/20 text-purple-500',
      shipped: 'bg-cyan-500/20 text-cyan-500',
      delivered: 'bg-green-500/20 text-green-500',
      cancelled: 'bg-red-500/20 text-red-500',
    };
    
    const labels: Record<string, string> = {
      pending: 'Pendente',
      paid: 'Pago',
      preparing: 'Preparando',
      shipped: 'Enviado',
      delivered: 'Entregue',
      cancelled: 'Cancelado',
    };
    
    return (
      <Badge className={styles[status] || 'bg-muted'}>
        {labels[status] || status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Nellor Drop</h1>
          <p className="text-muted-foreground">Gerencie seus produtos disponíveis para dropshipping</p>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {isDropEnabled ? 'Drop ativo' : 'Drop inativo'}
          </span>
          <Switch
            checked={isDropEnabled}
            onCheckedChange={handleToggleDrop}
            disabled={toggleDropMode.isPending}
          />
        </div>
      </div>

      {!isDropEnabled ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Ative o Nellor Drop</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Permita que revendedores vendam seus produtos em outros marketplaces. 
              Você define as comissões e mantém o controle total do estoque e envio.
            </p>
            <Button onClick={handleToggleDrop} disabled={toggleDropMode.isPending}>
              {toggleDropMode.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ativar Nellor Drop
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="products">Produtos</TabsTrigger>
            <TabsTrigger value="orders">Pedidos</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-xl">
                      <TrendingUp className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Vendas Drop</p>
                      <p className="text-2xl font-bold">
                        R$ {dropStats?.total_sales?.toFixed(2).replace('.', ',') || '0,00'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 rounded-xl">
                      <ShoppingCart className="h-6 w-6 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Pedidos</p>
                      <p className="text-2xl font-bold">{dropStats?.total_orders || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-500/10 rounded-xl">
                      <Package className="h-6 w-6 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Produtos no Drop</p>
                      <p className="text-2xl font-bold">{dropStats?.products_in_drop || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-yellow-500/10 rounded-xl">
                      <Clock className="h-6 w-6 text-yellow-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Pedidos Pendentes</p>
                      <p className="text-2xl font-bold">{dropStats?.pending_orders || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Drop Orders */}
            <Card>
              <CardHeader>
                <CardTitle>Pedidos Recentes (Drop)</CardTitle>
                <CardDescription>Últimos pedidos recebidos via Nellor Drop</CardDescription>
              </CardHeader>
              <CardContent>
                {dropOrders && dropOrders.length > 0 ? (
                  <div className="space-y-4">
                    {dropOrders.slice(0, 5).map((order: Record<string, unknown>) => (
                      <div key={order.id as string} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                            <Package className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">#{order.order_number as string}</p>
                            <p className="text-sm text-muted-foreground">
                              {(order.product as { nome: string } | null)?.nome}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            R$ {(order.supplier_amount as number)?.toFixed(2).replace('.', ',')}
                          </p>
                          {getStatusBadge(order.order_status as string)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum pedido Drop ainda
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Produtos no Nellor Drop</CardTitle>
                <CardDescription>
                  Ative ou desative produtos para disponibilizar no catálogo Drop
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {productsWithDrop?.map((product) => (
                    <div 
                      key={product.id} 
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden">
                          {product.imagens?.[0] ? (
                            <img 
                              src={product.imagens[0]} 
                              alt={product.nome} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{product.nome}</p>
                          <p className="text-sm text-muted-foreground">
                            R$ {product.preco.toFixed(2).replace('.', ',')} • 
                            Estoque: {product.estoque}
                          </p>
                          {product.dropSetting?.drop_enabled && (
                            <p className="text-xs text-primary">
                              Comissão: {product.dropSetting.commission_percent}% • 
                              Prazo: {product.dropSetting.shipping_days_estimate} dias
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedProduct(product);
                            setShowProductModal(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Configurar
                        </Button>
                        <Switch
                          checked={product.dropSetting?.drop_enabled ?? false}
                          onCheckedChange={(checked) => 
                            toggleProductDrop.mutateAsync({ productId: product.id, enabled: checked })
                          }
                          disabled={toggleProductDrop.isPending}
                        />
                      </div>
                    </div>
                  ))}
                  
                  {(!productsWithDrop || productsWithDrop.length === 0) && (
                    <p className="text-center text-muted-foreground py-8">
                      Você ainda não tem produtos cadastrados
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Pedidos Drop</CardTitle>
                <CardDescription>
                  Gerencie os pedidos recebidos via Nellor Drop
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dropOrders && dropOrders.length > 0 ? (
                    dropOrders.map((order: Record<string, unknown>) => (
                      <div 
                        key={order.id as string} 
                        className="p-4 bg-muted/50 rounded-lg space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold">#{order.order_number as string}</p>
                              <Badge variant="outline" className="text-xs">
                                Drop
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {(order.product as { nome: string } | null)?.nome} x {order.quantity as number}
                            </p>
                          </div>
                          {getStatusBadge(order.order_status as string)}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Comprador</p>
                            <p className="font-medium">{order.buyer_name as string}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Marketplace</p>
                            <p className="font-medium">{order.external_marketplace as string || 'Manual'}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Valor (seu)</p>
                            <p className="font-medium text-green-500">
                              R$ {(order.supplier_amount as number)?.toFixed(2).replace('.', ',')}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Rastreio</p>
                            <p className="font-medium">{order.tracking_code as string || '-'}</p>
                          </div>
                        </div>
                        
                        {order.order_status === 'paid' && (
                          <div className="flex gap-2">
                            <Button 
                              size="sm"
                              onClick={() => updateDropOrderStatus.mutateAsync({ 
                                orderId: order.id as string, 
                                status: 'preparing' 
                              })}
                            >
                              Iniciar Preparo
                            </Button>
                          </div>
                        )}
                        
                        {order.order_status === 'preparing' && (
                          <div className="flex gap-2">
                            <Button 
                              size="sm"
                              onClick={() => setTrackingModal({ 
                                orderId: order.id as string, 
                                isOpen: true 
                              })}
                            >
                              Marcar Enviado
                            </Button>
                          </div>
                        )}
                        
                        {order.order_status === 'shipped' && (
                          <div className="flex gap-2">
                            <Button 
                              size="sm"
                              variant="outline"
                              onClick={() => updateDropOrderStatus.mutateAsync({ 
                                orderId: order.id as string, 
                                status: 'delivered' 
                              })}
                            >
                              <Check className="h-4 w-4 mr-2" />
                              Confirmar Entrega
                            </Button>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum pedido Drop ainda
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações do Nellor Drop</CardTitle>
                <CardDescription>
                  Configure as regras padrão para seus produtos no Drop
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="commission">Comissão Padrão (%)</Label>
                    <div className="flex items-center gap-2">
                      <Percent className="h-4 w-4 text-muted-foreground" />
                      <Input
                        id="commission"
                        type="number"
                        min={0}
                        max={100}
                        value={settingsForm.default_commission_percent}
                        onChange={(e) => setSettingsForm(prev => ({
                          ...prev,
                          default_commission_percent: Number(e.target.value),
                        }))}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Comissão que revendedores ganham sobre o preço base
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="minOrder">Valor Mínimo de Pedido</Label>
                    <Input
                      id="minOrder"
                      type="number"
                      min={0}
                      value={settingsForm.min_order_value}
                      onChange={(e) => setSettingsForm(prev => ({
                        ...prev,
                        min_order_value: Number(e.target.value),
                      }))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Valor mínimo para aceitar pedidos Drop
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <Users className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Permitir Afiliados</p>
                        <p className="text-sm text-muted-foreground">
                          Afiliados podem divulgar produtos Drop
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={settingsForm.allow_affiliates_on_drop}
                      onCheckedChange={(checked) => setSettingsForm(prev => ({
                        ...prev,
                        allow_affiliates_on_drop: checked,
                      }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <Users className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Permitir Prestadores de Serviço</p>
                        <p className="text-sm text-muted-foreground">
                          Prestadores podem gerenciar produtos Drop
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={settingsForm.allow_service_providers_on_drop}
                      onCheckedChange={(checked) => setSettingsForm(prev => ({
                        ...prev,
                        allow_service_providers_on_drop: checked,
                      }))}
                    />
                  </div>
                </div>
                
                <Button 
                  onClick={handleSaveSettings}
                  disabled={updateDropSettings.isPending}
                >
                  {updateDropSettings.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar Configurações
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Product Settings Modal */}
      <SupplierProductDropModal
        product={selectedProduct}
        open={showProductModal}
        onOpenChange={setShowProductModal}
        onSave={handleSaveProductDropSettings}
        isSaving={updateProductDropSettings.isPending}
      />

      {/* Tracking Code Modal */}
      <Dialog open={trackingModal.isOpen} onOpenChange={(open) => !open && setTrackingModal({ orderId: '', isOpen: false })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Informar Código de Rastreio</DialogTitle>
            <DialogDescription>
              Informe o código de rastreio para marcar o pedido como enviado
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Código de Rastreio</Label>
              <Input
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value)}
                placeholder="Ex: BR123456789BR"
              />
            </div>
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setTrackingModal({ orderId: '', isOpen: false })}>
              Cancelar
            </Button>
            <Button 
              onClick={handleShipOrder}
              disabled={updateDropOrderStatus.isPending || !trackingCode}
            >
              {updateDropOrderStatus.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar Envio
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NellorDrop;
