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

// ✅ Register SW only in production to avoid dev/runtime registration issues
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  registerSW({
    immediate: true,
    onRegistered(r) {
      console.log("✅ PWA Service Worker registered", r);
    },
    onRegisterError(error) {
      console.error("❌ PWA Service Worker registration error", error);
    },
  });
}

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <SupabaseAuthProvider>
      <AuthProvider>
        <ProfileProvider>
          <FavoritesProvider>
            <StoresFavoritesProvider>
              <App />
            </StoresFavoritesProvider>
          </FavoritesProvider>
        </ProfileProvider>
      </AuthProvider>
    </SupabaseAuthProvider>
  </BrowserRouter>
);

