import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, UserPlus, TrendingUp, DollarSign } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const statsCards = [
  { title: "Total de Clientes", value: "2,847", icon: Users, color: "from-blue-500 to-blue-600" },
  { title: "Novos no Mês", value: "247", icon: UserPlus, color: "from-green-500 to-green-600" },
  { title: "Taxa de Retenção", value: "78%", icon: TrendingUp, color: "from-purple-500 to-purple-600" },
  { title: "Ticket Médio", value: "R$ 185", icon: DollarSign, color: "from-orange-500 to-orange-600" },
];

const userData = [
  { name: "Lucas M.", lastOrder: "02/11", totalSpent: "R$ 540", orders: 8 },
  { name: "Maria F.", lastOrder: "01/11", totalSpent: "R$ 230", orders: 2 },
  { name: "João P.", lastOrder: "31/10", totalSpent: "R$ 1.240", orders: 15 },
  { name: "Ana R.", lastOrder: "30/10", totalSpent: "R$ 890", orders: 12 },
  { name: "Carlos S.", lastOrder: "28/10", totalSpent: "R$ 670", orders: 9 },
  { name: "Paula T.", lastOrder: "27/10", totalSpent: "R$ 420", orders: 6 },
];

const growthData = [
  { day: "25/10", users: 2450 },
  { day: "26/10", users: 2520 },
  { day: "27/10", users: 2610 },
  { day: "28/10", users: 2680 },
  { day: "29/10", users: 2720 },
  { day: "30/10", users: 2790 },
  { day: "02/11", users: 2847 },
];

const Usuarios = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-900 to-violet-900 bg-clip-text text-transparent mb-2">
          👥 Usuários
        </h1>
        <p className="text-muted-foreground">Dados gerais dos clientes da plataforma</p>
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
                {userData.map((user) => (
                  <TableRow key={user.name} className="hover:bg-purple-50/50">
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.lastOrder}</TableCell>
                    <TableCell>{user.totalSpent}</TableCell>
                    <TableCell>{user.orders}</TableCell>
                  </TableRow>
                ))}
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
    </div>
  );
};

export default Usuarios;
