import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
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
import { registerSW } from 'virtual:pwa-register';

// Register service worker (required for Web Push to work with app closed)
registerSW({
  immediate: true,
  onRegistered(r) {
    console.log('✅ Service Worker registered', r);
  },
  onRegisterError(error) {
    console.error('❌ Service Worker registration error', error);
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
