import { ParticlesBackground } from "@/components/cliente/ParticlesBackground";
import { BottomNav } from "@/components/cliente/BottomNav";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useFavorites } from "@/hooks/useFavorites";
import { products } from "@/data/products";

const Favoritos = () => {
  const navigate = useNavigate();
  const { favorites, removeFavorite } = useFavorites();

  const favoriteProducts = products.filter((product) => favorites.includes(product.id));

  return (
    <div className="min-h-screen bg-background pb-20">
      <ParticlesBackground />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-full transition-colors">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-bold">Meus Favoritos</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 relative z-10">
        {favoriteProducts.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="h-20 w-20 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-bold mb-2">Nenhum favorito ainda</h2>
            <p className="text-muted-foreground mb-6">
              Adicione produtos aos favoritos para vê-los aqui
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {favoriteProducts.map((product) => (
              <Card key={product.id} className="bg-white border shadow-sm overflow-hidden relative group">
                <div
                  className="aspect-square overflow-hidden cursor-pointer"
                  onClick={() => navigate(`/cliente/produto/${product.id}`)}
                >
                  <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                </div>
                <button
                  onClick={() => removeFavorite(product.id)}
                  className="absolute top-2 right-2 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
                >
                  <Heart className="h-5 w-5 fill-red-500 text-red-500" />
                </button>
                <div className="p-3">
                  <h3 className="font-medium text-sm mb-2 line-clamp-2">{product.name}</h3>
                  <div className="flex items-center justify-between">
                    <p className="text-primary font-bold">{product.price}</p>
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-yellow-500">⭐</span>
                      <span>{product.rating}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Favoritos;
