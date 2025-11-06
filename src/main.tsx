import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { FavoritesProvider } from "./hooks/useFavorites";
import { StoresFavoritesProvider } from "./hooks/useStoresFavorites";
import { ProfileProvider } from "./hooks/useProfile";
import { AuthProvider } from "./hooks/useAuth";
import { SupplierOrdersProvider } from "./hooks/useSupplierOrders";
import { SupplierProductsProvider } from "./hooks/useSupplierProducts";
import { StoresProvider } from "./hooks/useStores";
import { StoreProfileProvider } from "./hooks/useStoreProfile";
import { ProductsProvider } from "./hooks/useProducts";

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <ProfileProvider>
      <StoreProfileProvider>
        <FavoritesProvider>
          <StoresFavoritesProvider>
            <SupplierOrdersProvider>
              <SupplierProductsProvider>
                <StoresProvider>
                  <ProductsProvider>
                    <App />
                  </ProductsProvider>
                </StoresProvider>
              </SupplierProductsProvider>
            </SupplierOrdersProvider>
          </StoresFavoritesProvider>
        </FavoritesProvider>
      </StoreProfileProvider>
    </ProfileProvider>
  </AuthProvider>
);
