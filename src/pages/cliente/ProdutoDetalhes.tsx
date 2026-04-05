import { ParticlesBackground } from "@/components/cliente/ParticlesBackground";
import { BottomNav } from "@/components/cliente/BottomNav";
import { ReviewsList } from "@/components/cliente/ReviewsList";
import { BulkOrderGrid } from "@/components/cliente/BulkOrderGrid";
import { FreightCalculator } from "@/components/cliente/FreightCalculator";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { ArrowLeft, Heart, Share2, Star, ShoppingCart, Package, MessageCircle, Box, AlertCircle } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { useStores } from "@/hooks/useStores";
import { useFavorites } from "@/hooks/useFavorites";
import { useCart } from "@/hooks/useCart";
import { useProducts } from "@/hooks/useProducts";
import { useSupabaseReviews } from "@/hooks/useSupabaseReviews";
import { useSupabaseProducts } from "@/hooks/useSupabaseProducts";
import { useProductVariations } from "@/hooks/useProductVariations";
import { useProductPriceTiers } from "@/hooks/useProductPriceTiers";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatCurrencyFromDecimal } from "@/utils/currency";
import { getColorHex } from "@/utils/colorMap";
import ReportButton from "@/components/ReportButton";
import PriceHistoryChart from "@/components/cliente/PriceHistoryChart";
import SaveToFolderButton from "@/components/cliente/SaveToFolderButton";

const SALE_UNIT_LABELS: Record<string, string> = {
  unit: 'Unidade', pair: 'Par', kit: 'Kit', closed_box: 'Caixa Fechada', bale: 'Fardo',
};

const ProdutoDetalhes = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();

  const [selectedImage, setSelectedImage] = useState(0);
  const [supplierProfile, setSupplierProfile] = useState<any>(null);
  const [currentStock, setCurrentStock] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [showQuantityDialog, setShowQuantityDialog] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | undefined>();
  const [selectedColor, setSelectedColor] = useState<string | undefined>();
  const [variationError, setVariationError] = useState<string | null>(null);

  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const { addToCart } = useCart();
  const { stores } = useStores();
  const { getProductById, getRelatedProducts } = useProducts();
  const { products: supabaseProducts } = useSupabaseProducts();

  const routeId = id ?? "";
  const isUuid = useMemo(() => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(routeId), [routeId]);
  const supabaseProductById = useMemo(() => isUuid ? supabaseProducts.find((p) => p.id === routeId) ?? null : null, [isUuid, supabaseProducts, routeId]);
  const legacyProductId = useMemo(() => { const n = Number.parseInt(routeId, 10); return Number.isFinite(n) ? n : null; }, [routeId]);
  const legacyProduct = legacyProductId ? getProductById(legacyProductId) : undefined;

  // Load variations and price tiers
  const { variations, loading: variationsLoading } = useProductVariations(supabaseProductById?.id);
  const { tiers: priceTiers } = useProductPriceTiers(supabaseProductById?.id);
  const hasVariations = variations.length > 0;

  // B2B fields
  const saleUnit = (supabaseProductById as any)?.sale_unit || 'unit';
  const unitsPerSaleUnit = (supabaseProductById as any)?.units_per_sale_unit || 1;
  const minOrderQuantity = (supabaseProductById as any)?.min_order_quantity || 1;
  const productBrand = (supabaseProductById as any)?.brand || '';
  const productModel = (supabaseProductById as any)?.model || '';
  const productMaterial = (supabaseProductById as any)?.material || '';
  const productCondition = (supabaseProductById as any)?.condition || 'new';
  const productGender = (supabaseProductById as any)?.gender || 'none';
  const productAgeGroup = (supabaseProductById as any)?.age_group || 'none';
  const productWeightGrams = (supabaseProductById as any)?.weight_grams;
  const productWidthCm = (supabaseProductById as any)?.width_cm;
  const productHeightCm = (supabaseProductById as any)?.height_cm;
  const productDepthCm = (supabaseProductById as any)?.depth_cm;
  const productNcm = (supabaseProductById as any)?.ncm_code;
  const productIsInternational = (supabaseProductById as any)?.is_international;
  const productWarrantyDays = (supabaseProductById as any)?.warranty_days;
  const productWhatIsInTheBox = (supabaseProductById as any)?.what_is_in_the_box;

  const productIsKit = supabaseProductById?.is_kit || false;
  const productKitItems: { name: string; quantity: number }[] = useMemo(() => (supabaseProductById?.kit_items as any[]) || [], [supabaseProductById]);

  // Unique colors from variations with images
  const variationColors = useMemo(() => {
    const seen = new Map<string, { hex: string; imageUrl: string }>();
    variations.filter(v => v.color).forEach(v => {
      if (!seen.has(v.color!)) seen.set(v.color!, { hex: v.color_hex || getColorHex(v.color!) || '#ccc', imageUrl: v.image_url || '' });
    });
    return Array.from(seen.entries()).map(([name, data]) => ({ name, ...data }));
  }, [variations]);

  // Unique sizes/variation values
  const variationSizes = useMemo(() => {
    const vals = variations.filter(v => v.variation_value || v.size).map(v => v.variation_value || v.size!);
    return [...new Set(vals)];
  }, [variations]);

  // Variation type label
  const variationLabel = useMemo(() => {
    const v = variations.find(v => v.variation_label);
    return v?.variation_label || 'Tamanho';
  }, [variations]);

  // Check if all required variations are selected
  const hasColors = variationColors.length > 0;
  const hasSizes = variationSizes.length > 0;
  const allVariationsSelected = useMemo(() => {
    if (!hasVariations) return true;
    if (hasColors && !selectedColor) return false;
    if (hasSizes && !selectedSize) return false;
    return true;
  }, [hasVariations, hasColors, hasSizes, selectedColor, selectedSize]);

  const getVariationStock = (color?: string, size?: string) => {
    const v = variations.find(vr =>
      (color ? vr.color === color : !vr.color) &&
      (size ? (vr.variation_value === size || vr.size === size) : !vr.size)
    );
    return v?.stock ?? 0;
  };

  // Get the selected variation's price if it has one
  const selectedVariation = useMemo(() => {
    if (!hasVariations) return null;
    return variations.find(v =>
      (hasColors ? v.color === selectedColor : true) &&
      (hasSizes ? (v.variation_value === selectedSize || v.size === selectedSize) : true)
    ) || null;
  }, [variations, hasVariations, hasColors, hasSizes, selectedColor, selectedSize]);

  const product = useMemo(() => {
    if (supabaseProductById) {
      const images = (supabaseProductById.imagens ?? []).filter(Boolean);
      const description = supabaseProductById.descricao_longa || supabaseProductById.descricao_curta || "";
      return {
        id: 0, name: supabaseProductById.nome,
        images: images.length ? images : [""],
        priceNumber: supabaseProductById.preco,
        price: formatCurrencyFromDecimal(supabaseProductById.preco),
        description, specs: [] as Array<{ label: string; value: string }>,
        category: supabaseProductById.categoria_id ?? "",
        supplierUuid: supabaseProductById.id,
        supplierProfileId: supabaseProductById.supplier_id,
        storeId: supabaseProductById.supplier_id,
      };
    }
    return legacyProduct;
  }, [supabaseProductById, legacyProduct]);

  const { reviews, loading: reviewsLoading } = useSupabaseReviews(
    (supabaseProductById?.id ?? (legacyProduct as any)?.supplierUuid) || undefined
  );

  const store = product ? stores.find((s) => s.id === (product as any).storeId) : undefined;
  const productId = legacyProductId ?? 0;
  const isProductFavorite = isFavorite(productId);
  const realRating = supabaseProductById?.rating_medio ?? (legacyProduct as any)?.rating ?? 0;
  const realReviewCount = supabaseProductById?.total_reviews ?? (legacyProduct as any)?.reviews ?? 0;
  const realSalesCount = supabaseProductById?.vendas_count ?? 0;

  useEffect(() => {
    const fetchSupplierData = async () => {
      if (!product?.supplierProfileId) return;
      try {
        const { data: profiles, error } = await supabase.rpc('get_public_store_profile', { _id: product.supplierProfileId });
        if (error) {
          const { data: viewProfile } = await supabase.from('public_supplier_profiles').select('id, nome, foto_perfil_url, banner_loja_url, descricao_loja').eq('id', product.supplierProfileId).maybeSingle();
          if (viewProfile) setSupplierProfile(viewProfile);
          return;
        }
        if (profiles && profiles.length > 0) setSupplierProfile(profiles[0]);
        if (product.supplierUuid) {
          const sp = supabaseProducts.find(p => p.id === product.supplierUuid);
          if (sp) setCurrentStock(sp.estoque);
        }
      } catch (error) { console.error('Error in fetchSupplierData:', error); }
    };
    fetchSupplierData();
  }, [product, supabaseProducts]);

  useEffect(() => {
    if (selectedColor && variationColors.length > 0) {
      const colorData = variationColors.find(c => c.name === selectedColor);
      if (colorData?.imageUrl) {
        const imgs = displayImages;
        const idx = imgs.indexOf(colorData.imageUrl);
        if (idx >= 0) setSelectedImage(idx);
      }
    }
  }, [selectedColor, variationColors]);

  // Clear variation error when selections change
  useEffect(() => {
    if (allVariationsSelected) setVariationError(null);
  }, [allVariationsSelected]);

  const handleToggleFavorite = () => { isProductFavorite ? removeFavorite(productId) : addFavorite(productId); };

  const handleShare = async () => {
    const envUrl = (import.meta as any).env?.VITE_PUBLIC_SITE_URL as string | undefined;
    const baseUrl = envUrl ? envUrl.replace(/\/$/, "") : window.location.origin;
    const productUrl = `${baseUrl}/p/${product?.supplierUuid || ""}`;
    const copyToClipboard = async () => {
      try { await navigator.clipboard.writeText(productUrl); } catch {
        const t = document.createElement("textarea"); t.value = productUrl; t.style.position = "fixed"; t.style.left = "-999999px";
        document.body.appendChild(t); t.select(); document.execCommand("copy"); document.body.removeChild(t);
      }
      toast({ title: "Link copiado!", description: "O link do produto foi copiado para a área de transferência." });
    };
    if (navigator.share) {
      try { await navigator.share({ title: product?.name || "Produto", text: `Confira este produto: ${product?.name}`, url: productUrl }); return; }
      catch (error) { if ((error as Error).name === "AbortError") return; }
    }
    await copyToClipboard();
  };

  const buildVariationsMap = (): Record<string, string> => {
    const map: Record<string, string> = {};
    if (selectedColor) map['Cor'] = selectedColor;
    if (selectedSize) map[variationLabel] = selectedSize;
    return map;
  };

  const getVariationImage = (): string | undefined => {
    if (selectedColor) {
      const colorData = variationColors.find(c => c.name === selectedColor);
      return colorData?.imageUrl || undefined;
    }
    return undefined;
  };

  const validateAndAddToCart = (qty: number, thenNavigate?: string) => {
    if (!product?.supplierProfileId) {
      toast({ title: 'Erro', description: 'Informações do fornecedor não encontradas.', variant: 'destructive' });
      return;
    }

    // Enforce variation selection
    if (hasVariations && !allVariationsSelected) {
      const missing: string[] = [];
      if (hasColors && !selectedColor) missing.push('cor');
      if (hasSizes && !selectedSize) missing.push(variationLabel.toLowerCase());
      setVariationError(`Selecione: ${missing.join(', ')}`);
      toast({ title: 'Selecione as variações', description: `Escolha ${missing.join(' e ')} antes de adicionar ao carrinho.`, variant: 'destructive' });
      return;
    }

    const variationsMap = buildVariationsMap();
    const varImage = getVariationImage();
    const effectivePrice = selectedVariation?.price ?? product.priceNumber;

    addToCart({
      productId: product.supplierUuid || '', name: product.name, price: effectivePrice,
      image: varImage || product.images[0], storeId: product.supplierProfileId || '',
      storeName: supplierProfile?.nome || 'Loja',
      selectedSize, selectedColor,
      variations: Object.keys(variationsMap).length > 0 ? variationsMap : undefined,
      variationImage: varImage,
    }, qty);
    if (thenNavigate) navigate(thenNavigate);
  };

  const handleBulkAddToCart = (items: Array<{ color: string; colorHex: string; size: string; quantity: number; price: number; imageUrl: string }>) => {
    if (!product?.supplierProfileId) return;
    items.forEach(item => {
      const variationsMap: Record<string, string> = {};
      if (item.color) variationsMap['Cor'] = item.color;
      if (item.size) variationsMap[variationLabel] = item.size;

      addToCart({
        productId: product.supplierUuid || '',
        name: product.name,
        price: item.price,
        image: item.imageUrl || product.images[0],
        storeId: product.supplierProfileId || '',
        storeName: supplierProfile?.nome || 'Loja',
        selectedSize: item.size || undefined,
        selectedColor: item.color || undefined,
        variations: Object.keys(variationsMap).length > 0 ? variationsMap : undefined,
        variationImage: item.imageUrl || undefined,
      }, item.quantity);
    });
    toast({ title: "Adicionado ao carrinho", description: `${items.reduce((s, i) => s + i.quantity, 0)} peças adicionadas.` });
  };

  const displayImages = useMemo(() => {
    if (!product) return [];
    const imgs = [...product.images];
    variationColors.forEach(c => {
      if (c.imageUrl && !imgs.includes(c.imageUrl)) imgs.push(c.imageUrl);
    });
    return imgs;
  }, [product?.images, variationColors]);

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Produto não encontrado</h1>
          <Button onClick={() => navigate("/cliente")} className="bg-primary hover:bg-primary/90 text-white">Voltar para Home</Button>
        </div>
      </div>
    );
  }

  const relatedProducts = getRelatedProducts(product.id, product.category, 4);

  // Effective display price considering selected variation
  const displayPrice = selectedVariation?.price
    ? formatCurrencyFromDecimal(selectedVariation.price)
    : product.price;
  const displayPriceNumber = selectedVariation?.price ?? product.priceNumber;

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-6">
      <ParticlesBackground />

      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-full transition-colors"><ArrowLeft className="h-6 w-6" /></button>
          <div className="flex items-center gap-2">
            <button onClick={() => {
              const envUrl = (import.meta as any).env?.VITE_PUBLIC_SITE_URL as string | undefined;
              const baseUrl = (envUrl ? envUrl.replace(/\/$/, "") : window.location.origin);
              const productUrl = `${baseUrl}/p/${product?.supplierUuid || ""}`;
              window.open(`https://wa.me/?text=${encodeURIComponent(`Confira este produto: ${product?.name} - ${productUrl}`)}`, '_blank');
            }} className="p-2 hover:bg-muted rounded-full transition-colors" title="Compartilhar no WhatsApp">
              <MessageCircle className="h-6 w-6 hover:text-primary transition-colors" />
            </button>
            <button onClick={handleShare} className="p-2 hover:bg-muted rounded-full transition-colors" title="Copiar link"><Share2 className="h-6 w-6 hover:text-primary transition-colors" /></button>
            <button onClick={handleToggleFavorite} className="p-2 hover:bg-muted rounded-full transition-colors"><Heart className={`h-6 w-6 transition-colors ${isProductFavorite ? "fill-red-500 text-red-500" : "hover:text-primary"}`} /></button>
            {product?.supplierUuid && (
              <SaveToFolderButton type="product" referenceId={product.supplierUuid} />
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 relative z-10 max-w-7xl">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8 lg:items-start">
          {/* Images */}
          <div className="lg:col-span-7 mb-6 lg:mb-0">
            <div className="lg:flex lg:gap-4">
              <div className="hidden lg:flex lg:flex-col gap-2 order-1">
                {displayImages.map((image, index) => (
                  <button key={index} onClick={() => setSelectedImage(index)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${selectedImage === index ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50"}`}>
                    <img src={image} alt={`${product.name} ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
              <div className="flex-1 order-2">
                <div className="aspect-square rounded-2xl overflow-hidden bg-muted max-w-lg mx-auto lg:max-w-none">
                  <img src={displayImages[selectedImage] || product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex gap-2 justify-center mt-4 lg:hidden">
                  {displayImages.map((image, index) => (
                    <button key={index} onClick={() => setSelectedImage(index)}
                      className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${selectedImage === index ? "border-primary scale-105" : "border-border"}`}>
                      <img src={image} alt={`${product.name} ${index + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-5">
            {supplierProfile && product.supplierProfileId && (
              <div onClick={() => navigate(`/cliente/loja/${product.supplierProfileId}`)} className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
                <Avatar className="h-10 w-10 border-2 border-primary/20">
                  <AvatarImage src={supplierProfile.foto_perfil_url} alt={supplierProfile.nome} />
                  <AvatarFallback className="bg-primary/10 text-primary">{supplierProfile.nome.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm hover:text-primary transition-colors">{supplierProfile.nome}</p>
                  <p className="text-xs text-muted-foreground">Ver loja</p>
                </div>
              </div>
            )}

            <div>
              <h1 className="text-xl lg:text-2xl font-bold mb-3">{product.name}</h1>
                <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < Math.floor(realRating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                  ))}
                  <span className="text-sm font-medium ml-1">{realRating.toFixed(1)}</span>
                </div>
                <span className="text-sm text-muted-foreground">({realReviewCount} avaliações)</span>
                {realSalesCount > 0 && <span className="text-sm text-orange-600 font-medium">{realSalesCount} vendidos</span>}
                <Badge variant={currentStock > 0 ? "outline" : "destructive"} className="flex items-center gap-1 text-xs">
                  <Package className="h-3 w-3" />{currentStock > 0 ? `${currentStock} em estoque` : 'Sem estoque'}
                </Badge>
              </div>

              {/* Highlight badges */}
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="secondary" className="text-xs">
                  {productCondition === 'new' ? '✅ Novo' : productCondition === 'refurbished' ? '🔄 Recondicionado' : '📦 Usado'}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {productIsInternational ? '🌍 Internacional' : '🇧🇷 Nacional'}
                </Badge>
                {productWarrantyDays && (
                  <Badge variant="secondary" className="text-xs">🛡️ Garantia {productWarrantyDays} dias</Badge>
                )}
                {productBrand && <Badge variant="outline" className="text-xs">🏷️ {productBrand}</Badge>}
              </div>
              {product.supplierUuid && <div className="mt-2"><ReportButton targetType="product" targetId={product.supplierUuid} /></div>}
            </div>

            {/* Sale unit badge - enhanced for box/bale */}
            {saleUnit !== 'unit' && (() => {
              const meta = (supabaseProductById as any)?.variacoes;
              const isBoxMeta = meta?._saleTypeMeta === 'closed_box';
              const isBaleMeta = meta?._saleTypeMeta === 'bale';
              const boxSpec = meta?.boxSpecification || productWhatIsInTheBox;
              const baleType = meta?.baleType;
              const baleWeight = meta?.baleWeightKg;
              const balePieces = meta?.baleApproxPieces || unitsPerSaleUnit;
              const baleSizes = meta?.baleSizesIncluded;
              const baleMix = meta?.baleMixDescription;
              const baleComposition = meta?.baleComposition;

              return (
                <div className="space-y-3">
                  {/* Main badge */}
                  <div className="flex items-center gap-2 bg-primary/10 rounded-lg px-4 py-3">
                    <Box className="h-5 w-5 text-primary" />
                    <div>
                      <span className="text-sm font-bold text-primary">
                        {SALE_UNIT_LABELS[saleUnit]}
                      </span>
                      {isBoxMeta && unitsPerSaleUnit > 1 && (
                        <p className="text-xs text-primary/80">Contém {unitsPerSaleUnit} unidades por caixa</p>
                      )}
                      {isBaleMeta && (
                        <p className="text-xs text-primary/80">
                          {baleWeight ? `${baleWeight}kg` : ''}
                          {balePieces ? ` • ~${balePieces} peças` : ''}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Box specification highlight */}
                  {isBoxMeta && boxSpec && (
                    <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-4">
                      <p className="text-xs font-semibold text-primary mb-1">📋 Especificação desta caixa</p>
                      <p className="text-sm font-medium">{boxSpec}</p>
                    </div>
                  )}

                  {/* Bale mix details */}
                  {isBaleMeta && baleType === 'mixed' && (
                    <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-4 space-y-2">
                      <p className="text-xs font-semibold text-primary">🧺 Detalhes do Fardo Sortido</p>
                      {baleSizes && baleSizes.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          <span className="text-xs text-muted-foreground">Tamanhos:</span>
                          {baleSizes.map((s: string) => (
                            <Badge key={s} variant="secondary" className="text-xs py-0">{s}</Badge>
                          ))}
                        </div>
                      )}
                      {baleMix && <p className="text-sm text-muted-foreground">{baleMix}</p>}
                      {baleComposition && (
                        <p className="text-xs text-muted-foreground">📊 Composição: {baleComposition}</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="py-4 border-y border-border">
              <p className="text-3xl font-bold text-primary">{displayPrice}</p>
              {saleUnit === 'closed_box' && unitsPerSaleUnit > 1 && (
                <p className="text-sm text-muted-foreground mt-1">
                  {formatCurrencyFromDecimal(displayPriceNumber / unitsPerSaleUnit)}/unidade
                </p>
              )}
              {saleUnit === 'bale' && (() => {
                const bw = (supabaseProductById as any)?.variacoes?.baleWeightKg;
                return bw ? (
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatCurrencyFromDecimal(displayPriceNumber / bw)}/kg
                  </p>
                ) : null;
              })()}
              {priceTiers.length > 1 && <p className="text-xs text-muted-foreground mt-1">Preço base • veja faixas de desconto abaixo</p>}
              {minOrderQuantity > 1 && (
                <p className="text-xs text-orange-600 font-medium mt-1">
                  Pedido mínimo: {minOrderQuantity} {SALE_UNIT_LABELS[saleUnit] ? SALE_UNIT_LABELS[saleUnit].toLowerCase() + (minOrderQuantity > 1 ? 's' : '') : 'unidades'}
                </p>
              )}
            </div>

            {/* Price tiers table */}
            {priceTiers.length > 0 && (
              <div className="bg-muted/30 rounded-lg p-3 border">
                <p className="text-xs font-semibold mb-2">💰 Preços por quantidade</p>
                <div className="space-y-1">
                  {priceTiers.map((t, idx) => {
                    const tierLabel = SALE_UNIT_LABELS[saleUnit]?.toLowerCase() || 'unid.';
                    const range = `${t.min_quantity}${t.max_quantity ? ` - ${t.max_quantity}` : '+'}`;
                    return (
                      <div key={idx} className="flex justify-between text-xs px-2 py-1">
                        <span>
                          {range} {tierLabel}.
                          {saleUnit === 'closed_box' && unitsPerSaleUnit > 1 && (
                            <span className="text-muted-foreground ml-1">
                              ({(parseInt(String(t.min_quantity)) || 1) * unitsPerSaleUnit}
                              {t.max_quantity ? ` - ${parseInt(String(t.max_quantity)) * unitsPerSaleUnit}` : '+'} un)
                            </span>
                          )}
                        </span>
                        <span className="font-semibold text-primary">
                          {formatCurrencyFromDecimal(t.price_per_unit)}/{tierLabel}
                          {saleUnit === 'closed_box' && unitsPerSaleUnit > 1 && (
                            <span className="text-muted-foreground font-normal ml-1">
                              ({formatCurrencyFromDecimal(t.price_per_unit / unitsPerSaleUnit)}/un)
                            </span>
                          )}
                          {saleUnit === 'bale' && (() => {
                            const bw = (supabaseProductById as any)?.variacoes?.baleWeightKg;
                            return bw ? (
                              <span className="text-muted-foreground font-normal ml-1">
                                ({formatCurrencyFromDecimal(t.price_per_unit / bw)}/kg)
                              </span>
                            ) : null;
                          })()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Price History Chart */}
            {supabaseProductById?.id && (
              <PriceHistoryChart 
                productId={supabaseProductById.id} 
                currentPrice={product.priceNumber} 
              />
            )}

            <div>
              <h3 className="text-sm font-semibold mb-2">Descrição</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">{product.description}</p>
            </div>

            {/* Color thumbnails */}
            {variationColors.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2">
                  🎨 Cor {selectedColor && <span className="text-muted-foreground font-normal">— {selectedColor}</span>}
                  {!selectedColor && <span className="text-destructive font-normal text-xs ml-2">* Obrigatório</span>}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {variationColors.map(color => (
                    <button key={color.name} onClick={() => {
                      setSelectedColor(color.name);
                      if (color.imageUrl) {
                        const idx = displayImages.indexOf(color.imageUrl);
                        if (idx >= 0) setSelectedImage(idx);
                      }
                    }}
                      className={`relative rounded-lg overflow-hidden border-2 transition-all ${selectedColor === color.name ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'}`}>
                      {color.imageUrl ? (
                        <img src={color.imageUrl} alt={color.name} className="w-12 h-12 object-cover" />
                      ) : (
                        <div className="w-12 h-12 flex items-center justify-center" style={{ backgroundColor: color.hex }}>
                          <span className="text-[10px] text-white font-bold drop-shadow">{color.name.slice(0, 2)}</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size/variation buttons */}
            {variationSizes.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2">
                  📏 {variationLabel}
                  {!selectedSize && <span className="text-destructive font-normal text-xs ml-2">* Obrigatório</span>}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {variationSizes.map(size => {
                    const stockForSize = selectedColor
                      ? getVariationStock(selectedColor, size)
                      : variations.filter(v => (v.variation_value === size || v.size === size)).reduce((s, v) => s + v.stock, 0);
                    const outOfStock = stockForSize === 0;
                    return (
                      <Badge key={size}
                        variant={selectedSize === size ? "default" : "outline"}
                        className={`cursor-pointer select-none px-3 py-1 ${outOfStock ? 'opacity-40 line-through cursor-not-allowed' : ''}`}
                        onClick={() => !outOfStock && setSelectedSize(size)}>
                        {size}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Variation error message */}
            {variationError && (
              <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 rounded-lg p-3">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{variationError}</span>
              </div>
            )}

            {/* Selected variation summary */}
            {hasVariations && allVariationsSelected && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                <p className="text-xs font-semibold text-primary mb-1">✅ Configuração selecionada:</p>
                <p className="text-sm font-medium">
                  {Object.entries(buildVariationsMap()).map(([k, v]) => `${v}`).join(' • ')}
                </p>
                {selectedVariation && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Estoque: {selectedVariation.stock} unid.
                    {selectedVariation.price && ` • ${formatCurrencyFromDecimal(selectedVariation.price)}`}
                  </p>
                )}
              </div>
            )}

            {/* Kit */}
            {productIsKit && productKitItems.length > 0 && (
              <div className="bg-muted/30 rounded-lg p-4">
                <h3 className="text-sm font-semibold mb-2">📦 Itens do Kit</h3>
                <ul className="space-y-1">
                  {productKitItems.map((item, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground">• {item.quantity}x {item.name}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Product Specifications - Shopee style */}
            <div className="bg-muted/30 rounded-lg p-4">
              <h3 className="text-sm font-semibold mb-3">📋 Especificações do Produto</h3>
              <Table>
                <TableBody>
                  {/* Informações Gerais */}
                  {productBrand && <TableRow className="border-b border-border/50"><TableCell className="text-muted-foreground py-2 px-2 text-xs w-1/3 bg-muted/50">Marca</TableCell><TableCell className="py-2 px-2 text-xs font-medium">{productBrand}</TableCell></TableRow>}
                  {productModel && <TableRow className="border-b border-border/50"><TableCell className="text-muted-foreground py-2 px-2 text-xs w-1/3 bg-muted/50">Modelo</TableCell><TableCell className="py-2 px-2 text-xs font-medium">{productModel}</TableCell></TableRow>}
                  <TableRow className="border-b border-border/50"><TableCell className="text-muted-foreground py-2 px-2 text-xs w-1/3 bg-muted/50">Condição</TableCell><TableCell className="py-2 px-2 text-xs font-medium">{productCondition === 'new' ? 'Novo' : productCondition === 'refurbished' ? 'Recondicionado' : 'Usado'}</TableCell></TableRow>
                  <TableRow className="border-b border-border/50"><TableCell className="text-muted-foreground py-2 px-2 text-xs w-1/3 bg-muted/50">Origem</TableCell><TableCell className="py-2 px-2 text-xs font-medium">{productIsInternational ? '🌍 Internacional' : '🇧🇷 Nacional'}</TableCell></TableRow>
                  {productMaterial && <TableRow className="border-b border-border/50"><TableCell className="text-muted-foreground py-2 px-2 text-xs w-1/3 bg-muted/50">Material</TableCell><TableCell className="py-2 px-2 text-xs font-medium">{productMaterial}</TableCell></TableRow>}
                  {productGender !== 'none' && <TableRow className="border-b border-border/50"><TableCell className="text-muted-foreground py-2 px-2 text-xs w-1/3 bg-muted/50">Gênero</TableCell><TableCell className="py-2 px-2 text-xs font-medium">{{ male: 'Masculino', female: 'Feminino', unisex: 'Unissex', kids: 'Infantil' }[productGender] || productGender}</TableCell></TableRow>}
                  {productAgeGroup !== 'none' && <TableRow className="border-b border-border/50"><TableCell className="text-muted-foreground py-2 px-2 text-xs w-1/3 bg-muted/50">Faixa Etária</TableCell><TableCell className="py-2 px-2 text-xs font-medium">{{ adult: 'Adulto', teen: 'Adolescente', child: 'Criança', baby: 'Bebê' }[productAgeGroup] || productAgeGroup}</TableCell></TableRow>}
                  {productWarrantyDays && <TableRow className="border-b border-border/50"><TableCell className="text-muted-foreground py-2 px-2 text-xs w-1/3 bg-muted/50">Garantia</TableCell><TableCell className="py-2 px-2 text-xs font-medium">{productWarrantyDays} dias</TableCell></TableRow>}
                  {/* Dimensões e Peso */}
                  {productWeightGrams && <TableRow className="border-b border-border/50"><TableCell className="text-muted-foreground py-2 px-2 text-xs w-1/3 bg-muted/50">Peso</TableCell><TableCell className="py-2 px-2 text-xs font-medium">{productWeightGrams >= 1000 ? `${(productWeightGrams / 1000).toFixed(1)} kg` : `${productWeightGrams}g`}</TableCell></TableRow>}
                  {productWidthCm && productHeightCm && productDepthCm && (
                    <TableRow className="border-b border-border/50"><TableCell className="text-muted-foreground py-2 px-2 text-xs w-1/3 bg-muted/50">Dimensões (L×A×P)</TableCell><TableCell className="py-2 px-2 text-xs font-medium">{productWidthCm} × {productHeightCm} × {productDepthCm} cm</TableCell></TableRow>
                  )}
                  {productNcm && <TableRow className="border-b border-border/50"><TableCell className="text-muted-foreground py-2 px-2 text-xs w-1/3 bg-muted/50">NCM</TableCell><TableCell className="py-2 px-2 text-xs font-medium">{productNcm}</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>

            {/* What's in the box */}
            {productWhatIsInTheBox && (
              <div className="bg-muted/30 rounded-lg p-4">
                <h3 className="text-sm font-semibold mb-2">📦 O que vem na caixa</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{productWhatIsInTheBox}</p>
              </div>
            )}

            {/* Seller info */}
            {supplierProfile && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4" onClick={() => navigate(`/cliente/loja/${product.supplierProfileId}`)} style={{ cursor: 'pointer' }}>
                <p className="text-xs text-muted-foreground mb-1">Vendido por</p>
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8 border border-primary/20">
                    <AvatarImage src={supplierProfile.foto_perfil_url} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">{supplierProfile.nome?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold text-primary">{supplierProfile.nome}</p>
                    <p className="text-xs text-muted-foreground">Ver loja →</p>
                  </div>
                </div>
              </div>
            )}

            {/* Freight Calculator */}
            {product.supplierProfileId && (
              <FreightCalculator 
                supplierId={product.supplierProfileId} 
                subtotal={displayPriceNumber}
              />
            )}

            {/* Bulk Order Grid */}
            {hasVariations && (
              <BulkOrderGrid
                variations={variations}
                basePrice={product.priceNumber}
                minQuantity={minOrderQuantity > 1 ? minOrderQuantity : undefined}
                priceTiers={priceTiers}
                onAddToCart={handleBulkAddToCart}
              />
            )}

            {/* Desktop buttons - show for ALL products */}
            <div className="hidden lg:flex gap-3 pt-2">
              <Button variant="outline" className="flex-1 border-primary text-primary hover:bg-primary/10 gap-2 h-12" disabled={currentStock === 0}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (currentStock === 0) return; validateAndAddToCart(1, '/cliente/carrinho'); }}>
                <ShoppingCart className="h-5 w-5" />Adicionar ao Carrinho
              </Button>
              <Button className="flex-1 bg-primary hover:bg-primary/90 text-white h-12" disabled={currentStock === 0}
                onClick={(e) => { e.preventDefault(); if (currentStock === 0) return; if (hasVariations && !allVariationsSelected) { validateAndAddToCart(1); return; } setQuantity(1); setShowQuantityDialog(true); }}>
                Comprar Agora
              </Button>
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div className="mt-10 lg:mt-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg lg:text-xl font-bold">Avaliações dos Clientes</h2>
            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center gap-1"><Star className="h-5 w-5 fill-yellow-400 text-yellow-400" /><span className="font-bold text-lg">{realRating.toFixed(1)}</span></div>
              <span className="text-muted-foreground">({realReviewCount} avaliações)</span>
            </div>
          </div>
          <Card className="bg-white border shadow-sm p-5"><ReviewsList reviews={reviews} loading={reviewsLoading} /></Card>
        </div>

        {/* Related */}
        {relatedProducts.length > 0 && (
          <div className="mt-10 lg:mt-16">
            <h2 className="text-lg lg:text-xl font-bold mb-6">Você também pode gostar</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {relatedProducts.map((rp) => (
                <Card key={rp.id} onClick={() => { setSelectedImage(0); navigate(`/cliente/produto/${rp.id}`); }}
                  className="bg-white border shadow-sm overflow-hidden hover:shadow-lg transition-all cursor-pointer group">
                  <div className="aspect-square overflow-hidden"><img src={rp.images[0]} alt={rp.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" /></div>
                  <div className="p-3"><p className="text-sm mb-2 line-clamp-2 group-hover:text-primary transition-colors">{rp.name}</p><p className="text-primary font-bold">{rp.price}</p></div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Quantity Dialog */}
        <Dialog open={showQuantityDialog} onOpenChange={setShowQuantityDialog}>
          <DialogContent>
            <div className="space-y-4">
              <h2 className="text-xl font-bold">Selecione a quantidade</h2>
              {allVariationsSelected && hasVariations && (
                <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-2">
                  {Object.entries(buildVariationsMap()).map(([k, v]) => `${v}`).join(' • ')}
                </p>
              )}
              <div className="flex items-center gap-4">
                <Button variant="outline" onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</Button>
                <Input type="number" value={quantity} onChange={(e) => { const v = parseInt(e.target.value); if (v > 0 && v <= currentStock) setQuantity(v); }} className="text-center w-20" min="1" max={currentStock} />
                <Button variant="outline" onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}>+</Button>
                <span className="text-sm text-muted-foreground">Máximo: {currentStock}</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowQuantityDialog(false)} className="flex-1">Cancelar</Button>
                <Button onClick={() => { validateAndAddToCart(quantity, '/cliente/checkout'); setShowQuantityDialog(false); }} className="flex-1 bg-primary hover:bg-primary/90 text-white">Confirmar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Mobile buttons - show for ALL products */}
        <div className="fixed bottom-20 left-0 right-0 bg-white/95 backdrop-blur-lg border-t shadow-sm p-4 z-30 lg:hidden">
          <div className="container mx-auto flex gap-3">
            <Button variant="outline" className="flex-1 border-primary text-primary hover:bg-primary/10 gap-2" disabled={currentStock === 0}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (currentStock === 0) { toast({ title: 'Produto sem estoque', variant: 'destructive' }); return; } validateAndAddToCart(1, '/cliente/carrinho'); }}>
              <ShoppingCart className="h-5 w-5" />Adicionar
            </Button>
            <Button className="flex-1 bg-primary hover:bg-primary/90 text-white" disabled={currentStock === 0}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (currentStock === 0) { toast({ title: 'Produto sem estoque', variant: 'destructive' }); return; } if (hasVariations && !allVariationsSelected) { validateAndAddToCart(1); return; } setQuantity(1); setShowQuantityDialog(true); }}>
              Comprar
            </Button>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default ProdutoDetalhes;
