import { Home, Package, MessageSquare, Tag, DollarSign, Bell, Store, BarChart3, Wallet, Crown, Ticket, Shield, Boxes } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useSupabaseNotifications } from "@/hooks/useSupabaseNotifications";

const menuItems = [
  { title: "Dashboard", url: "/fornecedor/dashboard", icon: Home },
  { title: "Pedidos", url: "/fornecedor/pedidos", icon: Package },
  { title: "Nellor Drop", url: "/fornecedor/nellor-drop", icon: Boxes },
  { title: "Chat", url: "/fornecedor/chat", icon: MessageSquare },
  { title: "Produtos", url: "/fornecedor/produtos", icon: Tag },
  { title: "Cupons", url: "/fornecedor/cupons", icon: Ticket },
  { title: "Estatísticas", url: "/fornecedor/estatisticas", icon: BarChart3 },
  { title: "Financeiro", url: "/fornecedor/financeiro", icon: DollarSign },
  { title: "Permissões", url: "/fornecedor/permissoes", icon: Shield },
  { title: "Planos", url: "/fornecedor/planos", icon: Crown },
  { title: "Notificações", url: "/fornecedor/notificacoes", icon: Bell },
  { title: "Editar Loja", url: "/fornecedor/editar-loja", icon: Store },
];

export function SupplierSidebar() {
  const location = useLocation();
  const { unreadCount } = useSupabaseNotifications();

  return (
    <aside className="w-64 h-screen fixed left-0 top-0 bg-gradient-to-b from-purple-950 to-violet-950 text-white shadow-2xl border-r border-purple-800/30">
      <div className="p-6 border-b border-purple-800/30">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-200 to-violet-200 bg-clip-text text-transparent">
          NELLOR
        </h1>
        <p className="text-xs text-purple-300 mt-1">Painel Fornecedor</p>
      </div>

      <nav className="p-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.url;
          return (
            <NavLink
              key={item.url}
              to={item.url}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm relative",
                isActive
                  ? "bg-purple-600/40 text-white shadow-lg shadow-purple-500/20 border border-purple-500/30"
                  : "text-purple-200 hover:bg-purple-800/30 hover:text-white"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium">{item.title}</span>
              {item.title === "Notificações" && unreadCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}


