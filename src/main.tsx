import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { FavoritesProvider } from "./hooks/useFavorites";
import { StoresFavoritesProvider } from "./hooks/useStoresFavorites";
import { ProfileProvider } from "./hooks/useProfile";
import { AuthProvider } from "./hooks/useAuth";

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <ProfileProvider>
      <FavoritesProvider>
        <StoresFavoritesProvider>
          <App />
        </StoresFavoritesProvider>
      </FavoritesProvider>
    </ProfileProvider>
  </AuthProvider>
);
