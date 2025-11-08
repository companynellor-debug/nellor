import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { FavoritesProvider } from "./hooks/useFavorites";
import { StoresFavoritesProvider } from "./hooks/useStoresFavorites";
import { ProfileProvider } from "./hooks/useProfile";
import { AuthProvider } from "./hooks/useAuth";
import { SupplierOrdersProvider } from "./hooks/useSupplierOrders";
import { StoresProvider } from "./hooks/useStores";
import { StoreProfileProvider } from "./hooks/useStoreProfile";
import { ProductsProvider } from "./hooks/useProducts";
import { ReviewsProvider } from "./hooks/useReviews";

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <ProfileProvider>
      <StoreProfileProvider>
        <FavoritesProvider>
          <StoresFavoritesProvider>
            <SupplierOrdersProvider>
              <StoresProvider>
                <ProductsProvider>
                  <ReviewsProvider>
                    <App />
                  </ReviewsProvider>
                </ProductsProvider>
              </StoresProvider>
            </SupplierOrdersProvider>
          </StoresFavoritesProvider>
        </FavoritesProvider>
      </StoreProfileProvider>
    </ProfileProvider>
  </AuthProvider>
);
