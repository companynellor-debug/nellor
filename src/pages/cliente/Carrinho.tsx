import { ParticlesBackground } from "@/components/cliente/ParticlesBackground";
import { BottomNav } from "@/components/cliente/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

const Carrinho = () => {
  const [cartItems, setCartItems] = useState([
    {
      id: 1,
      name: "Tênis Esportivo Premium",
      price: 299.9,
      quantity: 1,
      image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=300&fit=crop",
    },
    {
      id: 2,
      name: "Bolsa de Couro Elegante",
      price: 189.9,
      quantity: 2,
      image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=300&h=300&fit=crop",
    },
    {
      id: 3,
      name: "Relógio Smartwatch",
      price: 399.9,
      quantity: 1,
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop",
    },
  ]);

  const updateQuantity = (id: number, delta: number) => {
    setCartItems((items) =>
      items.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      )
    );
  };

  const removeItem = (id: number) => {
    setCartItems((items) => items.filter((item) => item.id !== id));
  };

  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="min-h-screen bg-[hsl(var(--cliente-bg))] text-[hsl(var(--cliente-text))] pb-20">
      <ParticlesBackground />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-[hsl(var(--cliente-surface))]/95 backdrop-blur-lg border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Meu Carrinho</h1>
          <p className="text-sm text-[hsl(var(--cliente-text-muted))]">{cartItems.length} {cartItems.length === 1 ? 'item' : 'itens'}</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 relative z-10">
        {cartItems.length === 0 ? (
          <Card className="bg-white/5 backdrop-blur-sm border-white/10 p-12 text-center">
            <p className="text-[hsl(var(--cliente-text-muted))] text-lg mb-4">Seu carrinho está vazio</p>
            <Button className="bg-[hsl(var(--cliente-accent))] hover:bg-[hsl(var(--cliente-accent))]/90 text-white">
              Continuar Comprando
            </Button>
          </Card>
        ) : (
          <>
            <div className="space-y-4 mb-6">
              {cartItems.map((item) => (
                <Card key={item.id} className="bg-white/5 backdrop-blur-sm border-white/10 p-4">
                  <div className="flex gap-4">
                    <div className="w-24 h-24 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium mb-2 line-clamp-2">{item.name}</h3>
                      <p className="text-[hsl(var(--cliente-accent))] font-bold text-lg">
                        R$ {(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-3 bg-white/5 rounded-full p-1">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-2 hover:bg-red-500/10 text-red-400 rounded-full transition-colors"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </Card>
              ))}
            </div>

            {/* Resumo */}
            <Card className="bg-white/5 backdrop-blur-sm border-white/10 p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Resumo do Pedido</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-[hsl(var(--cliente-text-muted))]">Subtotal</span>
                  <span className="font-medium">R$ {total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[hsl(var(--cliente-text-muted))]">Frete</span>
                  <span className="font-medium text-green-400">Grátis</span>
                </div>
                <div className="border-t border-white/10 pt-3 flex justify-between items-center">
                  <span className="text-xl font-bold">Total</span>
                  <span className="text-2xl font-bold text-[hsl(var(--cliente-accent))]">
                    R$ {total.toFixed(2)}
                  </span>
                </div>
              </div>
            </Card>

            {/* Botão Finalizar */}
            <Button className="w-full bg-[hsl(var(--cliente-accent))] hover:bg-[hsl(var(--cliente-accent))]/90 text-white h-14 text-lg font-bold">
              Ir para Pagamento
            </Button>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Carrinho;
