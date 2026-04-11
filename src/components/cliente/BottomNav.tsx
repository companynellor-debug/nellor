import { Home, MessageCircle, Bookmark, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const navItems = [
  { icon: Home, path: "/cliente" },
  { icon: MessageCircle, path: "/cliente/chat" },
  { icon: Bookmark, path: "/cliente/favoritos" },
  { icon: User, path: "/cliente/perfil" },
];

export const BottomNav = () => {
  const location = useLocation();

  const activeIndex = navItems.findIndex((item) => location.pathname === item.path);

  return (
    <nav className="fixed bottom-4 left-4 right-4 z-50">
      <div className="relative max-w-md mx-auto">
        <div className="flex items-center justify-around h-16 px-6 rounded-2xl bg-background/80 backdrop-blur-xl border border-border/30 shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const active = activeIndex === index;

            if (active) {
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="relative -mt-10 flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-primary to-purple-600 shadow-[0_4px_20px_hsl(var(--primary)/0.4)] active:scale-95"
                >
                  <Icon className="h-6 w-6 text-white transition-transform duration-300" strokeWidth={1.8} />
                </Link>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex flex-col items-center gap-1.5 transition-all duration-300"
              >
                <Icon
                  className="h-[22px] w-[22px] text-muted-foreground/70 transition-colors duration-300"
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
