import { Home, Handshake, MessageSquare, Tag, MoreHorizontal, Megaphone } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { DollarSign, Bell, Store, BarChart3, Ticket } from "lucide-react";
import { useSupplierCoupons } from "@/hooks/useSupplierCoupons";

export const BottomNavFornecedor = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const { coupons } = useSupplierCoupons();
  
  const activeCouponsCount = coupons.filter(c => 
    c.ativo && 
    (!c.expira_em || new Date(c.expira_em) > new Date()) &&
    (!c.uso_maximo || c.uso_atual < c.uso_maximo)
  ).length;

  const mainNavItems = [
    { icon: Home, label: "Dashboard", path: "/fornecedor/dashboard" },
    { icon: Handshake, label: "Negociações", path: "/fornecedor/negociacoes" },
    { icon: MessageSquare, label: "Chat", path: "/fornecedor/chat" },
    { icon: DollarSign, label: "Financeiro", path: "/fornecedor/financeiro" },
  ];

  const moreNavItems = [
    { icon: Tag, label: "Produtos", path: "/fornecedor/produtos" },
    { icon: Ticket, label: "Cupons", path: "/fornecedor/cupons", badge: activeCouponsCount },
    { icon: BarChart3, label: "Estatísticas", path: "/fornecedor/estatisticas" },
    { icon: Megaphone, label: "Patrocínio", path: "/fornecedor/patrocinio" },
    { icon: Bell, label: "Notificações", path: "/fornecedor/notificacoes" },
    { icon: Store, label: "Editar Loja", path: "/fornecedor/editar-loja" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 border-t shadow-lg z-50 backdrop-blur-lg md:hidden">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-4">
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path} className={`flex flex-col items-center gap-1 transition-all duration-300 ${isActive ? "text-primary" : "text-muted-foreground"}`}>
              <Icon className={`h-6 w-6 ${isActive ? "scale-110" : ""}`} />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
        
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button className={`flex flex-col items-center gap-1 transition-all duration-300 ${moreNavItems.some(item => location.pathname === item.path) ? "text-primary" : "text-muted-foreground"}`}>
              <MoreHorizontal className="h-6 w-6" />
              <span className="text-xs font-medium">Mais</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-auto">
            <SheetHeader><SheetTitle>Mais Opções</SheetTitle></SheetHeader>
            <div className="flex flex-col gap-2 mt-4">
              {moreNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link key={item.path} to={item.path} onClick={() => setOpen(false)} className={`flex items-center gap-4 p-4 rounded-lg transition-all ${isActive ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/50"}`}>
                    <div className="relative">
                      <Icon className="h-6 w-6" />
                      {item.badge && item.badge > 0 && (
                        <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 min-w-5 flex items-center justify-center px-1">
                          {item.badge > 99 ? '99+' : item.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-base">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
};
