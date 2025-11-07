import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Store, TrendingUp, DollarSign, Star } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
const statsCards = [{
  title: "Fornecedores Ativos",
  value: "184",
  icon: Store,
  color: "from-purple-500 to-purple-600"
}, {
  title: "Novos no Mês",
  value: "12",
  icon: TrendingUp,
  color: "from-green-500 to-green-600"
}, {
  title: "Faturamento Médio",
  value: "R$ 4.850",
  icon: DollarSign,
  color: "from-orange-500 to-orange-600"
}, {
  title: "Maior Volume",
  value: "UrbanCloth",
  icon: Star,
  color: "from-yellow-500 to-yellow-600"
}];
const suppliersData = [{
  name: "UrbanCloth",
  category: "Streetwear",
  orders: 120,
  revenue: "R$ 12.500",
  rating: 4.9
}, {
  name: "DriftWear",
  category: "Techwear",
  orders: 80,
  revenue: "R$ 8.900",
  rating: 4.7
}, {
  name: "TechStyle",
  category: "Acessórios",
  orders: 65,
  revenue: "R$ 7.200",
  rating: 4.8
}, {
  name: "StreetVibe",
  category: "Streetwear",
  orders: 58,
  revenue: "R$ 6.800",
  rating: 4.6
}, {
  name: "NeonWear",
  category: "Calçados",
  orders: 45,
  revenue: "R$ 5.400",
  rating: 4.5
}];
const topSuppliers = [{
  name: "UrbanCloth",
  vendas: 12500
}, {
  name: "DriftWear",
  vendas: 8900
}, {
  name: "TechStyle",
  vendas: 7200
}, {
  name: "StreetVibe",
  vendas: 6800
}, {
  name: "NeonWear",
  vendas: 5400
}];
const Fornecedores = () => {
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
                {suppliersData.map(supplier => <TableRow key={supplier.name} className="hover:bg-purple-50/50">
                    <TableCell className="font-medium">{supplier.name}</TableCell>
                    <TableCell>{supplier.category}</TableCell>
                    <TableCell>{supplier.orders}</TableCell>
                    <TableCell>{supplier.revenue}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span>{supplier.rating}</span>
                      </div>
                    </TableCell>
                  </TableRow>)}
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
                <div className="text-2xl font-bold text-purple-900">UrbanCloth</div>
                <p className="text-sm mt-2 text-stone-950">120 pedidos esta semana</p>
                <div className="flex items-center justify-center gap-2 mt-3">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-bold text-lg">4.9</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>;
};
export default Fornecedores;