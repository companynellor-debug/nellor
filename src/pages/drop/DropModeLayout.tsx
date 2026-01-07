import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  Store, 
  DollarSign, 
  Bell, 
  Settings, 
  Menu, 
  Boxes,
  TrendingUp,
  LogOut,
  Moon,
  Sun
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useClientDrop } from "@/hooks/useClientDrop";
import { ModeSwitcher } from "@/components/drop/ModeSwitcher";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

const navItems = [
  { title: "Dashboard", path: "/drop", icon: LayoutDashboard },
  { title: "Pedidos", path: "/drop/pedidos", icon: Package },
  { title: "Catálogo", path: "/drop/catalogo", icon: ShoppingBag },
  { title: "Meus Produtos", path: "/drop/meus-produtos", icon: Boxes },
  { title: "Marketplaces", path: "/drop/marketplaces", icon: Store },
  { title: "Financeiro", path: "/drop/financeiro", icon: DollarSign },
  { title: "Notificações", path: "/drop/notificacoes", icon: Bell },
  { title: "Configurações", path: "/drop/configuracoes", icon: Settings },
];

/**
 * Layout completo do Modo Nellor Drop
 * Estilo igual ao fornecedor com cores roxas
 */
const DropModeLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useSupabaseAuth();
  const { dropStats } = useClientDrop();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("drop-dark-mode");
    return saved ? JSON.parse(saved) : false; // Light mode by default
  });

  // Apply dark mode class to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem("drop-dark-mode", JSON.stringify(darkMode));
  }, [darkMode]);

  const isActive = (path: string) => {
    if (path === "/drop") {
      return location.pathname === "/drop";
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    await signOut();
    toast.success("Logout realizado com sucesso!");
    navigate("/");
  };

  // Sidebar content (desktop) - Purple theme like supplier
  const DesktopSidebar = () => (
    <aside className="w-64 h-screen fixed left-0 top-0 bg-gradient-to-b from-purple-900 via-purple-900 to-purple-950 text-white shadow-2xl border-r border-purple-700/30">
      <div className="p-6 border-b border-purple-700/30">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Nellor" className="h-8 w-auto brightness-0 invert" />
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent">
              NELLOR
            </h1>
            <p className="text-xs text-purple-300 flex items-center gap-1">
              <Boxes className="h-3 w-3" />
              Modo Drop
            </p>
          </div>
        </div>
      </div>

      {/* Mini Stats */}
      <div className="p-4 border-b border-purple-700/30">
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-purple-800/50 rounded-lg p-3 border border-purple-600/20">
            <div className="flex items-center gap-1 text-purple-300 text-xs">
              <TrendingUp className="h-3 w-3" />
              Vendas
            </div>
            <p className="text-white font-bold text-sm mt-1">
              R$ {(dropStats?.total_sales || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-purple-800/50 rounded-lg p-3 border border-purple-600/20">
            <div className="flex items-center gap-1 text-emerald-300 text-xs">
              <DollarSign className="h-3 w-3" />
              Lucro
            </div>
            <p className="text-emerald-400 font-bold text-sm mt-1">
              R$ {(dropStats?.total_profit || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm relative",
              isActive(item.path)
                ? "bg-purple-600/40 text-white shadow-lg shadow-purple-500/20 border border-purple-500/30"
                : "text-purple-200 hover:bg-purple-800/50 hover:text-white"
            )}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium">{item.title}</span>
            {item.title === "Pedidos" && (dropStats?.pending_orders || 0) > 0 && (
              <span className="ml-auto bg-amber-500 text-black text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                {dropStats?.pending_orders}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Mode Switcher - Bottom */}
      <div className="p-4 border-t border-purple-700/30">
        <ModeSwitcher variant="mobile" />
      </div>
    </aside>
  );

  // Mobile nav content - Purple theme
  const MobileNavContent = () => (
    <div className="flex flex-col h-full bg-gradient-to-b from-purple-900 via-purple-900 to-purple-950">
      {/* Logo */}
      <div className="p-6 border-b border-purple-700/30">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Nellor" className="h-8 w-auto brightness-0 invert" />
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent">
              NELLOR
            </h1>
            <p className="text-xs text-purple-300 flex items-center gap-1">
              <Boxes className="h-3 w-3" />
              Modo Drop
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="p-4 border-b border-purple-700/30">
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-purple-800/50 rounded-lg p-3 border border-purple-600/20">
            <div className="flex items-center gap-1 text-purple-300 text-xs">
              <TrendingUp className="h-3 w-3" />
              Vendas
            </div>
            <p className="text-white font-bold text-sm mt-1">
              R$ {(dropStats?.total_sales || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-purple-800/50 rounded-lg p-3 border border-purple-600/20">
            <div className="flex items-center gap-1 text-emerald-300 text-xs">
              <DollarSign className="h-3 w-3" />
              Lucro
            </div>
            <p className="text-emerald-400 font-bold text-sm mt-1">
              R$ {(dropStats?.total_profit || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => {
              navigate(item.path);
              setMobileMenuOpen(false);
            }}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm",
              isActive(item.path)
                ? "bg-purple-600/40 text-white shadow-lg shadow-purple-500/20 border border-purple-500/30"
                : "text-purple-200 hover:bg-purple-800/50 hover:text-white"
            )}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium">{item.title}</span>
            {item.title === "Pedidos" && (dropStats?.pending_orders || 0) > 0 && (
              <span className="ml-auto bg-amber-500 text-black text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                {dropStats?.pending_orders}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Mode Switcher */}
      <div className="p-4 border-t border-purple-700/30">
        <ModeSwitcher variant="mobile" />
      </div>
    </div>
  );

  return (
    <div className={`${darkMode ? 'dark' : ''}`}>
      <div className="min-h-screen bg-background">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <DesktopSidebar />
        </div>

        {/* Main Area */}
        <div className="md:ml-64">
          {/* Header */}
          <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 sticky top-0 z-40 shadow-sm">
            {/* Mobile menu + Logo */}
            <div className="flex items-center gap-3 md:hidden">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <button className="p-2 text-foreground hover:text-primary">
                    <Menu className="h-5 w-5" />
                  </button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 p-0 border-purple-700/30">
                  <MobileNavContent />
                </SheetContent>
              </Sheet>
              <div className="flex items-center gap-2">
                <Boxes className="h-5 w-5 text-primary" />
                <span className="font-bold text-foreground">Nellor Drop</span>
              </div>
            </div>

            {/* Desktop - Empty left side */}
            <div className="hidden md:block" />

            {/* Right side - Theme, Notifications and Logout */}
            <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
              <div className="hidden sm:flex items-center gap-2 mr-2">
                <Sun className="h-4 w-4 text-purple-400" />
                <Switch 
                  checked={darkMode} 
                  onCheckedChange={setDarkMode} 
                  className="data-[state=checked]:bg-purple-600 data-[state=unchecked]:bg-purple-300"
                />
                <Moon className="h-4 w-4 text-purple-400" />
              </div>
              
              {/* Mobile theme toggle */}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setDarkMode(!darkMode)} 
                className="h-8 w-8 sm:hidden"
              >
                {darkMode ? <Sun className="h-4 w-4 text-foreground" /> : <Moon className="h-4 w-4 text-foreground" />}
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate('/drop/notificacoes')} 
                className="h-8 w-8 sm:h-9 sm:w-9 relative"
              >
                <Bell className="h-4 w-4 text-foreground" />
                {(dropStats?.pending_orders || 0) > 0 && (
                  <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                    {dropStats?.pending_orders}
                  </span>
                )}
              </Button>
              
              <Button 
                variant="ghost" 
                onClick={handleLogout} 
                size="icon" 
                className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3"
              >
                <LogOut className="h-4 w-4 text-foreground" />
                <span className="hidden sm:inline ml-2 text-foreground">Sair</span>
              </Button>
            </div>
          </header>

          {/* Main Content */}
          <main className="p-3 sm:p-4 md:p-6 pb-20 md:pb-6">
            <div className="w-full max-w-full overflow-x-hidden">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default DropModeLayout;
