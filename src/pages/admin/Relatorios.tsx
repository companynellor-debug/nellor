import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const growthData = [
  { month: "Jun", clientes: 2100, fornecedores: 145 },
  { month: "Jul", clientes: 2280, fornecedores: 152 },
  { month: "Ago", clientes: 2450, fornecedores: 161 },
  { month: "Set", clientes: 2620, fornecedores: 170 },
  { month: "Out", clientes: 2780, fornecedores: 179 },
  { month: "Nov", clientes: 2847, fornecedores: 184 },
];

const categoryRevenue = [
  { category: "Streetwear", revenue: 44600 },
  { category: "Techwear", revenue: 31850 },
  { category: "Acessórios", revenue: 25486 },
  { category: "Calçados", revenue: 19116 },
  { category: "Outros", revenue: 6372 },
];

const stateData = [
  { state: "SP", orders: 520 },
  { state: "RJ", orders: 310 },
  { state: "MG", orders: 280 },
  { state: "RS", orders: 180 },
  { state: "PR", orders: 150 },
  { state: "Outros", orders: 83 },
];

const Relatorios = () => {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-900 to-violet-900 bg-clip-text text-transparent mb-2">
            📊 Relatórios
          </h1>
          <p className="text-muted-foreground">Central de análise e insights</p>
        </div>
        <Button className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700">
          <Download className="w-4 h-4 mr-2" />
          Gerar PDF
        </Button>
      </div>

      <Card className="border-purple-100">
        <CardHeader>
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <CardTitle>Filtros</CardTitle>
            </div>
            <Select defaultValue="30">
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 3 meses</SelectItem>
                <SelectItem value="365">Último ano</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os dados</SelectItem>
                <SelectItem value="financial">Financeiro</SelectItem>
                <SelectItem value="orders">Pedidos</SelectItem>
                <SelectItem value="users">Usuários</SelectItem>
                <SelectItem value="suppliers">Fornecedores</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-purple-100">
          <CardHeader>
            <CardTitle>📈 Crescimento: Clientes vs Fornecedores</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="clientes" stroke="#3B82F6" strokeWidth={2} name="Clientes" />
                <Line type="monotone" dataKey="fornecedores" stroke="#8B5CF6" strokeWidth={2} name="Fornecedores" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-purple-100">
          <CardHeader>
            <CardTitle>💰 Receita por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="category" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Bar dataKey="revenue" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-purple-100">
          <CardHeader>
            <CardTitle>🗺️ Pedidos por Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stateData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" stroke="#6b7280" />
                <YAxis dataKey="state" type="category" stroke="#6b7280" width={60} />
                <Tooltip />
                <Bar dataKey="orders" fill="#6366F1" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-purple-100 bg-gradient-to-br from-purple-50 to-violet-50">
          <CardHeader>
            <CardTitle>📋 Resumo do Período</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Total de Transações:</span>
              <span className="font-bold text-lg">1,523</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Receita Total:</span>
              <span className="font-bold text-lg text-green-700">R$ 127.430</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Novos Clientes:</span>
              <span className="font-bold text-lg text-blue-700">247</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Novos Fornecedores:</span>
              <span className="font-bold text-lg text-purple-700">12</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Taxa de Crescimento:</span>
              <span className="font-bold text-lg text-orange-700">+15.8%</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Relatorios;
