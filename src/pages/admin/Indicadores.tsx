import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, DollarSign, Users, Building2, Percent, Calculator } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
import { format, subMonths, subDays, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState, useMemo } from "react";
import { useAdminOrders } from "@/hooks/useAdminPrefetch";

const Indicadores = () => {
  const { orders, loading } = useAdminOrders();
  const [dateFilter, setDateFilter] = useState<'today' | '7days' | '14days' | '30days'>('30days');

  const { data, monthlyData } = useMemo(() => {
    const getStartDate = () => {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      if (dateFilter === 'today') return now;
      else if (dateFilter === '7days') return subDays(now, 7);
      else if (dateFilter === '14days') return subDays(now, 14);
      else return subDays(now, 30);
    };

    const startDate = getStartDate();

    const paidOrders = orders.filter(
      (o) => o.payment_status === "paid" && o.order_status !== "cancelled"
    );

    // Filtered by period
    const filteredOrders = paidOrders.filter(o => new Date(o.created_at) >= startDate);

    // GMV
    const gmvTotal = paidOrders.reduce((sum, o) => sum + Number(o.total), 0);
    const gmvPeriod = filteredOrders.reduce((sum, o) => sum + Number(o.total), 0);

    // Receita Nellor (7.5%)
    const receitaNellorTotal = gmvTotal * 0.075;
    const receitaNellorPeriod = gmvPeriod * 0.075;

    // Ticket médio
    const ticketMedio = filteredOrders.length > 0 ? gmvPeriod / filteredOrders.length : 0;

    // Valuation estimado: Receita mensal × 18
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const monthOrders = paidOrders.filter(o => {
      const d = new Date(o.created_at);
      return d >= monthStart && d <= monthEnd;
    });
    const receitaMes = monthOrders.reduce((sum, o) => sum + Number(o.total), 0) * 0.075;
    const valuationEstimado = receitaMes * 18;

    // Dados mensais dos últimos 6 meses
    const monthlyDataArr = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const mStart = startOfMonth(monthDate);
      const mEnd = endOfMonth(monthDate);
      const mOrders = paidOrders.filter(o => {
        const d = new Date(o.created_at);
        return d >= mStart && d <= mEnd;
      });
      const mGMV = mOrders.reduce((sum, o) => sum + Number(o.total), 0);
      monthlyDataArr.push({
        month: format(monthDate, "MMM", { locale: ptBR }),
        gmv: Math.round(mGMV),
        receita: Math.round(mGMV * 0.075),
        pedidos: mOrders.length
      });
    }

    return {
      data: {
        gmvTotal,
        gmvPeriod,
        receitaNellorTotal,
        receitaNellorPeriod,
        totalPedidos: paidOrders.length,
        pedidosPeriod: filteredOrders.length,
        ticketMedio,
        valuationEstimado,
        receitaMes,
      },
      monthlyData: monthlyDataArr,
    };
  }, [orders, dateFilter]);

  const formatCurrency = (value: number) => {
    return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const parteNatan = data.receitaNellorTotal;
  const parteNatanPeriod = data.receitaNellorPeriod;
  const societyData = [{ name: "Natan (100%)", value: parteNatan, color: "#8B5CF6" }];

  const filterLabel = dateFilter === 'today' ? 'Hoje' : dateFilter === '7days' ? '7 dias' : dateFilter === '14days' ? '14 dias' : '30 dias';

  if (loading && orders.length === 0) {
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
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-900 to-violet-900 bg-clip-text mb-2 text-slate-50">
            📊 Indicadores da Nellor
          </h1>
          <p className="text-muted-foreground">Métricas internas da empresa e divisão societária</p>
          <Badge variant="outline" className="mt-2 text-amber-600 border-amber-600">
            ⚠️ Indicador interno - não contábil
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {loading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          <div className="flex gap-2">
            {(['today', '7days', '14days', '30days'] as const).map(filter => (
              <Button key={filter} variant={dateFilter === filter ? 'default' : 'outline'} onClick={() => setDateFilter(filter)} size="sm">
                {filter === 'today' ? 'Hoje' : filter === '7days' ? '7 dias' : filter === '14days' ? '14 dias' : '30 dias'}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* GMV e Receita - filtered by period */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-purple-100 hover:shadow-lg transition-all bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950 dark:to-violet-950">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">GMV ({filterLabel})</CardTitle>
            <TrendingUp className="w-5 h-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">{formatCurrency(data.gmvPeriod)}</div>
            <p className="text-xs text-muted-foreground mt-1">{data.pedidosPeriod} pedidos no período</p>
          </CardContent>
        </Card>

        <Card className="border-green-100 hover:shadow-lg transition-all bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Receita Nellor ({filterLabel})</CardTitle>
            <DollarSign className="w-5 h-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">{formatCurrency(data.receitaNellorPeriod)}</div>
            <p className="text-xs text-muted-foreground mt-1">7,5% do GMV</p>
          </CardContent>
        </Card>

        <Card className="border-violet-100 hover:shadow-lg transition-all bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950 dark:to-purple-950">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ticket Médio ({filterLabel})</CardTitle>
            <Percent className="w-5 h-5 text-violet-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-violet-900 dark:text-violet-100">{formatCurrency(data.ticketMedio)}</div>
            <p className="text-xs text-muted-foreground mt-1">{data.pedidosPeriod} pedidos</p>
          </CardContent>
        </Card>

        <Card className="border-cyan-100 hover:shadow-lg transition-all bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950 dark:to-blue-950">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">GMV Total (Histórico)</CardTitle>
            <Calculator className="w-5 h-5 text-cyan-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-900 dark:text-cyan-100">{formatCurrency(data.gmvTotal)}</div>
            <p className="text-xs text-muted-foreground mt-1">{data.totalPedidos} pedidos totais</p>
          </CardContent>
        </Card>
      </div>

      {/* Divisão Societária */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-purple-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" />Receita do Proprietário</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="p-4 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <p className="text-sm text-muted-foreground">Natan (100%)</p>
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{formatCurrency(parteNatan)}</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={societyData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value"
                  label={({ name, value }) => `${name}: ${formatCurrency(value)}`}>
                  {societyData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-purple-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Building2 className="w-5 h-5" />Valuation Estimado</CardTitle>
            <p className="text-xs text-muted-foreground">Fórmula: Receita mensal × 18</p>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-6">
              <p className="text-sm text-muted-foreground">Valuation Total</p>
              <p className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                {formatCurrency(data.valuationEstimado)}
              </p>
            </div>
            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-700 dark:text-amber-400">
                ⚠️ Este é um indicador interno estimado, não reflete valuation contábil ou de mercado.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Receita do período */}
      <Card className="border-purple-100">
        <CardHeader>
          <CardTitle>💰 Receita do Período ({filterLabel})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-gradient-to-br from-green-100 to-emerald-50 dark:from-green-900/30 dark:to-emerald-800/20 border border-green-200 dark:border-green-800">
              <p className="text-sm text-muted-foreground">Receita Nellor</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">{formatCurrency(data.receitaNellorPeriod)}</p>
            </div>
            <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
              <p className="text-sm text-muted-foreground">Natan (100%)</p>
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{formatCurrency(parteNatanPeriod)}</p>
            </div>
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-muted-foreground">Comissão/Pedido</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{formatCurrency(data.ticketMedio * 0.075)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de Evolução */}
      <Card className="border-purple-100">
        <CardHeader>
          <CardTitle>📈 Evolução Mensal (GMV e Receita Nellor)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="colorGMV" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorReceitaInd" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Area type="monotone" dataKey="gmv" name="GMV" stroke="#8B5CF6" fillOpacity={1} fill="url(#colorGMV)" />
              <Area type="monotone" dataKey="receita" name="Receita Nellor" stroke="#06B6D4" fillOpacity={1} fill="url(#colorReceitaInd)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Resumo */}
      <Card className="border-purple-100 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950 dark:to-violet-950">
        <CardHeader>
          <CardTitle>📋 Resumo Executivo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total de Pedidos</p>
              <p className="text-xl font-bold">{data.totalPedidos}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pedidos ({filterLabel})</p>
              <p className="text-xl font-bold">{data.pedidosPeriod}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ticket Médio</p>
              <p className="text-xl font-bold">{formatCurrency(data.ticketMedio)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Comissão Média/Pedido</p>
              <p className="text-xl font-bold">{formatCurrency(data.ticketMedio * 0.075)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Indicadores;
