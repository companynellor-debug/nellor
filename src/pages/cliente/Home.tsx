import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, X, Download, Smartphone, CheckCircle2 } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useFavorites } from "@/hooks/useFavorites";
import { useProducts } from "@/hooks/useProducts";
import { useSupabaseBanners } from "@/hooks/useSupabaseBanners";
import { useSupabaseCategories } from "@/hooks/useSupabaseCategories";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { usePWA } from "@/hooks/usePWA";

const ClienteHome = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { favorites } = useFavorites();
  const { products } = useProducts();
  const { banners } = useSupabaseBanners();
  const { categories } = useSupabaseCategories();
  const { canInstall, isInstalled, isIOS, installApp } = usePWA();
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(true);
  const [showStripeReturnBanner, setShowStripeReturnBanner] = useState(false);

  // Detecta retorno do Stripe
  useEffect(() => {
    if (searchParams.get("stripe_return") === "1") {
      setShowStripeReturnBanner(true);
      searchParams.delete("stripe_return");
      searchParams.delete("session_id");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const mainBanners = banners.slice(0, 3);

  // Filter products by selected category
  const filteredProducts = selectedCategory 
    ? products.filter(product => product.category === selectedCategory) 
    : products;

  return (
    <div className="min-h-full pb-20 lg:pb-6">
      <div className="container mx-auto px-4 py-6">
        {/* Stripe Return Banner */}
        {showStripeReturnBanner && (
          <Card className="border-primary/20 bg-primary/5 mb-6">
            <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-full bg-primary/10 p-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Pagamento em processamento</p>
                  <p className="text-sm text-muted-foreground">
                    Para o pedido prosseguir, abra <strong>Meus Pedidos</strong> e acompanhe o status.
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button onClick={() => navigate("/cliente/meus-pedidos")}>Ir para Meus Pedidos</Button>
                <Button variant="ghost" onClick={() => setShowStripeReturnBanner(false)}>Fechar</Button>
              </div>
            </div>
          </Card>
        )}

        {/* Banners Section */}
        {banners.length > 0 && (
          <div className="mb-8">
            <Carousel 
              opts={{ align: "center", loop: true }} 
              plugins={[Autoplay({ delay: 4000 })]} 
              className="w-full"
            >
              <CarouselContent>
                {mainBanners.map(banner => (
                  <CarouselItem key={banner.id}>
                    <div 
                      className="relative overflow-hidden rounded-2xl cursor-pointer shadow-lg" 
                      onClick={() => banner.link_url && navigate(banner.link_url)}
                    >
                      <img 
                        src={banner.image_url} 
                        alt={banner.title || "Banner"} 
                        className="w-full h-48 md:h-64 lg:h-80 object-cover" 
                      />
                      {banner.title && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 md:p-6">
                          <h3 className="text-white font-bold text-lg md:text-xl">{banner.title}</h3>
                          {banner.subtitle && <p className="text-white/90 text-sm md:text-base">{banner.subtitle}</p>}
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

        {/* Categories */}
        {categories.length > 0 && (
          <section className="mb-8">
            <Card className="p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-muted-foreground">Categorias</h3>
                {selectedCategory && (
                  <button 
                    onClick={() => setSelectedCategory(null)} 
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-destructive bg-destructive/10 hover:bg-destructive/20 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Limpar filtro
                  </button>
                )}
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide justify-start lg:justify-center">
                {categories.map(category => (
                  <button 
                    key={category.id} 
                    onClick={() => setSelectedCategory(selectedCategory === category.slug ? null : category.slug)} 
                    className={`flex flex-col items-center gap-2 min-w-[80px] p-3 rounded-xl transition-colors group ${
                      selectedCategory === category.slug 
                        ? 'bg-primary/20 ring-2 ring-primary' 
                        : 'hover:bg-muted'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                      selectedCategory === category.slug 
                        ? 'bg-primary/30' 
                        : 'bg-primary/10 group-hover:bg-primary/20'
                    }`}>
                      {category.imagem_url 
                        ? <img src={category.imagem_url} alt={category.nome} className="w-8 h-8 object-contain" /> 
                        : <span className="text-2xl">🛍️</span>
                      }
                    </div>
                    <span className={`text-xs text-center font-medium whitespace-nowrap ${
                      selectedCategory === category.slug ? 'text-primary' : 'text-foreground'
                    }`}>
                      {category.nome}
                    </span>
                  </button>
                ))}
              </div>
            </Card>
          </section>
        )}

        {/* Flash Deals */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">⚡ Ofertas Relâmpago</h2>
            <button 
              onClick={() => navigate("/cliente/produtos")} 
              className="flex items-center gap-1 text-primary hover:underline text-sm font-medium"
            >
              Ver Tudo <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {filteredProducts.slice(0, 8).map(product => (
              <Link key={product.id} to={`/cliente/produto/${product.id}`} className="flex-shrink-0 w-44 lg:w-52">
                <Card className="overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1 group">
                  <div className="aspect-square overflow-hidden relative">
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                  <div className="p-3">
                    <p className="text-sm mb-2 line-clamp-2 text-foreground min-h-[40px]">{product.name}</p>
                    <p className="text-primary font-bold text-lg">{product.price}</p>
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-500 text-sm">⭐</span>
                        <span className="text-xs text-muted-foreground">{product.rating > 0 ? product.rating.toFixed(1) : '-'}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{product.salesCount || 0} vendidos</span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Products Grid */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">
              {selectedCategory ? `Produtos em ${selectedCategory}` : 'Recomendados para Você'}
            </h2>
            <button 
              onClick={() => navigate("/cliente/produtos")} 
              className="flex items-center gap-1 text-primary hover:underline text-sm font-medium"
            >
              Ver Mais <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredProducts.map(product => (
              <Link key={product.id} to={`/cliente/produto/${product.id}`}>
                <Card className="overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1 group h-full">
                  <div className="aspect-square overflow-hidden">
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-sm mb-2 line-clamp-2 text-foreground min-h-[40px]">{product.name}</h3>
                    <p className="text-primary font-bold">{product.price}</p>
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center gap-1 text-xs">
                        <span className="text-yellow-500">⭐</span>
                        <span className="text-muted-foreground">{product.rating > 0 ? product.rating.toFixed(1) : '-'}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{product.salesCount || 0} vendidos</span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      </div>

      {/* Floating Install Banner */}
      {showInstallBanner && canInstall && !isInstalled && (
        <div className="fixed bottom-20 left-4 right-4 z-40 lg:bottom-4 lg:left-auto lg:right-4 lg:max-w-sm animate-in slide-in-from-bottom-4 duration-500">
          <Card className="bg-gradient-to-r from-primary to-purple-600 text-white p-4 shadow-2xl border-0">
            <button 
              onClick={() => setShowInstallBanner(false)} 
              className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                <Smartphone className="h-7 w-7" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm mb-0.5">Instale o Nellor!</h4>
                <p className="text-xs text-white/80 mb-2">
                  {isIOS ? "Adicione à tela inicial para acesso rápido" : "Acesso rápido e notificações em tempo real"}
                </p>
                <Button 
                  size="sm" 
                  className="bg-white text-primary hover:bg-white/90 h-8 text-xs font-semibold" 
                  onClick={() => isIOS ? navigate("/cliente/instalar") : installApp()}
                >
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  {isIOS ? "Ver instruções" : "Instalar agora"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ClienteHome;
