import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Upload, 
  X, 
  Store, 
  Package, 
  DollarSign, 
  Image as ImageIcon,
  FileText,
  Loader2,
  AlertTriangle,
  Eye
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseCategories } from "@/hooks/useSupabaseCategories";
import { toast } from "sonner";

interface SupplierPermissions {
  can_edit_price: boolean;
  can_edit_stock: boolean;
  can_edit_photos: boolean;
  can_edit_description: boolean;
}

interface ManagedSupplier {
  id: string;
  supplier_id: string;
  supplier: { 
    nome: string; 
    email: string; 
    foto_perfil_url: string | null;
  } | null;
  permissions: SupplierPermissions | null;
}

interface Product {
  id: string;
  nome: string;
  descricao_curta: string | null;
  preco: number;
  estoque: number;
  imagens: string[] | null;
  categoria_id: string | null;
  ativo: boolean | null;
  supplier_id: string;
}

interface ServiceProviderProductsProps {
  suppliers: ManagedSupplier[];
  onRefresh: () => void;
}

export const ServiceProviderProducts = ({ suppliers, onRefresh }: ServiceProviderProductsProps) => {
  const { categories } = useSupabaseCategories();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<ManagedSupplier | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    nome: '',
    categoria_id: '',
    descricao_curta: '',
    preco: '',
    estoque: '',
  });
  const [imageFiles, setImageFiles] = useState<string[]>([]);

  // Get permissions for current supplier
  const currentPermissions = selectedSupplier?.permissions || {
    can_edit_price: false,
    can_edit_stock: false,
    can_edit_photos: false,
    can_edit_description: false,
  };

  const hasAnyEditPermission = 
    currentPermissions.can_edit_price || 
    currentPermissions.can_edit_stock || 
    currentPermissions.can_edit_photos || 
    currentPermissions.can_edit_description;

  useEffect(() => {
    if (selectedSupplier) {
      fetchProducts(selectedSupplier.supplier_id);
    } else if (suppliers.length > 0) {
      setSelectedSupplier(suppliers[0]);
    }
  }, [selectedSupplier, suppliers]);

  const fetchProducts = async (supplierId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, nome, descricao_curta, preco, estoque, imagens, categoria_id, ativo, supplier_id')
        .eq('supplier_id', supplierId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (product?: Product) => {
    if (!hasAnyEditPermission && !product) {
      toast.error('Você não tem permissão para adicionar produtos');
      return;
    }

    if (product) {
      setEditingProduct(product);
      setFormData({
        nome: product.nome,
        categoria_id: product.categoria_id || '',
        descricao_curta: product.descricao_curta || '',
        preco: product.preco.toString(),
        estoque: product.estoque.toString(),
      });
      setImageFiles(product.imagens || []);
    } else {
      setEditingProduct(null);
      setFormData({ nome: '', categoria_id: '', descricao_curta: '', preco: '', estoque: '' });
      setImageFiles([]);
    }
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentPermissions.can_edit_photos && editingProduct) {
      toast.error('Você não tem permissão para editar fotos');
      return;
    }

    const files = e.target.files;
    if (!files) return;

    if (imageFiles.length + files.length > 5) {
      toast.error("Máximo de 5 imagens");
      return;
    }

    // Upload to Supabase storage
    for (const file of Array.from(files)) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${selectedSupplier?.supplier_id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast.error('Erro ao fazer upload da imagem');
        continue;
      }

      const { data: publicUrl } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      setImageFiles(prev => [...prev, publicUrl.publicUrl]);
    }
  };

  const removeImage = (index: number) => {
    if (!currentPermissions.can_edit_photos && editingProduct) {
      toast.error('Você não tem permissão para editar fotos');
      return;
    }
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!selectedSupplier) return;

    // Validate based on permissions
    if (!formData.nome) {
      toast.error("Nome é obrigatório");
      return;
    }

    if (imageFiles.length === 0) {
      toast.error("Adicione pelo menos uma imagem");
      return;
    }

    setSaving(true);
    try {
      const productData: any = {
        nome: formData.nome,
        supplier_id: selectedSupplier.supplier_id,
        imagens: imageFiles,
      };

      // Only include fields the user has permission to edit
      if (!editingProduct || currentPermissions.can_edit_description) {
        productData.descricao_curta = formData.descricao_curta || null;
        productData.categoria_id = formData.categoria_id || null;
      }

      if (!editingProduct || currentPermissions.can_edit_price) {
        productData.preco = parseFloat(formData.preco) || 0;
      }

      if (!editingProduct || currentPermissions.can_edit_stock) {
        productData.estoque = parseInt(formData.estoque) || 0;
      }

      if (!editingProduct || currentPermissions.can_edit_photos) {
        productData.imagens = imageFiles;
      }

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;
        toast.success("Produto atualizado!");
      } else {
        productData.ativo = true;
        const { error } = await supabase
          .from('products')
          .insert(productData);

        if (error) throw error;
        toast.success("Produto adicionado!");
      }

      setIsModalOpen(false);
      fetchProducts(selectedSupplier.supplier_id);
      onRefresh();
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast.error(error.message || 'Erro ao salvar produto');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
      toast.success("Produto excluído!");
      if (selectedSupplier) {
        fetchProducts(selectedSupplier.supplier_id);
      }
      onRefresh();
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast.error('Erro ao excluir produto');
    }
  };

  if (suppliers.length === 0) {
    return (
      <Card className="p-8 text-center border-border">
        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-2">
          Nenhum fornecedor integrado
        </p>
        <p className="text-sm text-muted-foreground">
          Integre-se a fornecedores para gerenciar seus produtos
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Supplier Selector */}
      <Card className="p-4 border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Label className="text-sm font-medium">Fornecedor:</Label>
            <Select 
              value={selectedSupplier?.supplier_id || ''} 
              onValueChange={(value) => {
                const supplier = suppliers.find(s => s.supplier_id === value);
                setSelectedSupplier(supplier || null);
              }}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Selecione um fornecedor" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((s) => (
                  <SelectItem key={s.supplier_id} value={s.supplier_id}>
                    {s.supplier?.nome || 'Fornecedor'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {hasAnyEditPermission && (
            <Button onClick={() => handleOpenModal()} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Adicionar
            </Button>
          )}
        </div>

        {/* Permissions Display */}
        {selectedSupplier && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-muted-foreground mb-2">Suas permissões:</p>
            <div className="flex flex-wrap gap-1">
              {currentPermissions.can_edit_price && (
                <Badge variant="outline" className="text-xs gap-1">
                  <DollarSign className="h-3 w-3" /> Preço
                </Badge>
              )}
              {currentPermissions.can_edit_stock && (
                <Badge variant="outline" className="text-xs gap-1">
                  <Package className="h-3 w-3" /> Estoque
                </Badge>
              )}
              {currentPermissions.can_edit_photos && (
                <Badge variant="outline" className="text-xs gap-1">
                  <ImageIcon className="h-3 w-3" /> Fotos
                </Badge>
              )}
              {currentPermissions.can_edit_description && (
                <Badge variant="outline" className="text-xs gap-1">
                  <FileText className="h-3 w-3" /> Descrição
                </Badge>
              )}
              {!hasAnyEditPermission && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <Eye className="h-3 w-3" /> Apenas visualização
                </Badge>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Products List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : products.length === 0 ? (
        <Card className="p-8 text-center border-border">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-2">
            Nenhum produto encontrado
          </p>
          {hasAnyEditPermission && (
            <Button onClick={() => handleOpenModal()} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Adicionar primeiro produto
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {products.map((product) => {
            const categoryName = categories.find(c => c.id === product.categoria_id)?.nome || 'Sem categoria';
            const isLowStock = product.estoque < 5;
            
            return (
              <Card key={product.id} className="overflow-hidden border-border">
                <div className="relative">
                  <img
                    src={product.imagens?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e'}
                    alt={product.nome}
                    className="w-full h-32 object-cover"
                  />
                  {!product.ativo && (
                    <Badge variant="secondary" className="absolute top-2 left-2">
                      Inativo
                    </Badge>
                  )}
                  {isLowStock && (
                    <Badge variant="destructive" className="absolute top-2 right-2 gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Estoque baixo
                    </Badge>
                  )}
                </div>
                <div className="p-3 space-y-2">
                  <h3 className="font-medium text-sm line-clamp-1">{product.nome}</h3>
                  <p className="text-xs text-muted-foreground">{categoryName}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-primary">
                      R$ {product.preco.toFixed(2)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Estoque: {product.estoque}
                    </span>
                  </div>
                  <div className="flex gap-2 pt-2">
                    {hasAnyEditPermission ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleOpenModal(product)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleOpenModal(product)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Visualizar
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit/Add Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Editar Produto' : 'Adicionar Produto'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Nome - sempre editável para novos, descrição para edição */}
            <div>
              <Label>Nome do Produto *</Label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Nome do produto"
                disabled={editingProduct && !currentPermissions.can_edit_description}
              />
              {editingProduct && !currentPermissions.can_edit_description && (
                <p className="text-xs text-muted-foreground mt-1">Sem permissão para editar</p>
              )}
            </div>

            {/* Categoria */}
            <div>
              <Label>Categoria</Label>
              <Select
                value={formData.categoria_id}
                onValueChange={(value) => setFormData({ ...formData, categoria_id: value })}
                disabled={editingProduct && !currentPermissions.can_edit_description}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Descrição */}
            <div>
              <Label>Descrição</Label>
              <Textarea
                value={formData.descricao_curta}
                onChange={(e) => setFormData({ ...formData, descricao_curta: e.target.value })}
                placeholder="Descrição do produto"
                rows={3}
                disabled={editingProduct && !currentPermissions.can_edit_description}
              />
              {editingProduct && !currentPermissions.can_edit_description && (
                <p className="text-xs text-muted-foreground mt-1">Sem permissão para editar</p>
              )}
            </div>

            {/* Preço e Estoque */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Preço (R$) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.preco}
                  onChange={(e) => setFormData({ ...formData, preco: e.target.value })}
                  placeholder="0.00"
                  disabled={editingProduct && !currentPermissions.can_edit_price}
                />
                {editingProduct && !currentPermissions.can_edit_price && (
                  <p className="text-xs text-muted-foreground mt-1">Sem permissão</p>
                )}
              </div>
              <div>
                <Label>Estoque</Label>
                <Input
                  type="number"
                  value={formData.estoque}
                  onChange={(e) => setFormData({ ...formData, estoque: e.target.value })}
                  placeholder="0"
                  disabled={editingProduct && !currentPermissions.can_edit_stock}
                />
                {editingProduct && !currentPermissions.can_edit_stock && (
                  <p className="text-xs text-muted-foreground mt-1">Sem permissão</p>
                )}
              </div>
            </div>

            {/* Imagens */}
            <div>
              <Label>Imagens (máximo 5)</Label>
              <div className="space-y-3">
                {(!editingProduct || currentPermissions.can_edit_photos) && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      disabled={imageFiles.length >= 5}
                      className="cursor-pointer"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={imageFiles.length >= 5}
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  {imageFiles.length}/5 imagens
                  {editingProduct && !currentPermissions.can_edit_photos && ' (Sem permissão para editar)'}
                </p>
                {imageFiles.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {imageFiles.map((img, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={img}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-20 object-cover rounded-md"
                        />
                        {(!editingProduct || currentPermissions.can_edit_photos) && (
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              {hasAnyEditPermission && (
                <Button onClick={handleSubmit} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingProduct ? 'Salvar' : 'Adicionar'}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
