import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  MessageSquare,
  Wallet,
  Store,
  BarChart3,
  Settings,
  Lightbulb,
  FileText,
  HelpCircle,
  GraduationCap,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useSupabaseNotifications } from "@/hooks/useSupabaseNotifications";
import { useSupabaseMessages } from "@/hooks/useSupabaseMessages";
import { useNegotiations } from "@/hooks/useNegotiations";
import { useOnboardingTour } from "@/hooks/useOnboardingTour";
import logo from "@/assets/nellor-logo.png";

type Item = {
  title: string;
  url: string;
  icon: typeof LayoutDashboard;
  badgeKey?: "orders" | "messages";
};

const menuItems: Item[] = [
  { title: "Resumo", url: "/fornecedor/dashboard", icon: LayoutDashboard },
  { title: "Anúncios", url: "/fornecedor/produtos", icon: Package },
  { title: "Vendas", url: "/fornecedor/negociacoes", icon: ShoppingBag, badgeKey: "orders" },
  { title: "Mensagens", url: "/fornecedor/chat", icon: MessageSquare, badgeKey: "messages" },
  { title: "Cotações", url: "/fornecedor/solicitacoes", icon: FileText },
  { title: "Minha loja", url: "/fornecedor/editar-loja", icon: Store },
  { title: "Métricas", url: "/fornecedor/estatisticas", icon: BarChart3 },
  { title: "Tutorial", url: "/fornecedor/como-usar", icon: GraduationCap },
  { title: "Suporte", url: "/fornecedor/suporte", icon: HelpCircle },
  { title: "Conta", url: "/fornecedor/configuracoes", icon: Settings },
];

export function SupplierSidebar() {
  const location = useLocation();
  const { profile } = useSupabaseAuth();
  const { unreadCount: notificationsUnread } = useSupabaseNotifications();
  const { getTotalUnreadCount } = useSupabaseMessages();
  const { negotiations } = useNegotiations(profile?.id);
  const { triggerRestart } = useOnboardingTour();

  const pendingOrders = (negotiations || []).filter((n: any) =>
    ["pending", "accepted", "shipped"].includes(n?.status)
  ).length;

  const messagesUnread = getTotalUnreadCount();

  const badges: Record<string, number> = {
    orders: pendingOrders,
    messages: messagesUnread,
  };

  return (
    <aside className="w-64 h-screen fixed left-0 top-0 bg-card text-foreground border-r border-border flex flex-col">
      <div className="px-5 py-5 border-b border-border flex items-center gap-3">
        <img src={logo} alt="Nelor" className="h-9 w-9 object-contain" />
        <div className="leading-tight">
          <p className="text-sm font-extrabold tracking-tight">PLATAFORMA</p>
          <p className="text-[10px] font-semibold text-muted-foreground tracking-wider">DE NEGOCIAÇÕES</p>
        </div>
      </div>

      <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = location.pathname.startsWith(item.url);
          const Icon = item.icon;
          const badge = item.badgeKey ? badges[item.badgeKey] : 0;
          return (
            <NavLink
              key={item.url}
              to={item.url}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-foreground/80 hover:bg-muted"
              )}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={isActive ? 2.4 : 2} />
              <span className="flex-1 truncate">{item.title}</span>
              {badge > 0 && (
                <span
                  className={cn(
                    "ml-auto min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center",
                    isActive ? "bg-white/25 text-white" : "bg-primary/10 text-primary"
                  )}
                >
                  {badge > 99 ? "99+" : badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border space-y-3">
        <div className="rounded-2xl bg-primary/5 border border-primary/10 p-3">
          <div className="flex items-center gap-2 mb-1">
            <Lightbulb className="h-4 w-4 text-primary" />
            <p className="text-xs font-semibold text-foreground">Dica de hoje</p>
          </div>
          <p className="text-[11px] text-muted-foreground leading-snug">
            Mantenha seus produtos atualizados e responda rápido às mensagens para vender mais.
          </p>
          <button
            onClick={triggerRestart}
            className="mt-2 w-full text-[11px] font-semibold text-primary hover:underline text-left"
          >
            Ver tutorial novamente
          </button>
        </div>

        <div className="flex items-center gap-2 px-1">
          <div className="h-9 w-9 rounded-full bg-muted overflow-hidden flex items-center justify-center text-xs font-semibold text-muted-foreground shrink-0">
            {profile?.foto_perfil_url ? (
              <img src={profile.foto_perfil_url} alt="" className="h-full w-full object-cover" />
            ) : (
              (profile?.nome?.[0] || "F").toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold truncate">{profile?.nome || "Fornecedor"}</p>
            <p className="text-[10px] text-muted-foreground">Vendedor</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
