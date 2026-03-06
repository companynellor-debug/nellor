import { Outlet } from "react-router-dom";
import { ClientePrefetchProvider } from "@/hooks/useClientePrefetch";
import { AffiliateTracker } from "@/components/cliente/AffiliateTracker";
import { ProductsProvider } from "@/hooks/useProducts";
import { StoresProvider } from "@/hooks/useStores";
import { ReviewsProvider } from "@/hooks/useReviews";

/**
 * Layout persistente do painel do cliente.
 * - Providers de dados pesados só montam quando o cliente acessa /cliente
 * - Prefetch roda uma vez ao entrar no /cliente
 * - Provider NÃO remonta ao trocar de abas (rotas filhas)
 * - AffiliateTracker captura links de afiliado (?ref=xxx)
 */
const ClienteLayout = () => {
  return (
    <StoresProvider>
      <ProductsProvider>
        <ReviewsProvider>
          <ClientePrefetchProvider>
            <AffiliateTracker />
            <Outlet />
          </ClientePrefetchProvider>
        </ReviewsProvider>
      </ProductsProvider>
    </StoresProvider>
  );
};

export default ClienteLayout;
