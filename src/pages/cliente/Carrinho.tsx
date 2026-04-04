import { useState, useEffect } from "react";
import { ParticlesBackground } from "@/components/cliente/ParticlesBackground";
import { BottomNav } from "@/components/cliente/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Minus, Plus, Trash2, ShoppingCart, AlertCircle, Truck, MapPin, Package, Loader2, CheckCircle, Share2, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/hooks/useCart";
import { useSupabaseAddresses } from "@/hooks/useSupabaseAddresses";
import { useShippingCalculator, getRegionFromState, REGION_LABELS } from "@/hooks/useSupplierShipping";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { formatCurrencyFromDecimal } from "@/utils/currency";

interface ShippingInfo {
  available: boolean;
  price: number;
  freeAbove: number | null;
  allowsPickup: boolean;
  region: string | null;
  isFreeShipping: boolean;
  deliveryDaysMin: number | null;
  deliveryDaysMax: number | null;
}

const Carrinho = () => {
  const navigate = useNavigate();
  const { user } = useSupabaseAuth();
  const { cartItems, updateQuantity, removeItem, clearCart, getTotal, itemCount, validateMinimumLimits } = useCart();
  const { addresses, loading: addressesLoading } = useSupabaseAddresses();
  const { getShippingForSupplier } = useShippingCalculator();

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo | null>(null);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [isPickup, setIsPickup] = useState(false);
  const [sharingCart, setSharingCart] = useState(false);

  // Auto-select default address
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const defaultAddr = addresses.find(a => a.is_default);
      setSelectedAddressId(defaultAddr?.id || addresses[0].id);
    }
  }, [addresses, selectedAddressId]);

  // Calculate shipping when address or cart changes
  useEffect(() => {
    const calculateShipping = async () => {
      if (!selectedAddressId || cartItems.length === 0) {
        setShippingInfo(null);
        return;
      }

      const address = addresses.find(a => a.id === selectedAddressId);
      if (!address) return;

      const supplierId = cartItems[0]?.storeId;
      if (!supplierId) return;

      setShippingLoading(true);
      try {
        const result = await getShippingForSupplier(supplierId, address.state);
        const subtotal = getTotal();
        const isFreeShipping = result.freeAbove !== null && subtotal >= result.freeAbove;
        
        setShippingInfo({
          ...result,
          isFreeShipping,
        });
        setIsPickup(false);
      } catch {
        setShippingInfo(null);
      } finally {
        setShippingLoading(false);
      }
    };

    calculateShipping();
  }, [selectedAddressId, cartItems, addresses]);

  const subtotal = getTotal();
  const shippingPrice = isPickup ? 0 : (shippingInfo?.isFreeShipping ? 0 : (shippingInfo?.price || 0));
  const totalPieces = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  
  const handleCheckout = () => {
    const validation = validateMinimumLimits();
    if (!validation.isValid) {
      toast({
        title: "Limites mínimos não atendidos",
        description: (
          <div className="space-y-1 mt-2">
            {validation.errors.map((error, index) => (
              <p key={index}>• {error}</p>
            ))}
          </div>
        ),
        variant: "destructive"
      });
      return;
    }

    if (!selectedAddressId && !isPickup) {
      toast({
        title: "Endereço necessário",
        description: "Cadastre um endereço de entrega no seu perfil.",
        variant: "destructive"
      });
      return;
    }

    if (shippingInfo && !shippingInfo.available && !isPickup) {
      toast({
        title: "Frete indisponível",
        description: "O fornecedor não entrega na sua região.",
        variant: "destructive"
      });
      return;
    }

    // Store shipping data for checkout
    localStorage.setItem('checkout_shipping', JSON.stringify({
      addressId: selectedAddressId,
      shippingPrice,
      isPickup,
      region: shippingInfo?.region,
    }));

    navigate("/cliente/checkout");
  };

  const handleShareCart = async () => {
    if (!user || cartItems.length === 0) return;
    setSharingCart(true);
    try {
      const expires = new Date();
      expires.setDate(expires.getDate() + 7);
      
      const { data, error } = await (supabase.from("shared_carts" as any) as any)
        .insert({
          user_id: user.id,
          items: cartItems,
          expires_at: expires.toISOString(),
        })
        .select("share_token")
        .single();
      
      if (error) throw error;
      
      const url = `${window.location.origin}/carrinho/${data.share_token}`;
      await navigator.clipboard.writeText(url);
      toast({ title: "Carrinho compartilhado!", description: "Link copiado para a área de transferência. Válido por 7 dias." });
    } catch {
      toast({ title: "Erro ao compartilhar", description: "Tente novamente.", variant: "destructive" });
    } finally {
      setSharingCart(false);
    }
  };

  const getVariationSummary = (item: typeof cartItems[0]) => {
    if (item.variations && Object.keys(item.variations).length > 0) {
      return Object.values(item.variations).join(' • ');
    }
    const parts: string[] = [];
    if (item.selectedColor) parts.push(item.selectedColor);
    if (item.selectedSize) parts.push(item.selectedSize);
    return parts.length > 0 ? parts.join(' • ') : null;
  };

  const selectedAddress = addresses.find(a => a.id === selectedAddressId);

  return (
    <div className="min-h-screen bg-background pb-20">
      <ParticlesBackground />

      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">Meu Carrinho</h1>
            <p className="text-sm text-muted-foreground">{itemCount} {itemCount === 1 ? 'item' : 'itens'} • {totalPieces} peças</p>
          </div>
          <div className="flex items-center gap-2">
            {cartItems.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleShareCart}
                disabled={sharingCart}
                title="Compartilhar carrinho"
              >
                <Share2 className="h-5 w-5" />
              </Button>
            )}
            <ShoppingCart className="h-6 w-6 text-primary" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 relative z-10">
        {cartItems.length === 0 ? (
          <Card className="bg-white border shadow-sm p-12 text-center">
            <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-lg mb-4">Seu carrinho está vazio</p>
            <Button onClick={() => navigate("/cliente/produtos")} className="bg-primary hover:bg-primary/90 text-white">
              Continuar Comprando
            </Button>
          </Card>
        ) : (
          <>
            <div className="space-y-4 mb-6">
              {cartItems.map((item) => {
                const itemTotal = item.price * item.quantity;
                const variationSummary = getVariationSummary(item);
                const displayImage = item.variationImage || item.image;
                return (
                  <Card key={item.id} className="bg-white border shadow-sm p-4">
                    <div className="flex gap-4">
                      <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        <img src={displayImage} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium mb-1 line-clamp-2">{item.name}</h3>
                        {variationSummary && (
                          <p className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1 inline-block mb-2">
                            {variationSummary}
                          </p>
                        )}
                        <p className="text-primary font-bold text-lg">{formatCurrencyFromDecimal(itemTotal)}</p>
                        <p className="text-xs text-muted-foreground">{formatCurrencyFromDecimal(item.price)} × {item.quantity} peças</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-3 bg-muted rounded-full p-1">
                        <button onClick={() => updateQuantity(item.id, -1)} className="p-2 hover:bg-muted-foreground/10 rounded-full transition-colors">
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="p-2 hover:bg-muted-foreground/10 rounded-full transition-colors">
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* "Add more" navigates to product page */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/cliente/produto/${item.productId}`)}
                          className="text-primary text-xs gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Mais opções
                        </Button>
                        <button onClick={() => removeItem(item.id)} className="p-2 hover:bg-destructive/10 text-destructive rounded-full transition-colors">
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Shipping Section */}
            <Card className="bg-white border shadow-sm p-5 mb-6">
              <h2 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Entrega
              </h2>

              {addressesLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando endereços...
                </div>
              ) : addresses.length === 0 ? (
                <div className="text-center py-4">
                  <MapPin className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-3">
                    Cadastre um endereço para calcular o frete
                  </p>
                  <Button variant="outline" size="sm" onClick={() => navigate("/cliente/enderecos")}>
                    Adicionar Endereço
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Entregar em:</label>
                    <Select value={selectedAddressId || ''} onValueChange={setSelectedAddressId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o endereço" />
                      </SelectTrigger>
                      <SelectContent>
                        {addresses.map(addr => (
                          <SelectItem key={addr.id} value={addr.id}>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{addr.label}</span>
                              <span className="text-muted-foreground text-xs">
                                {addr.city}/{addr.state}
                              </span>
                              {addr.is_default && <Badge variant="outline" className="text-[10px]">Padrão</Badge>}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedAddress && (
                    <p className="text-xs text-muted-foreground">
                      {selectedAddress.street}, {selectedAddress.number} - {selectedAddress.neighborhood}, {selectedAddress.city}/{selectedAddress.state}
                    </p>
                  )}

                  {shippingLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Calculando frete...
                    </div>
                  ) : shippingInfo ? (
                    shippingInfo.available ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Truck className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">Entrega</span>
                            {shippingInfo.region && (
                              <Badge variant="outline" className="text-[10px]">
                                {REGION_LABELS[shippingInfo.region as keyof typeof REGION_LABELS]}
                              </Badge>
                            )}
                          </div>
                          {shippingInfo.isFreeShipping || isPickup ? (
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Grátis
                            </Badge>
                          ) : (
                            <span className="font-bold text-primary">
                              {formatCurrencyFromDecimal(shippingInfo.price)}
                            </span>
                          )}
                          </div>

                          {shippingInfo.deliveryDaysMin != null && shippingInfo.deliveryDaysMax != null && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              📦 Prazo estimado: {shippingInfo.deliveryDaysMin} a {shippingInfo.deliveryDaysMax} dias úteis
                            </p>
                          )}

                        {shippingInfo.freeAbove && !shippingInfo.isFreeShipping && (
                          <p className="text-xs text-green-600">
                            🎉 Frete grátis em compras acima de {formatCurrencyFromDecimal(shippingInfo.freeAbove)}
                          </p>
                        )}

                        {shippingInfo.allowsPickup && (
                          <button
                            onClick={() => setIsPickup(!isPickup)}
                            className={`flex items-center gap-2 p-3 rounded-lg border w-full text-left text-sm transition-all ${
                              isPickup ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                            }`}
                          >
                            <Package className={`h-4 w-4 ${isPickup ? 'text-primary' : 'text-muted-foreground'}`} />
                            <div className="flex-1">
                              <span className="font-medium">Retirar na fonte</span>
                              <p className="text-xs text-muted-foreground">Frete grátis</p>
                            </div>
                            {isPickup && <CheckCircle className="h-4 w-4 text-primary" />}
                          </button>
                        )}
                      </div>
                    ) : (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Este fornecedor não entrega na sua região.
                        </AlertDescription>
                      </Alert>
                    )
                  ) : null}
                </div>
              )}
            </Card>

            {/* Resumo */}
            <Card className="bg-white border shadow-sm p-6 mb-6">
              <h2 className="text-xl font-bold text-primary mb-4">Resumo do Pedido</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total de peças</span>
                  <span className="font-medium">{totalPieces}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatCurrencyFromDecimal(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Frete</span>
                  <span className="font-medium">
                    {shippingInfo?.available === false ? (
                      <span className="text-destructive text-sm">Indisponível</span>
                    ) : shippingPrice === 0 ? (
                      <span className="text-green-600">Grátis</span>
                    ) : (
                      formatCurrencyFromDecimal(shippingPrice)
                    )}
                  </span>
                </div>
                <div className="border-t pt-3 flex justify-between items-center">
                  <span className="text-xl font-bold">Total</span>
                  <span className="text-2xl font-bold text-primary">{formatCurrencyFromDecimal(subtotal + shippingPrice)}</span>
                </div>
              </div>
            </Card>

            {/* Validação */}
            {(() => {
              const validation = validateMinimumLimits();
              if (!validation.isValid) {
                return (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <p className="font-medium mb-2">Atenção! Limites mínimos não atendidos:</p>
                      {validation.errors.map((error, index) => (
                        <p key={index} className="text-sm">• {error}</p>
                      ))}
                    </AlertDescription>
                  </Alert>
                );
              }
              return null;
            })()}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => navigate("/cliente/produtos")} className="flex-1">
                Continuar Comprando
              </Button>
              <Button onClick={handleCheckout} className="flex-1 bg-primary hover:bg-primary/90 text-white">
                Finalizar Compra
              </Button>
            </div>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Carrinho;
