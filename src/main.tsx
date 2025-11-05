import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { FavoritesProvider } from "./hooks/useFavorites";
import { StoresFavoritesProvider } from "./hooks/useStoresFavorites";
import { ProfileProvider } from "./hooks/useProfile";
import { AuthProvider } from "./hooks/useAuth";
import { SupplierOrdersProvider } from "./hooks/useSupplierOrders";
import { SupplierProductsProvider } from "./hooks/useSupplierProducts";

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <ProfileProvider>
      <FavoritesProvider>
        <StoresFavoritesProvider>
          <SupplierOrdersProvider>
            <SupplierProductsProvider>
              <App />
            </SupplierProductsProvider>
          </SupplierOrdersProvider>
        </StoresFavoritesProvider>
      </FavoritesProvider>
    </ProfileProvider>
  </AuthProvider>
);
