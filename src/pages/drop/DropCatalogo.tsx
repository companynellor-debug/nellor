import { useState } from "react";
import { 
  ShoppingBag, 
  Search, 
  Plus,
  Package,
  Star,
  TrendingUp,
  Store,
  Check
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from "@/components/ui/dialog";
import { useClientDrop } from "@/hooks/useClientDrop";
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
  const [customPrice, setCustomPrice] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Filter available products (not already added)
  const availableProducts = (dropCatalog || []).filter((catalogItem: any) => 
    !myDropProducts?.some((myP: any) => myP.product_id === catalogItem.product_id)
  );

  const filteredProducts = availableProducts.filter((p: any) => 
    !search || p.product_name?.toLowerCase().includes(search.toLowerCase())
  );

  // Products already in my catalog
  const alreadyAdded = (productId: string) => 
    myDropProducts?.some((myP: any) => myP.product_id === productId);

  const handleSelectProduct = (product: any) => {
    setSelectedProduct(product);
    setCustomPrice(String((product.base_price * 1.3).toFixed(2))); // Default 30% margin
    setShowAddDialog(true);
  };

  const handleAddProduct = async () => {
    if (!selectedProduct || !customPrice) {
      toast.error('Preencha o preço de venda');
      return;
    }
    
    try {
      await addProductToDrop.mutateAsync({
        productId: selectedProduct.product_id,
        customPrice: parseFloat(customPrice),
        marginType: 'fixed',
        marginValue: parseFloat(customPrice) - selectedProduct.base_price
      });
      setShowAddDialog(false);
      setSelectedProduct(null);
      setCustomPrice("");
      toast.success('Produto adicionado ao seu catálogo!');
    } catch (error) {
      // Error handled by hook
    }
  };

  const margin = selectedProduct ? parseFloat(customPrice || "0") - selectedProduct.base_price : 0;
  const marginPercent = selectedProduct?.base_price > 0 
    ? ((margin / selectedProduct.base_price) * 100).toFixed(1) 
    : 0;

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-drop-text">Catálogo Drop</h1>
          <p className="text-drop-text-muted mt-1">
            Explore produtos disponíveis para revenda • {filteredProducts.length} produtos
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-drop-text-muted" />
        <Input
          placeholder="Buscar produtos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-drop-surface border-drop-border text-drop-text placeholder:text-drop-text-muted focus:border-drop-accent"
        />
      </div>

      {/* Products Grid - Visual de Marketplace */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="bg-drop-card border border-drop-border rounded-2xl overflow-hidden animate-pulse">
              <div className="aspect-square bg-drop-surface" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-drop-surface rounded w-3/4" />
                <div className="h-3 bg-drop-surface rounded w-1/2" />
                <div className="h-6 bg-drop-surface rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-drop-card border border-drop-border rounded-2xl p-12 text-center">
          <ShoppingBag className="h-16 w-16 text-drop-text-muted mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-drop-text mb-2">
            {search ? "Nenhum produto encontrado" : "Nenhum produto disponível"}
          </h3>
          <p className="text-drop-text-muted max-w-md mx-auto">
            {search 
              ? "Tente buscar com outros termos"
              : "Aguarde novos fornecedores disponibilizarem produtos para o Drop"
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredProducts.map((product: any) => {
            const suggestedPrice = product.base_price * 1.3;
            const suggestedMargin = suggestedPrice - product.base_price;
            
            return (
              <div 
                key={product.product_id}
                className="bg-drop-card border border-drop-border rounded-2xl overflow-hidden group hover:border-drop-accent/50 transition-all duration-300 cursor-pointer"
                onClick={() => handleSelectProduct(product)}
              >
                {/* Image */}
                <div className="relative aspect-square bg-drop-surface">
                  {product.product_images?.[0] ? (
                    <img 
                      src={product.product_images[0]} 
                      alt={product.product_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-12 w-12 text-drop-text-muted" />
                    </div>
                  )}
                  
                  {/* Commission Badge */}
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-drop-success text-white text-xs font-medium">
                      {product.commission_percent}% margem
                    </Badge>
                  </div>

                  {/* Stock Badge */}
                  {product.stock < 10 && product.stock > 0 && (
                    <div className="absolute top-2 left-2">
                      <Badge variant="outline" className="bg-drop-warning/20 text-drop-warning border-drop-warning/30 text-xs">
                        Últimas unidades
                      </Badge>
                    </div>
                  )}

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                    <Button 
                      size="sm"
                      className="bg-drop-accent hover:bg-drop-accent/90 text-white"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Adicionar
                    </Button>
                  </div>
                </div>

                {/* Info */}
                <div className="p-3">
                  {/* Supplier */}
                  <div className="flex items-center gap-1 text-xs text-drop-text-muted mb-1">
                    <Store className="h-3 w-3" />
                    <span className="truncate">{product.supplier_name}</span>
                  </div>

                  {/* Name */}
                  <h3 className="text-drop-text font-medium text-sm line-clamp-2 min-h-[2.5rem] mb-2">
                    {product.product_name}
                  </h3>
                  
                  {/* Prices */}
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold text-drop-text">
                        R$ {product.base_price?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1 text-xs text-drop-success">
                      <TrendingUp className="h-3 w-3" />
                      <span>Ganhe até R$ {suggestedMargin.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  {/* Stock */}
                  <div className="mt-2 flex items-center gap-1 text-xs text-drop-text-muted">
                    <Package className="h-3 w-3" />
                    <span>{product.stock} disponíveis</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Product Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-drop-bg border-drop-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-drop-text">Adicionar ao Seu Catálogo</DialogTitle>
            <DialogDescription className="text-drop-text-muted">
              Defina seu preço de venda para este produto
            </DialogDescription>
          </DialogHeader>
          
          {selectedProduct && (
            <div className="space-y-6">
              {/* Product Preview */}
              <div className="flex gap-4 p-4 bg-drop-surface rounded-xl">
                <div className="h-20 w-20 rounded-lg bg-drop-card overflow-hidden flex-shrink-0">
                  {selectedProduct.product_images?.[0] ? (
                    <img 
                      src={selectedProduct.product_images[0]} 
                      alt="" 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <Package className="h-6 w-6 text-drop-text-muted" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-drop-text font-medium truncate">{selectedProduct.product_name}</h4>
                  <p className="text-drop-text-muted text-sm">{selectedProduct.supplier_name}</p>
                  <div className="mt-2 text-sm">
                    <span className="text-drop-text-muted">Custo: </span>
                    <span className="text-drop-text font-medium">
                      R$ {selectedProduct.base_price?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Price Input */}
              <div>
                <label className="text-drop-text text-sm font-medium block mb-2">
                  Seu Preço de Venda
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-drop-text-muted font-medium">R$</span>
                  <Input
                    type="number"
                    step="0.01"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    className="pl-10 text-lg font-semibold bg-drop-surface border-drop-border text-drop-text h-12"
                  />
                </div>
              </div>

              {/* Margin Display */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-drop-surface rounded-xl text-center">
                  <p className="text-drop-text-muted text-sm mb-1">Sua Margem</p>
                  <p className={cn(
                    "text-2xl font-bold",
                    margin > 0 ? "text-drop-success" : "text-destructive"
                  )}>
                    R$ {margin.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-4 bg-drop-surface rounded-xl text-center">
                  <p className="text-drop-text-muted text-sm mb-1">Percentual</p>
                  <p className={cn(
                    "text-2xl font-bold",
                    margin > 0 ? "text-drop-success" : "text-destructive"
                  )}>
                    {marginPercent}%
                  </p>
                </div>
              </div>

              {margin <= 0 && (
                <p className="text-destructive text-sm text-center">
                  Defina um preço maior que o custo para ter lucro
                </p>
              )}
              
              <Button 
                onClick={handleAddProduct}
                disabled={addProductToDrop.isPending || margin <= 0}
                className="w-full bg-drop-accent hover:bg-drop-accent/90 text-white h-12 text-base"
              >
                {addProductToDrop.isPending ? (
                  "Adicionando..."
                ) : (
                  <>
                    <Check className="h-5 w-5 mr-2" />
                    Adicionar ao Meu Catálogo
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DropCatalogo;
