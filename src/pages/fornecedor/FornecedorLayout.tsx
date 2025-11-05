import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { SupplierSidebar } from "@/components/fornecedor/SupplierSidebar";
import { BottomNavFornecedor } from "@/components/fornecedor/BottomNav";
import { Bell, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const FornecedorLayout = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    toast.success("Logout realizado com sucesso!");
    navigate("/");
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background">
        {/* Desktop Sidebar - hidden on mobile */}
        <div className="hidden md:block">
          <SupplierSidebar />
        </div>
        
        <SidebarInset className="flex-1">
          <div className="flex flex-col min-h-screen">
            {/* Header */}
            <header className="h-16 border-b bg-white/95 backdrop-blur-lg flex items-center justify-between px-4 md:px-6 sticky top-0 z-40 shadow-sm">
              <SidebarTrigger className="hidden md:block" />
              
              <div className="flex items-center gap-2 md:gap-4 ml-auto">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigate('/fornecedor/notificacoes')}
                  className="hidden md:flex"
                >
                  <Bell className="h-5 w-5" />
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleLogout}
                  size="sm"
                  className="h-9"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </Button>
              </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6">
              <div className="container mx-auto">
                <Outlet />
              </div>
            </main>
          </div>
        </SidebarInset>

        {/* Mobile Bottom Navigation */}
        <BottomNavFornecedor />
      </div>
    </SidebarProvider>
  );
};

export default FornecedorLayout;
