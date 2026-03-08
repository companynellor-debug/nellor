import { useState, useEffect } from "react";
import { ParticlesBackground } from "@/components/cliente/ParticlesBackground";
import { BottomNav } from "@/components/cliente/BottomNav";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Heart, Bell, ShoppingCart, ChevronRight, X, Download, Smartphone, CheckCircle2 } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import logo from "@/assets/logo.png";
import { useFavorites } from "@/hooks/useFavorites";
import { useProducts } from "@/hooks/useProducts";
import { useSupabaseBanners } from "@/hooks/useSupabaseBanners";
import { useSupabaseCategories } from "@/hooks/useSupabaseCategories";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { useCart } from "@/hooks/useCart";
import { usePWA } from "@/hooks/usePWA";
const ClienteHome = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    favorites
  } = useFavorites();
  const {
    products
  } = useProducts();
  const {
    banners
  } = useSupabaseBanners();
  const {
    categories
  } = useSupabaseCategories();
  const {
    cartItems
  } = useCart();
  const {
    canInstall,
    isInstalled,
    isIOS,
    installApp
  } = usePWA();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(true);
  const [showStripeReturnBanner, setShowStripeReturnBanner] = useState(false);

  // Detecta retorno do Stripe
  useEffect(() => {
    if (searchParams.get("stripe_return") === "1") {
      setShowStripeReturnBanner(true);
      // Remove o parâmetro da URL
      searchParams.delete("stripe_return");
      searchParams.delete("session_id");
      setSearchParams(searchParams, {
        replace: true
      });
    }
  }, [searchParams, setSearchParams]);
  const mainBanners = banners.slice(0, 3);
  const sideBanners = banners.slice(3, 5);

  // Filter products by selected category
  const filteredProducts = selectedCategory ? products.filter(product => product.category === selectedCategory) : products;
  return <div className="min-h-screen bg-muted/30 pb-20 lg:pb-0">
      <ParticlesBackground />
      
      {/* Desktop Header */}
      <header className="sticky top-0 z-40 bg-background border-b shadow-sm">
        <div className="container mx-auto px-4">
          {/* Top bar - desktop only */}
          <div className="hidden lg:flex items-center justify-between py-2 text-sm border-b border-border/50">
            <div className="flex items-center gap-4 text-muted-foreground">
              <span>Bem-vindo à Nellor</span>
            </div>
            <div className="flex items-center gap-4 text-muted-foreground">
              <button onClick={() => navigate("/cliente/notificacoes")} className="hover:text-primary transition-colors">
                Notificações
              </button>
              <button onClick={() => navigate("/cliente/suporte")} className="hover:text-primary transition-colors">
                Ajuda
              </button>
            </div>
          </div>

          {/* Main header */}
          <div className="flex items-center justify-between gap-4 py-4">
            <img src={logo} alt="Nellor" className="h-10 lg:h-12 w-auto cursor-pointer" onClick={() => navigate("/cliente")} />
            
            {/* Search bar - expands on desktop */}
            <div className="flex-1 max-w-2xl hidden md:block">
              <div className="relative" onClick={() => navigate("/cliente/produtos")}>
                <Input placeholder="Buscar produtos, marcas e muito mais..." className="pl-4 pr-12 py-6 bg-muted border-input focus:border-primary cursor-pointer text-base" readOnly />
                <button className="absolute right-0 top-0 h-full px-4 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors rounded-r-md">
                  <Search className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Mobile search */}
            <div className="flex-1 md:hidden" onClick={() => navigate("/cliente/produtos")}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input placeholder="Buscar produtos..." className="pl-10 bg-muted border-input cursor-pointer" readOnly />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 lg:gap-4">
              <button onClick={() => navigate("/cliente/notificacoes")} className="p-2 hover:bg-muted rounded-full transition-colors">
                <Bell className="h-6 w-6 text-foreground" />
              </button>
              <button onClick={() => navigate("/cliente/carrinho")} className="relative p-2 hover:bg-muted rounded-full transition-colors">
                <ShoppingCart className="h-6 w-6 text-foreground" />
                {cartItems.length > 0 && <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cartItems.length}
                  </span>}
              </button>
              <button onClick={() => navigate("/cliente/favoritos")} className="relative p-2 hover:bg-muted rounded-full transition-colors">
                <Heart className="h-6 w-6 text-foreground" />
                {favorites.length > 0 && <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {favorites.length}
                  </span>}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 relative z-10">
        {showStripeReturnBanner && <div className="mb-6">
            <Card className="border-primary/20 bg-primary/5">
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

                <div className="flex flex-col gap-2 sm:flex-row sm:flex sm:items-center sm:justify-center">
                  <Button onClick={() => navigate("/cliente/meus-pedidos")}>Ir para Meus Pedidos</Button>
                  <Button variant="ghost" onClick={() => setShowStripeReturnBanner(false)}>
                    Fechar
                  </Button>
                </div>
              </div>
            </Card>
          </div>}

        {/* Banners Section - Centered */}
        {banners.length > 0 && <div className="mb-8">
            <div className="max-w-6xl mx-auto">
              <Carousel opts={{
              align: "center",
              loop: true
            }} plugins={[Autoplay({
              delay: 4000
            })]} className="w-full">
                <CarouselContent>
                  {mainBanners.map(banner => <CarouselItem key={banner.id}>
                      <div className="relative overflow-hidden rounded-xl cursor-pointer" onClick={() => banner.link_url && navigate(banner.link_url)}>
                        <img src={banner.image_url} alt={banner.title || "Banner"} className="w-full h-56 md:h-80 lg:h-[420px] object-cover" />
                      </div>
                    </CarouselItem>)}
                </CarouselContent>
              </Carousel>
            </div>
          </div>}

        {/* Faixa de Compra em Massa */}
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 mb-8 text-center flex flex-col sm:flex-row items-center justify-center gap-3">
          <Package className="h-6 w-6 text-primary" />
          <p className="text-foreground font-medium">Pedido mínimo a partir de 10 unidades — Compre para revender com os melhores preços!</p>
        </div>

        {/* Categories - Icon style row */}
        {categories.length > 0 && <section className="mb-8">
            <div className="bg-background rounded-xl p-4 shadow-sm border">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-muted-foreground">Categorias</h3>
                {selectedCategory && <button onClick={() => setSelectedCategory(null)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-destructive bg-destructive/10 hover:bg-destructive/20 rounded-full transition-colors">
                    <X className="w-4 h-4" />
                    Limpar filtro
                  </button>}
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide justify-start lg:justify-center">
                {categories.map(category => <button key={category.id} onClick={() => setSelectedCategory(selectedCategory === category.slug ? null : category.slug)} className={`flex flex-col items-center gap-2 min-w-[80px] p-3 rounded-xl transition-colors group ${selectedCategory === category.slug ? 'bg-primary/20 ring-2 ring-primary' : 'hover:bg-muted'}`}>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${selectedCategory === category.slug ? 'bg-primary/30' : 'bg-primary/10 group-hover:bg-primary/20'}`}>
                      {category.imagem_url ? <img src={category.imagem_url} alt={category.nome} className="w-8 h-8 object-contain" /> : <span className="text-2xl">🛍️</span>}
                    </div>
                    <span className={`text-xs text-center font-medium whitespace-nowrap ${selectedCategory === category.slug ? 'text-primary' : 'text-foreground'}`}>
                      {category.nome}
                    </span>
                  </button>)}
              </div>
            </div>
          </section>}

        {/* Flash Deals Section -> Produtos para Revenda */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-foreground">📦 Produtos para Revenda</h2>
            </div>
            <button onClick={() => navigate("/cliente/produtos")} className="flex items-center gap-1 text-primary hover:underline text-sm font-medium">
              Ver Tudo <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {filteredProducts.slice(0, 8).map(product => <Link key={product.id} to={`/cliente/produto/${product.id}`} className="flex-shrink-0 w-44 lg:w-52">
                <Card className="bg-background border overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1 group">
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
              </Link>)}
          </div>
        </section>

        {/* Products Grid - Recomendados */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">
              {selectedCategory ? `Produtos em ${selectedCategory}` : 'Recomendados para Você'}
            </h2>
            <button onClick={() => navigate("/cliente/produtos")} className="flex items-center gap-1 text-primary hover:underline text-sm font-medium">
              Ver Mais <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredProducts.map(product => <Link key={product.id} to={`/cliente/produto/${product.id}`}>
                <Card className="bg-background border overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1 group h-full">
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
              </Link>)}
          </div>
        </section>
      </main>

      {/* Floating Install Banner */}
      {showInstallBanner && canInstall && !isInstalled && <div className="fixed bottom-20 left-4 right-4 z-50 lg:bottom-4 lg:left-auto lg:right-4 lg:max-w-sm animate-in slide-in-from-bottom-4 duration-500">
          <Card className="bg-gradient-to-r from-primary to-purple-600 text-white p-4 shadow-2xl border-0">
            <button onClick={() => setShowInstallBanner(false)} className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded-full transition-colors">
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
                <Button size="sm" className="bg-white text-primary hover:bg-white/90 h-8 text-xs font-semibold" onClick={() => {
              if (isIOS) {
                navigate("/cliente/instalar");
              } else {
                installApp();
              }
            }}>
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  {isIOS ? "Ver instruções" : "Instalar agora"}
                </Button>
              </div>
            </div>
          </Card>
        </div>}

      <BottomNav />
    </div>;
};
export default ClienteHome;