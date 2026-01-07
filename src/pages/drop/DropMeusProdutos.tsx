import { useState } from "react";
import { useClientDrop } from "@/hooks/useClientDrop";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  Package, 
  Search, 
  Edit3, 
  Trash2, 
  TrendingUp,
  Store,
  DollarSign,
  Loader2,
  ExternalLink,
  ShoppingBag
} from "lucide-react";
import { toast } from "sonner";

const marketplaces = [
  { id: "shopee", name: "Shopee", color: "bg-orange-500" },
  { id: "mercadolivre", name: "Mercado Livre", color: "bg-yellow-500" },
  { id: "amazon", name: "Amazon", color: "bg-blue-500" },
  { id: "magalu", name: "Magazine Luiza", color: "bg-blue-600" },
];

export default function DropMeusProdutos() {
  const { myDropProducts, dropCatalog, updateMyDropProduct, removeFromDrop, isLoading } = useClientDrop();
  const [searchTerm, setSearchTerm] = useState("");
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editPrice, setEditPrice] = useState("");
  const [publishProduct, setPublishProduct] = useState<any>(null);
  const [selectedMarketplace, setSelectedMarketplace] = useState("");

  // Enrich my products with catalog data
  const enrichedProducts = myDropProducts?.map(myProduct => {
    const catalogProduct = dropCatalog?.find(p => p.product_id === myProduct.product_id);
    return {
      ...myProduct,
      ...catalogProduct,
      my_price: myProduct.custom_price,
      margin: catalogProduct ? myProduct.custom_price - catalogProduct.base_price : 0
    };
  }) || [];

  const filteredProducts = enrichedProducts.filter(product =>
    product.product_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setEditPrice(product.my_price?.toString() || "");
  };

  const handleSaveEdit = async () => {
    if (!editingProduct || !editPrice) return;
    
    const newPrice = parseFloat(editPrice);
    if (newPrice <= editingProduct.base_price) {
      toast.error("Preço deve ser maior que o preço base");
      return;
    }

    try {
      await updateMyDropProduct.mutateAsync({
        id: editingProduct.id,
        customPrice: newPrice,
        marginValue: newPrice - editingProduct.base_price
      });
      toast.success("Produto atualizado!");
      setEditingProduct(null);
    } catch (error) {
      toast.error("Erro ao atualizar produto");
    }
  };

  const handleRemoveProduct = async (productId: string) => {
    try {
      await removeFromDrop.mutateAsync(productId);
      toast.success("Produto removido do seu catálogo");
    } catch (error) {
      toast.error("Erro ao remover produto");
    }
  };

  const handlePublish = (product: any) => {
    setPublishProduct(product);
    setSelectedMarketplace("");
  };

  const handleConfirmPublish = () => {
    if (!selectedMarketplace) {
      toast.error("Selecione um marketplace");
      return;
    }
    
    const marketplace = marketplaces.find(m => m.id === selectedMarketplace);
    toast.success(`Produto enviado para ${marketplace?.name}! (Integração em desenvolvimento)`);
    setPublishProduct(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Meus Produtos</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie seus produtos e publique em marketplaces
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Package className="h-4 w-4 text-primary" />
          <span className="text-foreground font-medium">{enrichedProducts.length}</span>
          <span className="text-muted-foreground">produtos no catálogo</span>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar produtos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-background border-border"
        />
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Nenhum produto adicionado</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Vá até o Catálogo para adicionar produtos dos fornecedores ao seu catálogo de revenda.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="bg-card border-border overflow-hidden group">
              {/* Product Image */}
              <div className="relative aspect-square bg-muted">
                {product.product_images?.[0] ? (
                  <img
                    src={product.product_images[0]}
                    alt={product.product_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
                
                {/* Status Badge */}
                <div className="absolute top-3 left-3">
                  <Badge className={product.is_active ? "bg-green-500/20 text-green-600" : "bg-red-500/20 text-red-600"}>
                    {product.is_active ? "Ativo" : "Pausado"}
                  </Badge>
                </div>

                {/* Quick Actions */}
                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 bg-card/80 hover:bg-card text-foreground"
                    onClick={() => handleEditProduct(product)}
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 bg-red-500/20 hover:bg-red-500/40 text-red-600"
                    onClick={() => handleRemoveProduct(product.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <CardContent className="p-4 space-y-4">
                {/* Product Info */}
                <div>
                  <h3 className="font-semibold text-foreground line-clamp-2 mb-1">
                    {product.product_name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {product.supplier_name}
                  </p>
                </div>

                {/* Pricing */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-muted/50 rounded-lg p-2">
                    <p className="text-xs text-muted-foreground">Custo</p>
                    <p className="text-sm font-semibold text-foreground">
                      R$ {product.base_price?.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2">
                    <p className="text-xs text-muted-foreground">Venda</p>
                    <p className="text-sm font-semibold text-primary">
                      R$ {product.my_price?.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-green-500/10 rounded-lg p-2">
                    <p className="text-xs text-muted-foreground">Lucro</p>
                    <p className="text-sm font-semibold text-green-600">
                      R$ {product.margin?.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Stock */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Estoque disponível:</span>
                  <span className="text-foreground font-medium">{product.stock || 0} unidades</span>
                </div>

                {/* Publish Button */}
                <Button
                  className="w-full"
                  onClick={() => handlePublish(product)}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Publicar em Marketplace
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Price Dialog */}
      <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Editar Produto</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4">
              {editingProduct?.product_images?.[0] && (
                <img
                  src={editingProduct.product_images[0]}
                  alt=""
                  className="w-16 h-16 rounded-lg object-cover"
                />
              )}
              <div>
                <h4 className="font-medium text-foreground">{editingProduct?.product_name}</h4>
                <p className="text-sm text-muted-foreground">Custo: R$ {editingProduct?.base_price?.toFixed(2)}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Preço de Venda</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  step="0.01"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="pl-10 bg-background border-border"
                  placeholder="0.00"
                />
              </div>
              {editPrice && editingProduct && (
                <p className="text-sm text-green-600">
                  Lucro: R$ {(parseFloat(editPrice) - editingProduct.base_price).toFixed(2)}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-foreground">Produto Ativo</Label>
              <Switch
                checked={editingProduct?.is_active}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingProduct(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Publish to Marketplace Dialog */}
      <Dialog open={!!publishProduct} onOpenChange={() => setPublishProduct(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Publicar em Marketplace</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4">
              {publishProduct?.product_images?.[0] && (
                <img
                  src={publishProduct.product_images[0]}
                  alt=""
                  className="w-16 h-16 rounded-lg object-cover"
                />
              )}
              <div>
                <h4 className="font-medium text-foreground">{publishProduct?.product_name}</h4>
                <p className="text-sm text-muted-foreground">Preço: R$ {publishProduct?.my_price?.toFixed(2)}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Selecione o Marketplace</Label>
              <Select value={selectedMarketplace} onValueChange={setSelectedMarketplace}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="Escolha um marketplace" />
                </SelectTrigger>
                <SelectContent>
                  {marketplaces.map((mp) => (
                    <SelectItem key={mp.id} value={mp.id}>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${mp.color}`} />
                        {mp.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="text-sm text-muted-foreground">Ao publicar:</p>
              <ul className="text-sm text-foreground space-y-1">
                <li>• O anúncio será criado automaticamente</li>
                <li>• O estoque será sincronizado</li>
                <li>• Pedidos serão importados automaticamente</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPublishProduct(null)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmPublish}>
              <Store className="h-4 w-4 mr-2" />
              Publicar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
