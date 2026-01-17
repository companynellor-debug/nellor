import { Outlet } from "react-router-dom";
import { ClientePrefetchProvider } from "@/hooks/useClientePrefetch";
import { AffiliateTracker } from "@/components/cliente/AffiliateTracker";
import { ClienteSidebar } from "@/components/cliente/ClienteSidebar";
import { ClienteHeader } from "@/components/cliente/ClienteHeader";
import { BottomNav } from "@/components/cliente/BottomNav";

/**
 * Layout persistente do painel do cliente.
 * - Sidebar fixa no desktop
 * - Header + Bottom nav no mobile
 * - Prefetch roda uma vez ao entrar no /cliente
 * - AffiliateTracker captura links de afiliado (?ref=xxx)
 */
const ClienteLayout = () => {
  return (
    <ClientePrefetchProvider>
      <AffiliateTracker />
      <div className="min-h-screen flex w-full bg-muted/30">
        {/* Sidebar - desktop only */}
        <ClienteSidebar />
        
        {/* Main content area */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Header */}
          <ClienteHeader />
          
          {/* Page content */}
          <main className="flex-1">
            <Outlet />
          </main>
        </div>
      </div>
      
      {/* Bottom nav - mobile only */}
      <BottomNav />
    </ClientePrefetchProvider>
  );
};

export default ClienteLayout;
