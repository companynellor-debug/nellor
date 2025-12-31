import { Outlet } from "react-router-dom";
import { ClientePrefetchProvider } from "@/hooks/useClientePrefetch";

/**
 * Layout persistente do painel do cliente.
 * - Prefetch roda uma vez ao entrar no /cliente
 * - Provider NÃO remonta ao trocar de abas (rotas filhas)
 */
const ClienteLayout = () => {
  return (
    <ClientePrefetchProvider>
      <Outlet />
    </ClientePrefetchProvider>
  );
};

export default ClienteLayout;

