import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Bell, Handshake } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useSupplierProducts } from "@/hooks/useSupplierProducts";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { showPushNotification, getNotificationPermission, requestNotificationPermission } from "@/utils/pushNotifications";
import { useToast } from "@/hooks/use-toast";

const StatCard = ({ title, value, subtitle, emoji, borderColor }: {
  title: string; value: number | string; subtitle: string;
  emoji: string; borderColor: string;
}) => (
  <Card className={`rounded-2xl shadow-sm overflow-hidden border-2 ${borderColor}`}>
    <CardContent className="p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{emoji}</span>
        <span className="text-3xl font-bold">{value}</span>
      </div>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
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
    };

    fetchMetrics();
  }, [profile?.id]);

  const pendingNegotiations = negotiations.filter(n => n.status === 'pending').length;
  const acceptedNegotiations = negotiations.filter(n => n.status === 'accepted').length;
  const shippedNegotiations = negotiations.filter(n => n.status === 'shipped').length;
  const deliveredNegotiations = negotiations.filter(n => n.status === 'delivered').length;

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

  const stats = [
    { title: "Conversas", value: totalConversations, subtitle: "Compradores interessados", emoji: "💬", borderColor: "border-purple-500" },
    { title: "Negociações", value: negotiations.length, subtitle: `${pendingNegotiations} pendentes`, emoji: "🤝", borderColor: "border-blue-500" },
    { title: "Em Envio", value: acceptedNegotiations + shippedNegotiations, subtitle: "Aceitas ou enviadas", emoji: "🚚", borderColor: "border-orange-500" },
    { title: "Entregues", value: deliveredNegotiations, subtitle: "Concluídas", emoji: "✅", borderColor: "border-green-500" },
    { title: "Avaliações", value: totalReviews, subtitle: "Feedback recebido", emoji: "⭐", borderColor: "border-yellow-500" },
    { title: "Produtos", value: products.length, subtitle: "Ativos no catálogo", emoji: "📦", borderColor: "border-cyan-500" },
  ];

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

      {/* Stats Cards - 2x2 on mobile */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {stats.map((card) => (
          <StatCard key={card.title} {...card} />
        ))}
      </div>

      {/* Chart */}
      <Card className="rounded-2xl border-0 shadow-md overflow-hidden">
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

      {/* Recent Negotiations */}
      <Card className="rounded-2xl border-0 shadow-md overflow-hidden">
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
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Handshake className="h-5 w-5 text-primary" />
                  </div>
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
