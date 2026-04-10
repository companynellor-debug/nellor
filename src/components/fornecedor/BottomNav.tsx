import { Home, Handshake, MessageSquare, BarChart3, Store } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export const BottomNavFornecedor = () => {
  const location = useLocation();

  const navItems = [
    { icon: Home, label: "Dashboard", path: "/fornecedor/dashboard" },
    { icon: Handshake, label: "Negociações", path: "/fornecedor/negociacoes" },
    { icon: MessageSquare, label: "Chat", path: "/fornecedor/chat" },
    { icon: BarChart3, label: "Estatísticas", path: "/fornecedor/estatisticas" },
    { icon: Store, label: "Editar Loja", path: "/fornecedor/editar-loja" },
  ];

  const activeIndex = navItems.findIndex(item => location.pathname === item.path);

  return (
    <nav className="fixed bottom-4 left-4 right-4 z-50 md:hidden">
      <div className="relative max-w-md mx-auto">
        <div className="flex items-center justify-around h-16 px-4 rounded-2xl bg-white/60 backdrop-blur-xl border border-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const active = activeIndex === index;

            if (active) {
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="relative -mt-10 flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-primary to-purple-600 shadow-[0_4px_20px_hsl(var(--primary)/0.4)]"
                >
                  <Icon className="h-6 w-6 text-white" strokeWidth={1.8} />
                </Link>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex flex-col items-center gap-1.5"
              >
                <Icon
                  className="h-[22px] w-[22px] text-muted-foreground/70"
                  strokeWidth={1.6}
                />
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
