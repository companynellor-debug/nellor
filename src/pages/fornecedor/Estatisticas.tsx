import { Card } from "@/components/ui/card";
import { useSupplierOrders } from "@/hooks/useSupplierOrders";
import { useSupplierProducts } from "@/hooks/useSupplierProducts";
import { TrendingUp, Package, DollarSign, Star } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

const Estatisticas = () => {
  const { orders } = useSupplierOrders();
  const { products } = useSupplierProducts();

  const deliveredOrders = orders.filter(o => o.status === 'delivered');
  const totalSales = deliveredOrders.reduce((sum, o) => sum + o.value, 0);
  const totalOrders = deliveredOrders.length;
  const averageTicket = totalOrders > 0 ? totalSales / totalOrders : 0;

  // Produtos mais vendidos (mock data)
  const topProducts = products.slice(0, 5).map((product, idx) => ({
    name: product.name.substring(0, 20),
    vendas: Math.floor(Math.random() * 50) + 10
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Estatísticas</h1>
        <p className="text-muted-foreground">Análise do desempenho da sua loja</p>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Total Vendido</p>
            <DollarSign className="h-5 w-5 text-primary" />
          </div>
          <p className="text-3xl font-bold">R$ {totalSales.toFixed(2)}</p>
          <p className="text-xs text-green-600 mt-1">+12% vs mês anterior</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Pedidos Entregues</p>
            <Package className="h-5 w-5 text-primary" />
          </div>
          <p className="text-3xl font-bold">{totalOrders}</p>
          <p className="text-xs text-green-600 mt-1">+8% vs mês anterior</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Ticket Médio</p>
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <p className="text-3xl font-bold">R$ {averageTicket.toFixed(2)}</p>
          <p className="text-xs text-green-600 mt-1">+5% vs mês anterior</p>
        </Card>
      </div>

      {/* Gráfico de Produtos Mais Vendidos */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Produtos Mais Vendidos</h2>
          <Star className="h-5 w-5 text-muted-foreground" />
        </div>
        
        {products.length > 0 ? (
          <ChartContainer
            config={{
              vendas: {
                label: "Vendas",
                color: "hsl(var(--primary))",
              },
            }}
            className="h-[300px] w-full"
          >
            <BarChart data={topProducts}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="name" 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar 
                dataKey="vendas" 
                fill="hsl(var(--primary))" 
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground">Nenhum produto cadastrado ainda</p>
          </div>
        )}
      </Card>

      {/* Saldo Disponível */}
      <Card className="p-6 bg-gradient-to-br from-primary to-primary/80 text-white">
        <p className="text-sm opacity-90 mb-2">Saldo Disponível para Saque</p>
        <p className="text-4xl font-bold mb-4">R$ {(totalSales * 0.85).toFixed(2)}</p>
        <p className="text-xs opacity-75">Taxa da plataforma: 15%</p>
      </Card>
    </div>
  );
};

export default Estatisticas;
