import { useEffect, useState } from "react";
import { ParticlesBackground } from "@/components/cliente/ParticlesBackground";
import { BottomNav } from "@/components/cliente/BottomNav";
import { ReviewsList } from "@/components/cliente/ReviewsList";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Heart, MessageCircle, Star, Share2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useStoresFavorites } from "@/hooks/useStoresFavorites";
import { useProducts } from "@/hooks/useProducts";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useSupabaseStores } from "@/hooks/useSupabaseStores";
import { useSupabaseProducts } from "@/hooks/useSupabaseProducts";
import { useSupplierReviews } from "@/hooks/useSupplierReviews";
import { Helmet } from "react-helmet";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrencyFromDecimal } from "@/utils/currency";
import ReportButton from "@/components/ReportButton";

const PerfilLoja = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { stores, loading, refetch } = useSupabaseStores();
  const { products: supabaseProducts } = useSupabaseProducts();
  const { user } = useSupabaseAuth();
  const { isFavoriteStore, addFavoriteStore, removeFavoriteStore } = useStoresFavorites();
  
  // Refetch stores when component mounts to ensure fresh data
  useEffect(() => {
    refetch();
  }, [id]);
  
  // Support both UUID and slug-based lookups
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id || '');
  
  const [slugProfile, setSlugProfile] = useState<any>(null);
  
  useEffect(() => {
    if (!isUuid && id) {
      // Lookup by slug
      const lookupBySlug = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('id, nome, descricao_loja, foto_perfil_url, banner_loja_url, store_slug')
          .eq('store_slug', id)
          .eq('tipo', 'fornecedor')
          .single();
        if (data) setSlugProfile(data);
      };
      lookupBySlug();
    }
  }, [id, isUuid]);
  
  const resolvedId = isUuid ? id : slugProfile?.id;
  const storeProfile = stores.find(s => s.id === resolvedId) || (slugProfile ? { id: slugProfile.id, nome: slugProfile.nome, descricao_loja: slugProfile.descricao_loja, foto_perfil_url: slugProfile.foto_perfil_url, banner_loja_url: slugProfile.banner_loja_url } : undefined);
  const storeProducts = supabaseProducts.filter(p => p.supplier_id === resolvedId);

  // Fetch reviews for this supplier
  const { reviews: storeReviews, loading: reviewsLoading, averageRating } = useSupplierReviews(resolvedId);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!storeProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loja não encontrada</h1>
          <Button onClick={() => navigate("/cliente")} className="bg-primary hover:bg-primary/90 text-white">
            Voltar para Home
          </Button>
        </div>
      </div>
    );
  }

  const isStoreFavorite = id ? isFavoriteStore(id) : false;

  const handleToggleFavorite = () => {
    if (!id) return;
    if (isStoreFavorite) {
      removeFavoriteStore(id);
    } else {
      addFavoriteStore(id);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Helmet>
        <title>{storeProfile.nome} - Loja Online | Nellor</title>
        <meta name="description" content={`${storeProfile.descricao_loja || 'Confira nossos produtos'}`} />
        <meta property="og:title" content={`${storeProfile.nome} - Loja Online`} />
        <meta property="og:description" content={storeProfile.descricao_loja || ''} />
        <meta property="og:image" content={storeProfile.banner_loja_url || ''} />
        <meta property="og:type" content="website" />
        <link rel="canonical" href={`${window.location.origin}/loja/${id}`} />
      </Helmet>
      <ParticlesBackground />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => {
              window.history.length > 1 ? navigate(-1) : navigate("/cliente");
            }} 
            className="rounded-full"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-lg font-semibold">Perfil da Loja</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="relative z-10">
        {/* Banner */}
        <div className="h-48 overflow-hidden bg-muted">
          <img 
            src={storeProfile.banner_loja_url || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8'} 
            alt={`Banner ${storeProfile.nome}`} 
            className="w-full h-full object-cover" 
          />
        </div>

        {/* Store Info */}
        <div className="container mx-auto px-4">
          <div className="relative -mt-16 mb-6">
            <Card className="bg-white border shadow-sm p-6">
              <div className="flex items-start gap-4 mb-4">
                <Avatar className="h-24 w-24 border-4 border-white shadow-md">
                  <AvatarImage 
                    src={storeProfile.foto_perfil_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=store'} 
                    alt={storeProfile.nome} 
                  />
                  <AvatarFallback>{storeProfile.nome.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h2 className="text-xl font-bold mb-2">{storeProfile.nome}</h2>
                  <p className="text-sm text-muted-foreground mb-3">{storeProfile.descricao_loja || 'Sem descrição'}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>{averageRating.toFixed(1)}</span>
                    </div>
                    <span className="text-muted-foreground">
                      {storeReviews.length} {storeReviews.length === 1 ? 'avaliação' : 'avaliações'}
                    </span>
                    <span className="text-muted-foreground">{storeProducts.length} produtos</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                {user ? (
                  <>
                    <Button
                      onClick={() => {
                        navigate("/cliente/chat", { 
                          state: { 
                            supplierId: id,
                            message: `Olá! Tenho interesse em seus produtos.`
                          } 
                        });
                      }}
                      className="flex-1 bg-primary hover:bg-primary/90 text-white"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Chat
                    </Button>
                    <Button
                      onClick={handleToggleFavorite}
                      variant="outline"
                      className={`px-4 ${isStoreFavorite ? "border-red-500 text-red-500" : "border-primary text-primary"}`}
                    >
                      <Heart className={`h-5 w-5 ${isStoreFavorite ? "fill-red-500" : ""}`} />
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => navigate("/auth")}
                    className="flex-1 bg-primary hover:bg-primary/90 text-white"
                  >
                    Fazer login para interagir
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const url = `${window.location.origin}/loja/${id}`;
                    navigator.clipboard.writeText(url);
                    toast.success("Link da loja copiado!");
                  }}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex justify-end mt-2">
                {id && <ReportButton targetType="supplier" targetId={id} />}
              </div>
            </Card>
          </div>

          {/* Tabs para Produtos e Avaliações */}
          <Tabs defaultValue="products" className="mb-6">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="products">Produtos ({storeProducts.length})</TabsTrigger>
              <TabsTrigger value="reviews">Avaliações ({storeReviews.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="products" className="mt-0">
              <div className="grid grid-cols-2 gap-4">
                {storeProducts.map((product) => (
                  <Card
                    key={product.id}
                    onClick={() => navigate(`/cliente/produto/${product.id}`)}
                    className="bg-white border shadow-sm overflow-hidden hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="aspect-square overflow-hidden">
                      <img 
                        src={product.imagens?.[0] || '/placeholder.svg'} 
                        alt={product.nome} 
                        className="w-full h-full object-cover hover:scale-105 transition-transform" 
                      />
                    </div>
                    <div className="p-3">
                      <p className="text-sm mb-2 line-clamp-2 font-semibold">{product.nome}</p>
                      <div className="flex items-center gap-1 mb-2">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs text-muted-foreground">{product.rating_medio || 0}</span>
                      </div>
                      <p className="text-primary font-bold">{formatCurrencyFromDecimal(product.preco)}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="reviews" className="mt-0">
              <Card className="bg-white border shadow-sm p-6">
                <ReviewsList reviews={storeReviews} loading={reviewsLoading} />
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default PerfilLoja;
