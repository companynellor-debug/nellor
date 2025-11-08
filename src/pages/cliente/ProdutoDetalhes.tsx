import { ParticlesBackground } from "@/components/cliente/ParticlesBackground";
import { BottomNav } from "@/components/cliente/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
    <div className="min-h-screen bg-background pb-20">
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

      <main className="container mx-auto px-4 py-6 relative z-10">
        {/* Imagens do Produto */}
        <div className="mb-6">
          <div className="aspect-square rounded-2xl overflow-hidden mb-4 bg-muted">
            <img src={product.images[selectedImage]} alt={product.name} className="w-full h-full object-cover" />
          </div>
          <div className="flex gap-2 justify-center">
            {product.images.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                  selectedImage === index ? "border-primary scale-105" : "border-border"
                }`}
              >
                <img src={image} alt={`${product.name} ${index + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Store Info */}
        {supplierProfile && product.supplierProfileId && (
          <Card
            onClick={() => {
              console.log('Navigating to store:', product.supplierProfileId);
              navigate(`/cliente/loja/${product.supplierProfileId}`);
            }}
            className="bg-white border shadow-sm p-4 mb-6 cursor-pointer hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
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
              <Button
                variant="ghost"
                size="sm"
                className="text-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('Button clicked, navigating to:', product.supplierProfileId);
                  navigate(`/cliente/loja/${product.supplierProfileId}`);
                }}
              >
                <Store className="h-5 w-5" />
              </Button>
            </div>
          </Card>
        )}

        {/* Informações do Produto */}
        <Card className="bg-white border shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`h-4 w-4 ${i < Math.floor(product.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-400"}`} />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              {product.rating.toFixed(1)} ({product.reviews} avaliações)
            </span>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <p className="text-3xl font-bold text-primary">{product.price}</p>
            <Badge variant={currentStock > 0 ? "default" : "destructive"} className="flex items-center gap-1">
              <Package className="h-3 w-3" />
              {currentStock > 0 ? `${currentStock} disponíveis` : 'Sem estoque'}
            </Badge>
          </div>
          <p className="text-muted-foreground leading-relaxed">{product.description}</p>
        </Card>

        {/* Especificações */}
        <Card className="bg-white border shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-primary mb-4">Especificações</h2>
          <div className="space-y-3">
            {product.specs.map((spec) => (
              <div key={spec.label} className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">{spec.label}</span>
                <span className="font-medium">{spec.value}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Avaliações */}
        <Card className="bg-white border shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-primary mb-4">Avaliações dos Clientes</h2>
          <div className="space-y-4">
            {reviewsLoading ? (
              <p className="text-sm text-muted-foreground text-center py-4">Carregando avaliações...</p>
            ) : reviews.length > 0 ? (
              reviews.map((review) => (
                <div key={review.id} className="border-b pb-4 last:border-0">
                  <div className="flex items-center gap-3 mb-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={review.buyer?.foto_perfil_url || ''} alt={review.buyer?.nome} />
                      <AvatarFallback>{review.buyer?.nome?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{review.buyer?.nome}</p>
                      <span className="text-xs text-muted-foreground">
                        {new Date(review.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-3 w-3 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-400"}`} />
                    ))}
                  </div>
                  {review.comment && (
                    <p className="text-sm text-muted-foreground">{review.comment}</p>
                  )}
                  {review.photos && review.photos.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {review.photos.map((photo, idx) => (
                        <img key={idx} src={photo} alt="Review" className="w-16 h-16 rounded object-cover" />
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma avaliação ainda. Seja o primeiro a avaliar!</p>
            )}
          </div>
        </Card>

        {/* Produtos Relacionados */}
        {relatedProducts.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-bold text-primary mb-4">Você também pode gostar</h2>
            <div className="grid grid-cols-2 gap-4">
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
                    <p className="text-sm mb-2 line-clamp-2">{relatedProduct.name}</p>
                    <p className="text-primary font-bold">{relatedProduct.price}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Botões de Ação */}
        <div className="fixed bottom-20 left-0 right-0 bg-white/95 backdrop-blur-lg border-t shadow-sm p-4 z-30">
          <div className="container mx-auto flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1 border-primary text-primary hover:bg-primary/10 gap-2"
              disabled={currentStock === 0}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Add to cart clicked');
                console.log('Current stock:', currentStock);
                console.log('Product:', product);
                console.log('Supplier profile:', supplierProfile);
                
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

                console.log('Adding to cart...');
                const success = addToCart({
                  productId: product.id,
                  name: product.name,
                  price: product.priceNumber,
                  image: product.images[0],
                  storeId: product.supplierProfileId || '',
                  storeName: supplierProfile?.nome || 'Loja'
                }, 1);
                
                console.log('Add to cart success:', success);
                if (success) {
                  navigate('/cliente/carrinho');
                }
              }}
            >
              <ShoppingCart className="h-5 w-5" />
              Adicionar ao Carrinho
            </Button>
            <Button 
              className="flex-1 bg-primary hover:bg-primary/90 text-white"
              disabled={currentStock === 0}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Buy now clicked');
                console.log('Current stock:', currentStock);
                console.log('Product:', product);
                
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

                console.log('Adding to cart and going to checkout...');
                addToCart({
                  productId: product.id,
                  name: product.name,
                  price: product.priceNumber,
                  image: product.images[0],
                  storeId: product.supplierProfileId || '',
                  storeName: supplierProfile?.nome || 'Loja'
                }, 1);
                
                navigate('/cliente/checkout');
              }}
            >
              Comprar Agora
            </Button>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default ProdutoDetalhes;
