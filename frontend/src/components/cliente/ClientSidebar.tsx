import {
  Home,
  LayoutGrid,
  Heart,
  MessageSquare,
  Bell,
  User,
  Smartphone,
  Shirt,
  Sofa,
  Sparkles,
  Bike,
  Car,
  PawPrint,
  Baby,
  UtensilsCrossed,
  ListFilter,
  Store,
  ArrowRight,
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useSupabaseNotifications } from "@/hooks/useSupabaseNotifications";
import { useSupabaseMessages } from "@/hooks/useSupabaseMessages";
import { useNegotiations } from "@/hooks/useNegotiations";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useSupabaseCategories } from "@/hooks/useSupabaseCategories";
import logo from "@/assets/nellor-logo.png";

type Item = {
  title: string;
  url: string;
  icon: typeof Home;
  badgeKey?: "messages" | "notifications";
};

const mainItems: Item[] = [
  { title: "Início", url: "/cliente", icon: Home },
  { title: "Categorias", url: "/cliente/produtos", icon: LayoutGrid },
  { title: "Favoritos", url: "/cliente/favoritos", icon: Heart },
  { title: "Mensagens", url: "/cliente/chat", icon: MessageSquare, badgeKey: "messages" },
  { title: "Notificações", url: "/cliente/notificacoes", icon: Bell, badgeKey: "notifications" },
  { title: "Meu Perfil", url: "/cliente/perfil", icon: User },
];

// Default category icon mapping (fallback if backend doesn't define)
const CATEGORY_ICON_MAP: Record<string, typeof Home> = {
  eletronicos: Smartphone,
  "moda-e-acessorios": Shirt,
  moda: Shirt,
  "casa-e-decoracao": Sofa,
  casa: Sofa,
  "beleza-e-saude": Sparkles,
  beleza: Sparkles,
  "esportes-e-lazer": Bike,
  esportes: Bike,
  automotivo: Car,
  "pet-shop": PawPrint,
  pet: PawPrint,
  infantil: Baby,
  "alimentos-e-bebidas": UtensilsCrossed,
  alimentos: UtensilsCrossed,
};

export const ClientSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { unreadCount: notificationsUnread } = useSupabaseNotifications();
  const { getTotalUnreadCount } = useSupabaseMessages();
  const { negotiations } = useNegotiations();
  const { categories } = useSupabaseCategories();
  const { profile } = useSupabaseAuth();

  // Notifications: unread is approximated by negotiations needing attention
  const pendingActions = (negotiations || []).filter((n: any) =>
    ["pending"].includes(n?.status)
  ).length;

  const messagesUnread = getTotalUnreadCount();

  const badges: Record<string, number> = {
    messages: messagesUnread,
    notifications: pendingActions,
  };

  const isActiveExact = (p: string) => location.pathname === p;

  return (
    <aside
      className="hidden lg:flex flex-col fixed left-0 top-0 h-screen w-64 text-white z-30 overflow-y-auto"
      style={{ backgroundColor: "#3e199e" }}
      data-testid="client-sidebar"
    >
      {/* Brand — sem card atrás do logo */}
      <div className="px-5 py-6 flex items-center gap-3 border-b border-white/10">
        <img src={logo} alt="Nellor" className="h-10 w-10 object-contain shrink-0" />
        <div className="leading-tight min-w-0">
          <p className="text-[11px] font-extrabold tracking-[0.18em] text-white">PLATAFORMA</p>
          <p className="text-[10px] font-semibold text-white/60 tracking-[0.14em]">DE NEGOCIAÇÕES</p>
        </div>
      </div>

      {/* Main nav */}
      <nav className="px-3 py-4 space-y-1">
        {mainItems.map((item) => {
          const Icon = item.icon;
          const active = isActiveExact(item.url);
          const badge = item.badgeKey ? badges[item.badgeKey] : 0;
          return (
            <NavLink
              key={item.url}
              to={item.url}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                active
                  ? "bg-white text-[#3e199e] shadow-sm"
                  : "text-white/85 hover:bg-white/10"
              )}
              data-testid={`sidebar-link-${item.title.toLowerCase()}`}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={active ? 2.4 : 1.9} />
              <span className="flex-1 truncate">{item.title}</span>
              {badge > 0 && (
                <span
                  className={cn(
                    "ml-auto min-w-[22px] h-5 px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center",
                    active ? "bg-[#3e199e] text-white" : "bg-white/20 text-white"
                  )}
                >
                  {badge > 99 ? "99+" : badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Categories */}
      <div className="px-3 mt-2">
        <p className="px-3 text-[10px] font-bold tracking-[0.18em] text-white/45 mb-2">
          CATEGORIAS
        </p>
        <div className="space-y-0.5">
          {categories.slice(0, 9).map((cat) => {
            const slug = (cat.slug || "").toLowerCase();
            const Icon = CATEGORY_ICON_MAP[slug] || Sparkles;
            return (
              <button
                key={cat.id}
                onClick={() => navigate(`/cliente/produtos?categoria=${cat.slug}`)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-white/75 hover:bg-white/10 hover:text-white transition-colors"
                data-testid={`sidebar-cat-${cat.slug}`}
              >
                {cat.imagem_url ? (
                  <img src={cat.imagem_url} alt="" className="h-[18px] w-[18px] object-contain shrink-0" />
                ) : (
                  <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.8} />
                )}
                <span className="flex-1 text-left truncate">{cat.nome}</span>
              </button>
            );
          })}

          <button
            onClick={() => navigate("/cliente/produtos")}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-white/75 hover:bg-white/10 hover:text-white transition-colors"
            data-testid="sidebar-all-categories"
          >
            <ListFilter className="h-[18px] w-[18px] shrink-0" strokeWidth={1.8} />
            <span className="flex-1 text-left truncate">Ver todas categorias</span>
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-4" />

      {/* "Seja um vendedor" CTA */}
      <div className="px-3 pb-5">
        <button
          onClick={() => navigate("/cliente/solicitar-fornecedor")}
          className="group w-full text-left rounded-2xl p-4 transition-all hover:scale-[1.02]"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(167,139,250,0.18) 100%)",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
          data-testid="sidebar-seller-cta"
        >
          <div className="flex items-start gap-2 mb-1.5">
            <Store className="h-4 w-4 text-[#a78bfa] mt-0.5 shrink-0" />
            <p className="text-sm font-semibold text-white">Seja um vendedor</p>
          </div>
          <p className="text-[11px] text-white/65 leading-snug">
            Venda seus produtos para milhares de compradores todos os dias.
          </p>
          <div className="mt-3 inline-flex items-center justify-center h-8 w-8 rounded-full bg-[#a78bfa]/30 group-hover:bg-[#a78bfa]/50 transition-colors">
            <ArrowRight className="h-4 w-4 text-white" />
          </div>
        </button>
      </div>
    </aside>
  );
};

export default ClientSidebar;
