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

  // Buscar perfil do fornecedor (via VIEW pública) e estoque atual
  useEffect(() => {
    const fetchSupplierData = async () => {
      if (!product?.supplierProfileId) {
        console.log('No supplierProfileId found for product:', product);
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from('public_supplier_profiles')
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

  const relatedProducts = getRelatedProducts(product.id, product.category, 4);

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-6">
      <ParticlesBackground />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-full transition-colors">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div className="flex items-center gap-4">
            <Share2 className="h-6 w-6 cursor-pointer hover:text-primary transition-colors" />
            <button onClick={handleToggleFavorite} className="p-2 hover:bg-muted rounded-full transition-colors">
              <Heart className={`h-6 w-6 transition-colors ${isProductFavorite ? "fill-red-500 text-red-500" : "hover:text-primary"}`} />
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 relative z-10 max-w-6xl">
        {/* Layout Desktop: Grid 2 colunas */}
        <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-start">
          
          {/* Coluna Esquerda: Imagens */}
          <div className="mb-6 lg:mb-0 lg:sticky lg:top-24">
            <div className="aspect-square rounded-2xl overflow-hidden mb-4 bg-muted max-w-sm mx-auto lg:max-w-md">
              <img src={product.images[selectedImage]} alt={product.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex gap-2 justify-center">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`w-14 h-14 lg:w-16 lg:h-16 rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImage === index ? "border-primary scale-105" : "border-border"
                  }`}
                >
                  <img src={image} alt={`${product.name} ${index + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Coluna Direita: Informações */}
          <div className="space-y-4">
            {/* Store Info */}
            {supplierProfile && product.supplierProfileId && (
              <Card
                onClick={() => navigate(`/cliente/loja/${product.supplierProfileId}`)}
                className="bg-white border shadow-sm p-3 cursor-pointer hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={supplierProfile.foto_perfil_url} alt={supplierProfile.nome} />
                    <AvatarFallback>{supplierProfile.nome.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{supplierProfile.nome}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span>{product.rating.toFixed(1)}</span>
                      </div>
                      <span>•</span>
                      <span>{product.reviews} avaliações</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-primary">
                    <Store className="h-5 w-5" />
                  </Button>
                </div>
              </Card>
            )}

            {/* Informações do Produto */}
            <Card className="bg-white border shadow-sm p-5">
              <h1 className="text-lg lg:text-xl font-bold mb-2">{product.name}</h1>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < Math.floor(product.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  {product.rating.toFixed(1)} ({product.reviews} avaliações)
                </span>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <p className="text-2xl font-bold text-primary">{product.price}</p>
                <Badge variant={currentStock > 0 ? "default" : "destructive"} className="flex items-center gap-1 text-xs">
                  <Package className="h-3 w-3" />
                  {currentStock > 0 ? `${currentStock} em estoque` : 'Sem estoque'}
                </Badge>
              </div>
              <p className="text-muted-foreground leading-relaxed text-sm">{product.description}</p>

              {/* Botões de Ação - Desktop */}
              <div className="hidden lg:flex gap-3 mt-5 pt-5 border-t">
                <Button 
                  variant="outline" 
                  className="flex-1 border-primary text-primary hover:bg-primary/10 gap-2"
                  disabled={currentStock === 0}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (currentStock === 0 || !product.supplierProfileId) return;
                    addToCart({
                      productId: product.supplierUuid || '',
                      name: product.name,
                      price: product.priceNumber,
                      image: product.images[0],
                      storeId: product.supplierProfileId || '',
                      storeName: supplierProfile?.nome || 'Loja'
                    }, 1);
                    navigate('/cliente/carrinho');
                  }}
                >
                  <ShoppingCart className="h-4 w-4" />
                  Adicionar ao Carrinho
                </Button>
                <Button 
                  className="flex-1 bg-primary hover:bg-primary/90 text-white"
                  disabled={currentStock === 0}
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentStock === 0 || !product.supplierProfileId) return;
                    setQuantity(1);
                    setShowQuantityDialog(true);
                  }}
                >
                  Comprar Agora
                </Button>
              </div>
            </Card>

            {/* Especificações */}
            <Card className="bg-white border shadow-sm p-5">
              <h2 className="text-base font-bold text-primary mb-3">Especificações</h2>
              <div className="space-y-2">
                {product.specs.map((spec) => (
                  <div key={spec.label} className="flex justify-between items-center border-b border-border/50 pb-2 text-sm">
                    <span className="text-muted-foreground">{spec.label}</span>
                    <span className="font-medium">{spec.value}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* Avaliações - Full Width */}
        <Card className="bg-white border shadow-sm p-5 mt-6">
          <h2 className="text-base font-bold text-primary mb-4">Avaliações dos Clientes</h2>
          <ReviewsList reviews={reviews} loading={reviewsLoading} />
        </Card>

        {/* Produtos Relacionados - Full Width */}
        {relatedProducts.length > 0 && (
          <div className="mt-6">
            <h2 className="text-base font-bold text-primary mb-4">Você também pode gostar</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {relatedProducts.map((relatedProduct) => (
                <Card
                  key={relatedProduct.id}
                  onClick={() => {
                    setSelectedImage(0);
                    navigate(`/cliente/produto/${relatedProduct.id}`);
                  }}
                  className="bg-white border shadow-sm overflow-hidden hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="aspect-square overflow-hidden">
                    <img src={relatedProduct.images[0]} alt={relatedProduct.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-3">
                    <p className="text-sm mb-1 line-clamp-2">{relatedProduct.name}</p>
                    <p className="text-primary font-bold text-sm">{relatedProduct.price}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Dialog de Quantidade */}
        <Dialog open={showQuantityDialog} onOpenChange={setShowQuantityDialog}>
          <DialogContent>
            <div className="space-y-4">
              <h2 className="text-xl font-bold">Selecione a quantidade</h2>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
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
                  className="text-center w-20"
                  min="1"
                  max={currentStock}
                />
                <Button
                  variant="outline"
                  onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                >
                  +
                </Button>
                <span className="text-sm text-muted-foreground">
                  Máximo: {currentStock}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowQuantityDialog(false)}
                  className="flex-1"
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
                  className="flex-1 bg-primary hover:bg-primary/90 text-white"
                >
                  Confirmar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Botões de Ação - Mobile Only */}
        <div className="fixed bottom-20 left-0 right-0 bg-white/95 backdrop-blur-lg border-t shadow-sm p-4 z-30 lg:hidden">
          <div className="container mx-auto flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1 border-primary text-primary hover:bg-primary/10 gap-2"
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

                addToCart({
                  productId: product.supplierUuid || '',
                  name: product.name,
                  price: product.priceNumber,
                  image: product.images[0],
                  storeId: product.supplierProfileId || '',
                  storeName: supplierProfile?.nome || 'Loja'
                }, 1);
                
                navigate('/cliente/carrinho');
              }}
            >
              <ShoppingCart className="h-5 w-5" />
              Adicionar
            </Button>
            <Button 
              className="flex-1 bg-primary hover:bg-primary/90 text-white"
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

                setQuantity(1);
                setShowQuantityDialog(true);
              }}
            >
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