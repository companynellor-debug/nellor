import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, ArrowLeft, Copy, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { formatCurrencyFromDecimal } from "@/utils/currency";
import { useCart } from "@/hooks/useCart";
import nellorLogo from "@/assets/nellor-logo.png";

const CarrinhoCompartilhado = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [sharedCart, setSharedCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [expired, setExpired] = useState(false);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    const fetchCart = async () => {
      if (!token) return;
      setLoading(true);
      const { data } = await (supabase.from("shared_carts" as any) as any)
        .select("*")
        .eq("share_token", token)
        .maybeSingle();

      if (!data) {
        setNotFound(true);
      } else if (new Date(data.expires_at) < new Date()) {
        setExpired(true);
      } else {
        setSharedCart(data);
      }
      setLoading(false);
    };
    fetchCart();
  }, [token]);

  const handleImportCart = async () => {
    if (!sharedCart?.items) return;
    setImporting(true);
    const items = sharedCart.items as any[];
    let added = 0;
    for (const item of items) {
      const result = addToCart(
        {
          productId: item.productId,
          name: item.name,
          price: item.price,
          image: item.image,
          storeId: item.storeId,
          storeName: item.storeName,
          selectedSize: item.selectedSize,
          selectedColor: item.selectedColor,
          minQuantity: item.minQuantity,
          minValue: item.minValue,
        },
        item.quantity
      );
      if (result) added++;
    }
    setImporting(false);
    if (added > 0) {
      toast({ title: "Carrinho importado!", description: `${added} ${added === 1 ? "item adicionado" : "itens adicionados"} ao seu carrinho.` });
      navigate("/cliente/carrinho");
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).catch(() => {});
    toast({ title: "Link copiado!" });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <p className="text-muted-foreground animate-pulse">Carregando carrinho...</p>
      </div>
    );
  }

  if (notFound || expired) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 gap-4 px-4">
        <AlertCircle className="h-16 w-16 text-muted-foreground" />
        <h1 className="text-xl font-bold">
          {notFound ? "Carrinho não encontrado" : "Link expirado"}
        </h1>
        <p className="text-muted-foreground text-sm text-center">
          {notFound
            ? "Este link pode ser inválido."
            : "Este carrinho compartilhado expirou após 7 dias."}
        </p>
        <Button onClick={() => navigate("/")}>Ir para a Nellor</Button>
      </div>
    );
  }

  const items: any[] = sharedCart?.items || [];
  const total = items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);

  return (
    <div className="min-h-screen bg-muted/30 pb-10">
      <header className="sticky top-0 z-40 bg-background border-b shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between max-w-lg">
          <img src={nellorLogo} alt="Nellor" className="h-6" />
          <button onClick={handleCopyLink} className="p-2 hover:bg-muted rounded-full">
            <Copy className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <ShoppingCart className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Carrinho Compartilhado</h1>
            <p className="text-sm text-muted-foreground">
              {items.length} {items.length === 1 ? "item" : "itens"} · {formatCurrencyFromDecimal(total)}
            </p>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          {items.map((item: any, idx: number) => (
            <Card key={idx} className="p-4">
              <div className="flex gap-3">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium line-clamp-2">{item.name}</p>
                  {(item.selectedColor || item.selectedSize) && (
                    <div className="flex gap-1 mt-1">
                      {item.selectedColor && <Badge variant="outline" className="text-xs">{item.selectedColor}</Badge>}
                      {item.selectedSize && <Badge variant="outline" className="text-xs">{item.selectedSize}</Badge>}
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-primary font-bold text-sm">
                      {formatCurrencyFromDecimal(item.price * item.quantity)}
                    </p>
                    <span className="text-xs text-muted-foreground">{item.quantity}x</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-4 mb-4">
          <div className="flex justify-between items-center">
            <span className="font-semibold">Total</span>
            <span className="text-xl font-bold text-primary">{formatCurrencyFromDecimal(total)}</span>
          </div>
        </Card>

        <Button
          className="w-full h-12 text-base font-bold gap-2"
          onClick={handleImportCart}
          disabled={importing}
        >
          <ShoppingCart className="h-5 w-5" />
          {importing ? "Importando..." : "Usar este carrinho"}
        </Button>
        <p className="text-center text-xs text-muted-foreground mt-3">
          Todos os itens serão adicionados ao seu carrinho
        </p>
      </main>
    </div>
  );
};

export default CarrinhoCompartilhado;
