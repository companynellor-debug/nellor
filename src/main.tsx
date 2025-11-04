import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { FavoritesProvider } from "./hooks/useFavorites";
import { StoresFavoritesProvider } from "./hooks/useStoresFavorites";
import { ProfileProvider } from "./hooks/useProfile";

createRoot(document.getElementById("root")!).render(
  <ProfileProvider>
    <FavoritesProvider>
      <StoresFavoritesProvider>
        <App />
      </StoresFavoritesProvider>
    </FavoritesProvider>
  </ProfileProvider>
);
