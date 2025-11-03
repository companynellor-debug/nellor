import { Home, ShoppingCart, MessageSquare, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export const BottomNav = () => {
  const location = useLocation();

  const navItems = [
    { icon: Home, label: "Home", path: "/cliente" },
    { icon: ShoppingCart, label: "Carrinho", path: "/cliente/carrinho" },
    { icon: MessageSquare, label: "Chat", path: "/cliente/chat" },
    { icon: User, label: "Perfil", path: "/cliente/perfil" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 border-t shadow-lg z-50 backdrop-blur-lg">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 transition-all duration-300 ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className={`h-6 w-6 ${isActive ? "scale-110" : ""}`} />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
