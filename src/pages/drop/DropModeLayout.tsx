import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  Store, 
  DollarSign, 
  Bell, 
  Settings, 
  Menu, 
  X,
  ChevronLeft,
  Boxes,
  TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useClientDrop } from "@/hooks/useClientDrop";
import { ModeSwitcher } from "@/components/drop/ModeSwitcher";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import logo from "@/assets/logo.png";

const navItems = [
  { 
    title: "Dashboard", 
    path: "/drop", 
    icon: LayoutDashboard,
    description: "Visão geral"
  },
  { 
    title: "Pedidos", 
    path: "/drop/pedidos", 
    icon: Package,
    description: "Gerenciar vendas"
  },
  { 
    title: "Catálogo", 
    path: "/drop/catalogo", 
    icon: ShoppingBag,
    description: "Produtos disponíveis"
  },
  { 
    title: "Meus Produtos", 
    path: "/drop/meus-produtos", 
    icon: Boxes,
    description: "Gerenciar e publicar"
  },
  { 
    title: "Marketplaces", 
    path: "/drop/marketplaces", 
    icon: Store,
    description: "Integrações"
  },
  { 
    title: "Financeiro", 
    path: "/drop/financeiro", 
    icon: DollarSign,
    description: "Ganhos e repasses"
  },
  { 
    title: "Notificações", 
    path: "/drop/notificacoes", 
    icon: Bell,
    description: "Alertas"
  },
  { 
    title: "Configurações", 
    path: "/drop/configuracoes", 
    icon: Settings,
    description: "Preferências"
  },
];

/**
 * Layout completo do Modo Nellor Drop
 * Visual SaaS premium, dark theme com roxos
 */
const DropModeLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { dropStats } = useClientDrop();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === "/drop") {
      return location.pathname === "/drop";
    }
    return location.pathname.startsWith(path);
  };

  const NavContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={cn("flex flex-col h-full", mobile ? "" : "w-64")}>
      {/* Logo Area */}
      <div className="p-6 border-b border-drop-border">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img src={logo} alt="Nellor" className="h-8 w-auto" />
          </div>
          <div>
            <span className="text-drop-text font-bold text-lg">Nellor</span>
            <Badge className="ml-2 bg-drop-accent/20 text-drop-accent border-drop-accent/30 text-[10px]">
              DROP
            </Badge>
          </div>
        </div>
      </div>

      {/* Stats Mini */}
      <div className="p-4 border-b border-drop-border">
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-drop-surface rounded-lg p-3 border border-drop-border">
            <div className="flex items-center gap-2 text-drop-text-muted text-xs">
              <TrendingUp className="h-3 w-3" />
              Vendas
            </div>
            <p className="text-drop-text font-bold text-lg mt-1">
              R$ {(dropStats?.total_sales || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-drop-surface rounded-lg p-3 border border-drop-border">
            <div className="flex items-center gap-2 text-drop-text-muted text-xs">
              <DollarSign className="h-3 w-3" />
              Lucro
            </div>
            <p className="text-drop-success font-bold text-lg mt-1">
              R$ {(dropStats?.total_profit || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => {
              navigate(item.path);
              if (mobile) setMobileMenuOpen(false);
            }}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
              isActive(item.path)
                ? "bg-drop-accent text-white shadow-lg shadow-drop-accent/20"
                : "text-drop-text-muted hover:bg-drop-surface-hover hover:text-drop-text"
            )}
          >
            <item.icon className={cn(
              "h-5 w-5 transition-transform",
              isActive(item.path) ? "" : "group-hover:scale-110"
            )} />
            <div className="text-left">
              <p className="font-medium text-sm">{item.title}</p>
              <p className={cn(
                "text-[10px]",
                isActive(item.path) ? "text-white/70" : "text-drop-text-muted"
              )}>
                {item.description}
              </p>
            </div>
            {item.title === "Pedidos" && (dropStats?.pending_orders || 0) > 0 && (
              <Badge className="ml-auto bg-drop-warning text-black text-[10px]">
                {dropStats?.pending_orders}
              </Badge>
            )}
          </button>
        ))}
      </nav>

      {/* Mode Switcher - Bottom */}
      <div className="p-4 border-t border-drop-border">
        <ModeSwitcher variant="mobile" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-drop-bg">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-64 lg:flex-col border-r border-drop-border bg-gradient-to-b from-drop-bg to-drop-surface/50">
        <NavContent />
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-50 bg-drop-bg/95 backdrop-blur-sm border-b border-drop-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <button className="p-2 text-drop-text-muted hover:text-drop-text">
                  <Menu className="h-6 w-6" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0 bg-drop-bg border-drop-border">
                <NavContent mobile />
              </SheetContent>
            </Sheet>
            <div className="flex items-center gap-2">
              <Boxes className="h-6 w-6 text-drop-accent" />
              <span className="font-bold text-drop-text">Nellor Drop</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => navigate('/drop/notificacoes')}
              className="relative p-2 text-drop-text-muted hover:text-drop-text"
            >
              <Bell className="h-5 w-5" />
              {(dropStats?.pending_orders || 0) > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 bg-drop-accent rounded-full" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="lg:pl-64">
        <div className="min-h-screen">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DropModeLayout;
