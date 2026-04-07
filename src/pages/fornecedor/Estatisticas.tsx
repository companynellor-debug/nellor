import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { TrendingUp, Package, DollarSign, Star, Loader2 } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/utils/formatCurrency";

const Estatisticas = () => {
  const [loading, setLoading] = useState(true);
  const [totalSales, setTotalSales] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [averageTicket, setAverageTicket] = useState(0);
  const [supplierBalance, setSupplierBalance] = useState(0);
  const [topProducts, setTopProducts] = useState<{ name: string; vendas: number }[]>([]);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch ALL supplier orders (not paginated) excluding cancelled
      const { data: orders, error: ordersErr } = await supabase
        .from('orders')
        .select('total, order_status, payment_status, supplier_amount')
        .eq('supplier_id', user.id)
        .neq('order_status', 'cancelled');

      if (ordersErr) throw ordersErr;

      const paidOrders = (orders || []).filter(o => o.payment_status === 'paid');
      const sales = paidOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
      const count = paidOrders.length;
      const balance = paidOrders.reduce((sum, o) => sum + Number(o.supplier_amount || o.total * 0.925), 0);

      setTotalSales(sales);
      setTotalOrders(count);
      setAverageTicket(count > 0 ? sales / count : 0);
      setSupplierBalance(balance);

      // Fetch top products by vendas_count
      const { data: prods, error: prodsErr } = await supabase
        .from('products')
        .select('nome, vendas_count')
        .eq('supplier_id', user.id)
        .eq('ativo', true)
        .order('vendas_count', { ascending: false })
        .limit(5);

      if (prodsErr) throw prodsErr;

      setTopProducts((prods || []).map(p => ({
        name: (p.nome || '').substring(0, 20),
        vendas: p.vendas_count || 0
      })));
    } catch (e) {
      console.error('Error fetching stats:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 pb-20 md:pb-6 w-full max-w-full overflow-x-hidden">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">Estatísticas</h1>
        <p className="text-sm md:text-base text-muted-foreground">Análise do desempenho da sua loja</p>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
        <Card className="p-4 md:p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs md:text-sm text-muted-foreground">Total Vendido</p>
            <DollarSign className="h-4 w-4 md:h-5 md:w-5 text-primary" />
          </div>
          <p className="text-2xl md:text-3xl font-bold">{formatCurrency(totalSales)}</p>
          <p className="text-xs text-muted-foreground mt-1">Pedidos pagos (exceto cancelados)</p>
        </Card>

        <Card className="p-4 md:p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs md:text-sm text-muted-foreground">Pedidos Pagos</p>
            <Package className="h-4 w-4 md:h-5 md:w-5 text-primary" />
          </div>
          <p className="text-2xl md:text-3xl font-bold">{totalOrders}</p>
          <p className="text-xs text-muted-foreground mt-1">Total de pedidos confirmados</p>
        </Card>

        <Card className="p-4 md:p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs md:text-sm text-muted-foreground">Ticket Médio</p>
            <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-primary" />
          </div>
          <p className="text-2xl md:text-3xl font-bold">{formatCurrency(averageTicket)}</p>
          <p className="text-xs text-muted-foreground mt-1">Valor médio por pedido</p>
        </Card>
      </div>

      {/* Gráfico de Produtos Mais Vendidos */}
      <Card className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h2 className="text-lg md:text-xl font-bold">Produtos Mais Vendidos</h2>
          <Star className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
        </div>
        
        {topProducts.length > 0 && topProducts.some(p => p.vendas > 0) ? (
          <div className="w-full overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
            <ChartContainer
              config={{
                vendas: {
                  label: "Vendas",
                  color: "hsl(var(--primary))",
                },
              }}
              className="h-[250px] md:h-[300px] min-w-[300px] w-full"
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
          </div>
        ) : (
          <div className="h-[250px] md:h-[300px] flex items-center justify-center">
            <p className="text-sm md:text-base text-muted-foreground">Nenhuma venda registrada ainda</p>
          </div>
        )}
      </Card>

      {/* Saldo Disponível */}
      <Card className="p-4 md:p-6 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
        <p className="text-xs md:text-sm opacity-90 mb-2">Saldo Disponível para Saque</p>
        <p className="text-3xl md:text-4xl font-bold mb-3 md:mb-4">{formatCurrency(supplierBalance)}</p>
        <p className="text-xs opacity-75">Comissão da plataforma: 7,5%</p>
      </Card>
    </div>
  );
};

export default Estatisticas;
