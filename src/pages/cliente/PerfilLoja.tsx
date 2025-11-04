import { ParticlesBackground } from "@/components/cliente/ParticlesBackground";
import { BottomNav } from "@/components/cliente/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Heart, MessageCircle, Star } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { getStoreById } from "@/data/stores";
import { getProductsByStore } from "@/data/products";
import { useStoresFavorites } from "@/hooks/useStoresFavorites";

const PerfilLoja = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const storeId = id ? parseInt(id) : 1;
  const store = getStoreById(storeId);
  const storeProducts = getProductsByStore(storeId);
  const { isFavoriteStore, addFavoriteStore, removeFavoriteStore } = useStoresFavorites();

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

  const isStoreFavorite = isFavoriteStore(storeId);

  const handleToggleFavorite = () => {
    if (isStoreFavorite) {
      removeFavoriteStore(storeId);
    } else {
      addFavoriteStore(storeId);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
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
        <div className="h-48 overflow-hidden">
          <img src={store.banner} alt={`Banner ${store.name}`} className="w-full h-full object-cover" />
        </div>

        {/* Store Info */}
        <div className="container mx-auto px-4">
          <div className="relative -mt-16 mb-6">
            <Card className="bg-white border shadow-sm p-6">
              <div className="flex items-start gap-4 mb-4">
                <Avatar className="h-24 w-24 border-4 border-white shadow-md">
                  <AvatarImage src={store.avatar} alt={store.name} />
                  <AvatarFallback>{store.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h2 className="text-xl font-bold mb-2">{store.name}</h2>
                  <p className="text-sm text-muted-foreground mb-3">{store.bio}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{store.rating}</span>
                    </div>
                    <span className="text-muted-foreground">{store.totalReviews} avaliações</span>
                    <span className="text-muted-foreground">{store.totalSales.toLocaleString()} vendas</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={() => navigate("/cliente/chat", { state: { storeId, storeName: store.name, storeAvatar: store.avatar } })}
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
            </Card>
          </div>

          {/* Store Stats */}
          <Card className="bg-white border shadow-sm p-6 mb-6">
            <h3 className="text-lg font-bold text-primary mb-4">Estatísticas</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">{store.rating}</p>
                <p className="text-xs text-muted-foreground">Avaliação</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">{store.totalReviews}</p>
                <p className="text-xs text-muted-foreground">Avaliações</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">{store.totalSales.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Vendas</p>
              </div>
            </div>
          </Card>

          {/* Store Reviews */}
          <Card className="bg-white border shadow-sm p-6 mb-6">
            <h3 className="text-lg font-bold text-primary mb-4">Avaliações da Loja</h3>
            <div className="space-y-4">
              {store.reviews.map((review, index) => (
                <div key={index} className="border-b pb-4 last:border-0">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">{review.name}</p>
                    <span className="text-xs text-muted-foreground">{review.date}</span>
                  </div>
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">{review.comment}</p>
                </div>
              ))}
            </div>
          </Card>

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
