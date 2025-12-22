import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminIndicadores from "./pages/admin/Indicadores";
import AdminUsuarios from "./pages/admin/Usuarios";
import AdminFornecedores from "./pages/admin/Fornecedores";
import AdminVendas from "./pages/admin/Vendas";
import AdminFinanceiro from "./pages/admin/Financeiro";
import AdminRelatorios from "./pages/admin/Relatorios";
import AdminAlertas from "./pages/admin/Alertas";
import AdminConfiguracoes from "./pages/admin/Configuracoes";
import AdminSaques from "./pages/admin/Saques";
import AdminSuporteAdmin from "./pages/admin/SuporteAdmin";
import AdminCategorias from "./pages/admin/Categorias";
import AdminBanners from "./pages/admin/Banners";
import AdminNotificacoes from "./pages/admin/NotificacoesAdmin";
import Home from "./pages/Home";
import Fornecedor from "./pages/Fornecedor";
import Sobre from "./pages/Sobre";
import Contato from "./pages/Contato";
import Auth from "./pages/Auth";
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
import MetodosPagamento from "./pages/cliente/MetodosPagamento";
import Suporte from "./pages/cliente/Suporte";
import PedidoConfirmado from "./pages/cliente/PedidoConfirmado";
import FornecedorLayout from "./pages/fornecedor/FornecedorLayout";
import Dashboard from "./pages/fornecedor/Dashboard";
import Pedidos from "./pages/fornecedor/Pedidos";
import ChatFornecedor from "./pages/fornecedor/ChatFornecedor";
import ProdutosFornecedor from "./pages/fornecedor/Produtos";
import Financeiro from "./pages/fornecedor/Financeiro";
import NotificacoesFornecedor from "./pages/fornecedor/Notificacoes";
import EditarLoja from "./pages/fornecedor/EditarLoja";
import Onboarding from "./pages/fornecedor/Onboarding";
import Estatisticas from "./pages/fornecedor/Estatisticas";
import Recebimentos from "./pages/fornecedor/Recebimentos";
import PlanosFornecedor from "./pages/fornecedor/Planos";
import InstalarApp from "./pages/cliente/InstalarApp";
import ConfiguracoesNotificacoes from "./pages/cliente/ConfiguracoesNotificacoes";
import CuponsFornecedor from "./pages/fornecedor/Cupons";

const queryClient = new QueryClient();
const App = () => <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/sobre" element={<Sobre />} />
            <Route path="/contato" element={<Contato />} />
            <Route path="/auth" element={<Auth />} />
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
          <Route path="/cliente/pedido-confirmado" element={<ProtectedRoute requireType="cliente"><PedidoConfirmado /></ProtectedRoute>} />
          <Route path="/cliente/chat" element={<ProtectedRoute requireType="cliente"><Chat /></ProtectedRoute>} />
          <Route path="/cliente/perfil" element={<ProtectedRoute requireType="cliente"><Perfil /></ProtectedRoute>} />
          <Route path="/cliente/editar-perfil" element={<ProtectedRoute requireType="cliente"><EditarPerfil /></ProtectedRoute>} />
          <Route path="/cliente/meus-pedidos" element={<ProtectedRoute requireType="cliente"><MeusPedidos /></ProtectedRoute>} />
          <Route path="/cliente/enderecos" element={<ProtectedRoute requireType="cliente"><Enderecos /></ProtectedRoute>} />
          <Route path="/cliente/notificacoes" element={<ProtectedRoute requireType="cliente"><Notificacoes /></ProtectedRoute>} />
          <Route path="/cliente/avaliacoes" element={<ProtectedRoute requireType="cliente"><Avaliacoes /></ProtectedRoute>} />
          <Route path="/cliente/avaliar-pedido/:orderId" element={<ProtectedRoute requireType="cliente"><AvaliarPedido /></ProtectedRoute>} />
          <Route path="/cliente/favoritos" element={<ProtectedRoute requireType="cliente"><Favoritos /></ProtectedRoute>} />
          <Route path="/cliente/metodos-pagamento" element={<ProtectedRoute requireType="cliente"><MetodosPagamento /></ProtectedRoute>} />
          <Route path="/cliente/suporte" element={<ProtectedRoute requireType="cliente"><Suporte /></ProtectedRoute>} />
          <Route path="/cliente/instalar" element={<ProtectedRoute requireType="cliente"><InstalarApp /></ProtectedRoute>} />
          <Route path="/cliente/configuracoes-notificacoes" element={<ProtectedRoute requireType="cliente"><ConfiguracoesNotificacoes /></ProtectedRoute>} />

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
            <Route path="estatisticas" element={<Estatisticas />} />
            <Route path="recebimentos" element={<Recebimentos />} />
            <Route path="cupons" element={<CuponsFornecedor />} />
            <Route path="planos" element={<PlanosFornecedor />} />
          </Route>
          
          {/* Admin Panel */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="indicadores" element={<AdminIndicadores />} />
            <Route path="usuarios" element={<AdminUsuarios />} />
            <Route path="fornecedores" element={<AdminFornecedores />} />
            <Route path="vendas" element={<AdminVendas />} />
            <Route path="financeiro" element={<AdminFinanceiro />} />
            <Route path="relatorios" element={<AdminRelatorios />} />
            <Route path="alertas" element={<AdminAlertas />} />
            <Route path="configuracoes" element={<AdminConfiguracoes />} />
            <Route path="saques" element={<AdminSaques />} />
            <Route path="suporte" element={<AdminSuporteAdmin />} />
            <Route path="categorias" element={<AdminCategorias />} />
            <Route path="banners" element={<AdminBanners />} />
            <Route path="notificacoes" element={<AdminNotificacoes />} />
          </Route>
          
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
      </Routes>
    </TooltipProvider>
  </QueryClientProvider>;
export default App;