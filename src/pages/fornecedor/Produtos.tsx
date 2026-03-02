import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Upload, X } from "lucide-react";
import { useSupplierProducts, SupplierProduct } from "@/hooks/useSupplierProducts";
import { useSupabaseCategories } from "@/hooks/useSupabaseCategories";
import { useSupplierCategories } from "@/hooks/useSupplierCategories";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { toast } from "sonner";
import { formatCurrencyFromDecimal, CurrencyInput, centsToDecimal, decimalToCents } from "@/utils/currency";

const PRESET_CLOTHING_SIZES = ["PP", "P", "M", "G", "GG", "XG"];
const PRESET_SHOE_SIZES = ["34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45"];

const Produtos = () => {
  const { user } = useSupabaseAuth();
  const { products, addProduct, updateProduct, deleteProduct } = useSupplierProducts();
  const { categories } = useSupabaseCategories();
  const { categories: customCategories } = useSupplierCategories(user?.id);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<SupplierProduct | null>(null);
  const [formData, setFormData] = useState({
    name: '', category: '', description: '', priceCents: 0, stock: '', minQuantity: '', minValueCents: 0,
  });
  const [imageFiles, setImageFiles] = useState<string[]>([]);

  // Specs state
  const [hasSizes, setHasSizes] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [customSizeInput, setCustomSizeInput] = useState('');
  const [hasColors, setHasColors] = useState(false);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [colorInput, setColorInput] = useState('');
  const [isKit, setIsKit] = useState(false);
  const [kitItems, setKitItems] = useState<{ name: string; quantity: number }[]>([]);
  const [kitNameInput, setKitNameInput] = useState('');
  const [kitQtyInput, setKitQtyInput] = useState('1');

  const handleOpenModal = (product?: SupplierProduct) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name, category: product.category, description: product.description,
        priceCents: decimalToCents(product.price), stock: product.stock.toString(),
        minQuantity: product.minQuantity?.toString() || '', minValueCents: product.minValue ? decimalToCents(product.minValue) : 0,
      });
      setImageFiles(product.images);
      setHasSizes(!!(product.sizes && product.sizes.length > 0));
      setSelectedSizes(product.sizes || []);
      setHasColors(!!(product.colors && product.colors.length > 0));
      setSelectedColors(product.colors || []);
      setIsKit(product.isKit || false);
      setKitItems(product.kitItems || []);
    } else {
      setEditingProduct(null);
      setFormData({ name: '', category: '', description: '', priceCents: 0, stock: '', minQuantity: '', minValueCents: 0 });
      setImageFiles([]);
      setHasSizes(false); setSelectedSizes([]); setCustomSizeInput('');
      setHasColors(false); setSelectedColors([]); setColorInput('');
      setIsKit(false); setKitItems([]); setKitNameInput(''); setKitQtyInput('1');
    }
    setIsModalOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    if (imageFiles.length + files.length > 5) { toast.error("Máximo 5 imagens"); return; }
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => setImageFiles((prev) => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => setImageFiles((prev) => prev.filter((_, i) => i !== index));

  const toggleSize = (size: string) => {
    setSelectedSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]);
  };

  const addCustomSize = () => {
    const s = customSizeInput.trim();
    if (s && !selectedSizes.includes(s)) { setSelectedSizes(prev => [...prev, s]); }
    setCustomSizeInput('');
  };

  const addColor = () => {
    const c = colorInput.trim();
    if (c && !selectedColors.includes(c)) { setSelectedColors(prev => [...prev, c]); }
    setColorInput('');
  };

  const addKitItem = () => {
    const name = kitNameInput.trim();
    const qty = parseInt(kitQtyInput) || 1;
    if (name) { setKitItems(prev => [...prev, { name, quantity: qty }]); setKitNameInput(''); setKitQtyInput('1'); }
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.priceCents || !formData.category) {
      toast.error("Preencha os campos obrigatórios (Nome, Categoria e Preço)"); return;
    }
    if (imageFiles.length === 0) { toast.error("Adicione pelo menos uma imagem"); return; }

    const productData = {
      name: formData.name, category: formData.category, description: formData.description,
      price: centsToDecimal(formData.priceCents), stock: parseInt(formData.stock) || 0,
      minQuantity: formData.minQuantity ? parseInt(formData.minQuantity) : undefined,
      minValue: formData.minValueCents ? centsToDecimal(formData.minValueCents) : undefined,
      images: imageFiles,
      sizes: hasSizes ? selectedSizes : [],
      colors: hasColors ? selectedColors : [],
      isKit,
      kitItems: isKit ? kitItems : [],
    };

    if (editingProduct) {
      updateProduct(editingProduct.id, productData);
      toast.success("Produto atualizado!");
    } else {
      addProduct(productData);
      toast.success("Produto adicionado!");
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este produto?")) {
      deleteProduct(id); toast.success("Produto excluído!");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Produtos</h1>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="h-4 w-4 mr-2" />Adicionar Produto
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => {
          const categoryName = categories.find(c => c.id === product.category)?.nome || 'Sem categoria';
          return (
            <Card key={product.id} className="overflow-hidden">
              <img src={product.images[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e'} alt={product.name} className="w-full h-48 object-cover" />
              <div className="p-4 space-y-2">
                <h3 className="font-semibold text-lg">{product.name}</h3>
                <p className="text-sm text-muted-foreground">{categoryName}</p>
                <p className="text-sm line-clamp-2">{product.description}</p>
                <div className="flex flex-wrap gap-1">
                  {product.sizes && product.sizes.length > 0 && <Badge variant="outline" className="text-xs">📏 {product.sizes.length} tamanhos</Badge>}
                  {product.colors && product.colors.length > 0 && <Badge variant="outline" className="text-xs">🎨 {product.colors.length} cores</Badge>}
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

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Editar Produto' : 'Adicionar Produto'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome do Produto *</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Ex: Smartphone Premium" />
            </div>
            <div>
              <Label>Categoria *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger className="bg-background"><SelectValue placeholder="Selecione uma categoria" /></SelectTrigger>
                <SelectContent className="bg-popover border shadow-lg z-50">
                  <SelectGroup>
                    <SelectLabel>Categorias do Sistema</SelectLabel>
                    {categories.map((cat) => <SelectItem key={cat.id} value={cat.id}>{cat.nome}</SelectItem>)}
                  </SelectGroup>
                  {customCategories.length > 0 && (
                    <SelectGroup>
                      <SelectLabel>Minhas Categorias</SelectLabel>
                      {customCategories.map((cat) => <SelectItem key={cat.id} value={cat.id}>{cat.nome}</SelectItem>)}
                    </SelectGroup>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Descrição detalhada do produto" rows={4} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Preço (R$) *</Label>
                <CurrencyInput value={formData.priceCents} onChange={(cents) => setFormData({ ...formData, priceCents: cents })} placeholder="R$ 0,00" />
              </div>
              <div>
                <Label>Estoque</Label>
                <Input type="number" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} placeholder="0" />
              </div>
            </div>

            {/* Limites de Pedido */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3 text-sm">Limites de Pedido (Opcional)</h3>
              <p className="text-xs text-muted-foreground mb-3">Configure limites mínimos específicos para este produto.</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Quantidade Mínima</Label>
                  <Input type="number" min="0" value={formData.minQuantity} onChange={(e) => setFormData({ ...formData, minQuantity: e.target.value })} placeholder="Ex: 10" />
                </div>
                <div>
                  <Label>Valor Mínimo (R$)</Label>
                  <CurrencyInput value={formData.minValueCents} onChange={(cents) => setFormData({ ...formData, minValueCents: cents })} placeholder="R$ 0,00" />
                </div>
              </div>
            </div>

            {/* Tamanhos */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">📏 Tamanhos (Opcional)</h3>
                <Switch checked={hasSizes} onCheckedChange={setHasSizes} />
              </div>
              {hasSizes && (
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Roupas</p>
                    <div className="flex flex-wrap gap-2">
                      {PRESET_CLOTHING_SIZES.map(size => (
                        <Badge key={size} variant={selectedSizes.includes(size) ? "default" : "outline"}
                          className="cursor-pointer select-none" onClick={() => toggleSize(size)}>
                          {size}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Calçados</p>
                    <div className="flex flex-wrap gap-2">
                      {PRESET_SHOE_SIZES.map(size => (
                        <Badge key={size} variant={selectedSizes.includes(size) ? "default" : "outline"}
                          className="cursor-pointer select-none" onClick={() => toggleSize(size)}>
                          {size}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Input value={customSizeInput} onChange={(e) => setCustomSizeInput(e.target.value)}
                      placeholder="Tamanho personalizado" className="flex-1"
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomSize())} />
                    <Button type="button" variant="outline" size="sm" onClick={addCustomSize}>Adicionar</Button>
                  </div>
                  {selectedSizes.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Selecionados:</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedSizes.map(s => (
                          <Badge key={s} variant="secondary" className="gap-1">
                            {s}
                            <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedSizes(prev => prev.filter(x => x !== s))} />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Cores */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">🎨 Cores (Opcional)</h3>
                <Switch checked={hasColors} onCheckedChange={setHasColors} />
              </div>
              {hasColors && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input value={colorInput} onChange={(e) => setColorInput(e.target.value)}
                      placeholder="Ex: Preto, Azul, Vermelho" className="flex-1"
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addColor())} />
                    <Button type="button" variant="outline" size="sm" onClick={addColor}>Adicionar</Button>
                  </div>
                  {selectedColors.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {selectedColors.map(c => (
                        <Badge key={c} variant="secondary" className="gap-1">
                          {c}
                          <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedColors(prev => prev.filter(x => x !== c))} />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Kit */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">📦 Kit de Produtos (Opcional)</h3>
                <Switch checked={isKit} onCheckedChange={setIsKit} />
              </div>
              {isKit && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">Adicione os itens que compõem este kit.</p>
                  <div className="flex gap-2">
                    <Input value={kitNameInput} onChange={(e) => setKitNameInput(e.target.value)}
                      placeholder="Nome do item" className="flex-1"
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addKitItem())} />
                    <Input type="number" value={kitQtyInput} onChange={(e) => setKitQtyInput(e.target.value)}
                      placeholder="Qtd" className="w-20" min="1" />
                    <Button type="button" variant="outline" size="sm" onClick={addKitItem}>+</Button>
                  </div>
                  {kitItems.length > 0 && (
                    <div className="space-y-1">
                      {kitItems.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-muted/50 rounded px-3 py-2 text-sm">
                          <span>{item.quantity}x {item.name}</span>
                          <X className="h-4 w-4 cursor-pointer text-muted-foreground hover:text-destructive"
                            onClick={() => setKitItems(prev => prev.filter((_, i) => i !== idx))} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Imagens */}
            <div>
              <Label>Imagens do Produto (máximo 5)</Label>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Input type="file" accept="image/*" multiple onChange={handleImageUpload} disabled={imageFiles.length >= 5} className="cursor-pointer" />
                  <Button type="button" variant="outline" size="icon"
                    onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
                    disabled={imageFiles.length >= 5}>
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">{imageFiles.length}/5 imagens adicionadas</p>
                {imageFiles.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {imageFiles.map((img, index) => (
                      <div key={index} className="relative group">
                        <img src={img} alt={`Preview ${index + 1}`} className="w-full h-24 object-cover rounded-md" />
                        <button type="button" onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button onClick={handleSubmit}>{editingProduct ? 'Salvar Alterações' : 'Adicionar Produto'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Produtos;
