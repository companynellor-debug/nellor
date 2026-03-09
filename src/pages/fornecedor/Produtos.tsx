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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plus, Edit, Trash2, Upload, X, ChevronDown, Package, DollarSign, Truck, Palette, Image as ImageIcon, Info } from "lucide-react";
import { useSupplierProducts, SupplierProduct } from "@/hooks/useSupplierProducts";
import { useSupabaseCategories } from "@/hooks/useSupabaseCategories";
import { useSupplierCategories } from "@/hooks/useSupplierCategories";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useProductVariations } from "@/hooks/useProductVariations";
import { useProductPriceTiers, PriceTier } from "@/hooks/useProductPriceTiers";
import { toast } from "sonner";
import { formatCurrencyFromDecimal, CurrencyInput, centsToDecimal, decimalToCents } from "@/utils/currency";
import { VariationsEditor, VariationColor, VariationType, editorToVariationRows, variationsToEditorState } from "@/components/fornecedor/VariationsEditor";

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<SupplierProduct | null>(null);

  // Section open states
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    basic: true, saleUnit: true, pricing: true, logistics: false, variations: false, images: true,
  });
  const toggleSection = (key: string) => setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

  // Form data
  const [formData, setFormData] = useState({
    name: '', category: '', description: '', brand: '', material: '',
    condition: 'new' as string, isInternational: false,
    saleUnit: 'unit', unitsPerSaleUnit: '1', minOrderQuantity: '1',
    weightGrams: '', widthCm: '', heightCm: '', depthCm: '',
    ncmCode: '', isCnpjOnly: false,
    stock: '', priceCents: 0,
  });
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [imageFiles, setImageFiles] = useState<string[]>([]);

  // Price tiers
  const [priceTiers, setPriceTiers] = useState<Array<{ minQty: string; maxQty: string; priceCents: number }>>([
    { minQty: '1', maxQty: '', priceCents: 0 },
  ]);

  // Variations state
  const [hasVariations, setHasVariations] = useState(false);
  const [hasColors, setHasColors] = useState(false);
  const [hasSizes, setHasSizes] = useState(false);
  const [variationType, setVariationType] = useState<VariationType>('size');
  const [variationColors, setVariationColors] = useState<VariationColor[]>([]);
  const [variationSizes, setVariationSizes] = useState<string[]>([]);
  const [variationGrid, setVariationGrid] = useState<Record<string, Record<string, { stock: number; price: number | null }>>>({});

  // Kit state
  const [isKit, setIsKit] = useState(false);
  const [kitItems, setKitItems] = useState<{ name: string; quantity: number }[]>([]);
  const [kitNameInput, setKitNameInput] = useState('');
  const [kitQtyInput, setKitQtyInput] = useState('1');

  const handleOpenModal = async (product?: SupplierProduct) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name, category: product.category, description: product.description,
        brand: product.brand || '', material: product.material || '',
        condition: product.condition || 'new', isInternational: product.isInternational || false,
        saleUnit: product.saleUnit || 'unit',
        unitsPerSaleUnit: (product.unitsPerSaleUnit || 1).toString(),
        minOrderQuantity: (product.minOrderQuantity || 1).toString(),
        weightGrams: product.weightGrams?.toString() || '',
        widthCm: product.widthCm?.toString() || '',
        heightCm: product.heightCm?.toString() || '',
        depthCm: product.depthCm?.toString() || '',
        ncmCode: product.ncmCode || '', isCnpjOnly: product.isCnpjOnly || false,
        stock: product.stock.toString(), priceCents: decimalToCents(product.price),
      });
      setImageFiles(product.images);
      setKeywords(product.keywords || []);
      setKeywordInput('');
      setIsKit(product.isKit || false);
      setKitItems(product.kitItems || []);

      // Load price tiers
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: tiersData } = await supabase.from('product_price_tiers').select('*').eq('product_id', product.id).order('min_quantity');
      if (tiersData && tiersData.length > 0) {
        setPriceTiers(tiersData.map((t: any) => ({
          minQty: t.min_quantity.toString(), maxQty: t.max_quantity?.toString() || '', priceCents: decimalToCents(t.price_per_unit),
        })));
      } else {
        setPriceTiers([{ minQty: '1', maxQty: '', priceCents: decimalToCents(product.price) }]);
      }

      // Load variations
      const { data: varData } = await supabase.from('product_variations').select('*').eq('product_id', product.id).order('color').order('size');
      if (varData && varData.length > 0) {
        const state = variationsToEditorState(varData as any);
        setHasVariations(true);
        setHasColors(state.hasColors);
        setHasSizes(state.hasSizes);
        setVariationType(state.variationType);
        setVariationColors(state.colors);
        setVariationSizes(state.sizes);
        setVariationGrid(state.grid);
      } else {
        setHasVariations(false);
        setHasColors(false); setHasSizes(false);
        setVariationColors([]); setVariationSizes([]); setVariationGrid({});
      }
    } else {
      setEditingProduct(null);
      setFormData({
        name: '', category: '', description: '', brand: '', material: '',
        condition: 'new', isInternational: false,
        saleUnit: 'unit', unitsPerSaleUnit: '1', minOrderQuantity: '1',
        weightGrams: '', widthCm: '', heightCm: '', depthCm: '',
        ncmCode: '', isCnpjOnly: false,
        stock: '', priceCents: 0,
      });
      setImageFiles([]);
      setKeywords([]);
      setKeywordInput('');
      setPriceTiers([{ minQty: '1', maxQty: '', priceCents: 0 }]);
      setHasVariations(false);
      setHasColors(false); setHasSizes(false);
      setVariationType('size');
      setVariationColors([]); setVariationSizes([]); setVariationGrid({});
      setIsKit(false); setKitItems([]); setKitNameInput(''); setKitQtyInput('1');
    }
    setOpenSections({ basic: true, saleUnit: true, pricing: true, logistics: false, variations: false, images: true });
    setIsModalOpen(true);
  };

  const addKeyword = (value: string) => {
    const word = value.trim().toLowerCase();
    if (word && !keywords.includes(word) && keywords.length < 10) {
      setKeywords(prev => [...prev, word]);
    }
    setKeywordInput('');
  };

  const handleKeywordInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addKeyword(keywordInput);
    }
  };

  const removeKeyword = (word: string) => {
    setKeywords(prev => prev.filter(k => k !== word));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    if (imageFiles.length + files.length > 10) { toast.error("Máximo 10 imagens"); return; }
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => setImageFiles((prev) => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => setImageFiles((prev) => prev.filter((_, i) => i !== index));

  const addKitItem = () => {
    const name = kitNameInput.trim();
    const qty = parseInt(kitQtyInput) || 1;
    if (name) { setKitItems(prev => [...prev, { name, quantity: qty }]); setKitNameInput(''); setKitQtyInput('1'); }
  };

  const addPriceTier = () => {
    const lastTier = priceTiers[priceTiers.length - 1];
    const nextMin = lastTier?.maxQty ? (parseInt(lastTier.maxQty) + 1).toString() : '';
    setPriceTiers([...priceTiers, { minQty: nextMin, maxQty: '', priceCents: 0 }]);
  };

  const removePriceTier = (idx: number) => {
    if (priceTiers.length <= 1) return;
    setPriceTiers(priceTiers.filter((_, i) => i !== idx));
  };

  const updatePriceTier = (idx: number, field: string, value: string | number) => {
    setPriceTiers(priceTiers.map((t, i) => i === idx ? { ...t, [field]: value } : t));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.category) {
      toast.error("Preencha Nome e Categoria"); return;
    }
    if (formData.description.length < 100) {
      toast.error("Descrição deve ter no mínimo 100 caracteres"); return;
    }
    if (!formData.brand) { toast.error("Preencha a Marca"); return; }
    if (priceTiers.length === 0 || !priceTiers[0].priceCents) {
      toast.error("Adicione pelo menos 1 faixa de preço"); return;
    }
    if (imageFiles.length < 3) { toast.error("Adicione pelo menos 3 imagens"); return; }

    const variationRows = hasVariations
      ? editorToVariationRows(variationColors, variationSizes, variationGrid, hasColors, hasSizes, variationType)
      : [];
    const totalVariationStock = variationRows.reduce((s, r) => s + r.stock, 0);
    const useVariationStock = hasVariations && variationRows.length > 0;
    const basePrice = centsToDecimal(priceTiers[0].priceCents);

    const productData: Omit<SupplierProduct, 'id'> = {
      name: formData.name, category: formData.category, description: formData.description,
      price: basePrice,
      stock: useVariationStock ? totalVariationStock : (parseInt(formData.stock) || 0),
      images: imageFiles,
      sizes: hasSizes ? variationSizes : [],
      colors: hasColors ? variationColors.map(c => c.name) : [],
      isKit, kitItems: isKit ? kitItems : [],
      brand: formData.brand, material: formData.material,
      condition: formData.condition,
      isInternational: formData.isInternational,
      saleUnit: formData.saleUnit,
      unitsPerSaleUnit: parseInt(formData.unitsPerSaleUnit) || 1,
      minOrderQuantity: parseInt(formData.minOrderQuantity) || 1,
      weightGrams: formData.weightGrams ? parseInt(formData.weightGrams) : undefined,
      widthCm: formData.widthCm ? parseFloat(formData.widthCm) : undefined,
      heightCm: formData.heightCm ? parseFloat(formData.heightCm) : undefined,
      depthCm: formData.depthCm ? parseFloat(formData.depthCm) : undefined,
      ncmCode: formData.ncmCode, isCnpjOnly: formData.isCnpjOnly,
      keywords,
    };

    const tiersToSave: Omit<PriceTier, 'id' | 'product_id'>[] = priceTiers.map(t => ({
      min_quantity: parseInt(t.minQty) || 1,
      max_quantity: t.maxQty ? parseInt(t.maxQty) : null,
      price_per_unit: centsToDecimal(t.priceCents),
    }));

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, productData);
        await saveTiers(editingProduct.id, tiersToSave);
        if (hasVariations) {
          await saveVariations(editingProduct.id, variationRows.map(r => ({
            color: r.color || null, color_hex: r.colorHex || null, size: r.size || null,
            stock: r.stock, price: r.price, image_url: r.imageUrl || null,
            variation_type: r.variationType || 'size',
            variation_label: r.variationLabel || null,
            variation_value: r.variationValue || null,
          })));
        } else {
          await saveVariations(editingProduct.id, []);
        }
        toast.success("Produto atualizado!");
      } else {
        const newProduct = await addProduct(productData);
        if (newProduct?.id) {
          await saveTiers(newProduct.id, tiersToSave);
          if (hasVariations) {
            await saveVariations(newProduct.id, variationRows.map(r => ({
              color: r.color || null, color_hex: r.colorHex || null, size: r.size || null,
              stock: r.stock, price: r.price, image_url: r.imageUrl || null,
              variation_type: r.variationType || 'size',
              variation_label: r.variationLabel || null,
              variation_value: r.variationValue || null,
            })));
          }
        }
        toast.success("Produto adicionado!");
      }
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar produto");
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este produto?")) {
      deleteProduct(id); toast.success("Produto excluído!");
    }
  };

  const SectionHeader = ({ icon: Icon, title, sectionKey }: { icon: any; title: string; sectionKey: string }) => (
    <CollapsibleTrigger asChild onClick={() => toggleSection(sectionKey)}>
      <button className="flex items-center justify-between w-full p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">{title}</span>
        </div>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${openSections[sectionKey] ? 'rotate-180' : ''}`} />
      </button>
    </CollapsibleTrigger>
  );

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

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Editar Produto' : 'Cadastrar Produto'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">

            {/* SECTION 1 — Basic Info */}
            <Collapsible open={openSections.basic}>
              <SectionHeader icon={Info} title="1. Informações Básicas" sectionKey="basic" />
              <CollapsibleContent className="pt-3 space-y-3">
                <div>
                  <Label>Nome do Produto *</Label>
                  <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Ex: Camiseta Premium Algodão" />
                </div>
                <div>
                  <Label>Categoria *</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger className="bg-background"><SelectValue placeholder="Selecione" /></SelectTrigger>
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
                  <Label>Descrição * <span className="text-xs text-muted-foreground">({formData.description.length}/100 mín.)</span></Label>
                  <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Descrição detalhada do produto (mínimo 100 caracteres)" rows={4} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Marca *</Label>
                    <Input value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} placeholder="Ex: Nike" />
                  </div>
                  <div>
                    <Label>Condição</Label>
                    <Select value={formData.condition} onValueChange={(v) => setFormData({ ...formData, condition: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">Novo</SelectItem>
                        <SelectItem value="used">Usado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Material</Label>
                    <Input value={formData.material} onChange={(e) => setFormData({ ...formData, material: e.target.value })} placeholder="Ex: 100% Algodão" />
                  </div>
                  <div>
                    <Label>Origem</Label>
                    <Select value={formData.isInternational ? 'international' : 'national'} onValueChange={(v) => setFormData({ ...formData, isInternational: v === 'international' })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="national">Nacional</SelectItem>
                        <SelectItem value="international">Internacional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* SECTION 2 — Sale Unit */}
            <Collapsible open={openSections.saleUnit}>
              <SectionHeader icon={Package} title="2. Unidade de Venda" sectionKey="saleUnit" />
              <CollapsibleContent className="pt-3 space-y-3">
                <div>
                  <Label>Unidade de Venda</Label>
                  <Select value={formData.saleUnit} onValueChange={(v) => setFormData({ ...formData, saleUnit: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unit">Unidade</SelectItem>
                      <SelectItem value="pair">Par</SelectItem>
                      <SelectItem value="kit">Kit</SelectItem>
                      <SelectItem value="closed_box">Caixa Fechada</SelectItem>
                      <SelectItem value="bale">Fardo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {(formData.saleUnit === 'closed_box' || formData.saleUnit === 'bale') && (
                  <div>
                    <Label>Quantidade por embalagem</Label>
                    <Input type="number" min="1" value={formData.unitsPerSaleUnit} onChange={(e) => setFormData({ ...formData, unitsPerSaleUnit: e.target.value })} placeholder="Ex: 12" />
                  </div>
                )}
                <div>
                  <Label>Pedido mínimo (unidades) *</Label>
                  <Input type="number" min="1" value={formData.minOrderQuantity} onChange={(e) => setFormData({ ...formData, minOrderQuantity: e.target.value })} placeholder="Ex: 10" />
                </div>
                {/* Kit */}
                <div className="border-t pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="font-semibold text-sm">📦 Kit de Produtos</Label>
                    <Switch checked={isKit} onCheckedChange={setIsKit} />
                  </div>
                  {isKit && (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input value={kitNameInput} onChange={(e) => setKitNameInput(e.target.value)} placeholder="Nome do item" className="flex-1"
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addKitItem())} />
                        <Input type="number" value={kitQtyInput} onChange={(e) => setKitQtyInput(e.target.value)} placeholder="Qtd" className="w-20" min="1" />
                        <Button type="button" variant="outline" size="sm" onClick={addKitItem}>+</Button>
                      </div>
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
              </CollapsibleContent>
            </Collapsible>

            {/* SECTION 3 — Price Tiers */}
            <Collapsible open={openSections.pricing}>
              <SectionHeader icon={DollarSign} title="3. Preço por Faixa" sectionKey="pricing" />
              <CollapsibleContent className="pt-3 space-y-3">
                {priceTiers.map((tier, idx) => (
                  <div key={idx} className="flex items-end gap-2 bg-muted/30 rounded-lg p-3">
                    <div className="flex-1">
                      <Label className="text-xs">Qtd Mín</Label>
                      <Input type="number" min="1" value={tier.minQty} onChange={(e) => updatePriceTier(idx, 'minQty', e.target.value)} className="h-9" />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs">Qtd Máx <span className="text-muted-foreground">(vazio = sem limite)</span></Label>
                      <Input type="number" min="1" value={tier.maxQty} onChange={(e) => updatePriceTier(idx, 'maxQty', e.target.value)} placeholder="∞" className="h-9" />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs">Preço/unidade (R$)</Label>
                      <CurrencyInput value={tier.priceCents} onChange={(cents) => updatePriceTier(idx, 'priceCents', cents)} placeholder="R$ 0,00" />
                    </div>
                    {priceTiers.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => removePriceTier(idx)} className="h-9 px-2">
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addPriceTier} className="gap-1">
                  <Plus className="h-3 w-3" /> Adicionar Faixa
                </Button>

                {/* Preview */}
                {priceTiers.some(t => t.priceCents > 0) && (
                  <div className="bg-primary/5 rounded-lg p-3">
                    <p className="text-xs font-semibold mb-2">Preview das faixas:</p>
                    <div className="space-y-1">
                      {priceTiers.filter(t => t.priceCents > 0).map((t, idx) => (
                        <div key={idx} className="flex justify-between text-xs">
                          <span>{t.minQty}{t.maxQty ? ` - ${t.maxQty}` : '+'} unid.</span>
                          <span className="font-semibold text-primary">{formatCurrencyFromDecimal(centsToDecimal(t.priceCents))}/un</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>

            {/* SECTION 4 — Logistics */}
            <Collapsible open={openSections.logistics}>
              <SectionHeader icon={Truck} title="4. Estoque e Logística" sectionKey="logistics" />
              <CollapsibleContent className="pt-3 space-y-3">
                <div>
                  <Label>Estoque {hasVariations ? '(calculado pelas variações)' : ''}</Label>
                  <Input type="number" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    placeholder="0" disabled={hasVariations} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Peso (gramas)</Label>
                    <Input type="number" value={formData.weightGrams} onChange={(e) => setFormData({ ...formData, weightGrams: e.target.value })} placeholder="Ex: 350" />
                  </div>
                  <div>
                    <Label>NCM <span className="text-xs text-muted-foreground">(opcional)</span></Label>
                    <Input value={formData.ncmCode} onChange={(e) => {
                      let v = e.target.value.replace(/\D/g, '').slice(0, 8);
                      if (v.length > 4) v = v.slice(0, 4) + '.' + v.slice(4);
                      if (v.length > 7) v = v.slice(0, 7) + '.' + v.slice(7);
                      setFormData({ ...formData, ncmCode: v });
                    }} placeholder="0000.00.00" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>Largura (cm)</Label>
                    <Input type="number" value={formData.widthCm} onChange={(e) => setFormData({ ...formData, widthCm: e.target.value })} placeholder="0" />
                  </div>
                  <div>
                    <Label>Altura (cm)</Label>
                    <Input type="number" value={formData.heightCm} onChange={(e) => setFormData({ ...formData, heightCm: e.target.value })} placeholder="0" />
                  </div>
                  <div>
                    <Label>Profundidade (cm)</Label>
                    <Input type="number" value={formData.depthCm} onChange={(e) => setFormData({ ...formData, depthCm: e.target.value })} placeholder="0" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={formData.isCnpjOnly} onCheckedChange={(v) => setFormData({ ...formData, isCnpjOnly: v })} />
                  <Label className="text-sm">Vende apenas para CNPJ</Label>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* SECTION 5 — Variations */}
            <Collapsible open={openSections.variations}>
              <SectionHeader icon={Palette} title="5. Variações (opcional)" sectionKey="variations" />
              <CollapsibleContent className="pt-3 space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <Switch checked={hasVariations} onCheckedChange={(v) => {
                    setHasVariations(v);
                    if (!v) { setHasColors(false); setHasSizes(false); setVariationColors([]); setVariationSizes([]); setVariationGrid({}); }
                    else { setHasColors(true); setHasSizes(true); }
                  }} />
                  <Label className="text-sm">Ativar variações</Label>
                </div>
                {hasVariations && (
                  <>
                    <div className="flex gap-6 mb-3">
                      <div className="flex items-center gap-2">
                        <Switch checked={hasColors} onCheckedChange={(v) => {
                          setHasColors(v);
                          if (!v) { setVariationColors([]); setVariationGrid({}); }
                        }} />
                        <Label className="text-sm">🎨 Cores</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={hasSizes} onCheckedChange={(v) => {
                          setHasSizes(v);
                          if (!v) { setVariationSizes([]); setVariationGrid({}); }
                        }} />
                        <Label className="text-sm">📏 Variação secundária</Label>
                      </div>
                    </div>
                    <VariationsEditor
                      colors={variationColors} setColors={setVariationColors}
                      sizes={variationSizes} setSizes={setVariationSizes}
                      variationGrid={variationGrid} setVariationGrid={setVariationGrid}
                      hasColors={hasColors} hasSizes={hasSizes}
                      variationType={variationType} setVariationType={setVariationType}
                    />
                  </>
                )}
              </CollapsibleContent>
            </Collapsible>

            {/* SECTION 6 — Images */}
            <Collapsible open={openSections.images}>
              <SectionHeader icon={ImageIcon} title="6. Imagens Gerais (mín. 3, máx. 10)" sectionKey="images" />
              <CollapsibleContent className="pt-3 space-y-3">
                <div className="flex items-center gap-2">
                  <Input type="file" accept="image/*" multiple onChange={handleImageUpload} disabled={imageFiles.length >= 10} className="cursor-pointer" />
                </div>
                <p className="text-sm text-muted-foreground">{imageFiles.length}/10 imagens</p>
                {imageFiles.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {imageFiles.map((img, index) => (
                      <div key={index} className="relative group">
                        <img src={img} alt={`Preview ${index + 1}`} className="w-full h-20 object-cover rounded-md" />
                        <button type="button" onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>

            <div className="flex gap-2 justify-end pt-3 border-t">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button onClick={handleSubmit}>{editingProduct ? 'Salvar Alterações' : 'Cadastrar Produto'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Produtos;
