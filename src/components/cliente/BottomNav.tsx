import { Home, Heart, User, MessageCircle } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useCart } from "@/hooks/useCart";

export const BottomNav = () => {
  const location = useLocation();
  const { cartItems } = useCart();
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const sideItems = [
    { icon: Home, path: "/cliente" },
    { icon: MessageCircle, path: "/cliente/chat" },
    { icon: Heart, path: "/cliente/carrinho", isCenter: true },
    { icon: User, path: "/cliente/perfil" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-4 left-4 right-4 z-50">
      <div className="relative max-w-md mx-auto">
        <div className="flex items-center justify-around h-16 px-6 rounded-2xl bg-white/60 backdrop-blur-xl border border-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
          {sideItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            if (item.isCenter) {
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="relative -mt-10 flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-primary to-purple-600 shadow-[0_4px_20px_hsl(var(--primary)/0.4)] transition-transform duration-200 active:scale-95"
                >
                  <Icon className="h-6 w-6 text-white" strokeWidth={1.8} />
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                      {totalItems > 9 ? "9+" : totalItems}
                    </span>
                  )}
                </Link>
              );
            }

            return (
              <Link key={item.path} to={item.path} className="flex flex-col items-center gap-1.5">
                <Icon
                  className={`h-[22px] w-[22px] transition-colors duration-200 ${
                    active ? "text-primary" : "text-muted-foreground/70"
                  }`}
                  strokeWidth={active ? 2.2 : 1.6}
                />
                {active && <span className="w-1 h-1 rounded-full bg-primary" />}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
