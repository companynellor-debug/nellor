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
  }, [darkMode]);
  const handleLogout = async () => {
    await signOut();
    toast.success("Logout realizado com sucesso!");
    navigate("/");
  };
  return <div className={`${darkMode ? 'dark' : ''}`}>
    <div className="min-h-screen flex w-full bg-background">
      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden md:block">
        <SupplierSidebar />
      </div>
      
      <div className="flex-1 md:ml-64">
        <div className="flex flex-col min-h-screen">
          {/* Header */}
          <header className="h-14 border-b border-border bg-card flex items-center justify-between sm:px-4 md:px-6 sticky top-0 z-40 shadow-sm px-4">
            {/* Left side - Logo for mobile */}
            <div className="flex items-center md:hidden">
              <img src={logo} alt="Logo" className="h-8" />
            </div>
            
            {/* Right side - Theme, Notifications and Logout */}
            <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
              <div className="hidden sm:flex items-center gap-2 mr-2">
                <Sun className="h-4 w-4 text-muted-foreground" />
                <Switch checked={darkMode} onCheckedChange={setDarkMode} />
                <Moon className="h-4 w-4 text-muted-foreground" />
              </div>
              
              {/* Mobile theme toggle - icon only */}
              <Button variant="ghost" size="icon" onClick={() => setDarkMode(!darkMode)} className="h-8 w-8 sm:hidden">
                {darkMode ? <Sun className="h-4 w-4 text-foreground" /> : <Moon className="h-4 w-4 text-foreground" />}
              </Button>
              
              <Button variant="ghost" size="icon" onClick={() => navigate('/fornecedor/notificacoes')} className="h-8 w-8 sm:h-9 sm:w-9">
                <Bell className="h-4 w-4 text-foreground" />
              </Button>
              
              <Button variant="ghost" onClick={handleLogout} size="icon" className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3">
                <LogOut className="h-4 w-4 text-foreground" />
                <span className="hidden sm:inline ml-2 text-foreground">Sair</span>
              </Button>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-3 sm:p-4 md:p-6 pb-20 md:pb-6">
            <div className="w-full max-w-full overflow-x-hidden">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNavFornecedor />
    </div>
  </div>;
};
export default FornecedorLayout;