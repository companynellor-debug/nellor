import { Home, ShoppingCart, User, MessageCircle } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useCart } from "@/hooks/useCart";


export const BottomNav = () => {
  const location = useLocation();
  const { cartItems } = useCart();
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);


  const navItems = [
    { icon: Home, label: "Home", path: "/cliente" },
    { icon: MessageCircle, label: "Chat", path: "/cliente/chat" },
    { icon: ShoppingCart, label: "Carrinho", path: "/cliente/carrinho", badge: totalItems },
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
              <div className="relative inline-flex">
                <Icon className={`h-5 w-5 ${isActive ? "scale-110" : ""}`} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[10px] font-medium rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
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
