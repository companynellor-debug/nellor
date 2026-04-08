import { Home, Search, ShoppingBag, Settings, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useCart } from "@/hooks/useCart";

export const BottomNav = () => {
  const location = useLocation();
  const { cartItems } = useCart();
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const leftItems = [
    { icon: Home, path: "/cliente" },
    { icon: Search, path: "/cliente/produtos" },
  ];

  const rightItems = [
    { icon: Settings, path: "/cliente/perfil/configuracoes" },
    { icon: User, path: "/cliente/perfil" },
  ];

  const isActive = (path: string) => location.pathname === path;
  const isCenterActive = location.pathname === "/cliente/carrinho";

  return (
    <nav className="fixed bottom-4 left-4 right-4 z-50">
      <div className="relative max-w-md mx-auto">
        {/* Glass bar */}
        <div className="flex items-center justify-between h-16 px-6 rounded-2xl bg-white/60 backdrop-blur-xl border border-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
          {/* Left icons */}
          <div className="flex items-center gap-8">
            {leftItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link key={item.path} to={item.path} className="flex flex-col items-center gap-1.5">
                  <Icon
                    className={`h-[22px] w-[22px] transition-colors duration-200 ${
                      active ? "text-primary" : "text-muted-foreground/70"
                    }`}
                    strokeWidth={active ? 2.2 : 1.6}
                  />
                  {active && (
                    <span className="w-1 h-1 rounded-full bg-primary" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Spacer for center button */}
          <div className="w-14" />

          {/* Right icons */}
          <div className="flex items-center gap-8">
            {rightItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link key={item.path} to={item.path} className="flex flex-col items-center gap-1.5">
                  <Icon
                    className={`h-[22px] w-[22px] transition-colors duration-200 ${
                      active ? "text-primary" : "text-muted-foreground/70"
                    }`}
                    strokeWidth={active ? 2.2 : 1.6}
                  />
                  {active && (
                    <span className="w-1 h-1 rounded-full bg-primary" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Floating center button */}
        <Link
          to="/cliente/carrinho"
          className="absolute left-1/2 -translate-x-1/2 -top-4 flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-primary to-purple-600 shadow-[0_4px_20px_rgba(124,58,237,0.4)] transition-transform duration-200 active:scale-95"
        >
          <ShoppingBag className="h-6 w-6 text-white" strokeWidth={1.8} />
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
              {totalItems > 9 ? "9+" : totalItems}
            </span>
          )}
        </Link>
      </div>
    </nav>
  );
};
