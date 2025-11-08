import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingDown, Percent, TrendingUp, Loader2 } from "lucide-react";
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { format, subMonths } from "date-fns";

const Financeiro = () => {
  const [loading, setLoading] = useState(true);
  const [receitaTotal, setReceitaTotal] = useState(0);
  const [pagoFornecedores, setPagoFornecedores] = useState(0);
  const [comissoes, setComissoes] = useState(0);
  const [cashflowData, setCashflowData] = useState<any[]>([]);
  const [ticketMedio, setTicketMedio] = useState(0);
  const [comissaoPorVenda, setComissaoPorVenda] = useState(0);
  const [totalPedidos, setTotalPedidos] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Buscar transações
      const { data: orders } = await supabase
        .from('orders')
        .select('total, created_at, payment_status')
        .eq('payment_status', 'paid');

      const ordersList = orders || [];
      const receita = ordersList.reduce((sum, o) => sum + Number(o.total), 0);
      setReceitaTotal(receita);
      setTotalPedidos(ordersList.length);

      // Calcular comissão (5%)
      const comissao = receita * 0.05;
      setComissoes(comissao);

      // Pago aos fornecedores (95%)
      const pago = receita * 0.95;
      setPagoFornecedores(pago);

      // Ticket médio
      const ticket = ordersList.length > 0 ? receita / ordersList.length : 0;
      setTicketMedio(ticket);

      // Comissão por venda
      const comissaoVenda = ordersList.length > 0 ? comissao / ordersList.length : 0;
      setComissaoPorVenda(comissaoVenda);

      // Fluxo de caixa dos últimos 6 meses
      const cashflow = [];
      const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      
      for (let i = 5; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const monthOrders = ordersList.filter(o => {
          const orderDate = new Date(o.created_at);
          return orderDate.getMonth() === date.getMonth() && 
                 orderDate.getFullYear() === date.getFullYear();
        });
        
        const entrada = monthOrders.reduce((sum, o) => sum + Number(o.total), 0);
        const saida = entrada * 0.95;

        cashflow.push({
          month: meses[date.getMonth()],
          entrada: Math.round(entrada),
          saida: Math.round(saida)
        });
      }
      setCashflowData(cashflow);

    } catch (error) {
      console.error('Error fetching data:', error);
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

  const statsCards = [
    {
      title: "💰 Receita Total",
      value: `R$ ${receitaTotal.toFixed(2)}`,
      icon: DollarSign,
      color: "from-green-500 to-green-600"
    },
    {
      title: "💸 Pago aos Fornecedores",
      value: `R$ ${pagoFornecedores.toFixed(2)}`,
      icon: TrendingDown,
      color: "from-blue-500 to-blue-600"
    },
    {
      title: "📉 Comissões Nellor",
      value: `R$ ${comissoes.toFixed(2)}`,
      icon: Percent,
      color: "from-purple-500 to-purple-600"
    },
    {
      title: "🏦 Lucro Líquido",
      value: `R$ ${comissoes.toFixed(2)}`,
      icon: TrendingUp,
      color: "from-orange-500 to-orange-600"
    }
  ];

  const distributionData = [
    { name: "Fornecedores", value: pagoFornecedores, color: "#3B82F6" },
    { name: "Comissão Nellor", value: comissoes, color: "#8B5CF6" },
  ];

  return <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-900 to-violet-900 bg-clip-text mb-2 text-slate-50">
          💸 Financeiro
        </h1>
        <p className="text-muted-foreground">Movimentação geral da plataforma Nellor</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map(stat => <Card key={stat.title} className="border-purple-100 hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`w-5 h-5 bg-gradient-to-br ${stat.color} bg-clip-text text-transparent`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-purple-100">
          <CardHeader>
            <CardTitle>📊 Fluxo de Entrada/Saída</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={cashflowData}>
                <defs>
                  <linearGradient id="colorEntrada" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorSaida" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="entrada" stroke="#10B981" fillOpacity={1} fill="url(#colorEntrada)" />
                <Area type="monotone" dataKey="saida" stroke="#EF4444" fillOpacity={1} fill="url(#colorSaida)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-purple-100">
          <CardHeader>
            <CardTitle>🍰 Distribuição de Receita</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie data={distributionData} cx="50%" cy="50%" labelLine={false} label={({
                name,
                value
              }) => `${name}: R$ ${value.toFixed(2)}`} outerRadius={120} dataKey="value">
                  {distributionData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-purple-100 bg-gradient-to-br from-purple-50 to-violet-50">
          <CardHeader>
            <CardTitle className="text-stone-950">⚙️ Configurações Financeiras</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Taxa Atual da Nellor:</span>
              <span className="font-bold text-lg text-purple-900">5%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Ticket Médio:</span>
              <span className="font-bold text-lg">R$ {ticketMedio.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Comissão por Venda:</span>
              <span className="font-bold text-lg">R$ {comissaoPorVenda.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-100 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader>
            <CardTitle className="text-stone-950">📈 Lucro Estimado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Por Venda Média:</span>
              <span className="font-bold text-lg text-green-900">R$ {comissaoPorVenda.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total no Período:</span>
              <span className="font-bold text-lg text-green-900">R$ {comissoes.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total de Pedidos:</span>
              <span className="font-bold text-lg text-green-900">{totalPedidos}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
};
export default Financeiro;