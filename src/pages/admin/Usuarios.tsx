import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, UserPlus, TrendingUp, DollarSign, Loader2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays } from "date-fns";

const Usuarios = () => {
  const [loading, setLoading] = useState(true);
  const [totalClientes, setTotalClientes] = useState(0);
  const [novosNoMes, setNovosNoMes] = useState(0);
  const [ticketMedio, setTicketMedio] = useState(0);
  const [clientes, setClientes] = useState<any[]>([]);
  const [growthData, setGrowthData] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Buscar todos os clientes
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .eq('tipo', 'cliente')
        .order('created_at', { ascending: false });

      const clientesList = profiles || [];
      setTotalClientes(clientesList.length);

      // Clientes novos no mês
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const novos = clientesList.filter(c => 
        new Date(c.created_at) >= startOfMonth
      ).length;
      setNovosNoMes(novos);

      // Buscar pedidos dos clientes
      const { data: orders } = await supabase
        .from('orders')
        .select('buyer_id, total, created_at')
        .eq('payment_status', 'paid');

      // Calcular ticket médio
      if (orders && orders.length > 0) {
        const total = orders.reduce((sum, order) => sum + Number(order.total), 0);
        setTicketMedio(total / orders.length);
      }

      // Criar lista de clientes com dados de pedidos
      const clientesComPedidos = clientesList.slice(0, 10).map(cliente => {
        const pedidosCliente = orders?.filter(o => o.buyer_id === cliente.id) || [];
        const totalGasto = pedidosCliente.reduce((sum, o) => sum + Number(o.total), 0);
        const ultimoPedido = pedidosCliente.length > 0 
          ? format(new Date(Math.max(...pedidosCliente.map(o => new Date(o.created_at).getTime()))), 'dd/MM')
          : '-';

        return {
          name: cliente.nome,
          lastOrder: ultimoPedido,
          totalSpent: `R$ ${totalGasto.toFixed(2)}`,
          orders: pedidosCliente.length
        };
      });
      setClientes(clientesComPedidos);

      // Dados de crescimento (últimos 7 dias)
      const growth = [];
      for (let i = 6; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const count = clientesList.filter(c => 
          new Date(c.created_at) <= date
        ).length;
        
        growth.push({
          day: format(date, 'dd/MM'),
          users: count
        });
      }
      setGrowthData(growth);

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
      title: "Total de Clientes",
      value: totalClientes.toString(),
      icon: Users,
      color: "from-blue-500 to-blue-600"
    },
    {
      title: "Novos no Mês",
      value: novosNoMes.toString(),
      icon: UserPlus,
      color: "from-green-500 to-green-600"
    },
    {
      title: "Taxa de Retenção",
      value: clientes.filter(c => c.orders > 1).length > 0 
        ? `${Math.round((clientes.filter(c => c.orders > 1).length / clientes.length) * 100)}%`
        : "0%",
      icon: TrendingUp,
      color: "from-purple-500 to-purple-600"
    },
    {
      title: "Ticket Médio",
      value: `R$ ${ticketMedio.toFixed(0)}`,
      icon: DollarSign,
      color: "from-orange-500 to-orange-600"
    }
  ];

  return <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-900 to-violet-900 bg-clip-text mb-2 text-slate-50">
          👥 Usuários
        </h1>
        <p className="text-muted-foreground">Dados gerais dos clientes da plataforma</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-purple-100">
          <CardHeader>
            <CardTitle>Clientes Cadastrados</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Último Pedido</TableHead>
                  <TableHead>Total Gasto</TableHead>
                  <TableHead>Pedidos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientes.length > 0 ? clientes.map((user, idx) => (
                  <TableRow key={idx} className="hover:bg-purple-50/50">
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.lastOrder}</TableCell>
                    <TableCell>{user.totalSpent}</TableCell>
                    <TableCell>{user.orders}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Nenhum cliente cadastrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-purple-100">
          <CardHeader>
            <CardTitle>Crescimento (30 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Line type="monotone" dataKey="users" stroke="#8B5CF6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>;
};
export default Usuarios;