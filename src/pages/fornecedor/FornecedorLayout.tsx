import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { SupplierSidebar } from "@/components/fornecedor/SupplierSidebar";
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
      <div className="min-h-screen flex w-full bg-muted/20">
        <SupplierSidebar />
        
        <SidebarInset className="flex-1">
          <div className="flex flex-col min-h-screen">
            {/* Header */}
            <header className="h-16 border-b bg-white flex items-center justify-between px-6 sticky top-0 z-40 shadow-sm">
              <SidebarTrigger className="lg:hidden" />
              
              <div className="flex items-center gap-4 ml-auto">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigate('/fornecedor/notificacoes')}
                >
                  <Bell className="h-5 w-5" />
                </Button>
                <Button variant="outline" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </Button>
              </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-6">
              <Outlet />
            </main>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default FornecedorLayout;
