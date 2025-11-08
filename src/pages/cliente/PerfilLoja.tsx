import { ParticlesBackground } from "@/components/cliente/ParticlesBackground";
import { BottomNav } from "@/components/cliente/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Heart, MessageCircle, Star } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useStoresFavorites } from "@/hooks/useStoresFavorites";
import { useProducts } from "@/hooks/useProducts";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useSupabaseStores } from "@/hooks/useSupabaseStores";
import { useSupabaseReviews } from "@/hooks/useSupabaseReviews";
import { Helmet } from "react-helmet";

const PerfilLoja = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { stores, loading } = useSupabaseStores();
  const { products } = useProducts();
  const { user } = useSupabaseAuth();
  const { isFavoriteStore, addFavoriteStore, removeFavoriteStore } = useStoresFavorites();
  const { reviews: allReviews, loading: reviewsLoading } = useSupabaseReviews();
  
  const store = stores.find(s => s.id === id);
  const storeProducts = products.filter(p => p.supplierUuid === id);
  
  // Filtrar avaliações dos produtos desta loja
  const storeProductIds = storeProducts.map(p => p.supplierUuid).filter(Boolean);
  const storeReviews = allReviews.filter(r => storeProductIds.includes(r.product_id));
  const averageRating = storeReviews.length > 0
    ? storeReviews.reduce((sum, r) => sum + r.rating, 0) / storeReviews.length
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!store) {
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
        <title>{store.nome} - Loja Online | Nellor</title>
        <meta name="description" content={`${store.descricao_loja || 'Confira nossos produtos'}`} />
        <meta property="og:title" content={`${store.nome} - Loja Online`} />
        <meta property="og:description" content={store.descricao_loja || ''} />
        <meta property="og:image" content={store.banner_loja_url || ''} />
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
            src={store.banner_loja_url || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8'} 
            alt={`Banner ${store.nome}`} 
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
                    src={store.foto_perfil_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=store'} 
                    alt={store.nome} 
                  />
                  <AvatarFallback>{store.nome.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h2 className="text-xl font-bold mb-2">{store.nome}</h2>
                  <p className="text-sm text-muted-foreground mb-3">{store.descricao_loja || 'Sem descrição'}</p>
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
              {user && (
                <div className="flex gap-3">
                  <Button
                    onClick={() => navigate("/cliente/chat", { state: { supplierId: id } })}
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
                </div>
              )}
            </Card>
          </div>

          {/* Avaliações da Loja */}
          {storeReviews.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-primary mb-4">Avaliações da Loja</h3>
              <Card className="bg-white border shadow-sm p-6">
                <div className="space-y-4">
                  {reviewsLoading ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Carregando avaliações...</p>
                  ) : (
                    storeReviews.slice(0, 5).map((review) => (
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
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* Store Products */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-primary mb-4">Produtos da Loja</h3>
            <div className="grid grid-cols-2 gap-4">
              {storeProducts.map((product) => (
                <Card
                  key={product.id}
                  onClick={() => navigate(`/cliente/produto/${product.id}`)}
                  className="bg-white border shadow-sm overflow-hidden hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="aspect-square overflow-hidden">
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-3">
                    <p className="text-sm mb-2 line-clamp-2">{product.name}</p>
                    <div className="flex items-center gap-1 mb-2">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs text-muted-foreground">{product.rating}</span>
                    </div>
                    <p className="text-primary font-bold">{product.price}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default PerfilLoja;
