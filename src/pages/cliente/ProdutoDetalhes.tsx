import { ParticlesBackground } from "@/components/cliente/ParticlesBackground";
import { BottomNav } from "@/components/cliente/BottomNav";
import { ReviewsList } from "@/components/cliente/ReviewsList";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Heart, Share2, Star, Store, ShoppingCart, Package, MessageCircle } from "lucide-react";
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
        // Usar função RPC SECURITY DEFINER para garantir acesso público
        const { data: profiles, error } = await supabase.rpc('get_public_store_profile', {
          _id: product.supplierProfileId
        });

        if (error) {
          console.error('Error fetching supplier profile via RPC:', error);
          // Fallback to view
          const { data: viewProfile } = await supabase
            .from('public_supplier_profiles')
            .select('id, nome, foto_perfil_url, banner_loja_url, descricao_loja')
            .eq('id', product.supplierProfileId)
            .maybeSingle();
          
          if (viewProfile) {
            setSupplierProfile(viewProfile);
          }
          return;
        }

        if (profiles && profiles.length > 0) {
          setSupplierProfile(profiles[0]);
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

  const handleShare = async () => {
    const productUrl = `${window.location.origin}/cliente/produto/${id}`;
    
    const copyToClipboard = async () => {
      try {
        await navigator.clipboard.writeText(productUrl);
        toast({
          title: 'Link copiado!',
          description: 'O link do produto foi copiado para a área de transferência.',
        });
      } catch {
        // Fallback para navegadores que não suportam clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = productUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        toast({
          title: 'Link copiado!',
          description: 'O link do produto foi copiado para a área de transferência.',
        });
      }
    };

    // Tentar usar Web Share API primeiro (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.name || 'Produto',
          text: `Confira este produto: ${product?.name}`,
          url: productUrl,
        });
        return;
      } catch (error) {
        // Se o usuário cancelou, não faz nada
        if ((error as Error).name === 'AbortError') return;
        // Caso contrário, usa fallback de cópia
      }
    }
    
    // Fallback: copiar para área de transferência
    await copyToClipboard();
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
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                const productUrl = `${window.location.origin}/cliente/produto/${id}`;
                const text = `Confira este produto: ${product?.name} - ${productUrl}`;
                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
              }} 
              className="p-2 hover:bg-green-100 rounded-full transition-colors"
              title="Compartilhar no WhatsApp"
            >
              <MessageCircle className="h-6 w-6 text-green-600 hover:text-green-700 transition-colors" />
            </button>
            <button onClick={handleShare} className="p-2 hover:bg-muted rounded-full transition-colors" title="Copiar link">
              <Share2 className="h-6 w-6 hover:text-primary transition-colors" />
            </button>
            <button onClick={handleToggleFavorite} className="p-2 hover:bg-muted rounded-full transition-colors">
              <Heart className={`h-6 w-6 transition-colors ${isProductFavorite ? "fill-red-500 text-red-500" : "hover:text-primary"}`} />
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 relative z-10 max-w-7xl">
        {/* Layout Desktop: Grid com imagens lado esquerdo e info lado direito */}
        <div className="lg:grid lg:grid-cols-12 lg:gap-8 lg:items-start">
          
          {/* Coluna Esquerda: Thumbnails verticais + Imagem Principal */}
          <div className="lg:col-span-7 mb-6 lg:mb-0">
            <div className="lg:flex lg:gap-4">
              {/* Thumbnails - Vertical em Desktop */}
              <div className="hidden lg:flex lg:flex-col gap-2 order-1">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                      selectedImage === index ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <img src={image} alt={`${product.name} ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>

              {/* Imagem Principal */}
              <div className="flex-1 order-2">
                <div className="aspect-square rounded-2xl overflow-hidden bg-muted max-w-lg mx-auto lg:max-w-none">
                  <img src={product.images[selectedImage]} alt={product.name} className="w-full h-full object-cover" />
                </div>
                
                {/* Thumbnails - Horizontal em Mobile */}
                <div className="flex gap-2 justify-center mt-4 lg:hidden">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImage === index ? "border-primary scale-105" : "border-border"
                      }`}
                    >
                      <img src={image} alt={`${product.name} ${index + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Coluna Direita: Informações do Produto */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-5">
            {/* Loja */}
            {supplierProfile && product.supplierProfileId && (
              <div
                onClick={() => navigate(`/cliente/loja/${product.supplierProfileId}`)}
                className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
              >
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

            {/* Nome e Avaliações */}
            <div>
              <h1 className="text-xl lg:text-2xl font-bold mb-3">{product.name}</h1>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < Math.floor(product.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                  ))}
                  <span className="text-sm font-medium ml-1">{product.rating.toFixed(1)}</span>
                </div>
                <span className="text-sm text-muted-foreground">({product.reviews} avaliações)</span>
                <Badge variant={currentStock > 0 ? "outline" : "destructive"} className="flex items-center gap-1 text-xs">
                  <Package className="h-3 w-3" />
                  {currentStock > 0 ? `${currentStock} em estoque` : 'Sem estoque'}
                </Badge>
              </div>
            </div>

            {/* Preço */}
            <div className="py-4 border-y border-border">
              <p className="text-3xl font-bold text-primary">{product.price}</p>
              <p className="text-xs text-muted-foreground mt-1">à vista no PIX</p>
            </div>

            {/* Descrição */}
            <div>
              <h3 className="text-sm font-semibold mb-2">Descrição</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">{product.description}</p>
            </div>

            {/* Especificações Resumidas */}
            <div className="bg-muted/30 rounded-lg p-4">
              <h3 className="text-sm font-semibold mb-3">Especificações</h3>
              <div className="grid grid-cols-2 gap-2">
                {product.specs.slice(0, 4).map((spec) => (
                  <div key={spec.label} className="text-sm">
                    <span className="text-muted-foreground">{spec.label}: </span>
                    <span className="font-medium">{spec.value}</span>
                  </div>
                ))}
              </div>
              {product.specs.length > 4 && (
                <p className="text-xs text-primary mt-2 cursor-pointer hover:underline">Ver todas as especificações</p>
              )}
            </div>

            {/* Botões de Ação - Desktop */}
            <div className="hidden lg:flex gap-3 pt-2">
              <Button 
                variant="outline" 
                className="flex-1 border-primary text-primary hover:bg-primary/10 gap-2 h-12"
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
                <ShoppingCart className="h-5 w-5" />
                Adicionar ao Carrinho
              </Button>
              <Button 
                className="flex-1 bg-primary hover:bg-primary/90 text-white h-12"
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
          </div>
        </div>

        {/* Seção de Avaliações - Layout estilo e-commerce */}
        <div className="mt-10 lg:mt-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg lg:text-xl font-bold">Avaliações dos Clientes</h2>
            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center gap-1">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span className="font-bold text-lg">{product.rating.toFixed(1)}</span>
              </div>
              <span className="text-muted-foreground">({product.reviews} avaliações)</span>
            </div>
          </div>
          <Card className="bg-white border shadow-sm p-5">
            <ReviewsList reviews={reviews} loading={reviewsLoading} />
          </Card>
        </div>

        {/* Produtos Relacionados */}
        {relatedProducts.length > 0 && (
          <div className="mt-10 lg:mt-16">
            <h2 className="text-lg lg:text-xl font-bold mb-6">Você também pode gostar</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {relatedProducts.map((relatedProduct) => (
                <Card
                  key={relatedProduct.id}
                  onClick={() => {
                    setSelectedImage(0);
                    navigate(`/cliente/produto/${relatedProduct.id}`);
                  }}
                  className="bg-white border shadow-sm overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
                >
                  <div className="aspect-square overflow-hidden">
                    <img 
                      src={relatedProduct.images[0]} 
                      alt={relatedProduct.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                    />
                  </div>
                  <div className="p-3">
                    <p className="text-sm mb-2 line-clamp-2 group-hover:text-primary transition-colors">{relatedProduct.name}</p>
                    <p className="text-primary font-bold">{relatedProduct.price}</p>
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