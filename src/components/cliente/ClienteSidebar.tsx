import { Home, ShoppingCart, User, MessageCircle, Heart, Package, MapPin, Bell, CreditCard, Users, Zap, Briefcase, Settings, LogOut, HelpCircle, Smartphone, ChevronLeft, Menu } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCart } from "@/hooks/useCart";
import { useFavorites } from "@/hooks/useFavorites";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { usePWA } from "@/hooks/usePWA";
import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";
import { useState } from "react";
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

export const ClienteSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { cartItems } = useCart();
  const { favorites } = useFavorites();
  const { signOut, profile } = useSupabaseAuth();
  const { canInstall, isInstalled } = usePWA();
  const [collapsed, setCollapsed] = useState(false);
  
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
  };

  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive = location.pathname === item.path || 
      (item.path !== "/cliente" && location.pathname.startsWith(item.path));
    
    return (
      <Link
        to={item.path}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
          isActive 
            ? "bg-primary text-primary-foreground shadow-md" 
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
          item.highlight && !isActive && "bg-primary/5 border border-primary/20 hover:bg-primary/10"
        )}
      >
        <item.icon className={cn(
          "h-5 w-5 flex-shrink-0 transition-transform",
          isActive && "scale-110"
        )} />
        {!collapsed && (
          <>
            <div className="flex-1 min-w-0">
              <span className="block text-sm font-medium truncate">{item.label}</span>
              {item.description && (
                <span className="block text-xs opacity-70 truncate">{item.description}</span>
              )}
            </div>
            {item.badge !== undefined && item.badge > 0 && (
              <span className={cn(
                "flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-medium rounded-full",
                isActive ? "bg-white/20 text-primary-foreground" : "bg-primary text-primary-foreground"
              )}>
                {item.badge > 99 ? '99+' : item.badge}
              </span>
            )}
          </>
        )}
        {collapsed && item.badge !== undefined && item.badge > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full bg-primary text-primary-foreground">
            {item.badge > 99 ? '99+' : item.badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <aside className={cn(
      "hidden lg:flex flex-col bg-background border-r h-screen sticky top-0 transition-all duration-300 z-30",
      collapsed ? "w-[72px]" : "w-64"
    )}>
      {/* Header */}
      <div className={cn(
        "flex items-center gap-3 p-4 border-b",
        collapsed ? "justify-center" : "justify-between"
      )}>
        {!collapsed && (
          <Link to="/cliente" className="flex items-center gap-2">
            <img src={logo} alt="Nellor" className="h-8 w-auto" />
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8 rounded-lg"
        >
          {collapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Profile Summary (when not collapsed) */}
      {!collapsed && profile && (
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            {profile.foto_perfil_url ? (
              <img 
                src={profile.foto_perfil_url} 
                alt="Perfil" 
                className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/20"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{profile.nome || 'Usuário'}</p>
              <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className="px-3 space-y-6">
          {/* Main Navigation */}
          <div className="space-y-1">
            {!collapsed && (
              <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Menu
              </p>
            )}
            {mainNavItems.map((item) => (
              <NavLink key={item.path} item={item} />
            ))}
          </div>

          <Separator className="mx-3" />

          {/* Account Navigation */}
          <div className="space-y-1">
            {!collapsed && (
              <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Minha Conta
              </p>
            )}
            {accountNavItems.map((item) => (
              <NavLink key={item.path} item={item} />
            ))}
          </div>

          <Separator className="mx-3" />

          {/* Extra Navigation */}
          <div className="space-y-1">
            {!collapsed && (
              <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Outros
              </p>
            )}
            {extraNavItems.map((item) => (
              <NavLink key={item.path} item={item} />
            ))}
          </div>
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t">
        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-destructive hover:bg-destructive/10 transition-colors",
            collapsed && "justify-center"
          )}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Sair</span>}
        </button>
      </div>
    </aside>
  );
};
