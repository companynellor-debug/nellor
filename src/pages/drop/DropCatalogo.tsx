import { useState } from "react";
import { 
  ShoppingBag, 
  Search, 
  Plus,
  Edit,
  Trash2,
  Eye,
  ToggleLeft,
  ToggleRight,
  Star,
  Package,
  DollarSign,
  TrendingUp
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
    updateMyDropProduct, 
    removeFromDrop, 
    addProductToDrop,
    isLoading 
  } = useClientDrop();
  
  const [search, setSearch] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [customPrice, setCustomPrice] = useState("");
  const [marginValue, setMarginValue] = useState("");

  const filteredProducts = (myDropProducts || []).filter((p: any) => 
    !search || p.product?.nome?.toLowerCase().includes(search.toLowerCase())
  );

  const availableToAdd = (dropCatalog || []).filter((catalogItem: any) => 
    !myDropProducts?.some((myP: any) => myP.product_id === catalogItem.product_id)
  );

  const handleToggleActive = async (product: any) => {
    try {
      await updateMyDropProduct.mutateAsync({
        id: product.id,
        isActive: !product.is_active
      });
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleRemove = async (product: any) => {
    if (confirm('Remover este produto do seu catálogo?')) {
      try {
        await removeFromDrop.mutateAsync(product.id);
      } catch (error) {
        // Error handled by hook
      }
    }
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
    } catch (error) {
      // Error handled by hook
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-drop-text">Catálogo</h1>
          <p className="text-drop-text-muted mt-1">Gerencie seus produtos para revenda</p>
        </div>
        <Button 
          onClick={() => setShowAddDialog(true)}
          className="bg-drop-accent hover:bg-drop-accent/90 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Produto
        </Button>
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

      {/* Products Grid - Visual como marketplace */}
      {filteredProducts.length === 0 ? (
        <div className="bg-drop-card border border-drop-border rounded-2xl p-12 text-center">
          <ShoppingBag className="h-16 w-16 text-drop-text-muted mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-drop-text mb-2">Seu catálogo está vazio</h3>
          <p className="text-drop-text-muted max-w-md mx-auto mb-6">
            Adicione produtos do catálogo Nellor Drop para começar a revender
          </p>
          <Button 
            onClick={() => setShowAddDialog(true)}
            className="bg-drop-accent hover:bg-drop-accent/90 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Explorar Catálogo
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
          {filteredProducts.map((product: any) => {
            const basePrice = product.product?.preco || 0;
            const margin = product.custom_price - basePrice;
            const marginPercent = basePrice > 0 ? ((margin / basePrice) * 100).toFixed(1) : 0;
            
            return (
              <div 
                key={product.id}
                className={cn(
                  "bg-drop-card border rounded-2xl overflow-hidden group transition-all duration-300",
                  product.is_active 
                    ? "border-drop-border hover:border-drop-accent/50" 
                    : "border-drop-border/50 opacity-60"
                )}
              >
                {/* Image */}
                <div className="relative aspect-square bg-drop-surface">
                  {product.product?.imagens?.[0] ? (
                    <img 
                      src={product.product.imagens[0]} 
                      alt={product.product.nome}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-12 w-12 text-drop-text-muted" />
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  <div className="absolute top-3 left-3">
                    <Badge 
                      className={cn(
                        "text-xs",
                        product.is_active 
                          ? "bg-drop-success/90 text-white" 
                          : "bg-drop-surface/90 text-drop-text-muted"
                      )}
                    >
                      {product.is_active ? "Ativo" : "Pausado"}
                    </Badge>
                  </div>

                  {/* Margin Badge */}
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-drop-accent/90 text-white text-xs">
                      +{marginPercent}%
                    </Badge>
                  </div>

                  {/* Quick Actions */}
                  <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center justify-center gap-2">
                      <Button 
                        size="sm" 
                        variant="secondary"
                        onClick={() => handleToggleActive(product)}
                        className="bg-white/20 hover:bg-white/30 text-white border-0"
                      >
                        {product.is_active ? (
                          <><ToggleRight className="h-4 w-4 mr-1" /> Pausar</>
                        ) : (
                          <><ToggleLeft className="h-4 w-4 mr-1" /> Ativar</>
                        )}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="secondary"
                        onClick={() => handleRemove(product)}
                        className="bg-white/20 hover:bg-destructive/80 text-white border-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="text-drop-text font-semibold truncate mb-2">
                    {product.product?.nome}
                  </h3>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-drop-text-muted">Custo</span>
                      <span className="text-drop-text-muted">
                        R$ {basePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-drop-text-muted">Seu Preço</span>
                      <span className="text-drop-text font-bold">
                        R$ {product.custom_price?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm pt-2 border-t border-drop-border">
                      <span className="text-drop-success flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        Margem
                      </span>
                      <span className="text-drop-success font-bold">
                        R$ {margin.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* Stock */}
                  <div className="mt-3 flex items-center gap-2 text-xs text-drop-text-muted">
                    <Package className="h-3 w-3" />
                    <span>{product.product?.estoque || 0} em estoque</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Product Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-drop-bg border-drop-border max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-drop-text">Adicionar Produto ao Catálogo</DialogTitle>
            <DialogDescription className="text-drop-text-muted">
              Escolha produtos disponíveis e defina seu preço de venda
            </DialogDescription>
          </DialogHeader>
          
          <div className="overflow-y-auto max-h-[60vh] pr-2">
            {availableToAdd.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingBag className="h-12 w-12 text-drop-text-muted mx-auto mb-4" />
                <p className="text-drop-text-muted">
                  Você já adicionou todos os produtos disponíveis
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {availableToAdd.map((item: any) => (
                  <div 
                    key={item.product_id}
                    onClick={() => {
                      setSelectedProduct(item);
                      setCustomPrice(String(item.base_price * 1.3)); // Default 30% margin
                    }}
                    className={cn(
                      "p-4 rounded-xl border cursor-pointer transition-all",
                      selectedProduct?.product_id === item.product_id
                        ? "border-drop-accent bg-drop-accent/10"
                        : "border-drop-border hover:border-drop-accent/50 bg-drop-surface"
                    )}
                  >
                    <div className="flex gap-4">
                      <div className="h-20 w-20 rounded-lg bg-drop-card overflow-hidden flex-shrink-0">
                        {item.product_images?.[0] ? (
                          <img 
                            src={item.product_images[0]} 
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
                        <h4 className="text-drop-text font-medium truncate">{item.product_name}</h4>
                        <p className="text-drop-text-muted text-sm">{item.supplier_name}</p>
                        <div className="mt-2 flex items-center gap-3 text-sm">
                          <span className="text-drop-text">
                            R$ {item.base_price?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                          <Badge variant="outline" className="text-drop-success border-drop-success/30 text-xs">
                            {item.commission_percent}% comissão
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Selected Product Config */}
          {selectedProduct && (
            <div className="mt-4 pt-4 border-t border-drop-border space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-drop-text text-sm font-medium">Seu Preço de Venda</label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-drop-text-muted">R$</span>
                    <Input
                      type="number"
                      step="0.01"
                      value={customPrice}
                      onChange={(e) => setCustomPrice(e.target.value)}
                      className="pl-10 bg-drop-surface border-drop-border text-drop-text"
                    />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-drop-text-muted text-sm">Sua Margem</p>
                  <p className="text-drop-success text-xl font-bold">
                    R$ {(parseFloat(customPrice || "0") - selectedProduct.base_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
              
              <Button 
                onClick={handleAddProduct}
                disabled={addProductToDrop.isPending}
                className="w-full bg-drop-accent hover:bg-drop-accent/90 text-white"
              >
                {addProductToDrop.isPending ? "Adicionando..." : "Adicionar ao Meu Catálogo"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DropCatalogo;
