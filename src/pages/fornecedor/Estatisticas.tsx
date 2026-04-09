import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Handshake, TrendingUp, DollarSign, Loader2, Eye, Radio, BarChart3 } from "lucide-react";
import { DarkGlassIcon } from "@/components/ui/dark-glass-icon";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useSupplierStories } from "@/hooks/useSupplierStories";

const Estatisticas = () => {
  const [loading, setLoading] = useState(true);
  const [totalNegotiated, setTotalNegotiated] = useState(0);
  const [totalNegotiations, setTotalNegotiations] = useState(0);
  const [averageTicket, setAverageTicket] = useState(0);
  const [monthlyData, setMonthlyData] = useState<{ month: string; negociacoes: number }[]>([]);
  const [storyStats, setStoryStats] = useState({ activeCount: 0, totalViews: 0, avgViews: 0 });
  const [storyViewCounts, setStoryViewCounts] = useState<Record<string, number>>({});

  const { getMyStories, getMyStoryStats, getStoryViewCount } = useSupplierStories();
  const myStories = getMyStories();

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: negotiations, error } = await supabase
        .from('negotiations' as any)
        .select('*')
        .eq('supplier_id', user.id);

      if (error) throw error;

      const negs = (negotiations || []) as any[];
      const delivered = negs.filter(n => n.status === 'delivered');
      const totalVal = delivered.reduce((sum, n) => sum + Number(n.agreed_price) * (n.quantity || 1), 0);
      const count = delivered.length;

      setTotalNegotiated(totalVal);
      setTotalNegotiations(negs.length);
      setAverageTicket(count > 0 ? totalVal / count : 0);

      const now = new Date();
      const months: Record<string, number> = {};
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months[d.toLocaleDateString('pt-BR', { month: 'short' })] = 0;
      }
      negs.forEach(n => {
        const key = new Date(n.created_at).toLocaleDateString('pt-BR', { month: 'short' });
        if (months.hasOwnProperty(key)) months[key]++;
      });
      setMonthlyData(Object.entries(months).map(([month, negociacoes]) => ({ month, negociacoes })));
    } catch (e) {
      console.error('Error fetching stats:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStoryStats = useCallback(async () => {
    const stats = await getMyStoryStats();
    setStoryStats(stats);

    // Fetch individual view counts
    const counts: Record<string, number> = {};
    for (const s of myStories) {
      counts[s.id] = await getStoryViewCount(s.id);
    }
    setStoryViewCounts(counts);
  }, [getMyStoryStats, getStoryViewCount, myStories.length]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchStoryStats(); }, [myStories.length]);

  const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-20 md:pb-6 w-full max-w-full overflow-x-hidden">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-1">Estatísticas</h1>
        <p className="text-sm text-muted-foreground">Análise do desempenho da sua loja</p>
      </div>

      {/* Hero stat */}
      <div className="rounded-3xl p-6 text-primary-foreground relative overflow-hidden" style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))' }}>
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-primary-foreground/10 -translate-y-8 translate-x-8" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="h-5 w-5 opacity-80" />
            <span className="text-sm opacity-80 font-medium">Total Negociado (Entregues)</span>
          </div>
          <p className="text-4xl font-bold tracking-tight">{fmt(totalNegotiated)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Card className="p-5 rounded-2xl border-0 shadow-md">
          <div className="flex items-center gap-3 mb-3">
            <DarkGlassIcon icon={Handshake} size="sm" />
            <span className="text-sm text-muted-foreground font-medium">Total de Negociações</span>
          </div>
          <p className="text-2xl md:text-3xl font-bold">{totalNegotiations}</p>
          <p className="text-xs text-muted-foreground mt-1">Todas as negociações</p>
        </Card>

        <Card className="p-5 rounded-2xl border-0 shadow-md">
          <div className="flex items-center gap-3 mb-3">
            <DarkGlassIcon icon={TrendingUp} size="sm" />
            <span className="text-sm text-muted-foreground font-medium">Ticket Médio</span>
          </div>
          <p className="text-2xl md:text-3xl font-bold break-words">{fmt(averageTicket)}</p>
          <p className="text-xs text-muted-foreground mt-1">Valor médio por entrega</p>
        </Card>
      </div>

      {/* Story Stats Section */}
      <Card className="p-4 md:p-6 rounded-2xl border-0 shadow-md">
        <h2 className="text-base md:text-lg font-bold mb-4 flex items-center gap-2">
          <Radio className="h-5 w-5 text-primary" />
          Meus Status
        </h2>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-primary/5 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-primary">{storyStats.activeCount}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Ativos</p>
          </div>
          <div className="bg-primary/5 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-primary">{storyStats.totalViews}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Views total</p>
          </div>
          <div className="bg-primary/5 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-primary">{storyStats.avgViews}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Média/story</p>
          </div>
        </div>

        {myStories.length > 0 ? (
          <div className="space-y-2">
            {myStories.map(story => (
              <div key={story.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                  {story.type === 'text' ? (
                    <div className="w-full h-full flex items-center justify-center text-white text-[8px] font-bold p-1 leading-tight" style={{ backgroundColor: story.bg_color || '#7c3aed' }}>
                      {(story.caption || '').slice(0, 30)}
                    </div>
                  ) : story.media_url ? (
                    story.type === 'video' ? (
                      <video src={story.media_url} className="w-full h-full object-cover" muted />
                    ) : (
                      <img src={story.media_url} alt="" className="w-full h-full object-cover" />
                    )
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <BarChart3 className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{story.caption || (story.type === 'text' ? 'Status de texto' : 'Mídia')}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(story.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Eye className="h-4 w-4" />
                  <span className="text-sm font-medium">{storyViewCounts[story.id] || 0}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhum status ativo. Publique pelo chat!</p>
        )}
      </Card>

      <Card className="p-4 md:p-6 rounded-2xl border-0 shadow-md">
        <h2 className="text-base md:text-lg font-bold mb-4">Negociações por Mês</h2>
        {monthlyData.some(d => d.negociacoes > 0) ? (
          <div className="w-full overflow-hidden">
            <ChartContainer
              config={{ negociacoes: { label: "Negociações", color: "hsl(var(--primary))" } }}
              className="h-[250px] md:h-[300px] w-full"
            >
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="negociacoes" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </div>
        ) : (
          <div className="h-[250px] md:h-[300px] flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Nenhuma negociação registrada ainda</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Estatisticas;
