import { Home, Handshake, MessageSquare, MoreHorizontal, Megaphone, BookOpen, FileText } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { Bell, Store, BarChart3, Tag } from "lucide-react";

export const BottomNavFornecedor = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const mainNavItems = [
    { icon: Home, label: "Dashboard", path: "/fornecedor/dashboard" },
    { icon: Handshake, label: "Negociações", path: "/fornecedor/negociacoes" },
    { icon: MessageSquare, label: "Chat", path: "/fornecedor/chat" },
    { icon: Tag, label: "Produtos", path: "/fornecedor/produtos" },
  ];

  const moreNavItems = [
    { icon: FileText, label: "Cotações", path: "/fornecedor/cotacoes" },
    { icon: Tag, label: "Produtos", path: "/fornecedor/produtos" },
    { icon: BarChart3, label: "Estatísticas", path: "/fornecedor/estatisticas" },
    { icon: Megaphone, label: "Patrocínio", path: "/fornecedor/patrocinio" },
    { icon: Bell, label: "Notificações", path: "/fornecedor/notificacoes" },
    { icon: Store, label: "Editar Loja", path: "/fornecedor/editar-loja" },
    { icon: BookOpen, label: "Como Usar", path: "/fornecedor/como-usar" },
  ];

  const isMoreActive = moreNavItems.some(item => location.pathname === item.path);
  const activeMainIndex = mainNavItems.findIndex(item => location.pathname === item.path);
  // If a "more" item is active or the sheet is open, highlight "Mais"
  const maisHighlighted = open || isMoreActive;

  // BottomNav stays visible on the chat list; the conversation overlay (fixed z-[60]) covers it when open

  return (
    <nav className="fixed bottom-4 left-4 right-4 z-50 md:hidden">
      <div className="relative max-w-md mx-auto">
        <div className="flex items-center justify-around h-16 px-4 rounded-2xl bg-white/60 backdrop-blur-xl border border-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
          {mainNavItems.map((item, index) => {
            const Icon = item.icon;
            const active = activeMainIndex === index && !open;

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

          {/* Mais button */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              {maisHighlighted && !open ? (
                <button className="relative -mt-10 flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-primary to-purple-600 shadow-[0_4px_20px_hsl(var(--primary)/0.4)]">
                  <MoreHorizontal className="h-6 w-6 text-white" strokeWidth={1.8} />
                </button>
              ) : open ? (
                <button className="relative -mt-10 flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-primary to-purple-600 shadow-[0_4px_20px_hsl(var(--primary)/0.4)]">
                  <MoreHorizontal className="h-6 w-6 text-white" strokeWidth={1.8} />
                </button>
              ) : (
                <button className="flex flex-col items-center gap-1.5">
                  <MoreHorizontal className="h-[22px] w-[22px] text-muted-foreground/70" strokeWidth={1.6} />
                </button>
              )}
            </SheetTrigger>
            <SheetContent side="bottom" className="h-auto rounded-t-2xl">
              <SheetHeader><SheetTitle>Mais Opções</SheetTitle></SheetHeader>
              <div className="flex flex-col gap-2 mt-4">
                {moreNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link key={item.path} to={item.path} onClick={() => setOpen(false)} className={`flex items-center gap-4 p-4 rounded-xl transition-all ${isActive ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/50"}`}>
                      <Icon className="h-6 w-6" />
                      <span className="text-base">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};
