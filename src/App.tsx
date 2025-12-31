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
import AdminReconciliacao from "./pages/admin/Reconciliacao";
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
import PublicProduto from "./pages/PublicProduto";
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
import CheckoutSucesso from "./pages/cliente/CheckoutSucesso";
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
import RelatorioCupons from "./pages/fornecedor/RelatorioCupons";
import TesteNotificacoes from "./pages/fornecedor/TesteNotificacoes";
import ClienteLayout from "./pages/cliente/ClienteLayout";


const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/sobre" element={<Sobre />} />
          <Route path="/contato" element={<Contato />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/fornecedor/escolher-plano" element={<EscolherPlano />} />
          <Route
            path="/fornecedor/onboarding"
            element={
              <ProtectedRoute requireType="fornecedor">
                <Onboarding />
              </ProtectedRoute>
            }
          />
          <Route path="/download" element={<Download />} />
          <Route path="/recursos" element={<Recursos />} />
          <Route path="/faq" element={<FAQ />} />

          {/* Public Product Share Route */}
          <Route path="/p/:id" element={<PublicProduto />} />

          {/* Cliente Panel Routes (layout persistente, sem remount por aba) */}
          <Route
            path="/cliente"
            element={
              <ProtectedRoute requireType="cliente">
                <ClienteLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<ClienteHome />} />
            <Route path="produtos" element={<Produtos />} />
            <Route path="produto/:id" element={<ProdutoDetalhes />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="checkout/sucesso" element={<CheckoutSucesso />} />
            <Route path="pedido-confirmado" element={<PedidoConfirmado />} />
            <Route path="chat" element={<Chat />} />
            <Route path="perfil" element={<Perfil />} />
            <Route path="editar-perfil" element={<EditarPerfil />} />
            <Route path="meus-pedidos" element={<MeusPedidos />} />
            <Route path="enderecos" element={<Enderecos />} />
            <Route path="notificacoes" element={<Notificacoes />} />
            <Route path="avaliacoes" element={<Avaliacoes />} />
            <Route path="avaliar-pedido/:orderId" element={<AvaliarPedido />} />
            <Route path="favoritos" element={<Favoritos />} />
            <Route path="metodos-pagamento" element={<MetodosPagamento />} />
            <Route path="suporte" element={<Suporte />} />
            <Route path="instalar" element={<InstalarApp />} />
            <Route path="configuracoes-notificacoes" element={<ConfiguracoesNotificacoes />} />
            <Route path="carrinho" element={<Carrinho />} />
            <Route path="loja/:id" element={<PerfilLoja />} />
          </Route>

          {/* Public store profile route */}
          <Route path="/loja/:id" element={<PerfilLoja />} />

          {/* Fornecedor Panel Routes */}
          <Route
            path="/fornecedor"
            element={
              <ProtectedRoute requireType="fornecedor">
                <FornecedorLayout />
              </ProtectedRoute>
            }
          >
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
            <Route path="cupons/relatorio" element={<RelatorioCupons />} />
            <Route path="planos" element={<PlanosFornecedor />} />
            <Route path="teste-notificacoes" element={<TesteNotificacoes />} />
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
            <Route path="reconciliacao" element={<AdminReconciliacao />} />
          </Route>

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;