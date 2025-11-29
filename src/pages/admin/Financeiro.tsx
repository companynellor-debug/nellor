import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, TrendingDown, Percent, TrendingUp, Loader2, Users, HelpCircle } from "lucide-react";
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { format, subMonths } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const Financeiro = () => {
  const [loading, setLoading] = useState(true);
  const [receitaTotal, setReceitaTotal] = useState(0);
  const [pagoFornecedores, setPagoFornecedores] = useState(0);
  const [comissoes, setComissoes] = useState(0);
  const [cashflowData, setCashflowData] = useState<any[]>([]);
  const [ticketMedio, setTicketMedio] = useState(0);
  const [totalPedidos, setTotalPedidos] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [planosStats, setPlanosStats] = useState({ free: 0, premium: 0 });
  const [showHelpModal, setShowHelpModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Buscar transações/pedidos
      const { data: orders } = await supabase
        .from('orders')
        .select(`
          *,
          profiles!orders_supplier_id_fkey(nome)
        `)
        .eq('payment_status', 'paid')
        .order('created_at', { ascending: false });

      const ordersList = orders || [];
      setTransactions(ordersList);
      
      const receita = ordersList.reduce((sum, o) => sum + Number(o.total), 0);
      setReceitaTotal(receita);
      setTotalPedidos(ordersList.length);

      // Calcular comissão da plataforma (7.5% para plano grátis)
      // TODO: Ajustar baseado no plano real de cada fornecedor
      const comissao = receita * 0.075;
      setComissoes(comissao);

      // Pago aos fornecedores (valor bruto - comissão - taxa Stripe estimada)
      const taxaStripeEstimada = receita * 0.034;
      const pago = receita - comissao - taxaStripeEstimada;
      setPagoFornecedores(pago);

      // Ticket médio
      const ticket = ordersList.length > 0 ? receita / ordersList.length : 0;
      setTicketMedio(ticket);

      // Buscar stats de planos dos fornecedores
      const { data: fornecedores } = await supabase
        .from('profiles')
        .select('id')
        .eq('tipo', 'fornecedor');
      
      // TODO: Quando houver campo de plano no profiles, filtrar corretamente
      setPlanosStats({
        free: fornecedores?.length || 0,
        premium: 0
      });

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
        const saida = entrada * 0.891; // Aproximado (100% - 7.5% - 3.4%)

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

  const filteredTransactions = transactions.filter(tx => {
    if (statusFilter === "all") return true;
    return tx.order_status === statusFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const statsCards = [
    {
      title: "💰 Total Arrecadado",
      value: `R$ ${receitaTotal.toFixed(2)}`,
      subtitle: "(placeholder - via Stripe)",
      icon: DollarSign,
      color: "from-green-500 to-green-600"
    },
    {
      title: "💸 Total Repassado",
      value: `R$ ${pagoFornecedores.toFixed(2)}`,
      subtitle: "(placeholder - via Stripe)",
      icon: TrendingDown,
      color: "from-blue-500 to-blue-600"
    },
    {
      title: "📉 Comissões",
      value: `R$ ${comissoes.toFixed(2)}`,
      subtitle: "(7.5% plano Grátis)",
      icon: Percent,
      color: "from-purple-500 to-purple-600"
    },
    {
      title: "👥 Planos Ativos",
      value: `${planosStats.free} Grátis / ${planosStats.premium} Premium`,
      subtitle: "",
      icon: Users,
      color: "from-orange-500 to-orange-600"
    }
  ];

  const distributionData = [
    { name: "Fornecedores", value: pagoFornecedores, color: "#3B82F6" },
    { name: "Comissão Plataforma", value: comissoes, color: "#8B5CF6" },
    { name: "Taxa Stripe (est.)", value: receitaTotal * 0.034, color: "#F59E0B" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-900 to-violet-900 bg-clip-text mb-2 text-slate-50">
            💸 Financeiro
          </h1>
          <p className="text-muted-foreground">Movimentação geral da plataforma - Stripe Connect</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowHelpModal(true)}>
          <HelpCircle className="h-4 w-4 mr-2" />
          Como funciona
        </Button>
      </div>

      {/* Aviso sobre Stripe */}
      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/20">
        <CardContent className="p-4 text-sm">
          <p className="text-blue-800 dark:text-blue-200">
            <strong>ℹ️ Importante:</strong> Os valores exibidos são placeholders. 
            Após a integração com Stripe Connect, os dados reais de transações, 
            comissões e repasses serão exibidos automaticamente via webhooks.
          </p>
        </CardContent>
      </Card>

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
              {stat.subtitle && (
                <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
              )}
            </CardContent>
          </Card>
        ))}
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
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="entrada" name="Entrada" stroke="#10B981" fillOpacity={1} fill="url(#colorEntrada)" />
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
                  label={({ name, value }) => `${name}: R$ ${value.toFixed(2)}`} 
                  outerRadius={120} 
                  dataKey="value"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
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
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">ID</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Data</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Pedido</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Vendedor</th>
                  <th className="text-right py-3 px-2 font-medium text-muted-foreground">Valor Bruto</th>
                  <th className="text-right py-3 px-2 font-medium text-muted-foreground">Comissão</th>
                  <th className="text-right py-3 px-2 font-medium text-muted-foreground">Taxa Stripe</th>
                  <th className="text-right py-3 px-2 font-medium text-muted-foreground">Repassado</th>
                  <th className="text-center py-3 px-2 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.slice(0, 10).map((tx, idx) => {
                  const comissao = Number(tx.total) * 0.075;
                  const taxaStripe = Number(tx.total) * 0.034;
                  const repassado = Number(tx.total) - comissao - taxaStripe;
                  
                  return (
                    <tr key={tx.id} className="border-b hover:bg-muted/20">
                      <td className="py-3 px-2 text-xs text-muted-foreground">
                        {tx.id.slice(0, 8)}...
                      </td>
                      <td className="py-3 px-2">
                        {format(new Date(tx.created_at), 'dd/MM/yyyy')}
                      </td>
                      <td className="py-3 px-2 font-medium">#{tx.order_number}</td>
                      <td className="py-3 px-2">{tx.profiles?.nome || '---'}</td>
                      <td className="py-3 px-2 text-right">R$ {Number(tx.total).toFixed(2)}</td>
                      <td className="py-3 px-2 text-right text-purple-600">
                        R$ {comissao.toFixed(2)}
                      </td>
                      <td className="py-3 px-2 text-right text-orange-600">
                        R$ {taxaStripe.toFixed(2)}
                      </td>
                      <td className="py-3 px-2 text-right text-green-600 font-medium">
                        R$ {repassado.toFixed(2)}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <Badge variant="outline" className="text-xs">
                          {tx.order_status}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          <p className="text-xs text-muted-foreground mt-4">
            * Valores de comissão e taxa Stripe são estimados. Dados reais serão populados via webhooks do Stripe.
          </p>
        </CardContent>
      </Card>

      {/* Configurações */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-purple-100 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950 dark:to-violet-950">
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
              <span className="text-muted-foreground">Ticket Médio:</span>
              <span className="font-bold text-lg">R$ {ticketMedio.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-100 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
          <CardHeader>
            <CardTitle className="text-foreground">📈 Resumo do Período</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total de Pedidos:</span>
              <span className="font-bold text-lg">{totalPedidos}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Receita Comissões:</span>
              <span className="font-bold text-lg text-green-600">R$ {comissoes.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Fornecedores Grátis:</span>
              <span className="font-bold text-lg">{planosStats.free}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Fornecedores Premium:</span>
              <span className="font-bold text-lg">{planosStats.premium}</span>
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
              Entenda o fluxo de pagamentos com Stripe Connect
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <p>
              Todos os pagamentos são processados via <strong>Stripe Connect</strong>. 
              Quando um cliente realiza uma compra, o valor é automaticamente dividido entre:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Vendedor:</strong> Recebe o valor líquido diretamente na conta Stripe</li>
              <li><strong>Plataforma:</strong> Retém a comissão (7,5% ou 0% dependendo do plano)</li>
              <li><strong>Stripe:</strong> Cobra suas taxas de processamento</li>
            </ul>
            <p>
              Os vendedores recebem <strong>payouts automáticos semanais</strong> diretamente 
              em suas contas bancárias, sem necessidade de saque manual.
            </p>
            <div className="bg-muted p-3 rounded-lg">
              <strong>Observação:</strong> Os valores exibidos atualmente são placeholders. 
              Após completar a integração com Stripe Connect, todos os dados serão populados 
              automaticamente via webhooks.
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Financeiro;
