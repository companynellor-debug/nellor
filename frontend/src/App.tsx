import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import PageSkeleton from "@/components/PageSkeleton";

// Lazy load layouts
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const ClienteLayout = lazy(() => import("./pages/cliente/ClienteLayout"));
const FornecedorLayout = lazy(() => import("./pages/fornecedor/FornecedorLayout"));

// Lazy load public pages
const Welcome = lazy(() => import("./pages/Welcome"));
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));
const PublicProduto = lazy(() => import("./pages/PublicProduto"));
const PastaPublica = lazy(() => import("./pages/PastaPublica"));
const CarrinhoCompartilhado = lazy(() => import("./pages/CarrinhoCompartilhado"));
const Onboarding = lazy(() => import("./pages/fornecedor/Onboarding"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const TermosDeUso = lazy(() => import("./pages/TermosDeUso"));

// Lazy load cliente pages
const ClienteHome = lazy(() => import("./pages/cliente/Home"));
const ProdutoDetalhes = lazy(() => import("./pages/cliente/ProdutoDetalhes"));
const Carrinho = lazy(() => import("./pages/cliente/Carrinho"));
const Chat = lazy(() => import("./pages/cliente/Chat"));
const Perfil = lazy(() => import("./pages/cliente/Perfil"));
const Avaliacoes = lazy(() => import("./pages/cliente/Avaliacoes"));
const AvaliarPedido = lazy(() => import("./pages/cliente/AvaliarPedido"));
const Favoritos = lazy(() => import("./pages/cliente/Favoritos"));
const EditarPerfil = lazy(() => import("./pages/cliente/EditarPerfil"));
const MeusPedidos = lazy(() => import("./pages/cliente/MeusPedidos"));
const Enderecos = lazy(() => import("./pages/cliente/Enderecos"));
const Seguranca = lazy(() => import("./pages/cliente/Seguranca"));
const Notificacoes = lazy(() => import("./pages/cliente/Notificacoes"));
const Produtos = lazy(() => import("./pages/cliente/Produtos"));
const PerfilLoja = lazy(() => import("./pages/cliente/PerfilLoja"));
const Checkout = lazy(() => import("./pages/cliente/Checkout"));
const CheckoutSucesso = lazy(() => import("./pages/cliente/CheckoutSucesso"));
const MetodosPagamento = lazy(() => import("./pages/cliente/MetodosPagamento"));
const Suporte = lazy(() => import("./pages/cliente/Suporte"));
const PedidoConfirmado = lazy(() => import("./pages/cliente/PedidoConfirmado"));
const InstalarApp = lazy(() => import("./pages/cliente/InstalarApp"));
const ConfiguracoesNotificacoes = lazy(() => import("./pages/cliente/ConfiguracoesNotificacoes"));
const SolicitarFornecedor = lazy(() => import("./pages/cliente/SolicitarFornecedor"));
const MinhasNegociacoes = lazy(() => import("./pages/cliente/MinhasNegociacoes"));
const Ajuda = lazy(() => import("./pages/cliente/Ajuda"));
const MinhasSolicitacoes = lazy(() => import("./pages/cliente/MinhasSolicitacoes"));

// Lazy load fornecedor pages
const Dashboard = lazy(() => import("./pages/fornecedor/Dashboard"));
const Pedidos = lazy(() => import("./pages/fornecedor/Pedidos"));
const NegociacoesFornecedor = lazy(() => import("./pages/fornecedor/Negociacoes"));
const ChatFornecedor = lazy(() => import("./pages/fornecedor/ChatFornecedor"));
const ProdutosFornecedor = lazy(() => import("./pages/fornecedor/Produtos"));
const Financeiro = lazy(() => import("./pages/fornecedor/Financeiro"));
const NotificacoesFornecedor = lazy(() => import("./pages/fornecedor/Notificacoes"));
const EditarLoja = lazy(() => import("./pages/fornecedor/EditarLoja"));
const Estatisticas = lazy(() => import("./pages/fornecedor/Estatisticas"));
const Recebimentos = lazy(() => import("./pages/fornecedor/Recebimentos"));
const ComoUsarFornecedor = lazy(() => import("./pages/fornecedor/ComoUsar"));
const TesteNotificacoes = lazy(() => import("./pages/fornecedor/TesteNotificacoes"));

const AssinaturaFornecedor = lazy(() => import("./pages/fornecedor/Assinatura"));
const PlanosFornecedor = lazy(() => import("./pages/fornecedor/Planos"));

// Lazy load admin pages
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminUsuarios = lazy(() => import("./pages/admin/Usuarios"));
const AdminFornecedores = lazy(() => import("./pages/admin/Fornecedores"));
const AdminVendas = lazy(() => import("./pages/admin/Vendas"));
const AdminConfiguracoes = lazy(() => import("./pages/admin/Configuracoes"));
const AdminSuporteAdmin = lazy(() => import("./pages/admin/SuporteAdmin"));
const AdminCategorias = lazy(() => import("./pages/admin/Categorias"));
const AdminBanners = lazy(() => import("./pages/admin/Banners"));
const AdminSolicitacoesFornecedor = lazy(() => import("./pages/admin/SolicitacoesFornecedor"));
const AdminAssinaturas = lazy(() => import("./pages/admin/Assinaturas"));
const ConfiguracoesFornecedor = lazy(() => import("./pages/fornecedor/Configuracoes"));
const SolicitacoesFornecedor = lazy(() => import("./pages/fornecedor/Solicitacoes"));
const SuporteFornecedor = lazy(() => import("./pages/fornecedor/Suporte"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 10,
      gcTime: 1000 * 60 * 15,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 1,
    },
  },
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Suspense fallback={<PageSkeleton />}>
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/termos-de-uso" element={<TermosDeUso />} />
            <Route path="/p/:id" element={<PublicProduto />} />
            <Route path="/loja/:id" element={<PerfilLoja />} />
            <Route path="/pasta/:token" element={<PastaPublica />} />
            <Route path="/carrinho/:token" element={<CarrinhoCompartilhado />} />

            <Route
              path="/fornecedor/onboarding"
              element={
                <ProtectedRoute requireType="fornecedor">
                  <Onboarding />
                </ProtectedRoute>
              }
            />

            <Route
              path="/cliente"
              element={
                <ProtectedRoute requireType="cliente">
                  <ClienteLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Suspense fallback={<PageSkeleton />}><ClienteHome /></Suspense>} />
              <Route path="produtos" element={<Suspense fallback={<PageSkeleton />}><Produtos /></Suspense>} />
              <Route path="produto/:id" element={<Suspense fallback={<PageSkeleton />}><ProdutoDetalhes /></Suspense>} />
              <Route path="checkout" element={<Suspense fallback={<PageSkeleton />}><Checkout /></Suspense>} />
              <Route path="checkout/sucesso" element={<Suspense fallback={<PageSkeleton />}><CheckoutSucesso /></Suspense>} />
              <Route path="pedido-confirmado" element={<Suspense fallback={<PageSkeleton />}><PedidoConfirmado /></Suspense>} />
              <Route path="chat" element={<Suspense fallback={<PageSkeleton />}><Chat /></Suspense>} />
              <Route path="perfil" element={<Suspense fallback={<PageSkeleton />}><Perfil /></Suspense>} />
              <Route path="editar-perfil" element={<Suspense fallback={<PageSkeleton />}><EditarPerfil /></Suspense>} />
              <Route path="meus-pedidos" element={<Suspense fallback={<PageSkeleton />}><MeusPedidos /></Suspense>} />
              <Route path="enderecos" element={<Suspense fallback={<PageSkeleton />}><Enderecos /></Suspense>} />
              <Route path="seguranca" element={<Suspense fallback={<PageSkeleton />}><Seguranca /></Suspense>} />
              <Route path="notificacoes" element={<Suspense fallback={<PageSkeleton />}><Notificacoes /></Suspense>} />
              <Route path="avaliacoes" element={<Suspense fallback={<PageSkeleton />}><Avaliacoes /></Suspense>} />
              <Route path="avaliar-pedido/:orderId" element={<Suspense fallback={<PageSkeleton />}><AvaliarPedido /></Suspense>} />
              <Route path="favoritos" element={<Suspense fallback={<PageSkeleton />}><Favoritos /></Suspense>} />
              <Route path="metodos-pagamento" element={<Suspense fallback={<PageSkeleton />}><MetodosPagamento /></Suspense>} />
              <Route path="suporte" element={<Suspense fallback={<PageSkeleton />}><Suporte /></Suspense>} />
              <Route path="instalar" element={<Suspense fallback={<PageSkeleton />}><InstalarApp /></Suspense>} />
              <Route path="configuracoes-notificacoes" element={<Suspense fallback={<PageSkeleton />}><ConfiguracoesNotificacoes /></Suspense>} />
              <Route path="carrinho" element={<Suspense fallback={<PageSkeleton />}><Carrinho /></Suspense>} />
              <Route path="loja/:id" element={<Suspense fallback={<PageSkeleton />}><PerfilLoja /></Suspense>} />
              <Route path="solicitar-fornecedor" element={<Suspense fallback={<PageSkeleton />}><SolicitarFornecedor /></Suspense>} />
              <Route path="negociacoes" element={<Suspense fallback={<PageSkeleton />}><MinhasNegociacoes /></Suspense>} />
              <Route path="ajuda" element={<Suspense fallback={<PageSkeleton />}><Ajuda /></Suspense>} />
              <Route path="minhas-solicitacoes" element={<Suspense fallback={<PageSkeleton />}><MinhasSolicitacoes /></Suspense>} />
            </Route>

            <Route
              path="/fornecedor"
              element={
                <ProtectedRoute requireType="fornecedor">
                  <FornecedorLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Suspense fallback={<PageSkeleton />}><Dashboard /></Suspense>} />
              <Route path="dashboard" element={<Suspense fallback={<PageSkeleton />}><Dashboard /></Suspense>} />
              <Route path="pedidos" element={<Suspense fallback={<PageSkeleton />}><Pedidos /></Suspense>} />
              <Route path="negociacoes" element={<Suspense fallback={<PageSkeleton />}><NegociacoesFornecedor /></Suspense>} />
              <Route path="chat" element={<Suspense fallback={<PageSkeleton />}><ChatFornecedor /></Suspense>} />
              <Route path="produtos" element={<Suspense fallback={<PageSkeleton />}><ProdutosFornecedor /></Suspense>} />
              <Route path="financeiro" element={<Suspense fallback={<PageSkeleton />}><Financeiro /></Suspense>} />
              <Route path="notificacoes" element={<Suspense fallback={<PageSkeleton />}><NotificacoesFornecedor /></Suspense>} />
              <Route path="editar-loja" element={<Suspense fallback={<PageSkeleton />}><EditarLoja /></Suspense>} />
              <Route path="estatisticas" element={<Suspense fallback={<PageSkeleton />}><Estatisticas /></Suspense>} />
              <Route path="recebimentos" element={<Suspense fallback={<PageSkeleton />}><Recebimentos /></Suspense>} />
              <Route path="como-usar" element={<Suspense fallback={<PageSkeleton />}><ComoUsarFornecedor /></Suspense>} />
              <Route path="teste-notificacoes" element={<Suspense fallback={<PageSkeleton />}><TesteNotificacoes /></Suspense>} />
              <Route path="configuracoes" element={<Suspense fallback={<PageSkeleton />}><ConfiguracoesFornecedor /></Suspense>} />
              <Route path="solicitacoes" element={<Suspense fallback={<PageSkeleton />}><SolicitacoesFornecedor /></Suspense>} />
              <Route path="suporte" element={<Suspense fallback={<PageSkeleton />}><SuporteFornecedor /></Suspense>} />
              
              <Route path="assinatura" element={<Suspense fallback={<PageSkeleton />}><AssinaturaFornecedor /></Suspense>} />
              <Route path="planos" element={<Suspense fallback={<PageSkeleton />}><PlanosFornecedor /></Suspense>} />
            </Route>

            <Route
              path="/admin"
              element={
                <ProtectedRoute requireType="admin">
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Suspense fallback={<PageSkeleton />}><AdminDashboard /></Suspense>} />
              <Route path="dashboard" element={<Suspense fallback={<PageSkeleton />}><AdminDashboard /></Suspense>} />
              <Route path="usuarios" element={<Suspense fallback={<PageSkeleton />}><AdminUsuarios /></Suspense>} />
              <Route path="fornecedores" element={<Suspense fallback={<PageSkeleton />}><AdminFornecedores /></Suspense>} />
              <Route path="vendas" element={<Suspense fallback={<PageSkeleton />}><AdminVendas /></Suspense>} />
              <Route path="configuracoes" element={<Suspense fallback={<PageSkeleton />}><AdminConfiguracoes /></Suspense>} />
              <Route path="suporte" element={<Suspense fallback={<PageSkeleton />}><AdminSuporteAdmin /></Suspense>} />
              <Route path="categorias" element={<Suspense fallback={<PageSkeleton />}><AdminCategorias /></Suspense>} />
              <Route path="banners" element={<Suspense fallback={<PageSkeleton />}><AdminBanners /></Suspense>} />
              <Route path="solicitacoes-fornecedor" element={<Suspense fallback={<PageSkeleton />}><AdminSolicitacoesFornecedor /></Suspense>} />
              <Route path="assinaturas" element={<Suspense fallback={<PageSkeleton />}><AdminAssinaturas /></Suspense>} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;


