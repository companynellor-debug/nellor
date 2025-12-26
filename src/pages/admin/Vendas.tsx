import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Package, CheckCircle, DollarSign, Loader2 } from "lucide-react";
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, subDays } from "date-fns";
import { useMemo } from "react";
import { useAdminData } from "@/hooks/useAdminData";

const getStatusBadge = (status: string) => {
  const variants: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; }> = {
    delivered: { label: "Entregue", variant: "default" },
    pending: { label: "Pendente", variant: "secondary" },
    preparing: { label: "Preparando", variant: "outline" },
    shipped: { label: "Enviado", variant: "outline" },
    cancelled: { label: "Cancelado", variant: "destructive" },
  };
  const { label, variant } = variants[status] || variants.pending;
  return <Badge variant={variant}>{label}</Badge>;
};

const Vendas = () => {
  const { orders, loading } = useAdminData();

  const { totalPedidos, pedidosPendentes, pedidosConcluidos, vendasMes, pedidos, statusDistribution, dailyOrders } = useMemo(() => {
    const total = orders.length;
    const pendentes = orders.filter(p => p.order_status === 'pending').length;
    const concluidos = orders.filter(p => p.order_status === 'delivered').length;

    // Vendas do mês
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const vendasDoMes = orders
      .filter(p => new Date(p.created_at) >= startOfMonth && p.payment_status === 'paid')
      .reduce((sum, p) => sum + Number(p.total), 0);

    // Pedidos recentes
    const pedidosRecentes = orders.slice(0, 10).map((order) => ({
      id: order.order_number,
      customer: order.buyer_name || "Cliente",
      supplier: order.supplier_name || "Fornecedor",
      value: `R$ ${Number(order.total).toFixed(2)}`,
      status: order.order_status,
      date: format(new Date(order.created_at), "dd/MM"),
    }));

    // Distribuição de status
    const statusCount = {
      pending: orders.filter(p => p.order_status === 'pending').length,
      shipped: orders.filter(p => p.order_status === 'shipped').length,
      delivered: orders.filter(p => p.order_status === 'delivered').length,
    };

    const distribution = [
      { name: "Pendentes", value: statusCount.pending, color: "#F59E0B" },
      { name: "Enviados", value: statusCount.shipped, color: "#3B82F6" },
      { name: "Entregues", value: statusCount.delivered, color: "#10B981" },
    ];

    // Pedidos dos últimos 7 dias
    const daily = [];
    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const count = orders.filter(p => 
        format(new Date(p.created_at), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      ).length;
      
      daily.push({
        day: diasSemana[date.getDay()],
        orders: count
      });
    }

    return {
      totalPedidos: total,
      pedidosPendentes: pendentes,
      pedidosConcluidos: concluidos,
      vendasMes: vendasDoMes,
      pedidos: pedidosRecentes,
      statusDistribution: distribution,
      dailyOrders: daily,
    };
  }, [orders]);


  const statsCards = [
    {
      title: "Total de Pedidos",
      value: totalPedidos.toString(),
      icon: ShoppingCart,
      color: "from-blue-500 to-blue-600"
    },
    {
      title: "Pedidos Pendentes",
      value: pedidosPendentes.toString(),
      icon: Package,
      color: "from-orange-500 to-orange-600"
    },
    {
      title: "Pedidos Concluídos",
      value: pedidosConcluidos.toString(),
      icon: CheckCircle,
      color: "from-green-500 to-green-600"
    },
    {
      title: "Vendas do Mês",
      value: `R$ ${vendasMes.toFixed(2)}`,
      icon: DollarSign,
      color: "from-purple-500 to-purple-600"
    }
  ];

  if (loading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando vendas...</p>
        </div>
      </div>
    );
  }

  return <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-900 to-violet-900 bg-clip-text mb-2 text-slate-50">
            📦 Vendas & Pedidos
          </h1>
          <p className="text-muted-foreground">Informações gerais das transações</p>
        </div>
        {loading && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
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
            <CardTitle>Pedidos Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pedidos.length > 0 ? pedidos.map((order, idx) => (
                  <TableRow key={idx} className="hover:bg-purple-50/50">
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>{order.customer}</TableCell>
                    <TableCell>{order.supplier}</TableCell>
                    <TableCell>{order.value}</TableCell>
                    <TableCell>{getStatusBadge(order.status || 'pending')}</TableCell>
                    <TableCell>{order.date}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Nenhum pedido encontrado
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
              <CardTitle>Status dos Pedidos</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={statusDistribution} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                    {statusDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-purple-100">
            <CardHeader>
              <CardTitle>Pedidos na Semana</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={dailyOrders}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="day" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip />
                  <Line type="monotone" dataKey="orders" stroke="#8B5CF6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>;
};
export default Vendas;
