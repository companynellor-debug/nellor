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

// Lazy load public pages (minimal - only welcome and auth)
const Welcome = lazy(() => import("./pages/Welcome"));
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));
const PublicProduto = lazy(() => import("./pages/PublicProduto"));
const Onboarding = lazy(() => import("./pages/fornecedor/Onboarding"));

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
const ProgramaAfiliados = lazy(() => import("./pages/cliente/ProgramaAfiliados"));
const AfiliadoCadastro = lazy(() => import("./pages/cliente/AfiliadoCadastro"));
const PrestadorServicos = lazy(() => import("./pages/cliente/PrestadorServicos"));

// Lazy load fornecedor pages
const Dashboard = lazy(() => import("./pages/fornecedor/Dashboard"));
const Pedidos = lazy(() => import("./pages/fornecedor/Pedidos"));
const ChatFornecedor = lazy(() => import("./pages/fornecedor/ChatFornecedor"));
const ProdutosFornecedor = lazy(() => import("./pages/fornecedor/Produtos"));
const Financeiro = lazy(() => import("./pages/fornecedor/Financeiro"));
const NotificacoesFornecedor = lazy(() => import("./pages/fornecedor/Notificacoes"));
const EditarLoja = lazy(() => import("./pages/fornecedor/EditarLoja"));
const Estatisticas = lazy(() => import("./pages/fornecedor/Estatisticas"));
const Recebimentos = lazy(() => import("./pages/fornecedor/Recebimentos"));
const PlanosFornecedor = lazy(() => import("./pages/fornecedor/Planos"));
const CuponsFornecedor = lazy(() => import("./pages/fornecedor/Cupons"));
const RelatorioCupons = lazy(() => import("./pages/fornecedor/RelatorioCupons"));
const TesteNotificacoes = lazy(() => import("./pages/fornecedor/TesteNotificacoes"));
const PermissoesFornecedor = lazy(() => import("./pages/fornecedor/Permissoes"));

// Lazy load admin pages
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminIndicadores = lazy(() => import("./pages/admin/Indicadores"));
const AdminUsuarios = lazy(() => import("./pages/admin/Usuarios"));
const AdminFornecedores = lazy(() => import("./pages/admin/Fornecedores"));
const AdminVendas = lazy(() => import("./pages/admin/Vendas"));
const AdminFinanceiro = lazy(() => import("./pages/admin/Financeiro"));
const AdminRelatorios = lazy(() => import("./pages/admin/Relatorios"));
const AdminAlertas = lazy(() => import("./pages/admin/Alertas"));
const AdminConfiguracoes = lazy(() => import("./pages/admin/Configuracoes"));

const AdminSuporteAdmin = lazy(() => import("./pages/admin/SuporteAdmin"));
const AdminCategorias = lazy(() => import("./pages/admin/Categorias"));
const AdminBanners = lazy(() => import("./pages/admin/Banners"));
const AdminNotificacoes = lazy(() => import("./pages/admin/NotificacoesAdmin"));
const AdminReconciliacao = lazy(() => import("./pages/admin/Reconciliacao"));
const AdminAffiliatePrestadores = lazy(() => import("./pages/admin/AffiliatePrestadores"));
const ConfiguracoesFornecedor = lazy(() => import("./pages/fornecedor/Configuracoes"));

// Optimized QueryClient with aggressive caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
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
            {/* Welcome Screen - única página pública */}
            <Route path="/" element={<Welcome />} />
            <Route path="/auth" element={<Auth />} />
            
            {/* Public Product Share Route (mantido para links de compartilhamento) */}
            <Route path="/p/:id" element={<PublicProduto />} />

            {/* Fornecedor Onboarding */}
            <Route
              path="/fornecedor/onboarding"
              element={
                <ProtectedRoute requireType="fornecedor">
                  <Onboarding />
                </ProtectedRoute>
              }
            />

            {/* Cliente Panel Routes */}
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
              <Route path="afiliados" element={<Suspense fallback={<PageSkeleton />}><ProgramaAfiliados /></Suspense>} />
              <Route path="afiliados/cadastro" element={<Suspense fallback={<PageSkeleton />}><AfiliadoCadastro /></Suspense>} />
              <Route path="prestador-servicos" element={<Suspense fallback={<PageSkeleton />}><PrestadorServicos /></Suspense>} />
            </Route>

            {/* Fornecedor Panel Routes */}
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
              <Route path="chat" element={<Suspense fallback={<PageSkeleton />}><ChatFornecedor /></Suspense>} />
              <Route path="produtos" element={<Suspense fallback={<PageSkeleton />}><ProdutosFornecedor /></Suspense>} />
              <Route path="financeiro" element={<Suspense fallback={<PageSkeleton />}><Financeiro /></Suspense>} />
              <Route path="notificacoes" element={<Suspense fallback={<PageSkeleton />}><NotificacoesFornecedor /></Suspense>} />
              <Route path="editar-loja" element={<Suspense fallback={<PageSkeleton />}><EditarLoja /></Suspense>} />
              <Route path="estatisticas" element={<Suspense fallback={<PageSkeleton />}><Estatisticas /></Suspense>} />
              <Route path="recebimentos" element={<Suspense fallback={<PageSkeleton />}><Recebimentos /></Suspense>} />
              <Route path="cupons" element={<Suspense fallback={<PageSkeleton />}><CuponsFornecedor /></Suspense>} />
              <Route path="cupons/relatorio" element={<Suspense fallback={<PageSkeleton />}><RelatorioCupons /></Suspense>} />
              <Route path="planos" element={<Suspense fallback={<PageSkeleton />}><PlanosFornecedor /></Suspense>} />
              <Route path="teste-notificacoes" element={<Suspense fallback={<PageSkeleton />}><TesteNotificacoes /></Suspense>} />
              <Route path="configuracoes" element={<Suspense fallback={<PageSkeleton />}><ConfiguracoesFornecedor /></Suspense>} />
              <Route path="permissoes" element={<Suspense fallback={<PageSkeleton />}><PermissoesFornecedor /></Suspense>} />
            </Route>

            {/* Admin Panel */}
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
              <Route path="indicadores" element={<Suspense fallback={<PageSkeleton />}><AdminIndicadores /></Suspense>} />
              <Route path="usuarios" element={<Suspense fallback={<PageSkeleton />}><AdminUsuarios /></Suspense>} />
              <Route path="fornecedores" element={<Suspense fallback={<PageSkeleton />}><AdminFornecedores /></Suspense>} />
              <Route path="vendas" element={<Suspense fallback={<PageSkeleton />}><AdminVendas /></Suspense>} />
              <Route path="financeiro" element={<Suspense fallback={<PageSkeleton />}><AdminFinanceiro /></Suspense>} />
              <Route path="relatorios" element={<Suspense fallback={<PageSkeleton />}><AdminRelatorios /></Suspense>} />
              <Route path="alertas" element={<Suspense fallback={<PageSkeleton />}><AdminAlertas /></Suspense>} />
              <Route path="configuracoes" element={<Suspense fallback={<PageSkeleton />}><AdminConfiguracoes /></Suspense>} />
              
              <Route path="suporte" element={<Suspense fallback={<PageSkeleton />}><AdminSuporteAdmin /></Suspense>} />
              <Route path="categorias" element={<Suspense fallback={<PageSkeleton />}><AdminCategorias /></Suspense>} />
              <Route path="banners" element={<Suspense fallback={<PageSkeleton />}><AdminBanners /></Suspense>} />
              <Route path="notificacoes" element={<Suspense fallback={<PageSkeleton />}><AdminNotificacoes /></Suspense>} />
              <Route path="reconciliacao" element={<Suspense fallback={<PageSkeleton />}><AdminReconciliacao /></Suspense>} />
              <Route path="afiliados-prestadores" element={<Suspense fallback={<PageSkeleton />}><AdminAffiliatePrestadores /></Suspense>} />
            </Route>

            {/* Catch-all - redirect to welcome */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
