import { useState } from "react";
import { Search, Bell, ShoppingCart, Heart, Menu, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import logo from "@/assets/logo.png";
import { useCart } from "@/hooks/useCart";
import { useFavorites } from "@/hooks/useFavorites";
import { ClienteMobileMenu } from "./ClienteMobileMenu";

export const ClienteHeader = () => {
  const navigate = useNavigate();
  const { cartItems } = useCart();
  const { favorites } = useFavorites();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b shadow-sm">
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
        <div className="flex items-center justify-between gap-4 py-3 lg:py-4">
          {/* Mobile menu trigger */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon" className="h-10 w-10">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] p-0">
              <ClienteMobileMenu onClose={() => setMobileMenuOpen(false)} />
            </SheetContent>
          </Sheet>

          {/* Logo - hidden on desktop (sidebar has logo) */}
          <Link to="/cliente" className="lg:hidden">
            <img src={logo} alt="Nellor" className="h-8 w-auto" />
          </Link>
          
          {/* Search bar - expands on desktop */}
          <div className="flex-1 max-w-2xl hidden md:block">
            <div className="relative" onClick={() => navigate("/cliente/produtos")}>
              <Input 
                placeholder="Buscar produtos, marcas e muito mais..." 
                className="pl-4 pr-12 py-6 bg-muted/50 border-input focus:border-primary cursor-pointer text-base rounded-xl" 
                readOnly 
              />
              <button className="absolute right-0 top-0 h-full px-4 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors rounded-r-xl">
                <Search className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Mobile search */}
          <div className="flex-1 md:hidden" onClick={() => navigate("/cliente/produtos")}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="Buscar..." 
                className="pl-10 bg-muted/50 border-input cursor-pointer rounded-xl" 
                readOnly 
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 lg:gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate("/cliente/notificacoes")} 
              className="h-10 w-10 rounded-full"
            >
              <Bell className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate("/cliente/carrinho")} 
              className="h-10 w-10 rounded-full relative"
            >
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate("/cliente/favoritos")} 
              className="h-10 w-10 rounded-full relative hidden sm:flex"
            >
              <Heart className="h-5 w-5" />
              {favorites.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {favorites.length > 9 ? '9+' : favorites.length}
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
