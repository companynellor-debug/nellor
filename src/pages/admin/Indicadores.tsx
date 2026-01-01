import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, DollarSign, Users, Building2, Percent, Calculator } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMemo } from "react";
import { useAdminOrders } from "@/hooks/useAdminPrefetch";

const Indicadores = () => {
  const { orders, loading } = useAdminOrders();

  const { data, monthlyData } = useMemo(() => {
    const paidOrders = orders.filter(
      (o) => o.payment_status === "paid" && o.order_status !== "cancelled"
    );

    // GMV Total
    const gmvTotal = paidOrders.reduce((sum, o) => sum + Number(o.total), 0);

    // Pedidos do mês atual
    const now = new Date();
    const startOfCurrentMonth = startOfMonth(now);
    const endOfCurrentMonth = endOfMonth(now);
    const pedidosMesAtual = paidOrders.filter(o => {
      const orderDate = new Date(o.created_at);
      return orderDate >= startOfCurrentMonth && orderDate <= endOfCurrentMonth;
    });
    const gmvMes = pedidosMesAtual.reduce((sum, o) => sum + Number(o.total), 0);

    // Receita Nellor (7.5%)
    const receitaNellorTotal = paidOrders.reduce((sum, o) => sum + Number(o.total) * 0.075, 0);
    const receitaNellorMes = pedidosMesAtual.reduce((sum, o) => sum + Number(o.total) * 0.075, 0);

    // Ticket médio
    const ticketMedio = paidOrders.length > 0 ? gmvTotal / paidOrders.length : 0;

    // Valuation estimado: Receita mensal × 18
    const valuationEstimado = receitaNellorMes * 18;

    // Dados mensais dos últimos 6 meses
    const monthlyDataArr = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      const monthOrders = paidOrders.filter(o => {
        const orderDate = new Date(o.created_at);
        return orderDate >= monthStart && orderDate <= monthEnd;
      });
      const monthGMV = monthOrders.reduce((sum, o) => sum + Number(o.total), 0);
      const monthReceita = monthGMV * 0.075;
      monthlyDataArr.push({
        month: format(monthDate, "MMM", { locale: ptBR }),
        gmv: Math.round(monthGMV),
        receita: Math.round(monthReceita),
        pedidos: monthOrders.length
      });
    }

    return {
      data: {
        gmvTotal,
        gmvMes,
        receitaNellorTotal,
        receitaNellorMes,
        totalPedidos: paidOrders.length,
        pedidosMes: pedidosMesAtual.length,
        ticketMedio,
        valuationEstimado
      },
      monthlyData: monthlyDataArr,
    };
  }, [orders]);

  const formatCurrency = (value: number) => {
    return `R$ ${value.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  // Divisão societária
  const parteNatan = data.receitaNellorTotal * 0.5;
  const parteGustavo = data.receitaNellorTotal * 0.5;
  const parteNatanMes = data.receitaNellorMes * 0.5;
  const parteGustavoMes = data.receitaNellorMes * 0.5;

  // Valuation por sócio
  const valuationNatan = data.valuationEstimado * 0.5;
  const valuationGustavo = data.valuationEstimado * 0.5;
  const societyData = [
    { name: "Natan (50%)", value: parteNatan, color: "#8B5CF6" },
    { name: "Gustavo (50%)", value: parteGustavo, color: "#06B6D4" }
  ];

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

  return <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-900 to-violet-900 bg-clip-text mb-2 text-slate-50">
            📊 Indicadores da Nellor
          </h1>
          <p className="text-muted-foreground">Métricas internas da empresa e divisão societária</p>
          <Badge variant="outline" className="mt-2 text-amber-600 border-amber-600">
            ⚠️ Indicador interno - não contábil
          </Badge>
        </div>
        {loading && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
      </div>

      {/* GMV e Receita */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-purple-100 hover:shadow-lg transition-all bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950 dark:to-violet-950">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              GMV Total da Plataforma
            </CardTitle>
            <TrendingUp className="w-5 h-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              {formatCurrency(data.gmvTotal)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.totalPedidos} pedidos totais
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-100 hover:shadow-lg transition-all bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              GMV do Mês
            </CardTitle>
            <DollarSign className="w-5 h-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">
              {formatCurrency(data.gmvMes)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.pedidosMes} pedidos este mês
            </p>
          </CardContent>
        </Card>

        <Card className="border-violet-100 hover:shadow-lg transition-all bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950 dark:to-purple-950">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Receita Nellor Total (7,5%)
            </CardTitle>
            <Percent className="w-5 h-5 text-violet-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-violet-900 dark:text-violet-100">
              {formatCurrency(data.receitaNellorTotal)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Comissão total acumulada
            </p>
          </CardContent>
        </Card>

        <Card className="border-cyan-100 hover:shadow-lg transition-all bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950 dark:to-blue-950">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Receita Nellor Mensal
            </CardTitle>
            <Calculator className="w-5 h-5 text-cyan-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-900 dark:text-cyan-100">
              {formatCurrency(data.receitaNellorMes)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Ticket médio: {formatCurrency(data.ticketMedio)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Divisão Societária */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-purple-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Divisão Societária - Receita Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <p className="text-sm text-muted-foreground">Parte Natan (50%)</p>
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                  {formatCurrency(parteNatan)}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-cyan-100 dark:bg-cyan-900/30">
                <p className="text-sm text-muted-foreground">Parte vinicius  (50%)</p>
                <p className="text-2xl font-bold text-cyan-700 dark:text-cyan-300">
                  {formatCurrency(parteGustavo)}
                </p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={societyData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" label={({
                name,
                value
              }) => `${name}: ${formatCurrency(value)}`}>
                  {societyData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-purple-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Valuation Estimado
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Fórmula: Receita mensal × 18
            </p>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-6">
              <p className="text-sm text-muted-foreground">Valuation Total</p>
              <p className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                {formatCurrency(data.valuationEstimado)}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900/30 dark:to-purple-800/20 border border-purple-200 dark:border-purple-800">
                <p className="text-sm text-muted-foreground">Parte Natan (50%)</p>
                <p className="text-xl font-bold text-purple-700 dark:text-purple-300">
                  {formatCurrency(valuationNatan)}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-gradient-to-br from-cyan-100 to-cyan-50 dark:from-cyan-900/30 dark:to-cyan-800/20 border border-cyan-200 dark:border-cyan-800">
                <p className="text-sm text-muted-foreground">Parte Gustavo (50%)</p>
                <p className="text-xl font-bold text-cyan-700 dark:text-cyan-300">
                  {formatCurrency(valuationGustavo)}
                </p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-700 dark:text-amber-400">
                ⚠️ Este é um indicador interno estimado, não reflete valuation contábil ou de mercado.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Receita Mensal dos Sócios */}
      <Card className="border-purple-100">
        <CardHeader>
          <CardTitle>💰 Divisão Societária - Receita do Mês Atual</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-gradient-to-br from-green-100 to-emerald-50 dark:from-green-900/30 dark:to-emerald-800/20 border border-green-200 dark:border-green-800">
              <p className="text-sm text-muted-foreground">Receita Nellor (Mês)</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                {formatCurrency(data.receitaNellorMes)}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
              <p className="text-sm text-muted-foreground">Natan (50%)</p>
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                {formatCurrency(parteNatanMes)}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800">
              <p className="text-sm text-muted-foreground">Gustavo (50%)</p>
              <p className="text-2xl font-bold text-cyan-700 dark:text-cyan-300">
                {formatCurrency(parteGustavoMes)}
              </p>
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
              <p className="text-sm text-muted-foreground">Pedidos do Mês</p>
              <p className="text-xl font-bold">{data.pedidosMes}</p>
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
    </div>;
};
export default Indicadores;
