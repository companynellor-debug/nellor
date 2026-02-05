import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, TrendingDown, Percent, Users, HelpCircle, Calendar, Shield } from "lucide-react";
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, subMonths, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { fetchAdminOrders, fetchAdminProfiles } from "@/lib/adminRpc";

const Financeiro = () => {
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<'7days' | '30days' | '90days' | 'all'>('30days');
  const [receitaTotal, setReceitaTotal] = useState(0);
  const [pagoFornecedores, setPagoFornecedores] = useState(0);
  const [comissoes, setComissoes] = useState(0);
  const [cashflowData, setCashflowData] = useState<any[]>([]);
  const [ticketMedio, setTicketMedio] = useState(0);
  const [totalPedidos, setTotalPedidos] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [planosStats, setPlanosStats] = useState({
    free: 0,
    premium: 0,
    verified: 0
  });
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [periodSummary, setPeriodSummary] = useState({
    daily: 0,
    monthly: 0
  });

  useEffect(() => {
    fetchData();
  }, [dateFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const allOrders = await fetchAdminOrders();
      const allProfiles = await fetchAdminProfiles();

      // Filtrar por período
      const getStartDate = () => {
        const now = new Date();
        if (dateFilter === '7days') return subDays(now, 7);
        if (dateFilter === '30days') return subDays(now, 30);
        if (dateFilter === '90days') return subDays(now, 90);
        return null;
      };
      const startDate = getStartDate();

      // Pedidos pagos (não cancelados)
      const paidOrders = (allOrders || []).filter((o: any) => o.payment_status === 'paid' && o.order_status !== 'cancelled');

      // Filtrar por período se necessário
      const ordersList = startDate ? paidOrders.filter((o: any) => new Date(o.created_at) >= startDate) : paidOrders;
      setTransactions(ordersList);
      const receita = ordersList.reduce((sum: number, o: any) => sum + Number(o.total), 0);
      setReceitaTotal(receita);
      setTotalPedidos(ordersList.length);

      // Comissão Nellor: 7,5%
      const comissao = ordersList.reduce((sum: number, o: any) => sum + Number(o.total) * 0.075, 0);
      setComissoes(comissao);

      // Pago aos fornecedores
      const taxaProcessadorEstimada = ordersList.reduce((sum: number, o: any) => sum + Number(o.total) * 0.0349, 0);
      const pago = receita - comissao - taxaProcessadorEstimada;
      setPagoFornecedores(pago);

      // Ticket médio
      const ticket = ordersList.length > 0 ? receita / ordersList.length : 0;
      setTicketMedio(ticket);

      // Stats de planos dos fornecedores
      const fornecedores = (allProfiles || []).filter((p: any) => p.tipo === 'fornecedor');
      // Contar verificados - placeholder, seria baseado em um campo real
      const verified = fornecedores.length; // Placeholder
      setPlanosStats({
        free: fornecedores.length,
        premium: 0,
        verified
      });

      // Resumo por período
      const today = new Date();
      const todayOrders = paidOrders.filter((o: any) => {
        const d = new Date(o.created_at);
        return d.toDateString() === today.toDateString();
      });
      const thisMonthOrders = paidOrders.filter((o: any) => {
        const d = new Date(o.created_at);
        return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
      });
      setPeriodSummary({
        daily: todayOrders.reduce((sum: number, o: any) => sum + Number(o.total) * 0.075, 0),
        monthly: thisMonthOrders.reduce((sum: number, o: any) => sum + Number(o.total) * 0.075, 0)
      });

      // Fluxo de caixa dos últimos 6 meses
      const cashflow = [];
      const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      for (let i = 5; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const monthOrders = paidOrders.filter((o: any) => {
          const orderDate = new Date(o.created_at);
          return orderDate.getMonth() === date.getMonth() && orderDate.getFullYear() === date.getFullYear();
        });
        const entrada = monthOrders.reduce((sum: number, o: any) => sum + Number(o.total), 0);
        const saida = monthOrders.reduce((sum: number, o: any) => sum + (Number(o.total) - Number(o.total) * 0.075 - Number(o.total) * 0.0349), 0);
        cashflow.push({
          month: meses[date.getMonth()],
          entrada: Math.round(entrada),
          saida: Math.round(saida)
        });
      }
      setCashflowData(cashflow);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    if (statusFilter === "all") return true;
    return tx.order_status === statusFilter;
  });

  const statsCards = [{
    title: "💰 Total Arrecadado (GMV)",
    value: `R$ ${receitaTotal.toLocaleString('pt-BR', {
      minimumFractionDigits: 2
    })}`,
    subtitle: "Total movimentado na plataforma",
    icon: DollarSign,
    color: "from-green-500 to-green-600"
  }, {
    title: "💸 Total Repassado",
    value: `R$ ${pagoFornecedores.toLocaleString('pt-BR', {
      minimumFractionDigits: 2
    })}`,
    subtitle: "Valor líquido aos fornecedores",
    icon: TrendingDown,
    color: "from-blue-500 to-blue-600"
  }, {
    title: "📉 Comissão Nellor (7,5%)",
    value: `R$ ${comissoes.toLocaleString('pt-BR', {
      minimumFractionDigits: 2
    })}`,
    subtitle: "Receita da plataforma",
    icon: Percent,
    color: "from-purple-500 to-purple-600"
  }, {
    title: "👥 Fornecedores Verificados",
    value: `${planosStats.verified} / ${planosStats.free}`,
    subtitle: `${planosStats.free > 0 ? (planosStats.verified / planosStats.free * 100).toFixed(0) : 0}% verificados`,
    icon: Shield,
    color: "from-orange-500 to-orange-600"
  }];

  const distributionData = [{
    name: "Fornecedores",
    value: pagoFornecedores,
    color: "#3B82F6"
  }, {
    name: "Comissão Nellor",
    value: comissoes,
    color: "#8B5CF6"
  }, {
    name: "Taxa Processador (est.)",
    value: receitaTotal * 0.0349,
    color: "#F59E0B"
  }];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-900 to-violet-900 bg-clip-text mb-2 text-slate-50">
            💸 Financeiro
          </h1>
          <p className="text-muted-foreground">Movimentação geral da plataforma</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateFilter} onValueChange={(v: any) => setDateFilter(v)}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">7 dias</SelectItem>
              <SelectItem value="30days">30 dias</SelectItem>
              <SelectItem value="90days">90 dias</SelectItem>
              <SelectItem value="all">Todo período</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => setShowHelpModal(true)} className="mx-0 px-0 pb-[6px] pr-0">
            <HelpCircle className="h-4 w-4 mr-2" />
            ​ 
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map(stat => (
          <Card key={stat.title} className="border-purple-100 hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`w-5 h-5 bg-gradient-to-br ${stat.color} bg-clip-text text-transparent`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              {stat.subtitle && <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-purple-100">
          <CardHeader>
            <CardTitle>📊 Fluxo de Entrada/Saída (6 meses)</CardTitle>
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
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`} />
                <Legend />
                <Area type="monotone" dataKey="entrada" name="Entrada (GMV)" stroke="#10B981" fillOpacity={1} fill="url(#colorEntrada)" />
                <Area type="monotone" dataKey="saida" name="Repassado" stroke="#3B82F6" fillOpacity={1} fill="url(#colorSaida)" />
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
                <Pie 
                  data={distributionData} 
                  cx="50%" 
                  cy="50%" 
                  labelLine={false} 
                  label={({ name, value }) => value > 0 ? `${name}: R$ ${value.toFixed(0)}` : ''} 
                  outerRadius={120} 
                  dataKey="value"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Transações */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>📋 Transações Recentes</CardTitle>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filtrar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="preparing">Preparando</SelectItem>
              <SelectItem value="shipped">Enviado</SelectItem>
              <SelectItem value="delivered">Entregue</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Data</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Pedido</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Vendedor</th>
                  <th className="text-right py-3 px-2 font-medium text-muted-foreground">Valor Bruto</th>
                  <th className="text-right py-3 px-2 font-medium text-muted-foreground">Comissão (7,5%)</th>
                  <th className="text-right py-3 px-2 font-medium text-muted-foreground">Taxa Proc.</th>
                  <th className="text-right py-3 px-2 font-medium text-muted-foreground">Repassado</th>
                  <th className="text-center py-3 px-2 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length > 0 ? filteredTransactions.map(tx => {
                  const comissao = Number(tx.total) * 0.075;
                  const taxaProc = Number(tx.total) * 0.0349;
                  const repassado = Number(tx.total) - comissao - taxaProc;
                  return (
                    <tr key={tx.id} className="border-b hover:bg-muted/20">
                      <td className="py-3 px-2">{format(new Date(tx.created_at), "dd/MM/yyyy")}</td>
                      <td className="py-3 px-2 font-medium">#{tx.order_number}</td>
                      <td className="py-3 px-2">{tx.supplier_name || "---"}</td>
                      <td className="py-3 px-2 text-right">R$ {Number(tx.total).toFixed(2)}</td>
                      <td className="py-3 px-2 text-right text-purple-600">R$ {comissao.toFixed(2)}</td>
                      <td className="py-3 px-2 text-right text-orange-600">R$ {taxaProc.toFixed(2)}</td>
                      <td className="py-3 px-2 text-right text-green-600 font-medium">R$ {repassado.toFixed(2)}</td>
                      <td className="py-3 px-2 text-center">
                        <Badge variant="outline" className="text-xs">
                          {tx.order_status}
                        </Badge>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-muted-foreground">
                      Nenhuma transação encontrada
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Resumo por período */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-purple-100 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950 dark:to-violet-950">
          <CardHeader>
            <CardTitle className="text-foreground">📈 Resumo por Período</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Receita Hoje:</span>
              <span className="font-bold text-lg text-green-600">R$ {periodSummary.daily.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Receita do Mês:</span>
              <span className="font-bold text-lg text-green-600">R$ {periodSummary.monthly.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Ticket Médio:</span>
              <span className="font-bold text-lg">R$ {ticketMedio.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total de Pedidos:</span>
              <span className="font-bold text-lg">{totalPedidos}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-100 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
          <CardHeader>
            <CardTitle className="text-foreground">⚙️ Configurações de Comissão</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Plano Grátis:</span>
              <span className="font-bold text-lg">7,5%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Plano Premium:</span>
              <span className="font-bold text-lg text-green-600">0%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Mensalidade Premium:</span>
              <span className="font-bold text-lg">R$ 79/mês</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Taxa Processador (est.):</span>
              <span className="font-bold text-lg">~3,49%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Ajuda */}
      <Dialog open={showHelpModal} onOpenChange={setShowHelpModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Como funciona o sistema financeiro</DialogTitle>
            <DialogDescription>
              Entenda o fluxo de pagamentos da plataforma
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <p>
              A Nellor cobra uma comissão de <strong>7,5%</strong> sobre cada venda (plano Grátis). 
              Fornecedores Premium pagam R$79/mês e têm 0% de comissão.
            </p>
            <p>
              Os fornecedores podem solicitar saques a qualquer momento após o período de carência.
              Os valores são transferidos via Pix para a conta bancária cadastrada.
            </p>
            <div className="bg-muted p-3 rounded-lg">
              <h4 className="font-medium mb-2">Exemplo de transação:</h4>
              <ul className="space-y-1 text-xs">
                <li>• Valor da venda: R$ 100,00</li>
                <li>• Comissão Nellor (7,5%): R$ 7,50</li>
                <li>• Taxa processador (~3,49%): R$ 3,49</li>
                <li>• <strong>Fornecedor recebe: R$ 89,01</strong></li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Financeiro;
