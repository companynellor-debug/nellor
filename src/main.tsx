import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { FavoritesProvider } from "./hooks/useFavorites";
import { StoresFavoritesProvider } from "./hooks/useStoresFavorites";
import { ProfileProvider } from "./hooks/useProfile";
import { AuthProvider } from "./hooks/useAuth";
import { SupabaseAuthProvider } from "./hooks/useSupabaseAuth";
import { SupplierOrdersProvider } from "./hooks/useSupplierOrders";
import { StoresProvider } from "./hooks/useStores";
import { ProductsProvider } from "./hooks/useProducts";
import { ReviewsProvider } from "./hooks/useReviews";

createRoot(document.getElementById("root")!).render(
  <SupabaseAuthProvider>
    <AuthProvider>
      <ProfileProvider>
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
      </ProfileProvider>
    </AuthProvider>
  </SupabaseAuthProvider>
);
