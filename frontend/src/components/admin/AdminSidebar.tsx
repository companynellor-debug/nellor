import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Store,
  ShoppingCart,
  BarChart3,
  Bell,
  Settings,
  MessageCircle,
  Package,
  Image,
  PieChart,
  ClipboardList,
  MessagesSquare,
  AlertTriangle,
  CreditCard,
  ShieldCheck,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import logo from "@/assets/nellor-logo.png";

type Item = { icon: typeof Users; label: string; path: string };

type Section = { title: string; items: Item[] };

const sections: Section[] = [
  {
    title: "VISÃO GERAL",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
      { icon: PieChart, label: "Indicadores", path: "/admin/indicadores" },
      { icon: BarChart3, label: "Relatórios", path: "/admin/relatorios" },
    ],
  },
  {
    title: "PESSOAS",
    items: [
      { icon: Users, label: "Usuários", path: "/admin/usuarios" },
      { icon: Store, label: "Fornecedores", path: "/admin/fornecedores" },
      { icon: ClipboardList, label: "Solic. Fornecedor", path: "/admin/solicitacoes-fornecedor" },
    ],
  },
  {
    title: "OPERAÇÕES",
    items: [
      { icon: ShoppingCart, label: "Vendas & Pedidos", path: "/admin/vendas" },
      { icon: MessagesSquare, label: "Conversas", path: "/admin/conversas" },
      { icon: AlertTriangle, label: "Disputas", path: "/admin/disputas" },
      { icon: MessageCircle, label: "Suporte", path: "/admin/suporte" },
    ],
  },
  {
    title: "CATÁLOGO",
    items: [
      { icon: Tag, label: "Categorias", path: "/admin/categorias" },
      { icon: Image, label: "Banners", path: "/admin/banners" },
      { icon: CreditCard, label: "Assinaturas", path: "/admin/assinaturas" },
    ],
  },
  {
    title: "SISTEMA",
    items: [
      { icon: Bell, label: "Notificações", path: "/admin/notificacoes" },
      { icon: Settings, label: "Configurações", path: "/admin/configuracoes" },
    ],
  },
];

interface AdminSidebarProps {
  onNavigate?: () => void;
}

const AdminSidebar = ({ onNavigate }: AdminSidebarProps) => {
  const location = useLocation();

  return (
    <aside
      className="w-full h-full flex flex-col text-white lg:w-64 lg:h-screen lg:fixed lg:left-0 lg:top-0 lg:shadow-xl"
      style={{ backgroundColor: "#3e199e" }}
    >
      {/* Brand */}
      <div className="px-5 py-6 border-b border-white/10 flex items-center gap-3">
        <img src={logo} alt="Nellor" className="h-9 w-9 object-contain" />
        <div className="leading-tight">
          <p className="text-[11px] font-extrabold tracking-[0.18em] text-white">PAINEL ADMIN</p>
          <p className="text-[10px] text-white/60 tracking-[0.14em]">CONTROL CENTER</p>
        </div>
        <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold text-white/85 px-2 py-1 rounded-full bg-emerald-500/20 ring-1 ring-emerald-400/30">
          <ShieldCheck className="h-3 w-3" /> LIVE
        </span>
      </div>

      <nav className="flex-1 min-h-0 overflow-y-auto px-3 py-4 space-y-5">
        {sections.map((section) => (
          <div key={section.title}>
            <p className="px-3 mb-1.5 text-[10px] font-bold tracking-[0.18em] text-white/45">
              {section.title}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-sm",
                      isActive
                        ? "bg-white text-[#3e199e] shadow-sm font-semibold"
                        : "text-white/85 hover:bg-white/10"
                    )}
                    data-testid={`admin-nav-${item.label.toLowerCase().replace(/\s/g, "-")}`}
                  >
                    <Icon className={cn("h-[18px] w-[18px] shrink-0", isActive ? "stroke-[2.4]" : "stroke-[1.9]")} />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
};

export default AdminSidebar;
