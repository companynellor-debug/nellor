import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { FavoritesProvider } from "./hooks/useFavorites";
import { ProfileProvider } from "./hooks/useProfile";

createRoot(document.getElementById("root")!).render(
  <ProfileProvider>
    <FavoritesProvider>
      <App />
    </FavoritesProvider>
  </ProfileProvider>
);
