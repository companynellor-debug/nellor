import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Fornecedor from "./pages/Fornecedor";
import Sobre from "./pages/Sobre";
import Contato from "./pages/Contato";
import Login from "./pages/Login";
import LoginFornecedor from "./pages/LoginFornecedor";
import Download from "./pages/Download";
import Recursos from "./pages/Recursos";
import FAQ from "./pages/FAQ";
import NotFound from "./pages/NotFound";

import ClienteHome from "./pages/cliente/Home";
import ProdutoDetalhes from "./pages/cliente/ProdutoDetalhes";
import Carrinho from "./pages/cliente/Carrinho";
import Chat from "./pages/cliente/Chat";
import Perfil from "./pages/cliente/Perfil";
import Avaliacoes from "./pages/cliente/Avaliacoes";
import Favoritos from "./pages/cliente/Favoritos";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/fornecedor" element={<Fornecedor />} />
          <Route path="/sobre" element={<Sobre />} />
          <Route path="/contato" element={<Contato />} />
          <Route path="/login" element={<Login />} />
          <Route path="/login-fornecedor" element={<LoginFornecedor />} />
          <Route path="/download" element={<Download />} />
          <Route path="/recursos" element={<Recursos />} />
          <Route path="/faq" element={<FAQ />} />
          
          {/* Cliente Panel Routes */}
          <Route path="/cliente" element={<ClienteHome />} />
          <Route path="/cliente/produto/:id" element={<ProdutoDetalhes />} />
          <Route path="/cliente/carrinho" element={<Carrinho />} />
          <Route path="/cliente/chat" element={<Chat />} />
          <Route path="/cliente/perfil" element={<Perfil />} />
          <Route path="/cliente/avaliacoes" element={<Avaliacoes />} />
          <Route path="/cliente/favoritos" element={<Favoritos />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
