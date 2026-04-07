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

      // Monthly chart (last 6 months)
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
    <div className="space-y-4 md:space-y-6 pb-20 md:pb-6 w-full max-w-full overflow-x-hidden">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">Estatísticas</h1>
        <p className="text-sm md:text-base text-muted-foreground">Análise do desempenho da sua loja</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="p-5 md:p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Total Negociado</p>
            <DollarSign className="h-5 w-5 text-primary" />
          </div>
          <p className="text-2xl md:text-3xl font-bold break-words">{fmt(totalNegotiated)}</p>
          <p className="text-xs text-muted-foreground mt-1">Negociações entregues</p>
        </Card>

        <Card className="p-5 md:p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Total de Negociações</p>
            <Handshake className="h-5 w-5 text-primary" />
          </div>
          <p className="text-2xl md:text-3xl font-bold">{totalNegotiations}</p>
          <p className="text-xs text-muted-foreground mt-1">Todas as negociações</p>
        </Card>

        <Card className="p-5 md:p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Ticket Médio</p>
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <p className="text-2xl md:text-3xl font-bold break-words">{fmt(averageTicket)}</p>
          <p className="text-xs text-muted-foreground mt-1">Valor médio por entrega</p>
        </Card>
      </div>

      <Card className="p-4 md:p-6">
        <h2 className="text-lg md:text-xl font-bold mb-4 md:mb-6">Negociações por Mês</h2>
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
            <p className="text-sm md:text-base text-muted-foreground">Nenhuma negociação registrada ainda</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Estatisticas;
