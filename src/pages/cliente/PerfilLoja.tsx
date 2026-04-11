import { useEffect, useState } from "react";
import { ParticlesBackground } from "@/components/cliente/ParticlesBackground";
import { BottomNav } from "@/components/cliente/BottomNav";
import { ReviewsList } from "@/components/cliente/ReviewsList";
import { VerifiedSupplierBadge } from "@/components/cliente/VerifiedSupplierBadge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Heart, MessageCircle, Star, Share2, Package, Info } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useStoresFavorites } from "@/hooks/useStoresFavorites";
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

  useEffect(() => {
    refetch();
  }, [id]);

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id || '');
  const [slugProfile, setSlugProfile] = useState<any>(null);

  useEffect(() => {
    if (!isUuid && id) {
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
  const storeProfile = stores.find(s => s.id === resolvedId) || (slugProfile ? {
    id: slugProfile.id, nome: slugProfile.nome, descricao_loja: slugProfile.descricao_loja,
    foto_perfil_url: slugProfile.foto_perfil_url, banner_loja_url: slugProfile.banner_loja_url
  } : undefined);
  const storeProducts = supabaseProducts.filter(p => p.supplier_id === resolvedId);
  const { reviews: storeReviews, loading: reviewsLoading, averageRating } = useSupplierReviews(resolvedId);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!storeProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loja não encontrada</h1>
          <Button onClick={() => navigate("/cliente")} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            Voltar para Home
          </Button>
        </div>
      </div>
    );
  }

  const isStoreFavorite = id ? isFavoriteStore(id) : false;
  const handleToggleFavorite = () => {
    if (!id) return;
    if (isStoreFavorite) removeFavoriteStore(id);
    else addFavoriteStore(id);
  };

  const handleChat = () => {
    if (!user) { navigate("/auth"); return; }
    navigate("/cliente/chat", {
      state: { supplierId: id, message: "Olá! Tenho interesse em seus produtos." }
    });
  };

  const bannerUrl = storeProfile.banner_loja_url || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8';
  const avatarUrl = storeProfile.foto_perfil_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=store';

  return (
    <div className="min-h-screen bg-background pb-36 lg:pb-20">
      <Helmet>
        <title>{storeProfile.nome} - Loja Online | Nellor</title>
        <meta name="description" content={storeProfile.descricao_loja || 'Confira nossos produtos'} />
        <meta property="og:title" content={`${storeProfile.nome} - Loja Online`} />
        <meta property="og:description" content={storeProfile.descricao_loja || ''} />
        <meta property="og:image" content={storeProfile.banner_loja_url || ''} />
        <meta property="og:type" content="website" />
        <link rel="canonical" href={`${window.location.origin}/loja/${id}`} />
      </Helmet>
      <ParticlesBackground />

      {/* Hero Banner */}
      <div className="relative h-56 lg:h-72 w-full overflow-hidden">
        <img
          src={bannerUrl}
          alt={`Banner ${storeProfile.nome}`}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />

        {/* Nav buttons over banner */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.history.length > 1 ? navigate(-1) : navigate("/cliente")}
            className="rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/loja/${id}`);
              toast.success("Link da loja copiado!");
            }}
            className="rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 h-10 w-10"
          >
            <Share2 className="h-5 w-5" />
          </Button>
        </div>

        {/* Store info over banner */}
        <div className="absolute bottom-0 left-0 right-0 p-5 lg:px-0">
          <div className="lg:max-w-6xl lg:mx-auto flex items-end gap-4">
            <Avatar className="h-20 w-20 lg:h-28 lg:w-28 ring-4 ring-white shadow-xl shrink-0">
              <AvatarImage src={avatarUrl} alt={storeProfile.nome} />
              <AvatarFallback className="text-2xl font-bold">{storeProfile.nome.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 pb-1">
              <h1 className="text-white font-bold text-xl lg:text-3xl truncate drop-shadow-lg">
                {storeProfile.nome}
              </h1>
              {averageRating > 0 && (
                <div className="flex items-center gap-1.5 mt-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-white/90 text-sm font-medium">{averageRating.toFixed(1)}</span>
                  <span className="text-white/60 text-sm">
                    · {storeReviews.length} {storeReviews.length === 1 ? 'avaliação' : 'avaliações'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Strip Card */}
      <div className="relative z-10 px-4 lg:px-0 lg:max-w-6xl lg:mx-auto -mt-6">
        <div className="bg-card rounded-2xl shadow-lg border p-4">
          <div className="flex items-center justify-around text-center">
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1.5 text-primary">
                <Star className="h-4 w-4 fill-primary text-primary" />
                <span className="font-bold text-lg">{averageRating.toFixed(1)}</span>
              </div>
              <span className="text-xs text-muted-foreground">Avaliação</span>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1.5 text-foreground">
                <Package className="h-4 w-4 text-primary" />
                <span className="font-bold text-lg">{storeProducts.length}</span>
              </div>
              <span className="text-xs text-muted-foreground">Produtos</span>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1.5 text-foreground">
                <MessageCircle className="h-4 w-4 text-primary" />
                <span className="font-bold text-lg">{storeReviews.length}</span>
              </div>
              <span className="text-xs text-muted-foreground">Avaliações</span>
            </div>
          </div>

          {/* Desktop action buttons */}
          <div className="hidden lg:flex items-center gap-3 mt-4 pt-4 border-t">
            <Button onClick={handleChat} className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-11">
              <MessageCircle className="h-4 w-4 mr-2" />
              Falar com vendedor
            </Button>
            {user && (
              <Button
                onClick={handleToggleFavorite}
                variant="outline"
                className={`rounded-xl h-11 px-5 ${isStoreFavorite ? "border-destructive text-destructive" : "border-primary text-primary"}`}
              >
                <Heart className={`h-5 w-5 ${isStoreFavorite ? "fill-destructive" : ""}`} />
                <span className="ml-2">{isStoreFavorite ? "Seguindo" : "Seguir"}</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="relative z-10 mt-6 px-4 lg:px-0 lg:max-w-6xl lg:mx-auto">
        <Tabs defaultValue="products">
          <TabsList className="w-full bg-transparent border-b rounded-none h-auto p-0 gap-0">
            <TabsTrigger
              value="products"
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary pb-3 pt-2 text-muted-foreground gap-1.5"
            >
              <Package className="h-4 w-4" />
              Produtos
            </TabsTrigger>
            <TabsTrigger
              value="reviews"
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary pb-3 pt-2 text-muted-foreground gap-1.5"
            >
              <Star className="h-4 w-4" />
              Avaliações
            </TabsTrigger>
            <TabsTrigger
              value="about"
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary pb-3 pt-2 text-muted-foreground gap-1.5"
            >
              <Info className="h-4 w-4" />
              Sobre
            </TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products" className="mt-6">
            {storeProducts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-40" />
                <p>Nenhum produto cadastrado ainda.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                {storeProducts.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => navigate(`/cliente/produto/${product.id}`)}
                    className="group bg-card rounded-2xl border shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-all duration-200"
                  >
                    <div className="aspect-[4/5] overflow-hidden bg-muted">
                      <img
                        src={product.imagens?.[0] || '/placeholder.svg'}
                        alt={product.nome}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-3 lg:p-4 space-y-1.5">
                      <p className="text-sm font-semibold line-clamp-2 text-foreground leading-tight">
                        {product.nome}
                      </p>
                      {(product.rating_medio ?? 0) > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs text-muted-foreground">{product.rating_medio}</span>
                        </div>
                      )}
                      <p className="text-primary font-bold text-base">
                        {formatCurrencyFromDecimal(product.preco)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="mt-6">
            {averageRating > 0 && (
              <div className="flex items-center gap-3 mb-6 p-4 bg-card rounded-2xl border">
                <div className="text-center">
                  <p className="text-3xl font-bold text-foreground">{averageRating.toFixed(1)}</p>
                  <div className="flex items-center gap-0.5 mt-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i <= Math.round(averageRating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {storeReviews.length} {storeReviews.length === 1 ? 'avaliação' : 'avaliações'}
                  </p>
                </div>
              </div>
            )}
            <ReviewsList reviews={storeReviews} loading={reviewsLoading} />
          </TabsContent>

          {/* About Tab */}
          <TabsContent value="about" className="mt-6">
            <div className="bg-card rounded-2xl border p-5 space-y-4">
              <h3 className="font-semibold text-foreground text-lg">Sobre a loja</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {storeProfile.descricao_loja || 'Este vendedor ainda não adicionou uma descrição.'}
              </p>
              <div className="pt-2">
                {id && <ReportButton targetType="supplier" targetId={id} />}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Mobile Fixed Bottom Action Bar */}
      <div className="fixed bottom-16 left-0 right-0 z-30 lg:hidden">
        <div className="mx-3 mb-2 bg-card/90 backdrop-blur-xl rounded-2xl shadow-lg border p-3 flex items-center gap-3">
          <Button onClick={handleChat} className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-12 text-sm font-semibold">
            <MessageCircle className="h-5 w-5 mr-2" />
            Falar com vendedor
          </Button>
          {user && (
            <Button
              onClick={handleToggleFavorite}
              variant="outline"
              size="icon"
              className={`rounded-xl h-12 w-12 shrink-0 ${isStoreFavorite ? "border-destructive text-destructive" : "border-primary text-primary"}`}
            >
              <Heart className={`h-5 w-5 ${isStoreFavorite ? "fill-destructive" : ""}`} />
            </Button>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default PerfilLoja;
