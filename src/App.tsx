import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import Home from "./pages/Home";
import Fornecedor from "./pages/Fornecedor";
import Sobre from "./pages/Sobre";
import Contato from "./pages/Contato";
import Login from "./pages/Login";
import LoginFornecedor from "./pages/LoginFornecedor";
import EscolherPlano from "./pages/fornecedor/EscolherPlano";
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
import AvaliarPedido from "./pages/cliente/AvaliarPedido";
import Favoritos from "./pages/cliente/Favoritos";
import EditarPerfil from "./pages/cliente/EditarPerfil";
import MeusPedidos from "./pages/cliente/MeusPedidos";
import Enderecos from "./pages/cliente/Enderecos";
import Notificacoes from "./pages/cliente/Notificacoes";
import Produtos from "./pages/cliente/Produtos";
import PerfilLoja from "./pages/cliente/PerfilLoja";
import Checkout from "./pages/cliente/Checkout";

import FornecedorLayout from "./pages/fornecedor/FornecedorLayout";
import Dashboard from "./pages/fornecedor/Dashboard";
import Pedidos from "./pages/fornecedor/Pedidos";
import ChatFornecedor from "./pages/fornecedor/ChatFornecedor";
import ProdutosFornecedor from "./pages/fornecedor/Produtos";
import Financeiro from "./pages/fornecedor/Financeiro";
import NotificacoesFornecedor from "./pages/fornecedor/Notificacoes";
import EditarLoja from "./pages/fornecedor/EditarLoja";
import Onboarding from "./pages/fornecedor/Onboarding";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/sobre" element={<Sobre />} />
          <Route path="/contato" element={<Contato />} />
          <Route path="/login" element={<Login />} />
          <Route path="/login-fornecedor" element={<LoginFornecedor />} />
          <Route path="/fornecedor/escolher-plano" element={<EscolherPlano />} />
          <Route path="/fornecedor/onboarding" element={<ProtectedRoute requireType="fornecedor"><Onboarding /></ProtectedRoute>} />
          <Route path="/download" element={<Download />} />
          <Route path="/recursos" element={<Recursos />} />
          <Route path="/faq" element={<FAQ />} />
          
          {/* Cliente Panel Routes */}
          <Route path="/cliente" element={<ProtectedRoute requireType="cliente"><ClienteHome /></ProtectedRoute>} />
          <Route path="/cliente/produtos" element={<ProtectedRoute requireType="cliente"><Produtos /></ProtectedRoute>} />
          <Route path="/cliente/produto/:id" element={<ProtectedRoute requireType="cliente"><ProdutoDetalhes /></ProtectedRoute>} />
          <Route path="/loja/:id" element={<PerfilLoja />} />
          <Route path="/cliente/loja/:id" element={<ProtectedRoute requireType="cliente"><PerfilLoja /></ProtectedRoute>} />
          <Route path="/cliente/carrinho" element={<ProtectedRoute requireType="cliente"><Carrinho /></ProtectedRoute>} />
          <Route path="/cliente/checkout" element={<ProtectedRoute requireType="cliente"><Checkout /></ProtectedRoute>} />
          <Route path="/cliente/chat" element={<ProtectedRoute requireType="cliente"><Chat /></ProtectedRoute>} />
          <Route path="/cliente/perfil" element={<ProtectedRoute requireType="cliente"><Perfil /></ProtectedRoute>} />
          <Route path="/cliente/editar-perfil" element={<ProtectedRoute requireType="cliente"><EditarPerfil /></ProtectedRoute>} />
          <Route path="/cliente/meus-pedidos" element={<ProtectedRoute requireType="cliente"><MeusPedidos /></ProtectedRoute>} />
          <Route path="/cliente/enderecos" element={<ProtectedRoute requireType="cliente"><Enderecos /></ProtectedRoute>} />
          <Route path="/cliente/notificacoes" element={<ProtectedRoute requireType="cliente"><Notificacoes /></ProtectedRoute>} />
          <Route path="/cliente/avaliacoes" element={<ProtectedRoute requireType="cliente"><Avaliacoes /></ProtectedRoute>} />
          <Route path="/cliente/avaliar-pedido" element={<ProtectedRoute requireType="cliente"><AvaliarPedido /></ProtectedRoute>} />
          <Route path="/cliente/favoritos" element={<ProtectedRoute requireType="cliente"><Favoritos /></ProtectedRoute>} />

          {/* Fornecedor Panel Routes */}
          <Route path="/fornecedor" element={<ProtectedRoute requireType="fornecedor"><FornecedorLayout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="pedidos" element={<Pedidos />} />
            <Route path="chat" element={<ChatFornecedor />} />
            <Route path="produtos" element={<ProdutosFornecedor />} />
            <Route path="financeiro" element={<Financeiro />} />
            <Route path="notificacoes" element={<NotificacoesFornecedor />} />
            <Route path="editar-loja" element={<EditarLoja />} />
          </Route>
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
