import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingDown, Percent, TrendingUp } from "lucide-react";
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const statsCards = [
  { title: "💰 Receita Total", value: "R$ 127.430", icon: DollarSign, color: "from-green-500 to-green-600" },
  { title: "💸 Pago aos Fornecedores", value: "R$ 121.058", icon: TrendingDown, color: "from-blue-500 to-blue-600" },
  { title: "📉 Comissões Nellor", value: "R$ 6.372", icon: Percent, color: "from-purple-500 to-purple-600" },
  { title: "🏦 Lucro Líquido", value: "R$ 6.372", icon: TrendingUp, color: "from-orange-500 to-orange-600" },
];

const cashflowData = [
  { month: "Jun", entrada: 45000, saida: 42750 },
  { month: "Jul", entrada: 62000, saida: 58900 },
  { month: "Ago", entrada: 78000, saida: 74100 },
  { month: "Set", entrada: 95000, saida: 90250 },
  { month: "Out", entrada: 112000, saida: 106400 },
  { month: "Nov", entrada: 127430, saida: 121058 },
];

const distributionData = [
  { name: "Fornecedores", value: 95, color: "#3B82F6" },
  { name: "Comissão Nellor", value: 5, color: "#8B5CF6" },
];

const Financeiro = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-900 to-violet-900 bg-clip-text text-transparent mb-2">
          💸 Financeiro
        </h1>
        <p className="text-muted-foreground">Movimentação geral da plataforma Nellor</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat) => (
          <Card key={stat.title} className="border-purple-100 hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`w-5 h-5 bg-gradient-to-br ${stat.color} bg-clip-text text-transparent`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
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
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorSaida" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
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
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-purple-100 bg-gradient-to-br from-purple-50 to-violet-50">
          <CardHeader>
            <CardTitle>⚙️ Configurações Financeiras</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Taxa Atual da Nellor:</span>
              <span className="font-bold text-lg text-purple-900">5%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Ticket Médio:</span>
              <span className="font-bold text-lg">R$ 83,70</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Comissão por Venda:</span>
              <span className="font-bold text-lg">R$ 4,18</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-100 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader>
            <CardTitle>📈 Lucro Estimado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Por Venda Média:</span>
              <span className="font-bold text-lg text-green-900">R$ 4,18</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Por Dia (média):</span>
              <span className="font-bold text-lg text-green-900">R$ 217</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Projeção Mensal:</span>
              <span className="font-bold text-lg text-green-900">R$ 6.500</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Financeiro;
