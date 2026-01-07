import { useState } from "react";
import { 
  ShoppingBag, 
  Search, 
  Plus,
  Package,
  TrendingUp,
  Store,
  Filter,
  SlidersHorizontal
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useClientDrop } from "@/hooks/useClientDrop";
import { ProductDetailModal } from "@/components/drop/ProductDetailModal";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const DropCatalogo = () => {
  const { 
    myDropProducts, 
    dropCatalog, 
    addProductToDrop,
    isLoading 
  } = useClientDrop();
  
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Filter available products (not already added)
  const availableProducts = (dropCatalog || []).filter((catalogItem: any) => 
    !myDropProducts?.some((myP: any) => myP.product_id === catalogItem.product_id)
  );

  const filteredProducts = availableProducts.filter((p: any) => 
    !search || p.product_name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectProduct = (product: any) => {
    setSelectedProduct(product);
    setShowDetailModal(true);
  };

  const handleAddProduct = async (customPrice: number) => {
    if (!selectedProduct) return;
    
    try {
      await addProductToDrop.mutateAsync({
        productId: selectedProduct.product_id,
        customPrice: customPrice,
        marginType: 'fixed',
        marginValue: customPrice - selectedProduct.base_price
      });
      setShowDetailModal(false);
      setSelectedProduct(null);
      toast.success('Produto adicionado ao seu catálogo!');
    } catch (error) {
      // Error handled by hook
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Catálogo Drop</h1>
          <p className="text-muted-foreground mt-1">
            Explore produtos disponíveis para revenda • {filteredProducts.length} produtos
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar produtos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <Card key={i} className="bg-card border-border overflow-hidden animate-pulse">
              <div className="aspect-square bg-muted" />
              <CardContent className="p-4 space-y-3">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
                <div className="h-6 bg-muted rounded w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {search ? "Nenhum produto encontrado" : "Nenhum produto disponível"}
            </h3>
            <p className="text-muted-foreground max-w-md text-center">
              {search 
                ? "Tente buscar com outros termos"
                : "Aguarde novos fornecedores disponibilizarem produtos para o Drop"
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredProducts.map((product: any) => {
            const suggestedPrice = product.min_resale_price || product.base_price * 1.3;
            const suggestedMargin = suggestedPrice - product.base_price;
            
            return (
              <Card 
                key={product.product_id}
                className="bg-card border-border overflow-hidden group hover:border-primary/50 hover:shadow-lg transition-all duration-300 cursor-pointer"
                onClick={() => handleSelectProduct(product)}
              >
                {/* Image */}
                <div className="relative aspect-square bg-muted">
                  {product.product_images?.[0] ? (
                    <img 
                      src={product.product_images[0]} 
                      alt={product.product_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  
                  {/* Commission Badge */}
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-green-500 text-white text-xs font-medium">
                      até {product.max_commission_percent || product.commission_percent}% margem
                    </Badge>
                  </div>

                  {/* Stock Badge */}
                  {product.stock < 10 && product.stock > 0 && (
                    <div className="absolute top-2 left-2">
                      <Badge variant="outline" className="bg-amber-500/20 text-amber-600 border-amber-500/30 text-xs">
                        Últimas unidades
                      </Badge>
                    </div>
                  )}

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                    <Button size="sm" className="shadow-lg">
                      <Plus className="h-4 w-4 mr-1" />
                      Ver Detalhes
                    </Button>
                  </div>
                </div>

                {/* Info */}
                <CardContent className="p-3">
                  {/* Supplier */}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                    <Store className="h-3 w-3" />
                    <span className="truncate">{product.supplier_name}</span>
                  </div>

                  {/* Name */}
                  <h3 className="text-foreground font-medium text-sm line-clamp-2 min-h-[2.5rem] mb-2">
                    {product.product_name}
                  </h3>
                  
                  {/* Prices */}
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold text-foreground">
                        R$ {product.base_price?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1 text-xs text-green-600">
                      <TrendingUp className="h-3 w-3" />
                      <span>Ganhe até R$ {suggestedMargin.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  {/* Stock */}
                  <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                    <Package className="h-3 w-3" />
                    <span>{product.stock} disponíveis</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        open={showDetailModal}
        onOpenChange={setShowDetailModal}
        onAddProduct={handleAddProduct}
        isAdding={addProductToDrop.isPending}
      />
    </div>
  );
};

export default DropCatalogo;
