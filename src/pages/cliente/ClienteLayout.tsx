import { ReactNode } from "react";
import { ClientePrefetchProvider } from "@/hooks/useClientePrefetch";

interface ClienteLayoutProps {
  children: ReactNode;
}

/**
 * Layout do painel do cliente que prefetcha todos os dados ao entrar.
 * Isso garante que ao trocar de aba, os dados já estão carregados.
 */
const ClienteLayout = ({ children }: ClienteLayoutProps) => {
  return (
    <ClientePrefetchProvider>
      {children}
    </ClientePrefetchProvider>
  );
};

export default ClienteLayout;
