import { Card } from "@/components/ui/card";
import { Heart, Store } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useFavorites } from "@/hooks/useFavorites";
import { useStoresFavorites } from "@/hooks/useStoresFavorites";
import { useSupabaseStores } from "@/hooks/useSupabaseStores";
import { useProducts } from "@/hooks/useProducts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Favoritos = () => {
  const navigate = useNavigate();
  const { favorites, removeFavorite } = useFavorites();
  const { favoriteStores, removeFavoriteStore } = useStoresFavorites();
  const { stores } = useSupabaseStores();
  const { products } = useProducts();

  const favoriteProducts = products.filter((product) => favorites.includes(product.id));
  const favoriteStoresList = stores.filter((store) => favoriteStores.includes(store.id));

  return (
    <div className="min-h-full pb-20 lg:pb-6">
      <div className="container mx-auto px-4 py-6">
        {/* Page Header */}
        <h1 className="text-2xl font-bold text-foreground mb-6">Meus Favoritos</h1>

        <Tabs defaultValue="produtos" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="produtos">Produtos ({favoriteProducts.length})</TabsTrigger>
            <TabsTrigger value="lojas">Lojas ({favoriteStoresList.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="produtos">
            {favoriteProducts.length === 0 ? (
              <div className="text-center py-20">
                <Heart className="h-20 w-20 mx-auto mb-4 text-muted-foreground" />
                <h2 className="text-xl font-bold mb-2">Nenhum produto favorito ainda</h2>
                <p className="text-muted-foreground mb-6">
                  Adicione produtos aos favoritos para vê-los aqui
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {favoriteProducts.map((product) => (
                  <Card key={product.id} className="overflow-hidden relative group shadow-sm hover:shadow-md transition-all">
                    <div
                      className="aspect-square overflow-hidden cursor-pointer"
                      onClick={() => navigate(`/cliente/produto/${product.id}`)}
                    >
                      <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                    <button
                      onClick={() => removeFavorite(product.id)}
                      className="absolute top-2 right-2 p-2 bg-background/90 backdrop-blur-sm rounded-full hover:bg-background transition-colors shadow-sm"
                    >
                      <Heart className="h-5 w-5 fill-destructive text-destructive" />
                    </button>
                    <div className="p-3">
                      <h3 className="font-medium text-sm mb-2 line-clamp-2">{product.name}</h3>
                      <div className="flex items-center justify-between">
                        <p className="text-primary font-bold">{product.price}</p>
                        <div className="flex items-center gap-1 text-xs">
                          <span className="text-yellow-500">⭐</span>
                          <span className="text-muted-foreground">{product.rating}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="lojas">
            {favoriteStoresList.length === 0 ? (
              <div className="text-center py-20">
                <Store className="h-20 w-20 mx-auto mb-4 text-muted-foreground" />
                <h2 className="text-xl font-bold mb-2">Nenhuma loja favorita ainda</h2>
                <p className="text-muted-foreground mb-6">
                  Adicione lojas aos favoritos para vê-las aqui
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {favoriteStoresList.map((store) => (
                  <Card
                    key={store.id}
                    className="overflow-hidden cursor-pointer hover:shadow-md transition-all shadow-sm"
                    onClick={() => navigate(`/cliente/loja/${store.id}`)}
                  >
                    <div className="flex items-center gap-4 p-4 relative">
                      <img 
                        src={store.foto_perfil_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=store'} 
                        alt={store.nome} 
                        className="w-16 h-16 rounded-full object-cover flex-shrink-0 ring-2 ring-primary/20"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg mb-1">{store.nome}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{store.descricao_loja || 'Sem descrição'}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFavoriteStore(store.id);
                        }}
                        className="p-2 hover:bg-muted rounded-full transition-colors flex-shrink-0"
                      >
                        <Heart className="h-5 w-5 fill-destructive text-destructive" />
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Favoritos;
