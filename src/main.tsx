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

const DYNAMIC_IMPORT_RECOVERY_KEY = "nellor_dynamic_import_recovery_at";
const DYNAMIC_IMPORT_RECOVERY_WINDOW_MS = 15000;

const isDynamicImportError = (message: string) => {
  const normalizedMessage = message.toLowerCase();

  return [
    "failed to fetch dynamically imported module",
    "error loading dynamically imported module",
    "importing a module script failed",
  ].some((fragment) => normalizedMessage.includes(fragment));
};

const recoverFromDynamicImportError = () => {
  if (typeof window === "undefined") return;

  const now = Date.now();
  const lastRecoveryAt = Number(sessionStorage.getItem(DYNAMIC_IMPORT_RECOVERY_KEY) ?? "0");

  if (now - lastRecoveryAt < DYNAMIC_IMPORT_RECOVERY_WINDOW_MS) {
    return;
  }

  sessionStorage.setItem(DYNAMIC_IMPORT_RECOVERY_KEY, String(now));

  const url = new URL(window.location.href);
  url.searchParams.set("_reload", String(now));
  window.location.replace(url.toString());
};

if (typeof window !== "undefined") {
  window.addEventListener("vite:preloadError", (event) => {
    event.preventDefault();
    recoverFromDynamicImportError();
  });

  window.addEventListener("error", (event) => {
    const message = event.message || (event.error instanceof Error ? event.error.message : "");

    if (isDynamicImportError(message)) {
      event.preventDefault();
      recoverFromDynamicImportError();
    }
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    const message = reason instanceof Error ? reason.message : typeof reason === "string" ? reason : "";

    if (isDynamicImportError(message)) {
      event.preventDefault();
      recoverFromDynamicImportError();
    }
  });
}

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

