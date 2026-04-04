import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, AlertTriangle, Star, Loader2, Flag, Megaphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

const Alertas = () => {
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);

    // Fetch each independently so one failure doesn't block the others
    try {
      const { data, error } = await supabase
        .from('sponsored_products')
        .select('*, products(nome)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (error) console.error('Error fetching sponsorships:', error);
      else setSponsorships(data || []);
    } catch (e) {
      console.error('Sponsorship fetch failed:', e);
    }

    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) console.error('Error fetching reports:', error);
      else setReports(data || []);
    } catch (e) {
      console.error('Reports fetch failed:', e);
    }

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) console.error('Error fetching notifications:', error);
      
      const notificationsList = data || [];
      const formattedAlerts = notificationsList.map(notif => {
        let type = 'info';
        let icon = Star;
        let color = "from-blue-500 to-blue-600";
        let bg = "bg-blue-50";

        if (notif.type === 'order_update') {
          type = 'success'; icon = CheckCircle;
          color = "from-green-500 to-green-600"; bg = "bg-green-50";
        } else if (notif.type === 'payout') {
          type = 'warning'; icon = AlertTriangle;
          color = "from-yellow-500 to-yellow-600"; bg = "bg-yellow-50";
        }

        return {
          type, icon,
          title: notif.title,
          description: notif.body,
          time: formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: ptBR }),
          color, bg
        };
      });
      setAlerts(formattedAlerts);
    } catch (e) {
      console.error('Notifications fetch failed:', e);
    }

    setLoading(false);
  };

  const handleSponsorshipAction = async (id: string, action: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase.from('sponsored_products').update({ status: action } as any).eq('id', id);
      if (error) throw error;
      toast.success(action === 'approved' ? 'Patrocínio aprovado!' : 'Patrocínio rejeitado');
      setSponsorships(prev => prev.filter(s => s.id !== id));
    } catch (e) {
      toast.error('Erro ao atualizar patrocínio');
    }
  };

  const handleReportAction = async (id: string, action: 'reviewed' | 'resolved') => {
    try {
      const { error } = await supabase.from('reports').update({ status: action }).eq('id', id);
      if (error) throw error;
      toast.success('Denúncia atualizada!');
      setReports(prev => prev.filter(r => r.id !== id));
    } catch (e) {
      toast.error('Erro ao atualizar denúncia');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-900 to-violet-900 bg-clip-text mb-2 text-slate-50">
          🔔 Alertas & Notificações
        </h1>
        <p className="text-muted-foreground">Acompanhamento em tempo real da plataforma</p>
      </div>

      {/* Solicitações de Patrocínio */}
      {sponsorships.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-slate-50 mb-4 flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-yellow-400" />
            Solicitações de Patrocínio Pendentes ({sponsorships.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sponsorships.map((sp) => (
              <Card key={sp.id} className="border-l-4 border-l-yellow-500 bg-yellow-50">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base text-stone-900">
                      {sp.products?.nome || 'Produto'}
                    </CardTitle>
                    <Badge variant="secondary">Pendente</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {sp.description && <p className="text-sm text-muted-foreground">{sp.description}</p>}
                  {sp.banner_url && <img src={sp.banner_url} alt="Banner" className="w-full h-24 object-cover rounded-md" />}
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(sp.created_at), { addSuffix: true, locale: ptBR })}
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={() => handleSponsorshipAction(sp.id, 'approved')}>
                      <CheckCircle className="h-3 w-3 mr-1" />Aprovar
                    </Button>
                    <Button size="sm" variant="destructive" className="flex-1" onClick={() => handleSponsorshipAction(sp.id, 'rejected')}>
                      Rejeitar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Denúncias Recentes */}
      {reports.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-slate-50 mb-4 flex items-center gap-2">
            <Flag className="h-5 w-5 text-red-400" />
            Denúncias Pendentes ({reports.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reports.map((rep) => (
              <Card key={rep.id} className="border-l-4 border-l-red-500 bg-red-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-stone-900 capitalize">
                    {rep.target_type === 'product' ? '📦 Produto' : '🏪 Fornecedor'}: {rep.reason}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {rep.description && <p className="text-sm text-muted-foreground">{rep.description}</p>}
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(rep.created_at), { addSuffix: true, locale: ptBR })}
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => handleReportAction(rep.id, 'reviewed')}>
                      Analisar
                    </Button>
                    <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={() => handleReportAction(rep.id, 'resolved')}>
                      Resolver
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Notificações Gerais */}
      {alerts.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-slate-50 mb-4">Notificações do Sistema</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {alerts.map((alert, index) => {
              const Icon = alert.icon;
              return (
                <Card key={index} className={`border-l-4 ${alert.bg} hover:shadow-lg transition-all cursor-pointer`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${alert.color}`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-base font-semibold mb-1 text-stone-950">{alert.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">{alert.description}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-xs text-muted-foreground">{alert.time}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {alerts.length === 0 && sponsorships.length === 0 && reports.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Nenhum alerta no momento</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
export default Alertas;
