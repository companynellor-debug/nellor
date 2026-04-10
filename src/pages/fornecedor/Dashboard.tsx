import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Bell, Handshake, MessageSquare, Truck, CheckCircle, Star, Package, DollarSign, Eye } from "lucide-react";
import { DarkGlassIcon } from "@/components/ui/dark-glass-icon";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useSupplierProducts } from "@/hooks/useSupplierProducts";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { showPushNotification, getNotificationPermission, requestNotificationPermission } from "@/utils/pushNotifications";
import { useToast } from "@/hooks/use-toast";

const StatCard = ({ title, value, subtitle, icon, borderColor, wide }: {
  title: string; value: number | string; subtitle: string;
  icon: React.ElementType; borderColor: string; wide?: boolean;
}) => (
  <Card className={`rounded-2xl shadow-sm overflow-hidden border-2 ${borderColor}`}>
    <CardContent className={wide ? "p-6" : "p-5"}>
      {wide ? (
        <div className="flex items-center gap-5">
          <DarkGlassIcon icon={icon} size="md" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-muted-foreground">{title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          </div>
          <span className="text-4xl font-bold text-foreground">{value}</span>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-3">
            <DarkGlassIcon icon={icon} size="md" />
            <span className="text-3xl font-bold">{value}</span>
          </div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        </>
      )}
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { profile } = useSupabaseAuth();
  const { products } = useSupplierProducts();
  const [testingNotification, setTestingNotification] = useState(false);
  const { toast } = useToast();

  const handleTestNotification = async () => {
    setTestingNotification(true);
    try {
      const permission = getNotificationPermission();
      if (permission !== 'granted') {
        const granted = await requestNotificationPermission();
        if (!granted) {
          toast({ title: '❌ Permissão negada', description: 'Ative as notificações nas configurações do navegador/app', variant: 'destructive' });
          setTestingNotification(false);
          return;
        }
      }
      await showPushNotification('💰 Teste de Notificação!', {
        body: `Notificação de teste enviada com sucesso!`,
        tag: `test-${Date.now()}`,
        data: { url: '/fornecedor/dashboard' },
      });
      toast({ title: '✅ Notificação enviada!', description: 'Verifique se apareceu na barra de notificações.' });
    } catch (error) {
      console.error('Error testing notification:', error);
      toast({ title: '❌ Erro', description: 'Não foi possível enviar a notificação de teste.', variant: 'destructive' });
    } finally {
      setTestingNotification(false);
    }
  };

  const [totalConversations, setTotalConversations] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [negotiations, setNegotiations] = useState<any[]>([]);
  const [totalViews, setTotalViews] = useState(0);
  const [viewsLast30, setViewsLast30] = useState(0);

  useEffect(() => {
    const fetchMetrics = async () => {
      if (!profile?.id) return;

      const { data: msgs } = await supabase
        .from('messages')
        .select('from_user, to_user')
        .or(`from_user.eq.${profile.id},to_user.eq.${profile.id}`);
      
      if (msgs) {
        const uniqueUsers = new Set(msgs.map(m => m.from_user === profile.id ? m.to_user : m.from_user));
        setTotalConversations(uniqueUsers.size);
      }

      const { count: reviewCount } = await supabase
        .from('reviews' as any)
        .select('*', { count: 'exact', head: true })
        .eq('supplier_id', profile.id);
      setTotalReviews(reviewCount || 0);

      const { data: negData } = await supabase
        .from('negotiations' as any)
        .select('*')
        .eq('supplier_id', profile.id)
        .order('created_at', { ascending: false });
      setNegotiations((negData || []) as any[]);

      // Fetch product views
      const { data: viewsData } = await supabase.rpc('get_supplier_product_views', { _supplier_id: profile.id });
      if (viewsData && Array.isArray(viewsData) && viewsData.length > 0) {
        setTotalViews(Number(viewsData[0].total_views) || 0);
        setViewsLast30(Number(viewsData[0].views_last_30_days) || 0);
      } else if (viewsData && !Array.isArray(viewsData)) {
        setTotalViews(Number((viewsData as any).total_views) || 0);
        setViewsLast30(Number((viewsData as any).views_last_30_days) || 0);
      }
    };

    fetchMetrics();
  }, [profile?.id]);

  const pendingNegotiations = negotiations.filter(n => n.status === 'pending').length;
  const acceptedNegotiations = negotiations.filter(n => n.status === 'accepted').length;
  const shippedNegotiations = negotiations.filter(n => n.status === 'shipped').length;
  const deliveredNegotiations = negotiations.filter(n => n.status === 'delivered').length;

  // Faturamento: soma de agreed_price * quantity das negociações entregues
  const faturamento = negotiations
    .filter(n => n.status === 'delivered')
    .reduce((sum, n) => sum + (Number(n.agreed_price) * Number(n.quantity)), 0);

  const activityData = (() => {
    const monthsData: Record<string, number> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toLocaleDateString('pt-BR', { month: 'short' });
      monthsData[monthKey] = 0;
    }
    negotiations.forEach(neg => {
      const negDate = new Date(neg.created_at);
      const monthKey = negDate.toLocaleDateString('pt-BR', { month: 'short' });
      if (monthsData.hasOwnProperty(monthKey)) {
        monthsData[monthKey] += 1;
      }
    });
    return Object.entries(monthsData).map(([month, value]) => ({ month, negociacoes: value }));
  })();

  // Split stats for desktop layout
  const faturamentoCard = { title: "Faturamento", value: `R$ ${faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, subtitle: "Total entregue", icon: DollarSign, borderColor: "border-emerald-500" };
  const mainStats = [
    { title: "Negociações", value: negotiations.length, subtitle: `${pendingNegotiations} pendentes`, icon: Handshake, borderColor: "border-blue-500" },
    { title: "Avaliações", value: totalReviews, subtitle: "Feedback recebido", icon: Star, borderColor: "border-yellow-500" },
    { title: "Produtos", value: products.length, subtitle: "Ativos no catálogo", icon: Package, borderColor: "border-cyan-500" },
  ];
  const secondaryStats = [
    { title: "Visitas", value: totalViews, subtitle: `${viewsLast30} nos últimos 30 dias`, icon: Eye, borderColor: "border-indigo-500" },
    { title: "Conversas", value: totalConversations, subtitle: "Compradores interessados", icon: MessageSquare, borderColor: "border-purple-500" },
    { title: "Em Envio", value: acceptedNegotiations + shippedNegotiations, subtitle: "Aceitas ou enviadas", icon: Truck, borderColor: "border-orange-500" },
    { title: "Entregues", value: deliveredNegotiations, subtitle: "Concluídas", icon: CheckCircle, borderColor: "border-green-500" },
  ];

  const allStats = [faturamentoCard, ...mainStats, ...secondaryStats];

  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Visão geral do seu desempenho</p>
        </div>
        <Button variant="outline" onClick={handleTestNotification} disabled={testingNotification} size="sm" className="text-xs h-8 rounded-full border-primary/30 text-primary hover:bg-primary/10 self-start">
          {testingNotification ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Bell className="h-3 w-3 mr-1" />}
          Testar Push
        </Button>
      </div>

      {/* Stats Cards - 1 per row on mobile */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {allStats.map((card) => (
          <StatCard key={card.title} {...card} />
        ))}
      </div>

      {/* Desktop: Faturamento hero + grid */}
      <div className="hidden md:flex md:flex-col gap-3">
        <StatCard {...faturamentoCard} wide />
        <div className="grid grid-cols-3 gap-3">
          {mainStats.map((card) => (
            <StatCard key={card.title} {...card} />
          ))}
        </div>
        <div className="grid grid-cols-4 gap-3">
          {secondaryStats.map((card) => (
            <StatCard key={card.title} {...card} />
          ))}
        </div>
      </div>

      {/* Recent Negotiations - shown FIRST on mobile */}
      <div className="md:hidden">
        <Card className="rounded-2xl border-0 shadow-md overflow-hidden">
          <CardHeader className="p-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold">🤝 Negociações Recentes</CardTitle>
              <Button variant="outline" size="sm" onClick={() => navigate('/fornecedor/negociacoes')} className="text-xs rounded-full">
                Ver Todas
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {negotiations.length === 0 ? (
                <div className="p-8 text-center">
                  <Handshake className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-30" />
                  <p className="text-muted-foreground text-sm">Nenhuma negociação registrada</p>
                </div>
              ) : negotiations.slice(0, 5).map(neg => (
                <div key={neg.id} className="p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <DarkGlassIcon icon={Handshake} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{neg.product_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(neg.created_at).toLocaleDateString('pt-BR')} • Qtd: {neg.quantity}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-sm whitespace-nowrap text-primary">R$ {Number(neg.agreed_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      <Badge variant={neg.status === 'delivered' ? 'default' : neg.status === 'cancelled' ? 'destructive' : 'secondary'} className="text-[10px] mt-1 rounded-full">
                        {neg.status === 'pending' ? 'Pendente' : neg.status === 'accepted' ? 'Aceita' : neg.status === 'shipped' ? 'Enviada' : neg.status === 'delivered' ? 'Entregue' : neg.status === 'cancelled' ? 'Cancelada' : neg.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart - desktop only */}
      <Card className="rounded-2xl border-0 shadow-md overflow-hidden hidden md:block">
        <CardHeader className="p-4 sm:p-5">
          <CardTitle className="text-sm sm:text-base font-bold">📈 Atividade de Negociações</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 pt-0">
          {activityData.some(d => d.negociacoes > 0) ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={activityData}>
                <defs>
                  <linearGradient id="colorNeg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="fill-muted-foreground" tick={{ fontSize: 11 }} />
                <YAxis className="fill-muted-foreground" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="negociacoes" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorNeg)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center">
              <p className="text-muted-foreground text-xs sm:text-sm">Nenhuma negociação registrada ainda</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Negotiations - desktop only (mobile version is above chart) */}
      <Card className="rounded-2xl border-0 shadow-md overflow-hidden hidden md:block">
        <CardHeader className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm sm:text-base font-bold">🤝 Negociações Recentes</CardTitle>
            <Button variant="outline" size="sm" onClick={() => navigate('/fornecedor/negociacoes')} className="text-xs rounded-full">
              Ver Todas
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {negotiations.length === 0 ? (
              <div className="p-8 text-center">
                <Handshake className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-30" />
                <p className="text-muted-foreground text-sm">Nenhuma negociação registrada</p>
              </div>
            ) : negotiations.slice(0, 5).map(neg => (
              <div key={neg.id} className="p-4 sm:p-5 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                   <DarkGlassIcon icon={Handshake} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{neg.product_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(neg.created_at).toLocaleDateString('pt-BR')} • Qtd: {neg.quantity}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-sm whitespace-nowrap text-primary">R$ {Number(neg.agreed_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    <Badge variant={neg.status === 'delivered' ? 'default' : neg.status === 'cancelled' ? 'destructive' : 'secondary'} className="text-[10px] mt-1 rounded-full">
                      {neg.status === 'pending' ? 'Pendente' : neg.status === 'accepted' ? 'Aceita' : neg.status === 'shipped' ? 'Enviada' : neg.status === 'delivered' ? 'Entregue' : neg.status === 'cancelled' ? 'Cancelada' : neg.status}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
export default Dashboard;
