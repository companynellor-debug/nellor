import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { Search, ShoppingCart, Heart, ChevronLeft, Store, Package, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/hooks/useCart";
import { useFavorites } from "@/hooks/useFavorites";
import { ParticlesBackground } from "@/components/cliente/ParticlesBackground";
import logo from "@/assets/logo.png";

/**
 * Layout dedicado do Nellor Drop - experiência de marketplace completa
 * Visual idêntico ao marketplace principal, apenas com produtos Drop
 */
const DropLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartItems } = useCart();
  const { favorites } = useFavorites();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/cliente/drop?busca=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const isHomePage = location.pathname === "/cliente/drop";

  return (
    <div className="min-h-screen bg-muted/30">
      <ParticlesBackground />

      {/* Header - Estilo marketplace */}
      <header className="sticky top-0 z-40 bg-background border-b shadow-sm">
        <div className="container mx-auto px-4">
          {/* Top bar - desktop */}
          <div className="hidden lg:flex items-center justify-between py-2 text-sm border-b border-border/50">
            <div className="flex items-center gap-4 text-muted-foreground">
              <Link to="/cliente" className="hover:text-primary transition-colors flex items-center gap-1">
                <ChevronLeft className="h-4 w-4" />
                Voltar ao Marketplace
              </Link>
              <span className="text-primary font-medium">• Nellor Drop</span>
            </div>
            <div className="flex items-center gap-4 text-muted-foreground">
              <button onClick={() => navigate("/cliente/meus-pedidos")} className="hover:text-primary transition-colors">
                Meus Pedidos
              </button>
              <button onClick={() => navigate("/cliente/suporte")} className="hover:text-primary transition-colors">
                Ajuda
              </button>
            </div>
          </div>

          {/* Main header */}
          <div className="flex items-center justify-between gap-4 py-4">
            {/* Logo + Drop Badge */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/cliente/drop")}>
              <img src={logo} alt="Nellor" className="h-8 lg:h-10 w-auto" />
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 hidden sm:flex">
                Drop
              </Badge>
            </div>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
              <div className="relative">
                <Input
                  placeholder="Buscar produtos Drop..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-4 pr-12 py-6 bg-muted border-input focus:border-primary text-base"
                />
                <button
                  type="submit"
                  className="absolute right-0 top-0 h-full px-4 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors rounded-r-md"
                >
                  <Search className="h-5 w-5" />
                </button>
              </div>
            </form>

            {/* Actions */}
            <div className="flex items-center gap-2 lg:gap-4">
              <button
                onClick={() => navigate("/cliente/carrinho")}
                className="relative p-2 hover:bg-muted rounded-full transition-colors"
              >
                <ShoppingCart className="h-6 w-6 text-foreground" />
                {cartItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cartItems.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => navigate("/cliente/favoritos")}
                className="relative p-2 hover:bg-muted rounded-full transition-colors"
              >
                <Heart className="h-6 w-6 text-foreground" />
                {favorites.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {favorites.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => navigate("/cliente/perfil")}
                className="p-2 hover:bg-muted rounded-full transition-colors hidden lg:block"
              >
                <User className="h-6 w-6 text-foreground" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10">
        <Outlet />
      </main>

      {/* Bottom Navigation - Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t lg:hidden">
        <div className="flex items-center justify-around py-2">
          <button
            onClick={() => navigate("/cliente/drop")}
            className={`flex flex-col items-center gap-1 p-2 ${
              isHomePage ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Store className="h-5 w-5" />
            <span className="text-xs">Drop</span>
          </button>
          <button
            onClick={() => navigate("/cliente/meus-pedidos")}
            className="flex flex-col items-center gap-1 p-2 text-muted-foreground"
          >
            <Package className="h-5 w-5" />
            <span className="text-xs">Pedidos</span>
          </button>
          <button
            onClick={() => navigate("/cliente/carrinho")}
            className="flex flex-col items-center gap-1 p-2 text-muted-foreground relative"
          >
            <ShoppingCart className="h-5 w-5" />
            {cartItems.length > 0 && (
              <span className="absolute top-0 right-1 bg-primary text-primary-foreground text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
                {cartItems.length}
              </span>
            )}
            <span className="text-xs">Carrinho</span>
          </button>
          <button
            onClick={() => navigate("/cliente/perfil")}
            className="flex flex-col items-center gap-1 p-2 text-muted-foreground"
          >
            <User className="h-5 w-5" />
            <span className="text-xs">Perfil</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default DropLayout;
