import { ParticlesBackground } from "@/components/cliente/ParticlesBackground";
import { BottomNav } from "@/components/cliente/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/hooks/useCart";

const Carrinho = () => {
  const navigate = useNavigate();
  const { cartItems, updateQuantity, removeItem, clearCart, getTotal, itemCount } = useCart();

  const total = getTotal();
  const shipping = cartItems.length > 0 ? 15.00 : 0;

  return (
    <div className="min-h-screen bg-background pb-20">
      <ParticlesBackground />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">Meu Carrinho</h1>
            <p className="text-sm text-muted-foreground">{itemCount} {itemCount === 1 ? 'item' : 'itens'}</p>
          </div>
          <ShoppingCart className="h-6 w-6 text-primary" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 relative z-10">
        {cartItems.length === 0 ? (
          <Card className="bg-white border shadow-sm p-12 text-center">
            <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-lg mb-4">Seu carrinho está vazio</p>
            <Button 
              onClick={() => navigate("/cliente/produtos")}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              Continuar Comprando
            </Button>
          </Card>
        ) : (
          <>
            <div className="space-y-4 mb-6">
              {cartItems.map((item) => (
                <Card key={item.id} className="bg-white border shadow-sm p-4">
                  <div className="flex gap-4">
                    <div className="w-24 h-24 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium mb-2 line-clamp-2">{item.name}</h3>
                      <p className="text-primary font-bold text-lg">
                        R$ {(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-3 bg-muted rounded-full p-1">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="p-2 hover:bg-muted-foreground/10 rounded-full transition-colors"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="p-2 hover:bg-muted-foreground/10 rounded-full transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-2 hover:bg-red-500/10 text-red-500 rounded-full transition-colors"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </Card>
              ))}
            </div>

            {/* Resumo */}
            <Card className="bg-white border shadow-sm p-6 mb-6">
              <h2 className="text-xl font-bold text-primary mb-4">Resumo do Pedido</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">R$ {total.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Frete</span>
                  <span className="font-medium">R$ {shipping.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="border-t pt-3 flex justify-between items-center">
                  <span className="text-xl font-bold">Total</span>
                  <span className="text-2xl font-bold text-primary">
                    R$ {(total + shipping).toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>
            </Card>

            {/* Botões de Ação */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => clearCart()}
              >
                Limpar Carrinho
              </Button>
              <Button 
                onClick={() => navigate("/cliente/checkout")}
                className="flex-1 bg-primary hover:bg-primary/90 text-white h-14 text-lg font-bold"
              >
                Finalizar Pedido
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