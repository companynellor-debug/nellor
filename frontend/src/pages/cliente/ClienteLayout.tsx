import { Outlet } from "react-router-dom";
import { ClientePrefetchProvider } from "@/hooks/useClientePrefetch";
import { ProductsProvider } from "@/hooks/useProducts";
import { StoresProvider } from "@/hooks/useStores";
import { ReviewsProvider } from "@/hooks/useReviews";
import { ClientOnboardingTourProvider } from "@/hooks/useClientOnboardingTour";
import { ClientOnboardingTour } from "@/components/cliente/ClientOnboardingTour";
import { FloatingHelpButton } from "@/components/cliente/FloatingHelpButton";
import { ClientSidebar } from "@/components/cliente/ClientSidebar";

const ClienteLayout = () => {
  return (
    <StoresProvider>
      <ProductsProvider>
        <ReviewsProvider>
          <ClientePrefetchProvider>
            <ClientOnboardingTourProvider>
              {/* Sidebar — desktop only */}
              <ClientSidebar />
              {/* Main content shifts right on lg+ */}
              <div className="lg:pl-64 min-h-screen">
                <Outlet />
              </div>
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
