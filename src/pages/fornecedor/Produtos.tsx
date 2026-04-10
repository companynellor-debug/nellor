import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, FileEdit, Monitor } from "lucide-react";
import { useSupplierProducts, SupplierProduct } from "@/hooks/useSupplierProducts";
import { useSupabaseCategories } from "@/hooks/useSupabaseCategories";
import { useSupplierCategories } from "@/hooks/useSupplierCategories";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useProductVariations } from "@/hooks/useProductVariations";
import { useProductPriceTiers, PriceTier } from "@/hooks/useProductPriceTiers";
import { useProductDrafts } from "@/hooks/useProductDrafts";
import { toast } from "sonner";
import { formatCurrencyFromDecimal } from "@/utils/currency";
import ProductModal from "@/components/fornecedor/product-modal/ProductModal";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

const SALE_UNIT_LABELS: Record<string, string> = {
  unit: 'Unidade', pair: 'Par', kit: 'Kit', closed_box: 'Caixa Fechada', bale: 'Fardo',
};

const Produtos = () => {
  const { user } = useSupabaseAuth();
  const { products, addProduct, updateProduct, deleteProduct } = useSupplierProducts();
  const { categories } = useSupabaseCategories();
  const { categories: customCategories } = useSupplierCategories(user?.id);
  const { saveVariations } = useProductVariations();
  const { saveTiers } = useProductPriceTiers();
  const { draft, refetch: refetchDraft } = useProductDrafts();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<SupplierProduct | null>(null);

  const handleOpenModal = (product?: SupplierProduct) => {
    setEditingProduct(product || null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (
    productData: Omit<SupplierProduct, 'id'>,
    tiersToSave: Omit<PriceTier, 'id' | 'product_id'>[],
    variationRows: any[],
    isEdit: boolean,
    productId?: string
  ) => {
    try {
      if (isEdit && productId) {
        await updateProduct(productId, productData);
        await saveTiers(productId, tiersToSave);
        if (variationRows.length > 0) {
          await saveVariations(productId, variationRows);
        } else {
          await saveVariations(productId, []);
        }
        toast.success("Produto atualizado!");
      } else {
        const newProduct = await addProduct(productData);
        if (newProduct?.id) {
          await saveTiers(newProduct.id, tiersToSave);
          if (variationRows.length > 0) {
            await saveVariations(newProduct.id, variationRows);
          }
        }
        toast.success("Produto adicionado!");
      }
      refetchDraft();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar produto");
      throw err;
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este produto?")) {
      deleteProduct(id);
      toast.success("Produto excluído!");
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold">Produtos</h1>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="h-4 w-4 mr-2" />Adicionar Produto
        </Button>
      </div>

      {/* Draft resume card */}
      {draft && (
        <Card className="p-4 border-primary/30 bg-primary/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileEdit className="h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold text-sm">Rascunho salvo</p>
                <p className="text-xs text-muted-foreground">
                  {(draft.draft_data as any)?.name ? `"${(draft.draft_data as any).name}"` : 'Produto sem nome'} — Etapa {draft.current_step + 1}
                </p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => handleOpenModal()}>
              Continuar cadastro
            </Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {products.map((product) => {
          const categoryName = categories.find(c => c.id === product.category)?.nome || 'Sem categoria';
          return (
            <Card key={product.id} className="overflow-hidden">
              <img src={product.images[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e'} alt={product.name} className="w-full h-48 object-cover" />
              <div className="p-4 space-y-2">
                <h3 className="font-semibold text-lg">{product.name}</h3>
                <p className="text-sm text-muted-foreground">{categoryName}</p>
                <div className="flex flex-wrap gap-1">
                  {product.brand && <Badge variant="outline" className="text-xs">{product.brand}</Badge>}
                  <Badge variant="outline" className="text-xs">{SALE_UNIT_LABELS[product.saleUnit || 'unit']}</Badge>
                  {product.minOrderQuantity && product.minOrderQuantity > 1 && (
                    <Badge variant="outline" className="text-xs">Mín: {product.minOrderQuantity}</Badge>
                  )}
                  {product.isKit && <Badge variant="outline" className="text-xs">📦 Kit</Badge>}
                </div>
                <div className="flex justify-between items-center pt-2">
                  <p className="text-lg font-bold text-primary">{formatCurrencyFromDecimal(product.price)}</p>
                  <p className="text-sm text-muted-foreground">Estoque: {product.stock}</p>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => handleOpenModal(product)}>
                    <Edit className="h-4 w-4 mr-1" />Editar
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(product.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <ProductModal
        open={isModalOpen}
        onOpenChange={(open) => { setIsModalOpen(open); if (!open) refetchDraft(); }}
        editingProduct={editingProduct}
        categories={categories}
        customCategories={customCategories}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default Produtos;
