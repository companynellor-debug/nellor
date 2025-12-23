import { Home, Package, MessageSquare, Tag, MoreHorizontal } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { DollarSign, Bell, Store, BarChart3, Ticket } from "lucide-react";

export const BottomNavFornecedor = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const mainNavItems = [
    { icon: Home, label: "Dashboard", path: "/fornecedor/dashboard" },
    { icon: Package, label: "Pedidos", path: "/fornecedor/pedidos" },
    { icon: MessageSquare, label: "Chat", path: "/fornecedor/chat" },
    { icon: Tag, label: "Produtos", path: "/fornecedor/produtos" },
  ];

  const moreNavItems = [
    { icon: Ticket, label: "Cupons", path: "/fornecedor/cupons" },
    { icon: BarChart3, label: "Estatísticas", path: "/fornecedor/estatisticas" },
    { icon: DollarSign, label: "Financeiro", path: "/fornecedor/financeiro" },
    { icon: Bell, label: "Notificações", path: "/fornecedor/notificacoes" },
    { icon: Store, label: "Editar Loja", path: "/fornecedor/editar-loja" },
  ];

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 border-t shadow-lg z-50 backdrop-blur-lg md:hidden">
        <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-4">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 transition-all duration-300 ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className={`h-6 w-6 ${isActive ? "scale-110" : ""}`} />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
          
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                className={`flex flex-col items-center gap-1 transition-all duration-300 ${
                  moreNavItems.some(item => location.pathname === item.path) 
                    ? "text-primary" 
                    : "text-muted-foreground"
                }`}
              >
                <MoreHorizontal className="h-6 w-6" />
                <span className="text-xs font-medium">Mais</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-auto">
              <SheetHeader>
                <SheetTitle>Mais Opções</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-2 mt-4">
                {moreNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
                        isActive 
                          ? "bg-primary/10 text-primary font-medium" 
                          : "hover:bg-muted/50"
                      }`}
                    >
                      <Icon className="h-6 w-6" />
                      <span className="text-base">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </>
  );
};
