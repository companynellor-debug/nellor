import { useState } from "react";
import { ParticlesBackground } from "@/components/cliente/ParticlesBackground";
import { BottomNav } from "@/components/cliente/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Trash2, MessageCircle, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/hooks/useCart";
import { formatCurrencyFromDecimal } from "@/utils/currency";

const Carrinho = () => {
  const navigate = useNavigate();
  const { cartItems, removeItem, clearCart, itemCount } = useCart();

  const getVariationSummary = (item: typeof cartItems[0]) => {
    if (item.variations && Object.keys(item.variations).length > 0) {
      return Object.values(item.variations).join(' • ');
    }
    const parts: string[] = [];
    if (item.selectedColor) parts.push(item.selectedColor);
    if (item.selectedSize) parts.push(item.selectedSize);
    return parts.length > 0 ? parts.join(' • ') : null;
  };

  // Group items by store
  const storeGroups = cartItems.reduce((acc, item) => {
    if (!acc[item.storeId]) acc[item.storeId] = { storeName: item.storeName, items: [] };
    acc[item.storeId].items.push(item);
    return acc;
  }, {} as Record<string, { storeName: string; items: typeof cartItems }>);

  return (
    <div className="min-h-screen bg-background pb-20">
      <ParticlesBackground />

      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">Lista de Interesse</h1>
            <p className="text-sm text-muted-foreground">{itemCount} {itemCount === 1 ? 'produto' : 'produtos'} salvos</p>
          </div>
          <Heart className="h-6 w-6 text-primary" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 relative z-10">
        {cartItems.length === 0 ? (
          <Card className="bg-white border shadow-sm p-12 text-center">
            <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-lg mb-2">Sua lista de interesse está vazia</p>
            <p className="text-sm text-muted-foreground mb-6">Salve produtos que deseja negociar com fornecedores</p>
            <Button onClick={() => navigate("/cliente/produtos")} className="bg-primary hover:bg-primary/90 text-white">
              Explorar Produtos
            </Button>
          </Card>
        ) : (
          <>
            {Object.entries(storeGroups).map(([storeId, group]) => (
              <div key={storeId} className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-sm text-muted-foreground">{group.storeName}</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-primary border-primary/30 hover:bg-primary/10 gap-1 text-xs"
                    onClick={() => navigate('/cliente/chat', {
                      state: {
                        supplierId: storeId,
                        message: `Olá! Tenho interesse em ${group.items.length} produto(s) da sua loja. Podemos negociar?`
                      }
                    })}
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    Negociar tudo
                  </Button>
                </div>

                <div className="space-y-3">
                  {group.items.map((item) => {
                    const variationSummary = getVariationSummary(item);
                    const displayImage = item.variationImage || item.image;
                    return (
                      <Card key={item.id} className="bg-white border shadow-sm p-4">
                        <div className="flex gap-4">
                          <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                            <img src={displayImage} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium mb-1 line-clamp-2 text-sm">{item.name}</h3>
                            {variationSummary && (
                              <p className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-0.5 inline-block mb-1">
                                {variationSummary}
                              </p>
                            )}
                            <p className="text-primary font-bold">{formatCurrencyFromDecimal(item.price)}</p>
                            <p className="text-[10px] text-muted-foreground">Preço de referência</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-primary border-primary/30 hover:bg-primary/10 gap-1 text-xs h-8"
                              onClick={() => navigate('/cliente/chat', {
                                state: {
                                  supplierId: item.storeId,
                                  message: `Olá! Tenho interesse no produto ${item.name}. Podemos negociar?`
                                }
                              })}
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                              Negociar
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/cliente/produto/${item.productId}`)}
                              className="text-muted-foreground text-xs gap-1 h-8"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Ver
                            </Button>
                          </div>
                          <button onClick={() => removeItem(item.id)} className="p-2 hover:bg-destructive/10 text-destructive rounded-full transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="flex gap-3 mt-4">
              <Button variant="outline" onClick={() => navigate("/cliente/produtos")} className="flex-1">
                Explorar Mais
              </Button>
              <Button variant="outline" onClick={() => clearCart()} className="text-destructive border-destructive/30 hover:bg-destructive/10">
                Limpar Lista
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
