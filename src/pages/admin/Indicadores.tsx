import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, DollarSign, Users, Building2, CreditCard, XCircle } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState, useMemo, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const Indicadores = () => {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase.from('supplier_subscriptions' as any).select('*');
      setSubscriptions((data || []) as any[]);
      setLoading(false);
    };
    fetch();
  }, []);

  const { metrics, monthlyMRR } = useMemo(() => {
    const active = subscriptions.filter((s: any) => s.status === 'active');
    const pending = subscriptions.filter((s: any) => s.status === 'pending');
    const churned = subscriptions.filter((s: any) => s.status === 'expired' || s.status === 'cancelled');

    const currentMRR = active.reduce((acc: number, s: any) => acc + (Number(s.price) || 29), 0);
    const arr = currentMRR * 12;
    const conversionRate = subscriptions.length > 0 ? (active.length / subscriptions.length) * 100 : 0;
    const valuationEstimado = currentMRR * 18;

    // Monthly MRR evolution (last 6 months)
    const now = new Date();
    const monthly: { month: string; mrr: number; assinaturas: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const mEnd = endOfMonth(monthDate);
      // Count subscriptions that were active at end of that month
      const activeAtMonth = subscriptions.filter((s: any) => {
        if (!s.started_at) return false;
        const started = new Date(s.started_at);
        if (started > mEnd) return false;
        if (s.expires_at) {
          const expires = new Date(s.expires_at);
          if (expires < startOfMonth(monthDate)) return false;
        }
        return true;
      });
      const mrrMonth = activeAtMonth.reduce((acc: number, s: any) => acc + (Number(s.price) || 29), 0);
      monthly.push({
        month: format(monthDate, "MMM", { locale: ptBR }),
        mrr: Math.round(mrrMonth),
        assinaturas: activeAtMonth.length,
      });
    }

    return {
      metrics: {
        currentMRR,
        arr,
        activeCount: active.length,
        pendingCount: pending.length,
        churnedCount: churned.length,
        totalCount: subscriptions.length,
        conversionRate,
        valuationEstimado,
      },
      monthlyMRR: monthly,
    };
  }, [subscriptions]);

  const formatCurrency = (value: number) =>
    `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const ownerData = [{ name: "Natan (100%)", value: metrics.currentMRR, color: "#8B5CF6" }];

  if (loading && subscriptions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando indicadores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full space-y-6 overflow-x-hidden">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-4xl font-bold text-foreground">📊 Indicadores da Nellor</h1>
        <p className="text-sm text-muted-foreground">Métricas de assinaturas e receita recorrente</p>
        <Badge variant="outline" className="text-amber-600 border-amber-600">
          ⚠️ Indicador interno - não contábil
        </Badge>
      </div>

      {/* Cards principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-border hover:shadow-lg transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-1 px-3 pt-3 sm:px-6 sm:pt-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">💰 MRR Atual</CardTitle>
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
          </CardHeader>
          <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">{formatCurrency(metrics.currentMRR)}</div>
            <p className="text-xs text-muted-foreground mt-0.5">ARR: {formatCurrency(metrics.arr)}</p>
          </CardContent>
        </Card>

        <Card className="border-border hover:shadow-lg transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-1 px-3 pt-3 sm:px-6 sm:pt-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">✅ Assinaturas Ativas</CardTitle>
            <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
          </CardHeader>
          <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">{metrics.activeCount}</div>
            <p className="text-xs text-muted-foreground mt-0.5">de {metrics.totalCount} total</p>
          </CardContent>
        </Card>

        <Card className="border-border hover:shadow-lg transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-1 px-3 pt-3 sm:px-6 sm:pt-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">⏳ Pendentes</CardTitle>
            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
          </CardHeader>
          <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">{metrics.pendingCount}</div>
            <p className="text-xs text-muted-foreground mt-0.5">aguardando pagamento</p>
          </CardContent>
        </Card>

        <Card className="border-border hover:shadow-lg transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-1 px-3 pt-3 sm:px-6 sm:pt-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">❌ Churn / Expiradas</CardTitle>
            <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
          </CardHeader>
          <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">{metrics.churnedCount}</div>
            <p className="text-xs text-muted-foreground mt-0.5">expiradas ou canceladas</p>
          </CardContent>
        </Card>
      </div>

      {/* Receita e Valuation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="border-border">
          <CardHeader className="px-3 pt-3 pb-1 sm:px-6 sm:pt-6 sm:pb-2">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-lg"><Users className="w-4 h-4 sm:w-5 sm:h-5" />Receita do Proprietário</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <div className="mb-4 p-3 sm:p-4 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <p className="text-sm text-muted-foreground">Natan (100% do MRR)</p>
              <p className="text-xl sm:text-2xl font-bold text-purple-700 dark:text-purple-300">{formatCurrency(metrics.currentMRR)}</p>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={ownerData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value"
                  label={({ name, value }) => `${name}: ${formatCurrency(value)}`}>
                  {ownerData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="px-3 pt-3 pb-1 sm:px-6 sm:pt-6 sm:pb-2">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-lg"><Building2 className="w-4 h-4 sm:w-5 sm:h-5" />Valuation Estimado</CardTitle>
            <p className="text-xs text-muted-foreground">Fórmula: MRR × 18</p>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <div className="text-center mb-4">
              <p className="text-sm text-muted-foreground">Valuation Total</p>
              <p className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                {formatCurrency(metrics.valuationEstimado)}
              </p>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-700 dark:text-amber-400">
                ⚠️ Indicador interno estimado. Não reflete valuation contábil ou de mercado.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico MRR */}
      <Card className="min-w-0 overflow-hidden border-border">
        <CardHeader className="px-3 pt-3 pb-1 sm:px-6 sm:pt-6 sm:pb-2">
          <CardTitle className="text-sm sm:text-lg">📈 Evolução Mensal do MRR</CardTitle>
        </CardHeader>
        <CardContent className="overflow-hidden px-1 sm:px-6">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={monthlyMRR} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="colorMRR" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" className="fill-muted-foreground" fontSize={10} />
              <YAxis className="fill-muted-foreground" width={40} tick={{ fontSize: 9 }} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))', fontSize: 12 }} />
              <Area type="monotone" dataKey="mrr" name="MRR" stroke="#10B981" fillOpacity={1} fill="url(#colorMRR)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Resumo Executivo */}
      <Card className="border-border bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950 dark:to-violet-950">
        <CardHeader className="px-3 pt-3 pb-1 sm:px-6 sm:pt-6 sm:pb-2">
          <CardTitle className="text-sm sm:text-lg">📋 Resumo Executivo</CardTitle>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Total Assinaturas</p>
              <p className="text-lg sm:text-xl font-bold">{metrics.totalCount}</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">MRR Atual</p>
              <p className="text-lg sm:text-xl font-bold">{formatCurrency(metrics.currentMRR)}</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">ARR</p>
              <p className="text-lg sm:text-xl font-bold">{formatCurrency(metrics.arr)}</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Taxa Conversão</p>
              <p className="text-lg sm:text-xl font-bold">{metrics.conversionRate.toFixed(1)}%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Indicadores;
