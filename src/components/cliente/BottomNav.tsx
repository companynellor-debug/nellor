import { Home, Heart, User, MessageCircle } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useCart } from "@/hooks/useCart";
import { useEffect, useRef, useState } from "react";

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
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [bubbleStyle, setBubbleStyle] = useState<{ left: number; width: number } | null>(null);

  const activeIndex = navItems.findIndex((item) => location.pathname === item.path);

  useEffect(() => {
    const el = itemRefs.current[activeIndex];
    const container = containerRef.current;
    if (el && container) {
      const cRect = container.getBoundingClientRect();
      const eRect = el.getBoundingClientRect();
      setBubbleStyle({
        left: eRect.left - cRect.left + eRect.width / 2 - 28,
        width: 56,
      });
    }
  }, [activeIndex]);

  return (
    <nav className="fixed bottom-4 left-4 right-4 z-50">
      <div className="relative max-w-md mx-auto">
        <div
          ref={containerRef}
          className="relative flex items-center justify-around h-16 px-6 rounded-2xl bg-white/60 backdrop-blur-xl border border-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.08)]"
        >
          {/* Sliding bubble */}
          {bubbleStyle && (
            <div
              className="absolute -top-7 h-14 w-14 rounded-full bg-gradient-to-br from-primary to-purple-600 shadow-[0_4px_20px_hsl(var(--primary)/0.4)] pointer-events-none"
              style={{
                left: bubbleStyle.left,
                transition: "left 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            />
          )}

          {navItems.map((item, index) => {
            const Icon = item.icon;
            const active = activeIndex === index;

            return (
              <Link
                key={item.path}
                to={item.path}
                ref={(el) => { itemRefs.current[index] = el; }}
                className={`relative z-10 flex flex-col items-center justify-center w-10 h-10 transition-all duration-400 ${
                  active ? "-mt-8" : ""
                }`}
              >
                <Icon
                  className={`h-[22px] w-[22px] transition-all duration-400 ${
                    active ? "text-white scale-110" : "text-muted-foreground/70"
                  }`}
                  strokeWidth={active ? 2 : 1.6}
                />
                {item.path === "/cliente/carrinho" && totalItems > 0 && !active && (
                  <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
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
