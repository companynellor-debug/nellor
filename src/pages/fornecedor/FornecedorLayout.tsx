import { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { SupplierSidebar } from "@/components/fornecedor/SupplierSidebar";
import { BottomNavFornecedor } from "@/components/fornecedor/BottomNav";
import { Bell, LogOut, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
const FornecedorLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    signOut,
    profile
  } = useSupabaseAuth();
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("fornecedor-dark-mode");
    return saved ? JSON.parse(saved) : false;
  });

  // Redirecionar para onboarding se não completou
  useEffect(() => {
    if (profile?.tipo === 'fornecedor' && !profile?.onboarding_completed && location.pathname !== '/fornecedor/onboarding') {
      navigate('/fornecedor/onboarding');
    }
  }, [profile, navigate, location.pathname]);
  useEffect(() => {
    localStorage.setItem("fornecedor-dark-mode", JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);
  const handleLogout = async () => {
    await signOut();
    toast.success("Logout realizado com sucesso!");
    navigate("/");
  };
  return <div className="min-h-screen flex w-full bg-background">
      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden md:block">
        <SupplierSidebar />
      </div>
      
      <div className="flex-1 md:ml-64">
        <div className="flex flex-col min-h-screen">
          {/* Header */}
          <header className="h-14 sm:h-16 border-b bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950 dark:to-violet-950 flex items-center justify-between px-3 sm:px-4 md:px-6 sticky top-0 z-40 shadow-sm">
            {/* Left side - Logo for mobile */}
            <div className="flex items-center gap-4 md:hidden">
              <img src={logo} alt="Logo" className="h-7 sm:h-10" />
            </div>
            
            {/* Right side - Theme, Notifications and Logout - Hidden on mobile, visible on desktop */}
            <div className="hidden sm:flex items-center gap-2 ml-auto">
              <div className="flex items-center gap-2 mr-2">
                <Sun className="h-4 w-4 text-muted-foreground" />
                <Switch checked={darkMode} onCheckedChange={setDarkMode} />
                <Moon className="h-4 w-4 text-muted-foreground" />
              </div>
              <Button variant="outline" size="icon" onClick={() => navigate('/fornecedor/notificacoes')} className="h-9 w-9">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={handleLogout} size="sm" className="h-9">
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-4 md:p-6 lg:p-8 pb-20 md:pb-6">
            <div className="container mx-auto px-[7px]">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNavFornecedor />
    </div>;
};
export default FornecedorLayout;