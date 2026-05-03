import { Outlet } from "react-router-dom";
import { ClientePrefetchProvider } from "@/hooks/useClientePrefetch";
import { ProductsProvider } from "@/hooks/useProducts";
import { StoresProvider } from "@/hooks/useStores";
import { ReviewsProvider } from "@/hooks/useReviews";
import { ClientOnboardingTourProvider } from "@/hooks/useClientOnboardingTour";
import { ClientOnboardingTour } from "@/components/cliente/ClientOnboardingTour";
import { FloatingHelpButton } from "@/components/cliente/FloatingHelpButton";

const ClienteLayout = () => {
  return (
    <StoresProvider>
      <ProductsProvider>
        <ReviewsProvider>
          <ClientePrefetchProvider>
            <ClientOnboardingTourProvider>
              <Outlet />
              <ClientOnboardingTour />
              <FloatingHelpButton />
            </ClientOnboardingTourProvider>
          </ClientePrefetchProvider>
        </ReviewsProvider>
      </ProductsProvider>
    </StoresProvider>
  );
};

export default ClienteLayout;
