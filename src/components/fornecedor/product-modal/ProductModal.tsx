import { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, Save, X, Package } from 'lucide-react';
import { toast } from 'sonner';
import {
  ProductFormData, DEFAULT_FORM_DATA, SaleType,
  getStepsForSaleType, SALE_TYPE_CONFIG,
} from './types';
import SaleTypeStep from './SaleTypeStep';
import BasicInfoStep from './BasicInfoStep';
import SpecsStep from './SpecsStep';
import BoxConfigStep from './BoxConfigStep';
import BaleConfigStep from './BaleConfigStep';
import KitCompositionStep from './KitCompositionStep';
import PricingStep from './PricingStep';
import VariationsStep from './VariationsStep';
import ImagesStep from './ImagesStep';
import { VariationColor, VariationType, editorToVariationRows, variationsToEditorState } from '@/components/fornecedor/VariationsEditor';
import { useProductDrafts } from '@/hooks/useProductDrafts';
import { SupplierProduct } from '@/hooks/useSupplierProducts';
import { useProductPriceTiers, PriceTier } from '@/hooks/useProductPriceTiers';
import { useProductVariations } from '@/hooks/useProductVariations';
import { centsToDecimal, decimalToCents } from '@/utils/currency';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingProduct?: SupplierProduct | null;
  categories: { id: string; nome: string }[];
  customCategories: { id: string; nome: string }[];
  onSubmit: (product: Omit<SupplierProduct, 'id'>, tiers: Omit<PriceTier, 'id' | 'product_id'>[], variationRows: any[], isEdit: boolean, productId?: string) => Promise<void>;
}

export default function ProductModal({ open, onOpenChange, editingProduct, categories, customCategories, onSubmit }: Props) {
  const [formData, setFormData] = useState<ProductFormData>(DEFAULT_FORM_DATA);
  const [activeStep, setActiveStep] = useState(0);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const { saveDraft, deleteDraft, restoreFormData } = useProductDrafts();

  // Variation state (kept outside formData for VariationsEditor compatibility)
  const [hasColors, setHasColors] = useState(false);
  const [hasSizes, setHasSizes] = useState(false);
  const [variationType, setVariationType] = useState<VariationType>('size');
  const [variationColors, setVariationColors] = useState<VariationColor[]>([]);
  const [variationSizes, setVariationSizes] = useState<string[]>([]);
  const [variationGrid, setVariationGrid] = useState<Record<string, Record<string, { stock: number; price: number | null }>>>({});

  const steps = getStepsForSaleType(formData.saleType);
  const totalSteps = steps.length;
  const progressPercent = ((activeStep + 1) / totalSteps) * 100;

  // Initialize modal
  useEffect(() => {
    if (!open) return;

    if (editingProduct) {
      const saleUnit = editingProduct.saleUnit || 'unit';
      const saleType: SaleType = saleUnit === 'closed_box' ? 'closed_box' : saleUnit === 'bale' ? 'bale' : saleUnit === 'kit' ? 'kit' : saleUnit === 'pair' ? 'pair' : 'unit';
      setFormData({
        ...DEFAULT_FORM_DATA,
        saleType,
        name: editingProduct.name,
        category: editingProduct.category,
        description: editingProduct.description,
        brand: editingProduct.brand || '',
        model: editingProduct.model || '',
        material: editingProduct.material || '',
        condition: editingProduct.condition || 'new',
        isInternational: editingProduct.isInternational || false,
        gender: editingProduct.gender || 'none',
        ageGroup: editingProduct.ageGroup || 'none',
        weightGrams: editingProduct.weightGrams?.toString() || '',
        widthCm: editingProduct.widthCm?.toString() || '',
        heightCm: editingProduct.heightCm?.toString() || '',
        depthCm: editingProduct.depthCm?.toString() || '',
        ncmCode: editingProduct.ncmCode || '',
        warrantyDays: editingProduct.warrantyDays?.toString() || '',
        keywords: editingProduct.keywords || [],
        minOrderQuantity: (editingProduct.minOrderQuantity || 1).toString(),
        maxOrderQuantity: editingProduct.maxOrderQuantity?.toString() || '',
        isCnpjOnly: editingProduct.isCnpjOnly || false,
        stock: editingProduct.stock.toString(),
        priceTiers: [{ minQty: '1', maxQty: '', priceCents: decimalToCents(editingProduct.price) }],
        unitsPerBox: (editingProduct.unitsPerSaleUnit || '').toString(),
        images: editingProduct.images,
        hasVariations: false,
        kitItems: editingProduct.kitItems || [],
        kitWhatsIncluded: editingProduct.whatIsInTheBox || '',
      });
      // Load tiers & variations async
      loadProductExtras(editingProduct.id);
      setActiveStep(0);
    } else {
      // Try restore draft
      const restored = restoreFormData();
      if (restored) {
        setFormData(restored.formData);
        setActiveStep(restored.step);
        toast.info("Rascunho restaurado");
      } else {
        setFormData(DEFAULT_FORM_DATA);
        setActiveStep(0);
      }
      resetVariations();
    }
  }, [open, editingProduct]);

  const loadProductExtras = async (productId: string) => {
    const [{ data: tiersData }, { data: varData }] = await Promise.all([
      supabase.from('product_price_tiers').select('*').eq('product_id', productId).order('min_quantity'),
      supabase.from('product_variations').select('*').eq('product_id', productId).order('color').order('size'),
    ]);
    if (tiersData && tiersData.length > 0) {
      setFormData(prev => ({
        ...prev,
        priceTiers: tiersData.map((t: any) => ({ minQty: t.min_quantity.toString(), maxQty: t.max_quantity?.toString() || '', priceCents: decimalToCents(t.price_per_unit) })),
      }));
    }
    if (varData && varData.length > 0) {
      const state = variationsToEditorState(varData as any);
      setFormData(prev => ({ ...prev, hasVariations: true }));
      setHasColors(state.hasColors); setHasSizes(state.hasSizes);
      setVariationType(state.variationType);
      setVariationColors(state.colors); setVariationSizes(state.sizes);
      setVariationGrid(state.grid);
    }
  };

  const resetVariations = () => {
    setHasColors(false); setHasSizes(false); setVariationType('size');
    setVariationColors([]); setVariationSizes([]); setVariationGrid({});
  };

  const updateFormData = useCallback((updates: Partial<ProductFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  // Validation per step key
  const validateStep = (stepKey: string): string | null => {
    const isBox = formData.saleType === 'closed_box';
    const isBale = formData.saleType === 'bale';
    const minImages = (isBox || isBale) ? 2 : 3;
    switch (stepKey) {
      case 'sale_type': return null;
      case 'basic_info':
        if (formData.name.length < 20) return "Nome deve ter no mínimo 20 caracteres";
        if (!formData.category) return "Selecione uma categoria";
        if (formData.saleType !== 'bale' && formData.saleType !== 'kit' && !formData.brand) return "Preencha a marca";
        if (formData.description.length < 100) return "Descrição deve ter no mínimo 100 caracteres";
        return null;
      case 'specs':
        if (!formData.weightGrams) return "Preencha o peso";
        if (!formData.widthCm || !formData.heightCm || !formData.depthCm) return "Preencha todas as dimensões";
        return null;
      case 'box_config':
        if (!formData.unitsPerBox || parseInt(formData.unitsPerBox) === 0) return "Quantidade por caixa não pode ser 0";
        if (!formData.boxSpecification) return "Preencha a especificação desta caixa";
        return null;
      case 'bale_config':
        if (!formData.baleWeightKg) return "Preencha o peso do fardo";
        if (parseFloat(formData.baleWeightKg) < 1) return "O peso do fardo deve ser no mínimo 1kg";
        if (formData.baleType === 'mixed' && !formData.baleMixDescription) return "Descreva o mix de produtos do fardo";
        return null;
      case 'kit_composition':
        if (formData.kitItems.length < 2) return "O kit precisa ter pelo menos 2 itens";
        return null;
      case 'pricing':
        if (!formData.priceTiers.length || !formData.priceTiers[0].priceCents) return "Adicione pelo menos 1 faixa de preço";
        return null;
      case 'variations': return null;
      case 'images':
        if (formData.images.length < minImages) return `Adicione pelo menos ${minImages} imagens`;
        return null;
      default: return null;
    }
  };

  const handleNext = () => {
    const currentStepKey = steps[activeStep].key;
    const error = validateStep(currentStepKey);
    if (error && currentStepKey !== 'variations') { toast.error(error); return; }
    const nextStep = activeStep + 1;
    setActiveStep(nextStep);
    if (!editingProduct) saveDraft(formData, nextStep);
  };

  const handlePrev = () => setActiveStep(Math.max(0, activeStep - 1));

  const handleClose = () => {
    if (!editingProduct && (formData.name || formData.images.length > 0)) {
      setShowExitConfirm(true);
    } else {
      onOpenChange(false);
    }
  };

  const confirmExit = () => {
    if (!editingProduct) saveDraft(formData, activeStep);
    setShowExitConfirm(false);
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    // Validate all required steps
    for (let i = 0; i < steps.length; i++) {
      const error = validateStep(steps[i].key);
      if (error && steps[i].key !== 'variations') { setActiveStep(i); toast.error(error); return; }
    }

    const variationRows = formData.hasVariations
      ? editorToVariationRows(variationColors, variationSizes, variationGrid, hasColors, hasSizes, variationType)
      : [];
    const totalVariationStock = variationRows.reduce((s, r) => s + r.stock, 0);
    const useVariationStock = formData.hasVariations && variationRows.length > 0;
    const basePrice = centsToDecimal(formData.priceTiers[0].priceCents);

    const saleUnitMap: Record<SaleType, string> = { unit: 'unit', closed_box: 'closed_box', bale: 'bale', kit: 'kit', pair: 'pair' };

    const productData: Omit<SupplierProduct, 'id'> = {
      name: formData.name, category: formData.category, description: formData.description,
      price: basePrice,
      stock: useVariationStock ? totalVariationStock : (parseInt(formData.stock) || 0),
      images: formData.images,
      sizes: hasSizes ? variationSizes : [],
      colors: hasColors ? variationColors.map(c => c.name) : [],
      isKit: formData.saleType === 'kit',
      kitItems: formData.saleType === 'kit' ? formData.kitItems : [],
      brand: formData.brand, model: formData.model, material: formData.material,
      condition: formData.condition,
      isInternational: formData.isInternational,
      gender: formData.gender, ageGroup: formData.ageGroup,
      saleUnit: saleUnitMap[formData.saleType],
      unitsPerSaleUnit: formData.saleType === 'closed_box' ? parseInt(formData.unitsPerBox) || 1 : 1,
      minOrderQuantity: parseInt(formData.minOrderQuantity) || 1,
      maxOrderQuantity: formData.maxOrderQuantity ? parseInt(formData.maxOrderQuantity) : undefined,
      weightGrams: formData.weightGrams ? parseInt(formData.weightGrams) :
        formData.saleType === 'bale' && formData.baleWeightKg ? Math.round(parseFloat(formData.baleWeightKg) * 1000) :
        formData.saleType === 'closed_box' && formData.boxWeightKg ? Math.round(parseFloat(formData.boxWeightKg) * 1000) : undefined,
      widthCm: formData.widthCm ? parseFloat(formData.widthCm) : formData.boxWidthCm ? parseFloat(formData.boxWidthCm) : undefined,
      heightCm: formData.heightCm ? parseFloat(formData.heightCm) : formData.boxHeightCm ? parseFloat(formData.boxHeightCm) : undefined,
      depthCm: formData.depthCm ? parseFloat(formData.depthCm) : formData.boxDepthCm ? parseFloat(formData.boxDepthCm) : undefined,
      ncmCode: formData.ncmCode, isCnpjOnly: formData.isCnpjOnly,
      keywords: formData.keywords,
      warrantyDays: formData.warrantyDays ? parseInt(formData.warrantyDays) : undefined,
      whatIsInTheBox: formData.kitWhatsIncluded || undefined,
    };

    const tiersToSave = formData.priceTiers.map(t => ({
      min_quantity: parseInt(t.minQty) || 1,
      max_quantity: t.maxQty ? parseInt(t.maxQty) : null,
      price_per_unit: centsToDecimal(t.priceCents),
    }));

    const varRows = formData.hasVariations ? variationRows.map(r => ({
      color: r.color || null, color_hex: r.colorHex || null, size: r.size || null,
      stock: r.stock, price: r.price, image_url: r.imageUrl || null,
      variation_type: r.variationType || 'size',
      variation_label: r.variationLabel || null,
      variation_value: r.variationValue || null,
    })) : [];

    await onSubmit(productData, tiersToSave, varRows, !!editingProduct, editingProduct?.id);
    if (!editingProduct) deleteDraft();
    onOpenChange(false);
  };

  const renderStepContent = () => {
    const stepKey = steps[activeStep]?.key;
    switch (stepKey) {
      case 'sale_type':
        return <SaleTypeStep value={formData.saleType} onChange={(type) => {
          updateFormData({ saleType: type });
          // Reset step to 0 when type changes to recalculate steps
        }} />;
      case 'basic_info':
        return <BasicInfoStep data={formData} onChange={updateFormData} categories={categories} customCategories={customCategories} />;
      case 'specs':
        return <SpecsStep data={formData} onChange={updateFormData} />;
      case 'box_config':
        return <BoxConfigStep data={formData} onChange={updateFormData} />;
      case 'bale_config':
        return <BaleConfigStep data={formData} onChange={updateFormData} />;
      case 'kit_composition':
        return <KitCompositionStep data={formData} onChange={updateFormData} />;
      case 'pricing':
        return <PricingStep data={formData} onChange={updateFormData} hasVariations={formData.hasVariations} />;
      case 'variations':
        return <VariationsStep
          data={formData} onChange={updateFormData}
          hasColors={hasColors} setHasColors={setHasColors}
          hasSizes={hasSizes} setHasSizes={setHasSizes}
          variationType={variationType} setVariationType={setVariationType}
          variationColors={variationColors} setVariationColors={setVariationColors}
          variationSizes={variationSizes} setVariationSizes={setVariationSizes}
          variationGrid={variationGrid} setVariationGrid={setVariationGrid}
        />;
      case 'images':
        return <ImagesStep data={formData} onChange={updateFormData} />;
      default:
        return null;
    }
  };

  const isLastStep = activeStep === totalSteps - 1;

  return (
    <>
      <Dialog open={open} onOpenChange={() => {}}>
        <DialogContent
          className="w-full h-full max-w-full max-h-full sm:w-[90vw] sm:h-[90vh] sm:max-w-[90vw] sm:max-h-[90vh] sm:rounded-xl rounded-none p-0 flex flex-col gap-0 [&>button]:hidden"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogTitle className="sr-only">{editingProduct ? 'Editar Produto' : 'Cadastrar Produto'}</DialogTitle>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-background">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Package className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-semibold">{editingProduct ? 'Editar Produto' : 'Cadastrar Produto'}</h2>
                <p className="text-xs text-muted-foreground">Etapa {activeStep + 1} de {totalSteps} — {steps[activeStep]?.label}</p>
              </div>
            </div>
            <button onClick={handleClose} className="rounded-full p-2 hover:bg-muted transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Progress */}
          <div className="px-4 pt-2">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>{steps[activeStep]?.label}</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <Progress value={progressPercent} className="h-1.5" />
          </div>

          {/* Step indicators */}
          <div className="flex gap-1 px-4 pt-2 pb-1 overflow-x-auto">
            {steps.map((step, idx) => (
              <button
                key={step.key}
                onClick={() => idx <= activeStep && setActiveStep(idx)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  idx === activeStep
                    ? 'bg-primary text-primary-foreground'
                    : idx < activeStep
                      ? 'bg-primary/10 text-primary cursor-pointer'
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {idx < activeStep ? '✓ ' : ''}{step.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {renderStepContent()}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t bg-background">
            <div>
              {activeStep > 0 && (
                <Button variant="outline" onClick={handlePrev} className="gap-1">
                  <ChevronLeft className="h-4 w-4" /> Anterior
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              {!isLastStep ? (
                <Button onClick={handleNext} className="gap-1">
                  Próximo <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} className="gap-1">
                  <Save className="h-4 w-4" /> {editingProduct ? 'Salvar Alterações' : 'Cadastrar Produto'}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Exit confirmation */}
      <Dialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Tem certeza que quer sair?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">Seu rascunho será salvo e você pode continuar de onde parou.</p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => setShowExitConfirm(false)}>Continuar Editando</Button>
              <Button variant="destructive" onClick={confirmExit}>Sair e Salvar Rascunho</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
