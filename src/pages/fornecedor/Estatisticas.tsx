import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Handshake, TrendingUp, DollarSign, Loader2 } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { supabase } from "@/integrations/supabase/client";

const Estatisticas = () => {
  const [loading, setLoading] = useState(true);
  const [totalNegotiated, setTotalNegotiated] = useState(0);
  const [totalNegotiations, setTotalNegotiations] = useState(0);
  const [averageTicket, setAverageTicket] = useState(0);
  const [monthlyData, setMonthlyData] = useState<{ month: string; negociacoes: number }[]>([]);

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

  useEffect(() => { fetchStats(); }, [fetchStats]);

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
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Handshake className="h-5 w-5 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground font-medium">Total de Negociações</span>
          </div>
          <p className="text-2xl md:text-3xl font-bold">{totalNegotiations}</p>
          <p className="text-xs text-muted-foreground mt-1">Todas as negociações</p>
        </Card>

        <Card className="p-5 rounded-2xl border-0 shadow-md">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground font-medium">Ticket Médio</span>
          </div>
          <p className="text-2xl md:text-3xl font-bold break-words">{fmt(averageTicket)}</p>
          <p className="text-xs text-muted-foreground mt-1">Valor médio por entrega</p>
        </Card>
      </div>

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
