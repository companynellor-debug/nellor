import { ParticlesBackground } from "@/components/cliente/ParticlesBackground";
import { BottomNav } from "@/components/cliente/BottomNav";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Heart, Bell, Shirt, Footprints, Watch, Smartphone, Sparkles, Home as HomeIcon } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { products } from "@/data/products";
import logo from "@/assets/logo.png";
import { useFavorites } from "@/hooks/useFavorites";

const ClienteHome = () => {
  const navigate = useNavigate();
  const { favorites } = useFavorites();
  const categories = [
    { name: "Roupas", icon: Shirt },
    { name: "Calçados", icon: Footprints },
    { name: "Acessórios", icon: Watch },
    { name: "Eletrônicos", icon: Smartphone },
    { name: "Beleza", icon: Sparkles },
    { name: "Casa", icon: HomeIcon },
  ];

  const banners = [
    { title: "Mega Promoção", subtitle: "Até 70% OFF", color: "from-purple-600 to-pink-600" },
    { title: "Novidades", subtitle: "Confira já!", color: "from-blue-600 to-purple-600" },
    { title: "Frete Grátis", subtitle: "Em compras acima de R$ 99", color: "from-green-600 to-teal-600" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <ParticlesBackground />
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <img src={logo} alt="Nellor" className="h-12 w-auto" />
            <div className="flex items-center gap-4">
              <Bell className="h-6 w-6 text-foreground cursor-pointer hover:text-primary transition-colors" />
              <button onClick={() => navigate("/cliente/favoritos")} className="relative">
                <Heart className="h-6 w-6 text-foreground cursor-pointer hover:text-primary transition-colors" />
                {favorites.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {favorites.length}
                  </span>
                )}
              </button>
            </div>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar produtos ou marcas..."
              className="pl-10 bg-muted border-input focus:border-primary"
            />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 relative z-10">
        {/* Banners */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {banners.map((banner, index) => (
            <Card key={index} className={`bg-gradient-to-r ${banner.color} border-0 p-6 text-white cursor-pointer hover:scale-105 transition-transform`}>
              <h3 className="text-xl font-bold mb-1">{banner.title}</h3>
              <p className="text-sm opacity-90">{banner.subtitle}</p>
            </Card>
          ))}
        </div>

        {/* Categorias */}
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4 text-foreground">Categorias</h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {categories.map((category) => {
              const IconComponent = category.icon;
              return (
                <Card key={category.name} className="bg-card border hover:shadow-lg transition-all hover:scale-105 p-4 text-center cursor-pointer">
                  <IconComponent className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="text-sm font-medium text-foreground">{category.name}</p>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Produtos Recomendados */}
        <section>
          <h2 className="text-xl font-bold mb-4 text-foreground">Recomendados para Você</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {products.map((product) => (
              <Link key={product.id} to={`/cliente/produto/${product.id}`}>
                <Card className="bg-card border overflow-hidden hover:shadow-lg transition-all hover:scale-105 cursor-pointer">
                  <div className="aspect-square overflow-hidden">
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-sm mb-2 line-clamp-2 text-foreground">{product.name}</h3>
                    <div className="flex items-center justify-between">
                      <p className="text-primary font-bold">{product.price}</p>
                      <div className="flex items-center gap-1 text-xs">
                        <span className="text-yellow-500">⭐</span>
                        <span className="text-foreground">{product.rating}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Ofertas em Destaque */}
        <section className="mt-8">
          <h2 className="text-xl font-bold mb-4 text-foreground">Ofertas Relâmpago</h2>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {products.map((product) => (
              <Link key={product.id} to={`/cliente/produto/${product.id}`} className="flex-shrink-0 w-40">
                <Card className="bg-card border overflow-hidden hover:shadow-lg transition-all hover:scale-105">
                  <div className="aspect-square overflow-hidden">
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-3">
                    <p className="text-xs mb-1 line-clamp-1 text-foreground">{product.name}</p>
                    <p className="text-primary font-bold text-sm">{product.price}</p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
};

export default ClienteHome;
