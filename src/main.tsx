import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { registerSW } from "virtual:pwa-register";
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

// ✅ Correct SW registration for VitePWA (works in dev and prod)
registerSW({
  immediate: true,
  onRegistered(r) {
    console.log("✅ PWA Service Worker registered", r);
  },
  onRegisterError(error) {
    console.error("❌ PWA Service Worker registration error", error);
  },
});

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
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
  </BrowserRouter>
);

