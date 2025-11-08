import { Home, ShoppingCart, User, Bell, MessageCircle } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useSupabaseNotifications } from "@/hooks/useSupabaseNotifications";
import { useCart } from "@/hooks/useCart";

export const BottomNav = () => {
  const location = useLocation();
  const { unreadCount } = useSupabaseNotifications();
  const { cartItems } = useCart();
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const navItems = [
    { icon: Home, label: "Home", path: "/cliente" },
    { icon: MessageCircle, label: "Chat", path: "/cliente/chat" },
    { icon: ShoppingCart, label: "Carrinho", path: "/cliente/carrinho", badge: totalItems },
    { icon: Bell, label: "Alertas", path: "/cliente/notificacoes", badge: unreadCount },
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
              className={`flex flex-col items-center gap-1 transition-all duration-300 relative ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <div className="relative">
                <Icon className={`h-6 w-6 ${isActive ? "scale-110" : ""}`} />
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
