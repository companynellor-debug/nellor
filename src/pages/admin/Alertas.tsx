import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, AlertTriangle, Star, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const Alertas = () => {
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      
      // Buscar notificações do sistema (para admins)
      const { data: notifications } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      const notificationsList = notifications || [];

      // Transformar notificações em alertas
      const formattedAlerts = notificationsList.map(notif => {
        let type = 'info';
        let icon = Star;
        let color = "from-blue-500 to-blue-600";
        let bg = "bg-blue-50";

        if (notif.type === 'order_update') {
          type = 'success';
          icon = CheckCircle;
          color = "from-green-500 to-green-600";
          bg = "bg-green-50";
        } else if (notif.type === 'payout') {
          type = 'warning';
          icon = AlertTriangle;
          color = "from-yellow-500 to-yellow-600";
          bg = "bg-yellow-50";
        }

        return {
          type,
          icon,
          title: notif.title,
          description: notif.body,
          time: formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: ptBR }),
          color,
          bg
        };
      });

      setAlerts(formattedAlerts);

    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const staticAlerts = [{
  type: "success",
  icon: CheckCircle,
  title: "Fornecedor TechWear ultrapassou 100 vendas",
  description: "Meta mensal atingida com 12 dias de antecedência",
  time: "5 min atrás",
  color: "from-green-500 to-green-600",
  bg: "bg-green-50"
}, {
  type: "warning",
  icon: AlertTriangle,
  title: "Pedido #2050 pendente há mais de 24h",
  description: "Fornecedor DriftWear não confirmou o pedido",
  time: "1 hora atrás",
  color: "from-yellow-500 to-yellow-600",
  bg: "bg-yellow-50"
}, {
  type: "info",
  icon: Star,
  title: "Cliente Ana R. fez o primeiro pedido",
  description: "Novo cliente cadastrado hoje pela manhã",
  time: "2 horas atrás",
  color: "from-blue-500 to-blue-600",
  bg: "bg-blue-50"
}, {
  type: "success",
  icon: CheckCircle,
  title: "UrbanCloth atingiu 4.9★ de avaliação",
  description: "Baseado em 120 avaliações de clientes",
  time: "3 horas atrás",
  color: "from-green-500 to-green-600",
  bg: "bg-green-50"
}, {
  type: "warning",
  icon: AlertTriangle,
  title: "Estoque baixo reportado por 3 fornecedores",
  description: "TechStyle, NeonWear e StreetVibe precisam repor",
  time: "4 horas atrás",
  color: "from-yellow-500 to-yellow-600",
  bg: "bg-yellow-50"
}, {
  type: "error",
  icon: AlertCircle,
  title: "2 pedidos aguardando confirmação",
  description: "Tempo médio de resposta acima da meta",
  time: "5 horas atrás",
  color: "from-red-500 to-red-600",
  bg: "bg-red-50"
}, {
  type: "info",
  icon: Star,
  title: "Pico de vendas detectado",
  description: "310 pedidos realizados hoje (sexta-feira)",
  time: "6 horas atrás",
  color: "from-blue-500 to-blue-600",
  bg: "bg-blue-50"
}, {
  type: "success",
  icon: CheckCircle,
  title: "Meta de comissão mensal atingida",
  description: "R$ 6.372 em comissões este mês",
  time: "1 dia atrás",
  color: "from-green-500 to-green-600",
  bg: "bg-green-50"
}];
  const allAlerts = alerts.length > 0 ? alerts : staticAlerts;

  return <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-900 to-violet-900 bg-clip-text mb-2 text-slate-50">
          🔔 Alertas & Notificações
        </h1>
        <p className="text-muted-foreground">Acompanhamento em tempo real da plataforma</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {allAlerts.map((alert, index) => {
        const Icon = alert.icon;
        return <Card key={index} className={`border-l-4 ${alert.bg} hover:shadow-lg transition-all cursor-pointer`} style={{
          borderLeftColor: `hsl(var(--${alert.type === 'error' ? 'destructive' : alert.type === 'warning' ? 'orange' : alert.type === 'info' ? 'blue' : 'green'}-500))`
        }}>
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${alert.color}`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base font-semibold mb-1 text-stone-950">
                      {alert.title}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">{alert.description}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground">{alert.time}</p>
              </CardContent>
            </Card>;
      })}
      </div>
    </div>;
};
export default Alertas;