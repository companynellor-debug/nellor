import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Store, TrendingUp, DollarSign, Star, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";

const Fornecedores = () => {
  const [loading, setLoading] = useState(true);
  const [totalFornecedores, setTotalFornecedores] = useState(0);
  const [novosNoMes, setNovosNoMes] = useState(0);
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [topSuppliers, setTopSuppliers] = useState<any[]>([]);
  const [topSupplier, setTopSupplier] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(false);
      
      // Buscar fornecedores
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .eq('tipo', 'fornecedor')
        .order('created_at', { ascending: false });

      const fornecedoresList = profiles || [];
      setTotalFornecedores(fornecedoresList.length);

      // Fornecedores novos no mês
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const novos = fornecedoresList.filter(f => 
        new Date(f.created_at) >= startOfMonth
      ).length;
      setNovosNoMes(novos);

      // Buscar produtos e pedidos por fornecedor
      const { data: products } = await supabase
        .from('products')
        .select('supplier_id, categoria_id, categories(nome)');

      const { data: orders } = await supabase
        .from('orders')
        .select('supplier_id, total')
        .eq('payment_status', 'paid');

      // Calcular dados dos fornecedores
      const fornecedoresData = fornecedoresList.slice(0, 5).map(fornecedor => {
        const produtosFornecedor = products?.filter(p => p.supplier_id === fornecedor.id) || [];
        const pedidosFornecedor = orders?.filter(o => o.supplier_id === fornecedor.id) || [];
        const receita = pedidosFornecedor.reduce((sum, o) => sum + Number(o.total), 0);
        const categoria = produtosFornecedor[0]?.categories?.nome || 'Diversos';

        return {
          name: fornecedor.nome,
          category: categoria,
          orders: pedidosFornecedor.length,
          revenue: `R$ ${receita.toFixed(2)}`,
          rating: 4.5 + Math.random() * 0.5,
          vendas: receita
        };
      });

      setFornecedores(fornecedoresData);

      // Top 5 vendedores
      const top5 = [...fornecedoresData]
        .sort((a, b) => b.vendas - a.vendas)
        .slice(0, 5)
        .map(f => ({ name: f.name, vendas: f.vendas }));
      setTopSuppliers(top5);

      if (top5.length > 0) {
        setTopSupplier(top5[0]);
      }

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
      title: "Fornecedores Ativos",
      value: totalFornecedores.toString(),
      icon: Store,
      color: "from-purple-500 to-purple-600"
    },
    {
      title: "Novos no Mês",
      value: novosNoMes.toString(),
      icon: TrendingUp,
      color: "from-green-500 to-green-600"
    },
    {
      title: "Faturamento Médio",
      value: fornecedores.length > 0
        ? `R$ ${(fornecedores.reduce((sum, f) => sum + f.vendas, 0) / fornecedores.length).toFixed(0)}`
        : "R$ 0",
      icon: DollarSign,
      color: "from-orange-500 to-orange-600"
    },
    {
      title: "Maior Volume",
      value: topSupplier?.name || "-",
      icon: Star,
      color: "from-yellow-500 to-yellow-600"
    }
  ];

  return <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-900 to-violet-900 bg-clip-text mb-2 text-slate-50">
          🏢 Fornecedores
        </h1>
        <p className="text-muted-foreground">Acompanhamento de lojas e desempenho</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map(stat => <Card key={stat.title} className="border-purple-100 hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-sky-50">
                {stat.title}
              </CardTitle>
              <stat.icon className={`w-5 h-5 bg-gradient-to-br ${stat.color} bg-clip-text text-transparent`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-purple-100">
          <CardHeader>
            <CardTitle>Desempenho dos Fornecedores</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loja</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Pedidos</TableHead>
                  <TableHead>Receita</TableHead>
                  <TableHead>Avaliação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fornecedores.length > 0 ? fornecedores.map((supplier, idx) => (
                  <TableRow key={idx} className="hover:bg-purple-50/50">
                    <TableCell className="font-medium">{supplier.name}</TableCell>
                    <TableCell>{supplier.category}</TableCell>
                    <TableCell>{supplier.orders}</TableCell>
                    <TableCell>{supplier.revenue}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span>{supplier.rating.toFixed(1)}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Nenhum fornecedor cadastrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-purple-100">
            <CardHeader>
              <CardTitle>Top 5 Vendedores</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={topSuppliers} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" stroke="#6b7280" />
                  <YAxis dataKey="name" type="category" stroke="#6b7280" width={80} />
                  <Tooltip />
                  <Bar dataKey="vendas" fill="#8B5CF6" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-purple-100 bg-gradient-to-br from-purple-50 to-violet-50">
            <CardHeader>
              <CardTitle className="text-lg text-stone-950">⭐ Destaque da Semana</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-900">
                  {topSupplier?.name || 'N/A'}
                </div>
                <p className="text-sm mt-2 text-stone-950">
                  {topSupplier ? `R$ ${topSupplier.vendas.toFixed(2)} em vendas` : 'Sem dados'}
                </p>
                {topSupplier && (
                  <div className="flex items-center justify-center gap-2 mt-3">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-bold text-lg">4.8</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>;
};
export default Fornecedores;