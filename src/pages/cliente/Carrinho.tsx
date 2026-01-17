import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Minus, Plus, Trash2, ShoppingCart, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/hooks/useCart";
import { toast } from "@/hooks/use-toast";

const Carrinho = () => {
  const navigate = useNavigate();
  const { cartItems, updateQuantity, removeItem, clearCart, getTotal, itemCount, validateMinimumLimits } = useCart();
  
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
    
    navigate("/cliente/checkout");
  };

  const total = getTotal();
  const shipping = cartItems.length > 0 ? 15.00 : 0;

  return (
    <div className="min-h-full pb-20 lg:pb-6">
      <div className="container mx-auto px-4 py-6">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Meu Carrinho</h1>
            <p className="text-sm text-muted-foreground">{itemCount} {itemCount === 1 ? 'item' : 'itens'}</p>
          </div>
          <ShoppingCart className="h-6 w-6 text-primary" />
        </div>

        {cartItems.length === 0 ? (
          <Card className="p-12 text-center shadow-sm">
            <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-lg mb-4">Seu carrinho está vazio</p>
            <Button onClick={() => navigate("/cliente/produtos")}>
              Continuar Comprando
            </Button>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => {
                const itemTotal = item.price * item.quantity;
                const hasMinQuantity = item.minQuantity && item.minQuantity > 0;
                const hasMinValue = item.minValue && item.minValue > 0;
                const meetsMinQuantity = !hasMinQuantity || item.quantity >= item.minQuantity!;
                const meetsMinValue = !hasMinValue || itemTotal >= item.minValue!;
                const hasLimits = hasMinQuantity || hasMinValue;
                
                return (
                  <Card key={item.id} className="p-4 shadow-sm">
                    <div className="flex gap-4">
                      <div className="w-24 h-24 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium mb-2 line-clamp-2">{item.name}</h3>
                        <p className="text-primary font-bold text-lg">
                          R$ {itemTotal.toFixed(2)}
                        </p>
                        {hasLimits && (
                          <div className="mt-2 space-y-1">
                            {hasMinQuantity && (
                              <div className={`flex items-center gap-1 text-xs ${meetsMinQuantity ? 'text-green-600' : 'text-red-600'}`}>
                                {meetsMinQuantity ? '✓' : '✗'} Mín: {item.minQuantity} unidades
                              </div>
                            )}
                            {hasMinValue && (
                              <div className={`flex items-center gap-1 text-xs ${meetsMinValue ? 'text-green-600' : 'text-red-600'}`}>
                                {meetsMinValue ? '✓' : '✗'} Mín: R$ {item.minValue!.toFixed(2)}
                              </div>
                            )}
                          </div>
                        )}
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
                        className="p-2 hover:bg-destructive/10 text-destructive rounded-full transition-colors"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Order Summary */}
            <div className="space-y-4">
              <Card className="p-6 shadow-sm sticky top-24">
                <h2 className="text-xl font-bold text-foreground mb-4">Resumo do Pedido</h2>
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

                {/* Validation Warnings */}
                {(() => {
                  const validation = validateMinimumLimits();
                  if (!validation.isValid) {
                    return (
                      <Alert variant="destructive" className="mt-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <p className="font-medium mb-2">Limites mínimos não atendidos:</p>
                          <ul className="space-y-1 text-sm">
                            {validation.errors.map((error, index) => (
                              <li key={index}>• {error}</li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    );
                  }
                })()}

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 mt-6">
                  <Button 
                    onClick={handleCheckout}
                    className="w-full h-14 text-lg font-bold"
                  >
                    Finalizar Pedido
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => clearCart()}
                  >
                    Limpar Carrinho
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Carrinho;
