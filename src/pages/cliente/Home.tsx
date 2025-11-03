import { ParticlesBackground } from "@/components/cliente/ParticlesBackground";
import { BottomNav } from "@/components/cliente/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Heart, Bell } from "lucide-react";
import { Link } from "react-router-dom";

const ClienteHome = () => {
  const categories = [
    { name: "Roupas", emoji: "👕" },
    { name: "Calçados", emoji: "👟" },
    { name: "Acessórios", emoji: "⌚" },
    { name: "Eletrônicos", emoji: "📱" },
    { name: "Beleza", emoji: "💄" },
    { name: "Casa", emoji: "🏠" },
  ];

  const products = [
    { id: 1, name: "Tênis Esportivo Premium", price: "R$ 299,90", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=300&fit=crop", rating: 4.8 },
    { id: 2, name: "Bolsa de Couro Elegante", price: "R$ 189,90", image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=300&h=300&fit=crop", rating: 4.9 },
    { id: 3, name: "Relógio Smartwatch", price: "R$ 399,90", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop", rating: 4.7 },
    { id: 4, name: "Fone Bluetooth Pro", price: "R$ 249,90", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop", rating: 4.6 },
  ];

  const banners = [
    { title: "Mega Promoção", subtitle: "Até 70% OFF", color: "from-purple-600 to-pink-600" },
    { title: "Novidades", subtitle: "Confira já!", color: "from-blue-600 to-purple-600" },
    { title: "Frete Grátis", subtitle: "Em compras acima de R$ 99", color: "from-green-600 to-teal-600" },
  ];

  return (
    <div className="min-h-screen bg-[hsl(var(--cliente-bg))] text-[hsl(var(--cliente-text))] pb-20">
      <ParticlesBackground />
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[hsl(var(--cliente-surface))]/95 backdrop-blur-lg border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              nellor
            </h1>
            <div className="flex items-center gap-4">
              <Bell className="h-6 w-6 cursor-pointer hover:text-[hsl(var(--cliente-accent))] transition-colors" />
              <Heart className="h-6 w-6 cursor-pointer hover:text-[hsl(var(--cliente-accent))] transition-colors" />
            </div>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[hsl(var(--cliente-text-muted))]" />
            <Input
              placeholder="Buscar produtos ou marcas..."
              className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[hsl(var(--cliente-accent))]"
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
          <h2 className="text-xl font-bold mb-4">Categorias</h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {categories.map((category) => (
              <Card key={category.name} className="bg-white/5 backdrop-blur-sm border-white/10 p-4 text-center cursor-pointer hover:bg-white/10 transition-all hover:scale-105">
                <div className="text-4xl mb-2">{category.emoji}</div>
                <p className="text-sm font-medium">{category.name}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Produtos Recomendados */}
        <section>
          <h2 className="text-xl font-bold mb-4">Recomendados para Você</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {products.map((product) => (
              <Link key={product.id} to={`/cliente/produto/${product.id}`}>
                <Card className="bg-white/5 backdrop-blur-sm border-white/10 overflow-hidden hover:bg-white/10 transition-all hover:scale-105 cursor-pointer">
                  <div className="aspect-square overflow-hidden">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-sm mb-2 line-clamp-2">{product.name}</h3>
                    <div className="flex items-center justify-between">
                      <p className="text-[hsl(var(--cliente-accent))] font-bold">{product.price}</p>
                      <div className="flex items-center gap-1 text-xs">
                        <span className="text-yellow-400">⭐</span>
                        <span>{product.rating}</span>
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
          <h2 className="text-xl font-bold mb-4">Ofertas Relâmpago</h2>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {products.map((product) => (
              <Link key={product.id} to={`/cliente/produto/${product.id}`} className="flex-shrink-0 w-40">
                <Card className="bg-white/5 backdrop-blur-sm border-white/10 overflow-hidden hover:bg-white/10 transition-all hover:scale-105">
                  <div className="aspect-square overflow-hidden">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-3">
                    <p className="text-xs mb-1 line-clamp-1">{product.name}</p>
                    <p className="text-[hsl(var(--cliente-accent))] font-bold text-sm">{product.price}</p>
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
