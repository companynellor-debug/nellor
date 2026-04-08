import { Home, Heart, User, MessageCircle } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useCart } from "@/hooks/useCart";

const navItems = [
  { icon: Home, path: "/cliente" },
  { icon: MessageCircle, path: "/cliente/chat" },
  { icon: Heart, path: "/cliente/carrinho" },
  { icon: User, path: "/cliente/perfil" },
];

export const BottomNav = () => {
  const location = useLocation();
  const { cartItems } = useCart();
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const activeIndex = navItems.findIndex((item) => location.pathname === item.path);
  // Each item occupies 25% of width, center of item = (index * 25) + 12.5
  const bubbleLeftPercent = activeIndex >= 0 ? activeIndex * 25 + 12.5 : 12.5;

  return (
    <nav className="fixed bottom-4 left-4 right-4 z-50">
      <div className="relative max-w-md mx-auto">
        <div className="relative flex items-end h-[72px] rounded-2xl bg-white/60 backdrop-blur-xl border border-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.08)] overflow-visible">
          
          {/* Sliding bubble - absolutely positioned, centered via translate */}
          <div
            className="absolute -top-5 w-[52px] h-[52px] rounded-full bg-gradient-to-br from-primary to-purple-600 shadow-[0_4px_16px_hsl(var(--primary)/0.35)] z-0"
            style={{
              left: `${bubbleLeftPercent}%`,
              transform: "translateX(-50%)",
              transition: "left 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          />

          {/* Nav items */}
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const active = activeIndex === index;

            return (
              <Link
                key={item.path}
                to={item.path}
                className="relative z-10 flex-1 flex flex-col items-center justify-center pb-3"
                style={{
                  paddingTop: active ? "0px" : "12px",
                  marginTop: active ? "-16px" : "0px",
                  transition: "margin-top 0.45s cubic-bezier(0.34, 1.56, 0.64, 1), padding-top 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)",
                }}
              >
                <Icon
                  className={`h-[22px] w-[22px] ${active ? "text-white" : "text-muted-foreground/60"}`}
                  strokeWidth={active ? 2 : 1.5}
                  style={{
                    transition: "color 0.3s ease, transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)",
                    transform: active ? "scale(1.15)" : "scale(1)",
                  }}
                />
                {/* Dot indicator for inactive */}
                {!active && (
                  <span
                    className="mt-1.5 w-1 h-1 rounded-full bg-transparent"
                  />
                )}
                {/* Badge for carrinho */}
                {item.path === "/cliente/carrinho" && totalItems > 0 && !active && (
                  <span className="absolute top-1 right-1/4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                    {totalItems > 9 ? "9+" : totalItems}
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
