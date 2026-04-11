import { useState, useRef, useEffect, useMemo } from "react";
import { Search, X, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useProducts } from "@/hooks/useProducts";
import { useNavigate } from "react-router-dom";

interface ProductSearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

export const ProductSearchOverlay = ({ open, onClose }: ProductSearchOverlayProps) => {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { products } = useProducts();
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    const starts: typeof products = [];
    const contains: typeof products = [];

    for (const p of products) {
      const name = p.name.toLowerCase();
      if (name.startsWith(q)) starts.push(p);
      else if (name.includes(q)) contains.push(p);
    }
    return [...starts, ...contains].slice(0, 8);
  }, [query, products]);

  const handleSelect = (productId: number) => {
    onClose();
    navigate(`/cliente/produto/${productId}`);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

      {/* Search Panel */}
      <div className="relative z-10 w-full max-w-2xl mx-auto mt-4 sm:mt-20 px-4">
        <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            <Search className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar produtos, marcas e muito mais..."
              className="border-0 shadow-none focus-visible:ring-0 text-base p-0 h-auto bg-transparent"
            />
            <button onClick={onClose} className="p-1 hover:bg-muted rounded-full transition-colors flex-shrink-0">
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          {/* Results */}
          <div className="max-h-[60vh] overflow-y-auto">
            {query.trim() === "" && (
              <div className="p-6 text-center text-muted-foreground text-sm">
                Digite o nome do produto que procura...
              </div>
            )}

            {query.trim() !== "" && suggestions.length === 0 && (
              <div className="p-6 text-center text-muted-foreground text-sm">
                Nenhum produto encontrado para "<span className="font-medium text-foreground">{query}</span>"
              </div>
            )}

            {suggestions.map((product) => (
              <button
                key={product.id}
                onClick={() => handleSelect(product.id)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left border-b border-border/50 last:border-b-0"
              >
                {product.images?.[0] ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-12 h-12 rounded-lg object-cover bg-muted flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <Search className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {product.price}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
