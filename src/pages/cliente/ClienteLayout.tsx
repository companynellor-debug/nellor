import { Outlet } from "react-router-dom";
import { ClientePrefetchProvider } from "@/hooks/useClientePrefetch";
import { AffiliateTracker } from "@/components/cliente/AffiliateTracker";

/**
 * Layout persistente do painel do cliente.
 * - Prefetch roda uma vez ao entrar no /cliente
 * - Provider NÃO remonta ao trocar de abas (rotas filhas)
 * - AffiliateTracker captura links de afiliado (?ref=xxx)
 */
const ClienteLayout = () => {
  return (
    <ClientePrefetchProvider>
      <AffiliateTracker />
      <Outlet />
    </ClientePrefetchProvider>
  );
};

export default ClienteLayout;
