import { Home, ShoppingCart, User, MessageCircle, Heart, Package, MapPin, Bell, CreditCard, Users, Zap, Briefcase, LogOut, HelpCircle, Smartphone, X } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCart } from "@/hooks/useCart";
import { useFavorites } from "@/hooks/useFavorites";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { usePWA } from "@/hooks/usePWA";
import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  badge?: number;
  highlight?: boolean;
  description?: string;
}

interface ClienteMobileMenuProps {
  onClose: () => void;
}

export const ClienteMobileMenu = ({ onClose }: ClienteMobileMenuProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { cartItems } = useCart();
  const { favorites } = useFavorites();
  const { signOut, profile } = useSupabaseAuth();
  const { canInstall, isInstalled } = usePWA();
  
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const mainNavItems: NavItem[] = [
    { icon: Home, label: "Home", path: "/cliente" },
    { icon: Package, label: "Produtos", path: "/cliente/produtos" },
    { icon: Heart, label: "Favoritos", path: "/cliente/favoritos", badge: favorites.length },
    { icon: ShoppingCart, label: "Carrinho", path: "/cliente/carrinho", badge: totalItems },
    { icon: MessageCircle, label: "Chat", path: "/cliente/chat" },
  ];

  const accountNavItems: NavItem[] = [
    { icon: User, label: "Meu Perfil", path: "/cliente/perfil" },
    { icon: Package, label: "Meus Pedidos", path: "/cliente/meus-pedidos" },
    { icon: MapPin, label: "Endereços", path: "/cliente/enderecos" },
    { icon: CreditCard, label: "Pagamentos", path: "/cliente/metodos-pagamento" },
    { icon: Bell, label: "Notificações", path: "/cliente/notificacoes" },
  ];

  const extraNavItems: NavItem[] = [
    { icon: Users, label: "Programa de Afiliados", path: "/cliente/afiliados", highlight: true },
    { icon: Zap, label: "Nellor Drop", path: "/drop", highlight: true, description: "Revenda produtos" },
    { icon: Briefcase, label: "Prestador de Serviços", path: "/cliente/prestador-servicos" },
    ...(canInstall && !isInstalled ? [{ icon: Smartphone, label: "Instalar App", path: "/cliente/instalar" }] : []),
    { icon: HelpCircle, label: "Suporte", path: "/cliente/suporte" },
  ];

  const handleLogout = async () => {
    await signOut();
    navigate("/");
    onClose();
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive = location.pathname === item.path || 
      (item.path !== "/cliente" && location.pathname.startsWith(item.path));
    
    return (
      <button
        onClick={() => handleNavigate(item.path)}
        className={cn(
          "flex items-center gap-3 w-full px-3 py-3 rounded-xl transition-all duration-200 text-left",
          isActive 
            ? "bg-primary text-primary-foreground" 
            : "text-foreground hover:bg-muted",
          item.highlight && !isActive && "bg-primary/5 border border-primary/20"
        )}
      >
        <item.icon className="h-5 w-5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="block text-sm font-medium">{item.label}</span>
          {item.description && (
            <span className="block text-xs opacity-70">{item.description}</span>
          )}
        </div>
        {item.badge !== undefined && item.badge > 0 && (
          <span className={cn(
            "flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-medium rounded-full",
            isActive ? "bg-white/20" : "bg-primary text-primary-foreground"
          )}>
            {item.badge > 99 ? '99+' : item.badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <Link to="/cliente" onClick={onClose}>
          <img src={logo} alt="Nellor" className="h-8 w-auto" />
        </Link>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Profile Summary */}
      {profile && (
        <div className="p-4 border-b bg-muted/30">
          <div className="flex items-center gap-3">
            {profile.foto_perfil_url ? (
              <img 
                src={profile.foto_perfil_url} 
                alt="Perfil" 
                className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/20"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <User className="h-6 w-6 text-white" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{profile.nome || 'Usuário'}</p>
              <p className="text-sm text-muted-foreground truncate">{profile.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <ScrollArea className="flex-1">
        <nav className="p-4 space-y-6">
          {/* Main Navigation */}
          <div className="space-y-1">
            <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Menu
            </p>
            {mainNavItems.map((item) => (
              <NavLink key={item.path} item={item} />
            ))}
          </div>

          <Separator />

          {/* Account Navigation */}
          <div className="space-y-1">
            <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Minha Conta
            </p>
            {accountNavItems.map((item) => (
              <NavLink key={item.path} item={item} />
            ))}
          </div>

          <Separator />

          {/* Extra Navigation */}
          <div className="space-y-1">
            <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Outros
            </p>
            {extraNavItems.map((item) => (
              <NavLink key={item.path} item={item} />
            ))}
          </div>
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">Sair</span>
        </button>
      </div>
    </div>
  );
};
