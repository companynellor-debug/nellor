import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, TrendingUp, MessageCircle, Star, Loader2, Eye, Bell, ShieldCheck } from "lucide-react";
import { formatCurrencyFromDecimal } from "@/utils/currency";
import { useNavigate } from "react-router-dom";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useSupplierProducts } from "@/hooks/useSupplierProducts";
import { useSupabaseOrders } from "@/hooks/useSupabaseOrders";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { showPushNotification, getNotificationPermission, requestNotificationPermission } from "@/utils/pushNotifications";
import { useToast } from "@/hooks/use-toast";
import { useIdentityVerification } from "@/hooks/useIdentityVerification";

const Dashboard = () => {
  const navigate = useNavigate();
  const { profile } = useSupabaseAuth();
  const { products } = useSupplierProducts();
  const { statusLabel, canSell } = useIdentityVerification();
  const [dateFilter, setDateFilter] = useState<'today' | '7days' | '14days' | '30days' | 'all'>('today');
  const { orders } = useSupabaseOrders();
  const [testingNotification, setTestingNotification] = useState(false);
  const { toast } = useToast();

  // Test notification function
  const handleTestNotification = async () => {
    setTestingNotification(true);
    try {
      const permission = getNotificationPermission();
      if (permission !== 'granted') {
        const granted = await requestNotificationPermission();
        if (!granted) {
          toast({
            title: '❌ Permissão negada',
            description: 'Ative as notificações nas configurações do navegador/app',
            variant: 'destructive',
          });
          setTestingNotification(false);
          return;
        }
      }

      const testOrderNumber = `TEST-${Date.now().toString().slice(-4)}`;
      const testTotal = (Math.random() * 300 + 50).toFixed(2);

      await showPushNotification('💰 Teste de Notificação!', {
        body: `Pedido #${testOrderNumber} - R$ ${testTotal}`,
        tag: `test-${Date.now()}`,
        data: { url: '/fornecedor/pedidos' },
      });

      toast({
        title: '✅ Notificação enviada!',
        description: 'Verifique se apareceu na barra de notificações do celular.',
      });
    } catch (error) {
      console.error('Error testing notification:', error);
      toast({
        title: '❌ Erro',
        description: 'Não foi possível enviar a notificação de teste.',
        variant: 'destructive',
      });
    } finally {
      setTestingNotification(false);
    }
  };

  // Fetch conversation count and negotiations
  const [totalConversations, setTotalConversations] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [totalNegotiations, setTotalNegotiations] = useState(0);

  useEffect(() => {
    const fetchMetrics = async () => {
      if (!profile?.id) return;

      // Count unique conversations (messages where supplier is to_user or from_user)
      const { data: msgs } = await supabase
        .from('messages')
        .select('from_user, to_user')
        .or(`from_user.eq.${profile.id},to_user.eq.${profile.id}`);
      
      if (msgs) {
        const uniqueUsers = new Set(msgs.map(m => m.from_user === profile.id ? m.to_user : m.from_user));
        setTotalConversations(uniqueUsers.size);
      }

      // Count reviews for supplier products
      const { count: reviewCount } = await supabase
        .from('reviews' as any)
        .select('*', { count: 'exact', head: true })
        .eq('supplier_id', profile.id);
      setTotalReviews(reviewCount || 0);

      // Count negotiations
      const { count: negCount } = await supabase
        .from('negotiations' as any)
        .select('*', { count: 'exact', head: true })
        .eq('supplier_id', profile.id);
      setTotalNegotiations(negCount || 0);
    };

    fetchMetrics();
  }, [profile?.id]);

  // Filter by date
  const getStartDate = () => {
    if (dateFilter === 'all') return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    if (dateFilter === 'today') return now;
    if (dateFilter === '7days') { const d = new Date(now); d.setDate(d.getDate() - 7); return d; }
    if (dateFilter === '14days') { const d = new Date(now); d.setDate(d.getDate() - 14); return d; }
    const d = new Date(now); d.setDate(d.getDate() - 30); return d;
  };

  const startDate = getStartDate();
  const filteredOrders = startDate ? orders.filter(o => new Date(o.created_at) >= startDate) : orders;
  const totalOrders = filteredOrders.length;
  const deliveredOrders = filteredOrders.filter(o => o.order_status === 'delivered').length;
  const newOrders = filteredOrders.filter(o => o.order_status === 'preparing').length;

  // Conversations over time (last 6 months) - use orders as proxy for activity
  const activityData = (() => {
    const monthsData: Record<string, number> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toLocaleDateString('pt-BR', { month: 'short' });
      monthsData[monthKey] = 0;
    }
    orders.forEach(order => {
      const orderDate = new Date(order.created_at);
      const monthKey = orderDate.toLocaleDateString('pt-BR', { month: 'short' });
      if (monthsData.hasOwnProperty(monthKey)) {
        monthsData[monthKey] += 1;
      }
    });
    return Object.entries(monthsData).map(([month, value]) => ({ month, negociacoes: value }));
  })();
  return <div className="w-full max-w-full space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Visão geral do seu desempenho</p>
        </div>
<div className="flex gap-2 flex-wrap">
          <Button 
            variant="outline" 
            onClick={handleTestNotification}
            disabled={testingNotification}
            size="sm" 
            className="text-xs sm:text-sm h-8 border-amber-500 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
          >
            {testingNotification ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Bell className="h-3 w-3 mr-1" />}
            Testar Push
          </Button>
          {(['today', '7days', '14days', '30days', 'all'] as const).map(filter => (
            <Button key={filter} variant={dateFilter === filter ? 'default' : 'outline'} onClick={() => setDateFilter(filter)} size="sm" className="text-xs sm:text-sm h-8">
              {filter === 'today' ? 'Hoje' : filter === '7days' ? '7 dias' : filter === '14days' ? '14 dias' : filter === '30days' ? '30 dias' : 'Total'}
            </Button>
          ))}
        </div>
      </div>

      {/* Status de Verificação */}
      <Card className={`relative overflow-hidden border-2 ${canSell ? 'border-green-500 bg-green-50/50 dark:bg-green-900/10' : 'border-amber-500 bg-amber-50/50 dark:bg-amber-900/10'}`}>
        <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <ShieldCheck className={`h-5 w-5 ${canSell ? 'text-green-600' : 'text-amber-600'}`} />
            Status da conta
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div>
            <p className={`text-lg font-semibold ${canSell ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400'}`}>{statusLabel}</p>
            {!canSell ? (
              <div className="mt-2">
                <p className="text-xs text-muted-foreground mb-3">Para vender e solicitar saque, é obrigatório verificar a identidade.</p>
                <Button size="sm" className="w-full" onClick={() => navigate('/fornecedor/financeiro')}>Verificar agora</Button>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">Você está liberado para vender e sacar.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-border">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-purple-600 opacity-0 group-hover:opacity-5 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Conversas Iniciadas
            </CardTitle>
            <MessageCircle className="w-5 h-5 text-purple-600" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{totalConversations}</div>
            <p className="text-xs text-muted-foreground mt-1">Compradores interessados</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-border">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 opacity-0 group-hover:opacity-5 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Negociações Registradas
            </CardTitle>
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{totalNegotiations}</div>
            <p className="text-xs text-muted-foreground mt-1">Acordos feitos no chat</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-border">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500 to-yellow-600 opacity-0 group-hover:opacity-5 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avaliações Recebidas
            </CardTitle>
            <Star className="w-5 h-5 text-yellow-600" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{totalReviews}</div>
            <p className="text-xs text-muted-foreground mt-1">Feedback dos compradores</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-border">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-orange-600 opacity-0 group-hover:opacity-5 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Produtos com Interesse
            </CardTitle>
            <Eye className="w-5 h-5 text-orange-600" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Produtos ativos no catálogo</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-border">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-green-600 opacity-0 group-hover:opacity-5 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pedidos Entregues
            </CardTitle>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{deliveredOrders}</div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-border">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-cyan-600 opacity-0 group-hover:opacity-5 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Novos Pedidos
            </CardTitle>
            <Package className="w-5 h-5 text-cyan-600" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{newOrders}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:gap-6">
        <Card className="border-border hover:shadow-lg transition-shadow">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-sm sm:text-base md:text-lg">📈 Atividade de Negociações</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            {activityData.some(d => d.negociacoes > 0) ? <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={activityData}>
                  <defs>
                    <linearGradient id="colorNeg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip />
                  <Area type="monotone" dataKey="negociacoes" stroke="#8B5CF6" fillOpacity={1} fill="url(#colorNeg)" />
                </AreaChart>
              </ResponsiveContainer> : <div className="h-[250px] flex items-center justify-center">
                <p className="text-muted-foreground text-xs sm:text-sm">Nenhuma negociação registrada ainda</p>
              </div>}
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card className="border-border hover:shadow-lg transition-shadow">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm sm:text-base md:text-lg">📦 Pedidos Recentes</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate('/fornecedor/pedidos')} className="text-xs sm:text-sm">
                Ver Todos
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {orders.length === 0 ? <div className="p-6 sm:p-8 text-center">
                <Package className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-sm">Nenhum pedido recente</p>
              </div> : orders.slice(0, 5).map(order => <div key={order.id} className="p-4 sm:p-6 hover:bg-muted/20 transition-colors">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <Package className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium mb-1 text-sm sm:text-base truncate">Pedido #{order.order_number}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                        {new Date(order.created_at).toLocaleDateString('pt-BR')}
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-[10px] sm:text-xs font-medium whitespace-nowrap ${order.order_status === 'delivered' ? 'bg-green-100 text-green-800' : order.order_status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {order.order_status === 'delivered' ? 'Entregue' : order.order_status === 'cancelled' ? 'Cancelado' : 'Pendente'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-semibold text-sm sm:text-base whitespace-nowrap">{formatCurrencyFromDecimal(Number(order.total || 0))}</p>
                    </div>
                  </div>
                </div>)}
          </div>
        </CardContent>
      </Card>

    </div>;
};
export default Dashboard;