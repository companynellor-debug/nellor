import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Package, CheckCircle, DollarSign } from "lucide-react";
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
const statsCards = [{
  title: "Total de Pedidos",
  value: "1,523",
  icon: ShoppingCart,
  color: "from-blue-500 to-blue-600"
}, {
  title: "Pedidos Pendentes",
  value: "47",
  icon: Package,
  color: "from-orange-500 to-orange-600"
}, {
  title: "Pedidos Concluídos",
  value: "1,476",
  icon: CheckCircle,
  color: "from-green-500 to-green-600"
}, {
  title: "Vendas do Mês",
  value: "R$ 127.430",
  icon: DollarSign,
  color: "from-purple-500 to-purple-600"
}];
const ordersData = [{
  id: "#2048",
  customer: "João M.",
  supplier: "UrbanCloth",
  value: "R$ 230,00",
  status: "completed",
  date: "02/11"
}, {
  id: "#2049",
  customer: "Maria F.",
  supplier: "DriftWear",
  value: "R$ 150,00",
  status: "pending",
  date: "02/11"
}, {
  id: "#2050",
  customer: "Lucas S.",
  supplier: "TechStyle",
  value: "R$ 380,00",
  status: "shipped",
  date: "01/11"
}, {
  id: "#2051",
  customer: "Ana R.",
  supplier: "UrbanCloth",
  value: "R$ 290,00",
  status: "completed",
  date: "01/11"
}, {
  id: "#2052",
  customer: "Carlos P.",
  supplier: "NeonWear",
  value: "R$ 520,00",
  status: "completed",
  date: "31/10"
}];
const statusDistribution = [{
  name: "Pendentes",
  value: 47,
  color: "#F59E0B"
}, {
  name: "Enviados",
  value: 98,
  color: "#3B82F6"
}, {
  name: "Entregues",
  value: 1476,
  color: "#10B981"
}];
const dailyOrders = [{
  day: "Seg",
  orders: 180
}, {
  day: "Ter",
  orders: 220
}, {
  day: "Qua",
  orders: 195
}, {
  day: "Qui",
  orders: 250
}, {
  day: "Sex",
  orders: 310
}, {
  day: "Sáb",
  orders: 240
}, {
  day: "Dom",
  orders: 128
}];
const getStatusBadge = (status: string) => {
  const variants: Record<string, {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }> = {
    completed: {
      label: "Concluído",
      variant: "default"
    },
    pending: {
      label: "Pendente",
      variant: "secondary"
    },
    shipped: {
      label: "Enviado",
      variant: "outline"
    }
  };
  const {
    label,
    variant
  } = variants[status] || variants.pending;
  return <Badge variant={variant}>{label}</Badge>;
};
const Vendas = () => {
  return <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-900 to-violet-900 bg-clip-text mb-2 text-slate-50">
          📦 Vendas & Pedidos
        </h1>
        <p className="text-muted-foreground">Informações gerais das transações</p>
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
                {ordersData.map(order => <TableRow key={order.id} className="hover:bg-purple-50/50">
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>{order.customer}</TableCell>
                    <TableCell>{order.supplier}</TableCell>
                    <TableCell>{order.value}</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>{order.date}</TableCell>
                  </TableRow>)}
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