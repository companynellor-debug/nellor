import { ParticlesBackground } from "@/components/cliente/ParticlesBackground";
import { BottomNav } from "@/components/cliente/BottomNav";
import { ReviewsList } from "@/components/cliente/ReviewsList";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Heart, Share2, Star, Store, ShoppingCart, Package } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useStores } from "@/hooks/useStores";
import { useFavorites } from "@/hooks/useFavorites";
import { useCart } from "@/hooks/useCart";
import { useProducts } from "@/hooks/useProducts";
import { useSupabaseReviews } from "@/hooks/useSupabaseReviews";
import { useSupabaseProducts } from "@/hooks/useSupabaseProducts";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const ProdutoDetalhes = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState(0);
  const [supplierProfile, setSupplierProfile] = useState<any>(null);
  const [currentStock, setCurrentStock] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [showQuantityDialog, setShowQuantityDialog] = useState(false);
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const { addToCart } = useCart();
  const { stores } = useStores();
  const { getProductById, getRelatedProducts } = useProducts();

  const productId = id ? parseInt(id) : 1;
  const product = getProductById(productId);
  const { reviews, loading: reviewsLoading } = useSupabaseReviews(product?.supplierUuid);
  const { products: supabaseProducts } = useSupabaseProducts();
  const store = product ? stores.find(s => s.id === product.storeId) : undefined;
  const isProductFavorite = isFavorite(productId);

  // Buscar perfil do fornecedor e estoque atual
  useEffect(() => {
    const fetchSupplierData = async () => {
      if (!product?.supplierProfileId) {
        console.log('No supplierProfileId found for product:', product);
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('id, nome, foto_perfil_url, banner_loja_url, descricao_loja')
          .eq('id', product.supplierProfileId)
          .maybeSingle();

        if (error) {
          console.error('Error fetching supplier profile:', error);
          return;
        }

        if (profile) {
          setSupplierProfile(profile);
        }

        // Buscar estoque atual do produto
        if (product.supplierUuid) {
          const supabaseProduct = supabaseProducts.find(p => p.id === product.supplierUuid);
          if (supabaseProduct) {
            setCurrentStock(supabaseProduct.estoque);
          }
        }
      } catch (error) {
        console.error('Error in fetchSupplierData:', error);
      }
    };

    fetchSupplierData();
  }, [product, supabaseProducts]);

  const handleToggleFavorite = () => {
    if (isProductFavorite) {
      removeFavorite(productId);
    } else {
      addFavorite(productId);
    }
  };

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Produto não encontrado</h1>
          <Button onClick={() => navigate("/cliente")} className="bg-primary hover:bg-primary/90 text-white">
            Voltar para Home
          </Button>
        </div>
      </div>
    );
  }

  const relatedProducts = getRelatedProducts(product.id, product.category, 2);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-white pb-24">
      {/* Header - Minimal */}
      <header className="sticky top-0 z-40 bg-transparent px-4 py-4">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)} 
            className="w-10 h-10 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-all"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <button 
            onClick={handleToggleFavorite} 
            className="w-10 h-10 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-all"
          >
            <Heart className={`h-5 w-5 transition-colors ${isProductFavorite ? "fill-red-500 text-red-500" : "text-foreground"}`} />
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 relative z-10">
        {/* Hero Image Section */}
        <div className="flex flex-col items-center mb-8">
          {/* Main Image with Circular Background */}
          <div className="relative w-full max-w-sm aspect-square flex items-center justify-center mb-6">
            {/* Circular gradient background */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-64 rounded-full bg-gradient-to-br from-primary/10 via-primary/5 to-transparent blur-xl"></div>
              <div className="absolute w-52 h-52 rounded-full border-2 border-primary/10"></div>
              <div className="absolute w-44 h-44 rounded-full border border-primary/5"></div>
            </div>
            {/* Product Image */}
            <img 
              src={product.images[selectedImage]} 
              alt={product.name} 
              className="relative z-10 w-4/5 h-4/5 object-contain drop-shadow-2xl" 
            />
          </div>

          {/* Image Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex gap-3 justify-center">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`w-14 h-14 rounded-2xl overflow-hidden border-2 transition-all ${
                    selectedImage === index 
                      ? "border-primary shadow-md scale-105" 
                      : "border-transparent bg-white/60 hover:bg-white"
                  }`}
                >
                  <img src={image} alt={`${product.name} ${index + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info Section */}
        <div className="bg-white rounded-3xl shadow-sm p-6 mb-6">
          {/* Product Name */}
          <h1 className="text-2xl font-bold text-foreground mb-3">{product.name}</h1>

          {/* Price Row */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-3xl font-bold text-primary">{product.price}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-2 py-1 rounded-full">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span className="font-medium">{product.rating.toFixed(1)}</span>
                <span className="text-amber-500/70">({product.reviews} avaliações)</span>
              </div>
            </div>
          </div>

          {/* Stock Badge */}
          <div className="flex items-center gap-3 mb-4">
            <Badge 
              variant={currentStock > 0 ? "secondary" : "destructive"} 
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${
                currentStock > 0 ? "bg-emerald-50 text-emerald-600 border-emerald-200" : ""
              }`}
            >
              <Package className="h-3.5 w-3.5" />
              {currentStock > 0 ? `${currentStock} disponíveis` : 'Sem estoque'}
            </Badge>
            <span className="text-sm text-emerald-600 font-medium">Frete Grátis</span>
          </div>

          {/* Description */}
          <p className="text-muted-foreground leading-relaxed text-sm">{product.description}</p>
        </div>

        {/* Store Info Card */}
        {supplierProfile && product.supplierProfileId && (
          <div
            onClick={() => navigate(`/cliente/loja/${product.supplierProfileId}`)}
            className="bg-white rounded-3xl shadow-sm p-4 mb-6 cursor-pointer hover:shadow-md transition-all flex items-center gap-4"
          >
            <Avatar className="h-14 w-14 border-2 border-primary/10">
              <AvatarImage src={supplierProfile.foto_perfil_url} alt={supplierProfile.nome} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {supplierProfile.nome.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-semibold text-foreground">{supplierProfile.nome}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                <span>{product.rating.toFixed(1)}</span>
                <span>•</span>
                <span>{product.reviews} avaliações</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full bg-primary/5 hover:bg-primary/10 text-primary"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/cliente/loja/${product.supplierProfileId}`);
              }}
            >
              <Store className="h-5 w-5" />
            </Button>
          </div>
        )}

        {/* Specifications */}
        <div className="bg-white rounded-3xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-bold text-foreground mb-4">Especificações</h2>
          <div className="space-y-3">
            {product.specs.map((spec) => (
              <div key={spec.label} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                <span className="text-muted-foreground text-sm">{spec.label}</span>
                <span className="font-medium text-sm">{spec.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Reviews */}
        <div className="bg-white rounded-3xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-bold text-foreground mb-4">Avaliações</h2>
          <ReviewsList reviews={reviews} loading={reviewsLoading} />
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">Você também pode gostar</h2>
              <span className="text-sm text-primary font-medium cursor-pointer">Ver tudo</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {relatedProducts.map((relatedProduct) => (
                <div
                  key={relatedProduct.id}
                  onClick={() => {
                    setSelectedImage(0);
                    navigate(`/cliente/produto/${relatedProduct.id}`);
                  }}
                  className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="aspect-square overflow-hidden bg-slate-50 p-4 flex items-center justify-center">
                    <img 
                      src={relatedProduct.images[0]} 
                      alt={relatedProduct.name} 
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform" 
                    />
                  </div>
                  <div className="p-3">
                    <p className="text-sm mb-2 line-clamp-2 text-foreground">{relatedProduct.name}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-primary font-bold">{relatedProduct.price}</p>
                      <button 
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-primary hover:text-white transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Add to favorites logic
                        }}
                      >
                        <Heart className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quantity Dialog */}
        <Dialog open={showQuantityDialog} onOpenChange={setShowQuantityDialog}>
          <DialogContent className="rounded-3xl">
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-center">Selecione a quantidade</h2>
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full w-12 h-12"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  -
                </Button>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (val > 0 && val <= currentStock) {
                      setQuantity(val);
                    }
                  }}
                  className="text-center w-20 h-12 text-xl font-bold rounded-2xl"
                  min="1"
                  max={currentStock}
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full w-12 h-12"
                  onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                >
                  +
                </Button>
              </div>
              <p className="text-center text-sm text-muted-foreground">
                Máximo: {currentStock} unidades
              </p>
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowQuantityDialog(false)}
                  className="flex-1 rounded-full h-12"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    if (!product.supplierProfileId) {
                      toast({
                        title: 'Erro',
                        description: 'Informações do fornecedor não encontradas.',
                        variant: 'destructive',
                      });
                      return;
                    }

                    addToCart({
                      productId: product.supplierUuid || '',
                      name: product.name,
                      price: product.priceNumber,
                      image: product.images[0],
                      storeId: product.supplierProfileId || '',
                      storeName: supplierProfile?.nome || 'Loja'
                    }, quantity);
                    
                    setShowQuantityDialog(false);
                    navigate('/cliente/checkout');
                  }}
                  className="flex-1 rounded-full h-12 bg-primary hover:bg-primary/90"
                >
                  Confirmar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-16 left-0 right-0 px-4 pb-4 z-30">
        <div className="container mx-auto max-w-lg">
          <Button 
            className="w-full h-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base shadow-lg shadow-primary/25 gap-2"
            disabled={currentStock === 0}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              
              if (currentStock === 0) {
                toast({
                  title: 'Produto sem estoque',
                  description: 'Este produto não está disponível no momento.',
                  variant: 'destructive',
                });
                return;
              }
              
              if (!product.supplierProfileId) {
                toast({
                  title: 'Erro',
                  description: 'Informações do fornecedor não encontradas.',
                  variant: 'destructive',
                });
                return;
              }

              const success = addToCart({
                productId: product.supplierUuid || '',
                name: product.name,
                price: product.priceNumber,
                image: product.images[0],
                storeId: product.supplierProfileId || '',
                storeName: supplierProfile?.nome || 'Loja'
              }, 1);
              
              if (success) {
                navigate('/cliente/carrinho');
              }
            }}
          >
            <ShoppingCart className="h-5 w-5" />
            ADICIONAR AO CARRINHO
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default ProdutoDetalhes;
