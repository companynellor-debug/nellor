import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, TrendingUp, DollarSign, ShoppingCart, Loader2, Wallet, Percent, Bell, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrencyFromDecimal } from "@/utils/currency";
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
const [analytics, setAnalytics] = useState<any>(null);
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

  // Buscar analytics do mês atual (pedidos já vêm do hook com realtime)
  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!profile?.id) return;

      const currentMonth = new Date().toISOString().slice(0, 7) + '-01';
      const { data: analyticsData } = await supabase
        .from('analytics')
        .select('*')
        .eq('supplier_id', profile.id)
        .eq('mes_referencia', currentMonth)
        .single();

      setAnalytics(analyticsData);
    };

    fetchAnalytics();
  }, [profile?.id]);

  // Calcular data de início baseado no filtro
  const getStartDate = () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    if (dateFilter === 'today') {
      return now;
    } else if (dateFilter === '7days') {
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return sevenDaysAgo;
    } else if (dateFilter === '14days') {
      const fourteenDaysAgo = new Date(now);
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
      return fourteenDaysAgo;
    } else {
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return thirtyDaysAgo;
    }
  };

  // Filtrar pedidos por data
  const startDate = getStartDate();
  const filteredOrders = orders.filter(o => new Date(o.created_at) >= startDate);
  const newOrders = filteredOrders.filter(o => o.order_status === 'preparing').length;
  const deliveredOrders = filteredOrders.filter(o => o.order_status === 'delivered').length;
  const totalOrders = filteredOrders.length;
  const totalRevenue = filteredOrders
    .filter(o => o.payment_status === 'paid')
    .reduce((sum, o) => sum + Number(o.total || 0), 0);

  // Cálculo de comissões e valor líquido
  const paidFilteredOrders = filteredOrders.filter(o => o.payment_status === 'paid');
  const totalPlatformFee = paidFilteredOrders.reduce((sum, o) => {
    // Usar valor real se disponível, senão calcular 7.5%
    const fee = o.platform_fee ? Number(o.platform_fee) : Number(o.total || 0) * 0.075;
    return sum + fee;
  }, 0);
  const totalSupplierAmount = paidFilteredOrders.reduce((sum, o) => {
    // Usar valor real se disponível, senão calcular
    const amount = o.supplier_amount ? Number(o.supplier_amount) : Number(o.total || 0) * 0.925;
    return sum + amount;
  }, 0);
  const paidOrders = paidFilteredOrders;
  const ticketMedio = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;

  // Dados de vendas ao longo do tempo (últimos 6 meses)
  const salesData = (() => {
    const monthsData: {
      [key: string]: number;
    } = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toLocaleDateString('pt-BR', {
        month: 'short'
      });
      monthsData[monthKey] = 0;
    }
    orders.filter(o => o.payment_status === 'paid').forEach(order => {
      const orderDate = new Date(order.created_at);
      const monthKey = orderDate.toLocaleDateString('pt-BR', {
        month: 'short'
      });
      if (monthsData.hasOwnProperty(monthKey)) {
        monthsData[monthKey] += Number(order.total || 0);
      }
    });
    return Object.entries(monthsData).map(([month, value]) => ({
      month,
      vendas: value
    }));
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
          <Button variant={dateFilter === 'today' ? 'default' : 'outline'} onClick={() => setDateFilter('today')} size="sm" className="text-xs sm:text-sm h-8">
            Hoje
          </Button>
          <Button variant={dateFilter === '7days' ? 'default' : 'outline'} onClick={() => setDateFilter('7days')} size="sm" className="text-xs sm:text-sm h-8">
            7 dias
          </Button>
          <Button variant={dateFilter === '14days' ? 'default' : 'outline'} onClick={() => setDateFilter('14days')} size="sm" className="text-xs sm:text-sm h-8">
            14 dias
          </Button>
          <Button variant={dateFilter === '30days' ? 'default' : 'outline'} onClick={() => setDateFilter('30days')} size="sm" className="text-xs sm:text-sm h-8">
            30 dias
          </Button>
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
          <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-green-600 opacity-0 group-hover:opacity-5 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Receita Total
            </CardTitle>
            <DollarSign className="w-5 h-5 text-green-600" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{formatCurrencyFromDecimal(totalRevenue)}</div>
          </CardContent>
        </Card>

        {/* Valor Líquido Card */}
        <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-border">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-emerald-600 opacity-0 group-hover:opacity-5 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Valor Líquido
            </CardTitle>
            <Wallet className="w-5 h-5 text-emerald-600" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-emerald-600">{formatCurrencyFromDecimal(totalSupplierAmount)}</div>
            <p className="text-xs text-muted-foreground mt-1">Após taxa da plataforma</p>
          </CardContent>
        </Card>

        {/* Comissão Plataforma Card */}
        <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-border">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-purple-600 opacity-0 group-hover:opacity-5 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taxa Plataforma
            </CardTitle>
            <Percent className="w-5 h-5 text-purple-600" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-purple-600">{formatCurrencyFromDecimal(totalPlatformFee)}</div>
            <p className="text-xs text-muted-foreground mt-1">7,5% por venda</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-border">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-orange-600 opacity-0 group-hover:opacity-5 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Pedidos Ativos
            </CardTitle>
            <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-br from-orange-500 to-orange-600 bg-clip-text text-transparent" />
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl md:text-3xl font-bold">{totalOrders - deliveredOrders}</div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-border">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 opacity-0 group-hover:opacity-5 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Novos Pedidos
            </CardTitle>
            <Package className="w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-br from-blue-500 to-blue-600 bg-clip-text text-transparent" />
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl md:text-3xl font-bold">{newOrders}</div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-border">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-purple-600 opacity-0 group-hover:opacity-5 transition-opacity mx-0" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Pedidos Entregues
            </CardTitle>
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-br from-purple-500 to-purple-600 bg-clip-text text-transparent" />
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl md:text-3xl font-bold">{deliveredOrders}</div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-border">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-pink-600 opacity-0 group-hover:opacity-5 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Total de Pedidos
            </CardTitle>
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-br from-pink-500 to-pink-600 bg-clip-text text-transparent" />
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl md:text-3xl font-bold">{totalOrders}</div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-border">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-violet-600 opacity-0 group-hover:opacity-5 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Ticket Médio
            </CardTitle>
            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-br from-violet-500 to-violet-600 bg-clip-text text-transparent" />
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl md:text-3xl font-bold">{formatCurrencyFromDecimal(ticketMedio)}</div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-border">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-cyan-600 opacity-0 group-hover:opacity-5 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Total de Produtos
            </CardTitle>
            <Package className="w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-br from-cyan-500 to-cyan-600 bg-clip-text text-transparent" />
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl md:text-3xl font-bold">{products.length}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Produtos cadastrados</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:gap-6">
        {/* Evolução de Vendas */}
        <Card className="border-border hover:shadow-lg transition-shadow">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-sm sm:text-base md:text-lg">📈 Evolução de Vendas</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            {salesData.some(d => d.vendas > 0) ? <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={salesData}>
                  <defs>
                    <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" tickFormatter={value => `R$${value}`} />
                  <Tooltip />
                  <Area type="monotone" dataKey="vendas" stroke="#8B5CF6" fillOpacity={1} fill="url(#colorVendas)" />
                </AreaChart>
              </ResponsiveContainer> : <div className="h-[250px] flex items-center justify-center">
                <p className="text-muted-foreground text-xs sm:text-sm">Nenhuma venda registrada ainda</p>
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