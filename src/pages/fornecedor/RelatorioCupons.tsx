import { useState, useEffect } from "react";
import { formatCurrency } from "@/utils/formatCurrency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Tag, 
  Percent, 
  DollarSign, 
  TrendingUp,
  TrendingDown,
  BarChart3,
  ShoppingCart,
  Users,
  ArrowLeft,
  Loader2,
  Calendar,
  Target,
  Wallet
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

interface CouponWithStats {
  id: string;
  codigo: string;
  tipo: 'percentage' | 'fixed';
  valor: number;
  uso_atual: number;
  uso_maximo: number | null;
  ativo: boolean;
  created_at: string;
  expira_em: string | null;
  product?: { nome: string } | null;
  orders_count: number;
  total_discount: number;
  total_revenue: number;
  conversion_rate: number;
}

interface CouponStats {
  totalCoupons: number;
  activeCoupons: number;
  totalUses: number;
  totalDiscount: number;
  totalRevenue: number;
  averageOrderValue: number;
  conversionRate: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', '#22c55e', '#f59e0b', '#ef4444'];

const RelatorioCupons = () => {
  const [coupons, setCoupons] = useState<CouponWithStats[]>([]);
  const [stats, setStats] = useState<CouponStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30");
  const [usageByDay, setUsageByDay] = useState<{ date: string; uses: number; revenue: number }[]>([]);

  useEffect(() => {
    fetchCouponStats();
  }, [period]);

  const fetchCouponStats = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch coupons
      const { data: couponsData, error: couponsError } = await supabase
        .from('coupons')
        .select(`
          *,
          product:products(nome)
        `)
        .eq('supplier_id', user.id)
        .order('uso_atual', { ascending: false });

      if (couponsError) throw couponsError;

      // Fetch orders with discounts
      const startDate = subDays(new Date(), parseInt(period));
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('supplier_id', user.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (ordersError) throw ordersError;

      // Calculate stats per coupon
      const ordersWithDiscount = ordersData?.filter(o => o.desconto && o.desconto > 0) || [];
      
      const couponStats: CouponWithStats[] = (couponsData || []).map(coupon => {
        // Estimate orders that used this coupon based on discount value
        const matchingOrders = ordersWithDiscount.filter(o => {
          if (coupon.tipo === 'fixed') {
            return Math.abs(o.desconto - coupon.valor) < 0.01;
          }
          // For percentage, we can't be 100% sure, distribute proportionally
          return true;
        });

        const ordersCount = Math.min(coupon.uso_atual, matchingOrders.length);
        const totalDiscount = coupon.tipo === 'fixed' 
          ? coupon.uso_atual * coupon.valor
          : matchingOrders.slice(0, coupon.uso_atual).reduce((sum, o) => sum + (o.desconto || 0), 0);
        const totalRevenue = matchingOrders.slice(0, ordersCount).reduce((sum, o) => sum + o.total, 0);

        return {
          ...coupon,
          orders_count: ordersCount,
          total_discount: totalDiscount,
          total_revenue: totalRevenue,
          conversion_rate: coupon.uso_maximo ? (coupon.uso_atual / coupon.uso_maximo) * 100 : 0,
        };
      });

      setCoupons(couponStats);

      // Calculate overall stats
      const totalCoupons = couponsData?.length || 0;
      const activeCoupons = couponsData?.filter(c => c.ativo).length || 0;
      const totalUses = couponsData?.reduce((sum, c) => sum + (c.uso_atual || 0), 0) || 0;
      const totalDiscount = ordersWithDiscount.reduce((sum, o) => sum + (o.desconto || 0), 0);
      const totalRevenue = ordersWithDiscount.reduce((sum, o) => sum + o.total, 0);
      const averageOrderValue = ordersWithDiscount.length > 0 ? totalRevenue / ordersWithDiscount.length : 0;
      const totalOrders = ordersData?.length || 0;
      const conversionRate = totalOrders > 0 ? (ordersWithDiscount.length / totalOrders) * 100 : 0;

      setStats({
        totalCoupons,
        activeCoupons,
        totalUses,
        totalDiscount,
        totalRevenue,
        averageOrderValue,
        conversionRate,
      });

      // Calculate usage by day
      const usageMap = new Map<string, { uses: number; revenue: number }>();
      for (let i = parseInt(period); i >= 0; i--) {
        const date = format(subDays(new Date(), i), 'dd/MM');
        usageMap.set(date, { uses: 0, revenue: 0 });
      }

      ordersWithDiscount.forEach(order => {
        const date = format(new Date(order.created_at), 'dd/MM');
        const existing = usageMap.get(date) || { uses: 0, revenue: 0 };
        usageMap.set(date, {
          uses: existing.uses + 1,
          revenue: existing.revenue + order.total
        });
      });

      setUsageByDay(Array.from(usageMap.entries()).map(([date, data]) => ({
        date,
        uses: data.uses,
        revenue: data.revenue
      })));

    } catch (error) {
      console.error('Error fetching coupon stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const pieData = coupons.slice(0, 5).map((coupon, index) => ({
    name: coupon.codigo,
    value: coupon.uso_atual,
    fill: COLORS[index % COLORS.length]
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/fornecedor/cupons">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Relatório de Cupons</h1>
            <p className="text-muted-foreground">Métricas de uso e conversão</p>
          </div>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="60">Últimos 60 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Tag className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Cupons</p>
                <p className="text-2xl font-bold">{stats?.totalCoupons || 0}</p>
                <p className="text-xs text-muted-foreground">{stats?.activeCoupons || 0} ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <ShoppingCart className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Usos Totais</p>
                <p className="text-2xl font-bold">{stats?.totalUses || 0}</p>
                <p className="text-xs text-muted-foreground">no período</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Percent className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Taxa Conversão</p>
                <p className="text-2xl font-bold">{stats?.conversionRate.toFixed(1) || 0}%</p>
                <p className="text-xs text-muted-foreground">pedidos com cupom</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Wallet className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ticket Médio</p>
                <p className="text-2xl font-bold">
                  R$ {stats?.averageOrderValue.toFixed(2).replace('.', ',') || '0,00'}
                </p>
                <p className="text-xs text-muted-foreground">com cupom</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Receita com Cupons</p>
                <p className="text-3xl font-bold text-green-500">
                  R$ {stats?.totalRevenue.toFixed(2).replace('.', ',') || '0,00'}
                </p>
              </div>
              <TrendingUp className="h-10 w-10 text-green-500/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total em Descontos</p>
                <p className="text-3xl font-bold text-orange-500">
                  R$ {stats?.totalDiscount.toFixed(2).replace('.', ',') || '0,00'}
                </p>
              </div>
              <TrendingDown className="h-10 w-10 text-orange-500/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage Over Time */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Uso ao Longo do Tempo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ uses: { label: "Usos", color: "hsl(var(--primary))" } }} className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={usageByDay.slice(-14)}>
                  <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="uses" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Coupon Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Distribuição por Cupom
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ChartContainer config={{ value: { label: "Usos" } }} className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                Nenhum uso registrado
              </div>
            )}
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              {pieData.map((item, index) => (
                <div key={item.name} className="flex items-center gap-1.5 text-sm">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Desempenho por Cupom</CardTitle>
        </CardHeader>
        <CardContent>
          {coupons.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Tag className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum cupom encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium text-muted-foreground">Cupom</th>
                    <th className="pb-3 font-medium text-muted-foreground text-center">Tipo</th>
                    <th className="pb-3 font-medium text-muted-foreground text-center">Valor</th>
                    <th className="pb-3 font-medium text-muted-foreground text-center">Usos</th>
                    <th className="pb-3 font-medium text-muted-foreground text-center">Limite</th>
                    <th className="pb-3 font-medium text-muted-foreground text-right">Desconto Total</th>
                    <th className="pb-3 font-medium text-muted-foreground text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((coupon) => {
                    const isExpired = coupon.expira_em && new Date(coupon.expira_em) < new Date();
                    const usagePercent = coupon.uso_maximo 
                      ? Math.round((coupon.uso_atual / coupon.uso_maximo) * 100)
                      : null;

                    return (
                      <tr key={coupon.id} className="border-b last:border-0">
                        <td className="py-4">
                          <div>
                            <code className="font-bold bg-muted px-2 py-1 rounded text-sm">
                              {coupon.codigo}
                            </code>
                            {coupon.product && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {coupon.product.nome}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-4 text-center">
                          {coupon.tipo === 'percentage' ? (
                            <Badge variant="secondary">
                              <Percent className="h-3 w-3 mr-1" />
                              Percentual
                            </Badge>
                          ) : (
                            <Badge variant="outline">
                              <DollarSign className="h-3 w-3 mr-1" />
                              Fixo
                            </Badge>
                          )}
                        </td>
                        <td className="py-4 text-center font-medium">
                          {coupon.tipo === 'percentage' 
                            ? `${coupon.valor}%`
                            : formatCurrency(coupon.valor)
                          }
                        </td>
                        <td className="py-4 text-center">
                          <span className="font-bold text-primary">{coupon.uso_atual}</span>
                        </td>
                        <td className="py-4 text-center">
                          {coupon.uso_maximo ? (
                            <div className="flex flex-col items-center">
                              <span>{coupon.uso_maximo}</span>
                              {usagePercent !== null && (
                                <div className="w-16 h-1.5 bg-muted rounded-full mt-1">
                                  <div 
                                    className="h-full bg-primary rounded-full" 
                                    style={{ width: `${Math.min(usagePercent, 100)}%` }}
                                  />
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">∞</span>
                          )}
                        </td>
                        <td className="py-4 text-right font-medium">
                          R$ {coupon.total_discount.toFixed(2).replace('.', ',')}
                        </td>
                        <td className="py-4 text-center">
                          {isExpired ? (
                            <Badge variant="destructive">Expirado</Badge>
                          ) : coupon.ativo ? (
                            <Badge className="bg-green-500 hover:bg-green-600">Ativo</Badge>
                          ) : (
                            <Badge variant="secondary">Inativo</Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RelatorioCupons;
