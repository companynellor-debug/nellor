import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Loader2 } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { format, subMonths } from "date-fns";

const Relatorios = () => {
  const [loading, setLoading] = useState(true);
  const [growthData, setGrowthData] = useState<any[]>([]);
  const [categoryRevenueData, setCategoryRevenueData] = useState<any[]>([]);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [receitaTotal, setReceitaTotal] = useState(0);
  const [novosClientes, setNovosClientes] = useState(0);
  const [novosFornecedores, setNovosFornecedores] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Buscar dados dos últimos 6 meses
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*');

      const { data: orders } = await supabase
        .from('orders')
        .select('total, created_at, payment_status, itens')
        .eq('payment_status', 'paid');

      const clientes = profiles?.filter(p => p.tipo === 'cliente') || [];
      const fornecedores = profiles?.filter(p => p.tipo === 'fornecedor') || [];
      const ordersList = orders || [];

      // Crescimento dos últimos 6 meses
      const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const growth = [];
      
      for (let i = 5; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const clientesAteData = clientes.filter(c => new Date(c.created_at) <= date).length;
        const fornecedoresAteData = fornecedores.filter(f => new Date(f.created_at) <= date).length;

        growth.push({
          month: meses[date.getMonth()],
          clientes: clientesAteData,
          fornecedores: fornecedoresAteData
        });
      }
      setGrowthData(growth);

      // Receita por categoria (simulado)
      setCategoryRevenueData([
        { category: "Streetwear", revenue: ordersList.length > 0 ? Math.random() * 50000 : 0 },
        { category: "Techwear", revenue: ordersList.length > 0 ? Math.random() * 40000 : 0 },
        { category: "Acessórios", revenue: ordersList.length > 0 ? Math.random() * 30000 : 0 },
        { category: "Calçados", revenue: ordersList.length > 0 ? Math.random() * 25000 : 0 },
        { category: "Outros", revenue: ordersList.length > 0 ? Math.random() * 10000 : 0 },
      ]);

      // Estatísticas
      setTotalTransactions(ordersList.length);
      setReceitaTotal(ordersList.reduce((sum, o) => sum + Number(o.total), 0));

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      setNovosClientes(clientes.filter(c => new Date(c.created_at) >= startOfMonth).length);
      setNovosFornecedores(fornecedores.filter(f => new Date(f.created_at) >= startOfMonth).length);

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

  const stateDataList = [
    { state: "SP", orders: 520 },
    { state: "RJ", orders: 310 },
    { state: "MG", orders: 280 },
    { state: "RS", orders: 180 },
    { state: "PR", orders: 150 },
    { state: "Outros", orders: 83 }
  ];
  return <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-900 to-violet-900 bg-clip-text mb-2 text-slate-50">
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
                <BarChart data={categoryRevenueData}>
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
                <BarChart data={stateDataList} layout="vertical">
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
            <CardTitle className="text-stone-950">📋 Resumo do Período</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Total de Transações:</span>
              <span className="font-bold text-lg text-neutral-700">{totalTransactions}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Receita Total:</span>
              <span className="font-bold text-lg text-green-700">R$ {receitaTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Novos Clientes:</span>
              <span className="font-bold text-lg text-blue-700">{novosClientes}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Novos Fornecedores:</span>
              <span className="font-bold text-lg text-purple-700">{novosFornecedores}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Taxa de Crescimento:</span>
              <span className="font-bold text-lg text-orange-700">
                {novosClientes > 0 ? `+${((novosClientes / totalTransactions) * 100).toFixed(1)}%` : '0%'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
};
export default Relatorios;