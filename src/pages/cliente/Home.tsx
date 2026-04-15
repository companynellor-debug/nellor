import { useState, useEffect, useCallback, useRef } from "react";

import { ParticlesBackground } from "@/components/cliente/ParticlesBackground";
import { BottomNav } from "@/components/cliente/BottomNav";
import { ProductSearchOverlay } from "@/components/cliente/ProductSearchOverlay";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Heart, Bell, Bookmark, ChevronRight, X, Download, Smartphone, CheckCircle2, Package, Sparkles, HelpCircle, FileText } from "lucide-react";
import { DarkGlassIcon } from "@/components/ui/dark-glass-icon";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import logo from "@/assets/logo.png";
import { useFavorites } from "@/hooks/useFavorites";
import { useProducts } from "@/hooks/useProducts";
import { useSupabaseBanners } from "@/hooks/useSupabaseBanners";
import { useSupabaseCategories } from "@/hooks/useSupabaseCategories";
import { useSupabaseStores } from "@/hooks/useSupabaseStores";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { useCart } from "@/hooks/useCart";
import { usePWA } from "@/hooks/usePWA";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useProductVariations } from "@/hooks/useProductVariations";
import { getColorHex } from "@/utils/colorMap";

import { useClientOnboardingTour } from "@/hooks/useClientOnboardingTour";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

const ProductCardColorDots = ({ productId }: {productId: string;}) => {
  const { variations } = useProductVariations(productId);
  const uniqueColors = [...new Set(variations.filter((v) => v.color).map((v) => ({ name: v.color!, hex: v.color_hex })))];
  const seen = new Set<string>();
  const deduped = uniqueColors.filter((c) => {
    if (seen.has(c.name)) return false;
    seen.add(c.name);
    return true;
  });

  if (deduped.length === 0) return null;
  return (
    <div className="flex gap-1 mt-1">
      {deduped.slice(0, 5).map((c) =>
      <div key={c.name} className="w-3.5 h-3.5 rounded-full border border-border"
      style={{ backgroundColor: c.hex || getColorHex(c.name) || '#ccc' }}
      title={c.name} />
      )}
      {deduped.length > 5 && <span className="text-[10px] text-muted-foreground">+{deduped.length - 5}</span>}
    </div>);

};

const ClienteHome = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { favorites } = useFavorites();
  const { products } = useProducts();
  const { banners } = useSupabaseBanners();
  const { categories } = useSupabaseCategories();
  const { stores } = useSupabaseStores();
  
  const { cartItems } = useCart();
  const { canInstall, isInstalled, isIOS, installApp } = usePWA();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(true);
  const [showStripeReturnBanner, setShowStripeReturnBanner] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { startTour } = useClientOnboardingTour();
  const { profile } = useSupabaseAuth();
  const tourStartedRef = useRef(false);

  // Auto-start tour for first-time clients (once per session)
  useEffect(() => {
    if (
      profile &&
      profile.tipo === 'cliente' &&
      profile.client_onboarding_completed === false &&
      !tourStartedRef.current &&
      !sessionStorage.getItem('nellor_tour_done')
    ) {
      tourStartedRef.current = true;
      const t = setTimeout(() => startTour(), 800);
      return () => clearTimeout(t);
    }
  }, [profile]);

  useEffect(() => {
    if (searchParams.get("stripe_return") === "1") {
      setShowStripeReturnBanner(true);
      searchParams.delete("stripe_return");
      searchParams.delete("session_id");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const mainBanners = banners.slice(0, 3);
  const filteredProducts = selectedCategory ? products.filter((product) => product.category === selectedCategory) : products;

  // Ordenar fornecedores por total de vendas (soma de vendas_count dos produtos)
  const sortedStores = [...stores].sort((a, b) => {
    const salesA = products.filter(p => p.supplierUuid === a.id).reduce((sum, p) => sum + (p.salesCount || 0), 0);
    const salesB = products.filter(p => p.supplierUuid === b.id).reduce((sum, p) => sum + (p.salesCount || 0), 0);
    return salesB - salesA;
  });

  return (
    <div className="min-h-screen bg-muted/30 pb-20 lg:pb-0">
      <ParticlesBackground />
      
      {/* Desktop Header */}
      <header className="sticky top-0 z-40 bg-background border-b shadow-sm">
        <div className="container mx-auto px-4">
          <div className="hidden lg:flex items-center justify-between py-2 text-sm border-b border-border/50">
            <div className="flex items-center gap-4 text-muted-foreground">
              <span>Bem-vindo à Nellor</span>
            </div>
            <div className="flex items-center gap-4 text-muted-foreground">
              <button onClick={() => navigate("/cliente/notificacoes")} className="hover:text-primary transition-colors">Notificações</button>
              <button onClick={() => navigate("/cliente/suporte")} className="hover:text-primary transition-colors">Ajuda</button>
            </div>
          </div>
          <div className="flex items-center justify-between gap-4 py-4">
            <img src={logo} alt="Nellor" className="h-10 lg:h-12 w-auto cursor-pointer" onClick={() => navigate("/cliente")} />
            <div className="flex-1 max-w-2xl hidden md:block">
              <div className="relative" onClick={() => setSearchOpen(true)} id="home-search-bar" data-tour="home-search-bar">
                <Input placeholder="Buscar produtos, marcas e muito mais..." className="pl-4 pr-12 py-6 bg-muted border-input focus:border-primary cursor-pointer text-base" readOnly />
                <button className="absolute right-0 top-0 h-full px-4 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors rounded-r-md">
                  <Search className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 md:hidden" onClick={() => setSearchOpen(true)} data-tour="home-search-bar">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input placeholder="Buscar produtos..." className="pl-10 bg-muted border-input cursor-pointer" readOnly />
              </div>
            </div>
            <div className="flex items-center gap-2 lg:gap-4">
              <button onClick={() => navigate("/cliente/notificacoes")} className="p-2 hover:bg-muted rounded-full transition-colors">
                <Bell className="h-6 w-6 text-foreground" />
              </button>
              <button onClick={() => navigate("/cliente/carrinho")} className="relative p-2 hover:bg-muted rounded-full transition-colors">
                <Bookmark className="h-6 w-6 text-foreground" />
                {cartItems.length > 0 && <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">{cartItems.length}</span>}
              </button>
              <button onClick={() => navigate("/cliente/favoritos")} className="relative p-2 hover:bg-muted rounded-full transition-colors">
                <Heart className="h-6 w-6 text-foreground" />
                {favorites.length > 0 && <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">{favorites.length}</span>}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 relative z-10">
        {showStripeReturnBanner &&
        <div className="mb-6">
            <Card className="border-primary/20 bg-primary/5">
              <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-full bg-primary/10 p-2"><CheckCircle2 className="h-5 w-5 text-primary" /></div>
                  <div>
                    <p className="font-semibold text-foreground">Pagamento em processamento</p>
                    <p className="text-sm text-muted-foreground">Para o pedido prosseguir, abra <strong>Meus Pedidos</strong> e acompanhe o status.</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:flex sm:items-center sm:justify-center">
                  <Button onClick={() => navigate("/cliente/meus-pedidos")}>Ir para Meus Pedidos</Button>
                  <Button variant="ghost" onClick={() => setShowStripeReturnBanner(false)}>Fechar</Button>
                </div>
              </div>
            </Card>
          </div>
        }

        {/* Banners */}
        {banners.length > 0 &&
        <div className="mb-6">
            <div className="max-w-6xl mx-auto">
              <Carousel opts={{ align: "center", loop: true }} plugins={[Autoplay({ delay: 4000 })]} className="w-full">
                <CarouselContent>
                  {mainBanners.map((banner) =>
                <CarouselItem key={banner.id}>
                      <div className="relative overflow-hidden rounded-3xl cursor-pointer shadow-lg hover:shadow-xl transition-shadow" onClick={() => banner.link_url && navigate(banner.link_url)}>
                        <img src={banner.image_url} alt={banner.title || "Banner"} className="w-full h-40 md:h-80 lg:h-[420px] object-cover" />
                      </div>
                    </CarouselItem>
                )}
                </CarouselContent>
              </Carousel>
            </div>
          </div>
        }

        {/* B2B Banner Strip */}
        <div className="mb-6 rounded-xl overflow-hidden" style={{ background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(270 60% 50%) 100%)' }}>
          <div className="flex items-center justify-between px-4 py-3 sm:px-6" style={{ maxHeight: '60px' }}>
            <div className="flex items-center gap-3 min-w-0">
              <Package className="h-5 w-5 text-white flex-shrink-0" />
              <p className="text-white font-bold text-sm sm:text-base truncate">
                Pedido mínimo a partir de 10 unidades
              </p>
            </div>
            <Badge className="bg-white/20 text-white border-white/30 font-bold text-xs flex-shrink-0 ml-2">
              Para Revenda
            </Badge>
          </div>
        </div>

        {/* Categories */}
        {categories.length > 0 &&
        <section className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-medium text-muted-foreground">Categorias</h3>
              {selectedCategory &&
              <button onClick={() => setSelectedCategory(null)} className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-destructive bg-destructive/10 hover:bg-destructive/20 rounded-full transition-colors">
                  <X className="w-3 h-3" />Limpar
                </button>
              }
            </div>
            <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide snap-x">
              {categories.map((category) =>
              <button key={category.id} onClick={() => setSelectedCategory(selectedCategory === category.slug ? null : category.slug)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full border-2 transition-all whitespace-nowrap snap-start ${selectedCategory === category.slug ? 'bg-primary text-primary-foreground border-primary shadow-md' : 'bg-background border-border hover:border-primary/50 hover:bg-muted'}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${selectedCategory === category.slug ? 'bg-primary-foreground/20' : 'bg-primary/10'}`}>
                    {category.imagem_url ? <img src={category.imagem_url} alt={category.nome} className="w-5 h-5 object-contain" /> : <span className="text-sm">🛍️</span>}
                  </div>
                  <span className="text-xs font-semibold">{category.nome}</span>
                </button>
              )}
            </div>
          </section>
        }


        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">📦 Produtos para Revenda</h2>
            <button onClick={() => navigate("/cliente/produtos")} className="flex items-center gap-1 text-primary hover:underline text-sm font-medium">
              Ver Tudo <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {filteredProducts.slice(0, 8).map((product) =>
            <Link key={product.id} to={`/cliente/produto/${(product as any).supplierUuid || product.id}`} className="flex-shrink-0 w-44 lg:w-52">
                <Card className="bg-background border overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1 group rounded-2xl shadow-md">
                  <div className="aspect-square overflow-hidden relative rounded-t-2xl">
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    {(() => {
                      const su = (product as any).saleUnit;
                      const units = (product as any).unitsPerSaleUnit;
                      const balePieces = (product as any).baleApproxPieces;
                      const kitCount = (product as any).kitItemsCount;
                      if (su === 'closed_box' && units > 1) return <Badge className="absolute top-2.5 right-2.5 bg-foreground/80 text-background text-[10px] rounded-full px-2">Caixa c/ {units} un</Badge>;
                      if (su === 'bale') return <Badge className="absolute top-2.5 right-2.5 bg-foreground/80 text-background text-[10px] rounded-full px-2">Fardo {balePieces ? `~${balePieces}pç` : ''}</Badge>;
                      if (su === 'kit' && kitCount > 0) return <Badge className="absolute top-2.5 right-2.5 bg-foreground/80 text-background text-[10px] rounded-full px-2">Kit {kitCount} itens</Badge>;
                      if (su === 'pair') return <Badge className="absolute top-2.5 right-2.5 bg-foreground/80 text-background text-[10px] rounded-full px-2">Par</Badge>;
                      if ((product as any).minQuantity && (product as any).minQuantity > 1) return <Badge className="absolute top-2.5 right-2.5 bg-foreground/80 text-background text-[10px] rounded-full px-2">Mín. {(product as any).minQuantity} un.</Badge>;
                      return null;
                    })()}
                    <div className="absolute bottom-2.5 left-2.5 bg-primary/90 text-primary-foreground text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-sm">
                      {product.price}
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-sm mb-1.5 line-clamp-2 text-foreground min-h-[40px]">{product.name}</p>
                    {(product as any).supplierUuid && <ProductCardColorDots productId={(product as any).supplierUuid} />}
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
            )}
          </div>
        </section>

        {/* Fornecedores em Destaque - Real Data */}
        {stores.length > 0 &&
        <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground">🏆 Fornecedores em Destaque</h2>
              <button onClick={() => navigate("/cliente/produtos")} className="flex items-center gap-1 text-primary hover:underline text-sm font-medium">
                Ver Todos <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {sortedStores.map((store) =>
            <div key={store.id} className="flex-shrink-0 w-64">
                  <Card className="bg-background border overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1 group p-4 flex items-center gap-4 cursor-pointer rounded-2xl shadow-sm"
              onClick={() => navigate(`/cliente/loja/${store.id}`)}>
                    <Avatar className="h-16 w-16 border-2 border-primary/20 flex-shrink-0 rounded-2xl">
                      <AvatarImage src={store.foto_perfil_url || undefined} alt={store.nome} className="rounded-2xl" />
                      <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold rounded-2xl">{store.nome.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm text-foreground truncate">{store.nome}</h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{store.descricao_loja || 'Fornecedor verificado'}</p>
                    </div>
                  </Card>
                </div>
            )}
            </div>
          </section>
        }

        {/* Products Grid */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">
              {selectedCategory ? `Produtos em ${selectedCategory}` : 'Recomendados para Você'}
            </h2>
            <button onClick={() => navigate("/cliente/produtos")} className="flex items-center gap-1 text-primary hover:underline text-sm font-medium">
              Ver Mais <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
            {filteredProducts.map((product, idx) =>
            <Link key={product.id} to={`/cliente/produto/${(product as any).supplierUuid || product.id}`} {...(idx === 0 ? { "data-tour": "product-card" } : {})}>
                <Card className="bg-background border overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1 group h-full rounded-2xl shadow-sm">
                  <div className="aspect-square overflow-hidden relative rounded-t-2xl">
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    {(() => {
                      const su = (product as any).saleUnit;
                      const units = (product as any).unitsPerSaleUnit;
                      const balePieces = (product as any).baleApproxPieces;
                      const kitCount = (product as any).kitItemsCount;
                      if (su === 'closed_box' && units > 1) return <Badge className="absolute top-2.5 right-2.5 bg-foreground/80 text-background text-[10px] rounded-full px-2">Caixa c/ {units} un</Badge>;
                      if (su === 'bale') return <Badge className="absolute top-2.5 right-2.5 bg-foreground/80 text-background text-[10px] rounded-full px-2">Fardo {balePieces ? `~${balePieces}pç` : ''}</Badge>;
                      if (su === 'kit' && kitCount > 0) return <Badge className="absolute top-2.5 right-2.5 bg-foreground/80 text-background text-[10px] rounded-full px-2">Kit {kitCount} itens</Badge>;
                      if (su === 'pair') return <Badge className="absolute top-2.5 right-2.5 bg-foreground/80 text-background text-[10px] rounded-full px-2">Par</Badge>;
                      return null;
                    })()}
                    <div className="absolute bottom-2.5 left-2.5 bg-primary/90 text-primary-foreground text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-sm">
                      {product.price}
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-sm mb-1.5 line-clamp-2 text-foreground min-h-[40px]">{product.name}</h3>
                    {(product as any).supplierUuid && <ProductCardColorDots productId={(product as any).supplierUuid} />}
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
            )}
          </div>
        </section>
      </main>

      {/* Floating Install Banner */}
      {showInstallBanner && canInstall && !isInstalled &&
      <div className="fixed bottom-20 left-4 right-4 z-50 lg:bottom-4 lg:left-auto lg:right-4 lg:max-w-sm animate-in slide-in-from-bottom-4 duration-500">
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
                if (isIOS) {navigate("/cliente/instalar");} else {installApp();}
              }}>
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  {isIOS ? "Ver instruções" : "Instalar agora"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      }


      <BottomNav />
      <ProductSearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>);

};
export default ClienteHome;