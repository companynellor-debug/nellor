import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, UserPlus, DollarSign, Loader2, Percent } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, subMonths, startOfMonth } from "date-fns";
import { fetchAdminOrders, fetchAdminProfiles } from "@/lib/adminRpc";

const Usuarios = () => {
  const [loading, setLoading] = useState(true);
  const [totalClientes, setTotalClientes] = useState(0);
  const [novosNoMes, setNovosNoMes] = useState(0);
  const [ticketMedio, setTicketMedio] = useState(0);
  const [taxaRetencao, setTaxaRetencao] = useState(0);
  const [totalGasto, setTotalGasto] = useState(0);
  const [clientes, setClientes] = useState<any[]>([]);
  const [growthData, setGrowthData] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const profiles = await fetchAdminProfiles();
      const clientesList = profiles
        .filter((p) => p.tipo === "cliente")
        .map((p) => ({ ...p, created_at: p.created_at }));

      setTotalClientes(clientesList.length);

      // Clientes novos no mês
      const startOfCurrentMonth = startOfMonth(new Date());
      const novos = clientesList.filter((c) => new Date(c.created_at) >= startOfCurrentMonth).length;
      setNovosNoMes(novos);

      const allOrders = (await fetchAdminOrders()).filter(
        (o) => o.payment_status === "paid" && o.order_status !== "cancelled"
      );

      // Calcular ticket médio
      if (allOrders.length > 0) {
        const totalReceita = allOrders.reduce((sum, order) => sum + Number(order.total), 0);
        setTicketMedio(totalReceita / allOrders.length);
        setTotalGasto(totalReceita);
      }

      // Taxa de retenção: clientes que fizeram mais de 1 pedido
      const pedidosPorCliente: Record<string, number> = {};
      allOrders.forEach(order => {
        if (order.buyer_id) {
          pedidosPorCliente[order.buyer_id] = (pedidosPorCliente[order.buyer_id] || 0) + 1;
        }
      });

      const clientesComPedidos = Object.keys(pedidosPorCliente).length;
      const clientesRecorrentes = Object.values(pedidosPorCliente).filter(count => count > 1).length;
      const retencao = clientesComPedidos > 0 ? (clientesRecorrentes / clientesComPedidos) * 100 : 0;
      setTaxaRetencao(retencao);

      // Criar lista de clientes com dados de pedidos
      const clientesComPedidosList = clientesList.slice(0, 20).map(cliente => {
        const pedidosCliente = allOrders.filter(o => o.buyer_id === cliente.id);
        const totalGastoCliente = pedidosCliente.reduce((sum, o) => sum + Number(o.total), 0);
        const ultimoPedido = pedidosCliente.length > 0 
          ? format(new Date(Math.max(...pedidosCliente.map(o => new Date(o.created_at).getTime()))), 'dd/MM/yyyy')
          : '-';

        return {
          id: cliente.id,
          name: cliente.nome || 'Sem nome',
          email: cliente.email,
          lastOrder: ultimoPedido,
          totalSpent: totalGastoCliente,
          orders: pedidosCliente.length,
          createdAt: format(new Date(cliente.created_at), 'dd/MM/yyyy')
        };
      });
      setClientes(clientesComPedidosList);

      // Dados de crescimento (últimos 6 meses)
      const growth = [];
      for (let i = 5; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const monthStart = startOfMonth(date);

        const countUntilMonth = clientesList.filter((c) => new Date(c.created_at) <= monthStart).length;

        const novosNoMes = clientesList.filter((c) => {
          const createdAt = new Date(c.created_at);
          return createdAt.getMonth() === date.getMonth() && createdAt.getFullYear() === date.getFullYear();
        }).length;

        growth.push({
          month: format(date, "MMM"),
          total: countUntilMonth + novosNoMes,
          novos: novosNoMes,
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
      value: `${taxaRetencao.toFixed(1)}%`,
      subtitle: "Clientes com +1 pedido",
      icon: Percent,
      color: "from-purple-500 to-purple-600"
    },
    {
      title: "Ticket Médio",
      value: `R$ ${ticketMedio.toFixed(2)}`,
      icon: DollarSign,
      color: "from-orange-500 to-orange-600"
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-900 to-violet-900 bg-clip-text mb-2 text-slate-50">
          👥 Usuários
        </h1>
        <p className="text-muted-foreground">Dados gerais dos clientes da plataforma</p>
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
              <div className="text-3xl font-bold">{stat.value}</div>
              {(stat as any).subtitle && (
                <p className="text-xs text-muted-foreground mt-1">{(stat as any).subtitle}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-purple-100">
          <CardHeader>
            <CardTitle>Clientes Cadastrados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Cadastro</TableHead>
                    <TableHead>Último Pedido</TableHead>
                    <TableHead className="text-right">Total Gasto</TableHead>
                    <TableHead className="text-right">Pedidos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientes.length > 0 ? clientes.map((user) => (
                    <TableRow key={user.id} className="hover:bg-purple-50/50">
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{user.email}</TableCell>
                      <TableCell>{user.createdAt}</TableCell>
                      <TableCell>{user.lastOrder}</TableCell>
                      <TableCell className="text-right font-medium">
                        R$ {user.totalSpent.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">{user.orders}</TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        Nenhum cliente cadastrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-100">
          <CardHeader>
            <CardTitle>Crescimento de Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="total" name="Total" stroke="#8B5CF6" strokeWidth={2} />
                <Line type="monotone" dataKey="novos" name="Novos" stroke="#10B981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Resumo de Gastos */}
      <Card className="border-purple-100 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950 dark:to-violet-950">
        <CardHeader>
          <CardTitle>📊 Resumo de Gastos dos Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Gasto (Todos)</p>
              <p className="text-2xl font-bold">R$ {totalGasto.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ticket Médio</p>
              <p className="text-2xl font-bold">R$ {ticketMedio.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Clientes c/ Pedidos</p>
              <p className="text-2xl font-bold">{clientes.filter(c => c.orders > 0).length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
              <p className="text-2xl font-bold">
                {totalClientes > 0 ? ((clientes.filter(c => c.orders > 0).length / totalClientes) * 100).toFixed(1) : 0}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Usuarios;
