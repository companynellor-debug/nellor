import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  Store, 
  ShoppingCart, 
  DollarSign, 
  BarChart3, 
  Bell, 
  Settings 
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
  { icon: Users, label: "Usuários", path: "/admin/usuarios" },
  { icon: Store, label: "Fornecedores", path: "/admin/fornecedores" },
  { icon: ShoppingCart, label: "Vendas & Pedidos", path: "/admin/vendas" },
  { icon: DollarSign, label: "Financeiro", path: "/admin/financeiro" },
  { icon: BarChart3, label: "Relatórios", path: "/admin/relatorios" },
  { icon: Bell, label: "Alertas", path: "/admin/alertas" },
  { icon: Settings, label: "Configurações", path: "/admin/configuracoes" },
];

const AdminSidebar = () => {
  const location = useLocation();

  return (
    <aside className="w-64 bg-gradient-to-b from-purple-950 to-violet-950 text-white h-screen fixed left-0 top-0 shadow-2xl border-r border-purple-800/30">
      <div className="p-6 border-b border-purple-800/30">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-200 to-violet-200 bg-clip-text text-transparent">
          NELLOR
        </h1>
        <p className="text-xs text-purple-300 mt-1">Control Center</p>
      </div>

      <nav className="p-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                isActive
                  ? "bg-purple-600/40 text-white shadow-lg shadow-purple-500/20 border border-purple-500/30"
                  : "text-purple-200 hover:bg-purple-800/30 hover:text-white"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default AdminSidebar;
