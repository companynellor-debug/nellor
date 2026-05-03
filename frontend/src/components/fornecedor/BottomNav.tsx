import { LayoutDashboard, Package, MessageSquare, User, Plus } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useSupabaseNotifications } from "@/hooks/useSupabaseNotifications";

export const BottomNavFornecedor = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { unreadCount } = useSupabaseNotifications();

  const left = [
    { icon: LayoutDashboard, label: "Painel", path: "/fornecedor/dashboard" },
    { icon: Package, label: "Produtos", path: "/fornecedor/produtos" },
  ];
  const right = [
    { icon: MessageSquare, label: "Conversas", path: "/fornecedor/chat", badge: unreadCount },
    { icon: User, label: "Loja", path: "/fornecedor/editar-loja" },
  ];

  const isActive = (p: string) => location.pathname.startsWith(p);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-3 mb-3 rounded-2xl bg-card/95 backdrop-blur-xl border border-border shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        <div className="grid grid-cols-5 items-center h-16 px-2 relative">
          {left.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link key={item.path} to={item.path} className="flex flex-col items-center gap-0.5">
                <Icon className={cn("h-5 w-5", active ? "text-primary" : "text-muted-foreground")} strokeWidth={active ? 2.4 : 1.8} />
                <span className={cn("text-[10px] font-medium", active ? "text-primary" : "text-muted-foreground")}>{item.label}</span>
              </Link>
            );
          })}

          {/* Center "+ Anunciar" floating button */}
          <button
            onClick={() => navigate("/fornecedor/produtos?novo=1")}
            className="flex flex-col items-center justify-center"
          >
            <span className="-mt-8 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_6px_20px_hsl(var(--primary)/0.4)]">
              <Plus className="h-6 w-6" strokeWidth={2.6} />
            </span>
            <span className="text-[10px] font-semibold text-foreground/80 mt-0.5">Vender</span>
          </button>

          {right.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link key={item.path} to={item.path} className="relative flex flex-col items-center gap-0.5">
                <Icon className={cn("h-5 w-5", active ? "text-primary" : "text-muted-foreground")} strokeWidth={active ? 2.4 : 1.8} />
                <span className={cn("text-[10px] font-medium", active ? "text-primary" : "text-muted-foreground")}>{item.label}</span>
                {"badge" in item && (item as any).badge > 0 && (
                  <span className="absolute top-0 right-2 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {(item as any).badge > 9 ? "9+" : (item as any).badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
