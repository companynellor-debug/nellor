export type SaleType = 'unit' | 'closed_box' | 'bale' | 'kit' | 'pair';

export const SALE_TYPE_CONFIG: Record<SaleType, { label: string; unitLabel: string; unitLabelPlural: string; icon: string; description: string }> = {
  unit: { label: 'Unidade', unitLabel: 'unidade', unitLabelPlural: 'unidades', icon: '📦', description: 'Vendo peça por peça. Exemplo: celular, bolsa, par de sapato unitário.' },
  closed_box: { label: 'Caixa Fechada', unitLabel: 'caixa', unitLabelPlural: 'caixas', icon: '📦📦', description: 'Vendo caixas com quantidade fixa de produtos iguais. Exemplo: caixa com 12 camisetas do mesmo modelo.' },
  bale: { label: 'Fardo', unitLabel: 'fardo', unitLabelPlural: 'fardos', icon: '🧺', description: 'Vendo fardos ou sacolas com mix de produtos variados. Exemplo: fardo de 10kg com roupas sortidas.' },
  kit: { label: 'Kit', unitLabel: 'kit', unitLabelPlural: 'kits', icon: '🎁', description: 'Vendo conjuntos de produtos diferentes vendidos juntos. Exemplo: kit skincare com 3 produtos.' },
  pair: { label: 'Par', unitLabel: 'par', unitLabelPlural: 'pares', icon: '👟', description: 'Vendo sempre em pares. Exemplo: calçados, meias, luvas.' },
};

export type BaleType = 'single_product' | 'mixed';

export interface ProductFormData {
  saleType: SaleType;
  name: string;
  category: string;
  description: string;
  brand: string;
  model: string;
  material: string;
  condition: string;
  isInternational: boolean;
  gender: string;
  ageGroup: string;
  weightGrams: string;
  widthCm: string;
  heightCm: string;
  depthCm: string;
  ncmCode: string;
  warrantyDays: string;
  keywords: string[];
  // Pricing
  minOrderQuantity: string;
  maxOrderQuantity: string;
  isCnpjOnly: boolean;
  stock: string;
  priceTiers: PriceTierForm[];
  // Box specific
  unitsPerBox: string;
  boxWeightKg: string;
  boxWidthCm: string;
  boxHeightCm: string;
  boxDepthCm: string;
  boxAllSame: boolean;
  boxModelDescription: string;
  /** Free text describing what makes this box unique (color, size, config) */
  boxSpecification: string;
  // Bale specific
  baleWeightKg: string;
  baleApproxPieces: string;
  baleSameType: boolean;
  baleMixDescription: string;
  baleSizesIncluded: string[];
  baleObservations: string;
  /** 'single_product' or 'mixed' */
  baleType: BaleType;
  /** Approximate composition for mixed bales, e.g. "70% feminino, 30% masculino" */
  baleComposition: string;
  // Kit specific
  kitItems: KitItem[];
  kitWhatsIncluded: string;
  // Variations
  hasVariations: boolean;
  // Images
  images: string[];
}

export interface PriceTierForm {
  minQty: string;
  maxQty: string;
  priceCents: number;
}

export interface KitItem {
  name: string;
  quantity: number;
  image?: string;
}

export function getStepsForSaleType(saleType: SaleType): StepDef[] {
  switch (saleType) {
    case 'unit':
      return [
        { key: 'sale_type', label: 'Tipo de Venda' },
        { key: 'basic_info', label: 'Informações Básicas' },
        { key: 'specs', label: 'Especificações' },
        { key: 'pricing', label: 'Venda e Preço' },
        { key: 'variations', label: 'Variações' },
        { key: 'images', label: 'Imagens' },
      ];
    case 'pair':
      return [
        { key: 'sale_type', label: 'Tipo de Venda' },
        { key: 'basic_info', label: 'Informações Básicas' },
        { key: 'specs', label: 'Especificações' },
        { key: 'pricing', label: 'Venda e Preço' },
        { key: 'variations', label: 'Variações' },
        { key: 'images', label: 'Imagens' },
      ];
    case 'closed_box':
      return [
        { key: 'sale_type', label: 'Tipo de Venda' },
        { key: 'basic_info', label: 'Informações Básicas' },
        { key: 'specs', label: 'Especificações do Produto' },
        { key: 'box_config', label: 'Configuração da Caixa' },
        { key: 'pricing', label: 'Venda e Preço' },
        { key: 'variations', label: 'Variações' },
        { key: 'images', label: 'Imagens' },
      ];
    case 'bale':
      return [
        { key: 'sale_type', label: 'Tipo de Venda' },
        { key: 'basic_info', label: 'Informações Básicas' },
        { key: 'bale_config', label: 'Tipo de Fardo' },
        { key: 'pricing', label: 'Venda e Preço' },
        { key: 'variations', label: 'Variações' },
        { key: 'images', label: 'Imagens' },
      ];
    case 'kit':
      return [
        { key: 'sale_type', label: 'Tipo de Venda' },
        { key: 'basic_info', label: 'Informações Básicas' },
        { key: 'kit_composition', label: 'Composição do Kit' },
        { key: 'pricing', label: 'Venda e Preço' },
        { key: 'images', label: 'Imagens' },
      ];
  }
}

export interface StepDef {
  key: string;
  label: string;
}

export const DEFAULT_FORM_DATA: ProductFormData = {
  saleType: 'unit',
  name: '', category: '', description: '', brand: '', model: '', material: '',
  condition: 'new', isInternational: false, gender: 'none', ageGroup: 'none',
  weightGrams: '', widthCm: '', heightCm: '', depthCm: '', ncmCode: '',
  warrantyDays: '', keywords: [],
  minOrderQuantity: '1', maxOrderQuantity: '', isCnpjOnly: false, stock: '',
  priceTiers: [{ minQty: '1', maxQty: '', priceCents: 0 }],
  unitsPerBox: '', boxWeightKg: '', boxWidthCm: '', boxHeightCm: '', boxDepthCm: '',
  boxAllSame: true, boxModelDescription: '', boxSpecification: '',
  baleWeightKg: '', baleApproxPieces: '', baleSameType: true, baleMixDescription: '',
  baleSizesIncluded: [], baleObservations: '', baleType: 'single_product', baleComposition: '',
  kitItems: [], kitWhatsIncluded: '',
  hasVariations: false,
  images: [],
};
