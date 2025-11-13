import { ParticlesBackground } from "@/components/cliente/ParticlesBackground";
import { BottomNav } from "@/components/cliente/BottomNav";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Heart, Bell } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";
import { useFavorites } from "@/hooks/useFavorites";
import { useProducts } from "@/hooks/useProducts";
import { useSupabaseBanners } from "@/hooks/useSupabaseBanners";
import { useCategories } from "@/hooks/useCategories";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
const ClienteHome = () => {
  const navigate = useNavigate();
  const {
    favorites
  } = useFavorites();
  const {
    products
  } = useProducts();
  const { banners } = useSupabaseBanners();
  const { categories } = useCategories();
  return <div className="min-h-screen bg-background pb-20">
      <ParticlesBackground />
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <img src={logo} alt="Nellor" className="h-12 w-auto" />
            <div className="flex items-center gap-4">
              <button onClick={() => navigate("/cliente/notificacoes")}>
                <Bell className="h-6 w-6 text-foreground cursor-pointer hover:text-primary transition-colors" />
              </button>
              <button onClick={() => navigate("/cliente/favoritos")} className="relative">
                <Heart className="h-6 w-6 text-foreground cursor-pointer hover:text-primary transition-colors" />
                {favorites.length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {favorites.length}
                  </span>}
              </button>
            </div>
          </div>
          
          <div className="relative" onClick={() => navigate("/cliente/produtos")}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input placeholder="Buscar produtos ou marcas..." className="pl-10 bg-muted border-input focus:border-primary cursor-pointer" readOnly />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 relative z-10">
        {/* Banners Carousel */}
        {banners.length > 0 && (
          <div className="mb-8">
            <Carousel 
              opts={{
                align: "start",
                loop: true
              }} 
              plugins={[Autoplay({ delay: 4000 })]} 
              className="w-full"
            >
              <CarouselContent>
                {banners.map(banner => (
                  <CarouselItem key={banner.id}>
                    <div className="relative overflow-hidden rounded-lg cursor-pointer"
                         onClick={() => banner.link_url && navigate(banner.link_url)}>
                      <img 
                        src={banner.image_url} 
                        alt={banner.title || "Banner"} 
                        className="w-full h-48 md:h-64 object-cover" 
                      />
                      {banner.title && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                          <h3 className="text-white font-bold text-lg">{banner.title}</h3>
                          {banner.subtitle && (
                            <p className="text-white/90 text-sm">{banner.subtitle}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-2" />
              <CarouselNext className="right-2" />
            </Carousel>
          </div>
        )}

        {/* Categorias */}
        {categories.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4 text-foreground">Categorias</h2>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {categories.map(category => (
                <Badge
                  key={category.id}
                  onClick={() => navigate(`/cliente/produtos?categoria=${category.name}`)}
                  variant="secondary"
                  className="cursor-pointer whitespace-nowrap px-4 py-2"
                >
                  {category.name}
                </Badge>
              ))}
            </div>
          </section>
        )}

        {/* Produtos Recomendados */}
        <section>
          <h2 className="text-xl font-bold mb-4 text-foreground">Recomendados para Você</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {products.map(product => <Link key={product.id} to={`/cliente/produto/${product.id}`}>
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
              </Link>)}
          </div>
        </section>

        {/* Ofertas em Destaque */}
        <section className="mt-8">
          <h2 className="text-xl font-bold mb-4 text-foreground">Ofertas Relâmpago</h2>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {products.map(product => <Link key={product.id} to={`/cliente/produto/${product.id}`} className="flex-shrink-0 w-40">
                <Card className="bg-card border overflow-hidden hover:shadow-lg transition-all hover:scale-105">
                  <div className="aspect-square overflow-hidden">
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-3">
                    <p className="text-xs mb-1 line-clamp-1 text-foreground">{product.name}</p>
                    <p className="text-primary font-bold text-sm">{product.price}</p>
                  </div>
                </Card>
              </Link>)}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>;
};
export default ClienteHome;