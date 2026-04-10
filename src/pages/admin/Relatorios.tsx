import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Loader2 } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { subDays, subMonths, startOfMonth } from "date-fns";
import { fetchAdminOrders, fetchAdminProfiles, AdminOrder, AdminProfile } from "@/lib/adminRpc";
import { formatCurrency } from "@/utils/formatCurrency";

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const Relatorios = () => {
  const [loading, setLoading] = useState(true);
  const [allOrders, setAllOrders] = useState<AdminOrder[]>([]);
  const [allProfiles, setAllProfiles] = useState<AdminProfile[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [periodDays, setPeriodDays] = useState("30");

  // Derived filtered data
  const cutoff = periodDays === "all" ? null : subDays(new Date(), Number(periodDays));
  
  const orders = allOrders.filter(o => {
    if (o.order_status === 'cancelled') return false;
    if (cutoff && new Date(o.created_at) < cutoff) return false;
    return true;
  });

  const clientes = allProfiles.filter(p => p.tipo === 'cliente');
  const fornecedores = allProfiles.filter(p => p.tipo === 'fornecedor');

  const clientesNoPeriodo = cutoff
    ? clientes.filter(c => new Date(c.created_at) >= cutoff).length
    : clientes.length;
  const fornecedoresNoPeriodo = cutoff
    ? fornecedores.filter(f => new Date(f.created_at) >= cutoff).length
    : fornecedores.length;

  const gmvTotal = orders.reduce((s, o) => s + Number(o.total), 0);

  // Growth chart (cumulative last 6 months, always full range)
  const growthData = (() => {
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      data.push({
        month: MESES[date.getMonth()],
        clientes: clientes.filter(c => new Date(c.created_at) <= endOfMonth).length,
        fornecedores: fornecedores.filter(f => new Date(f.created_at) <= endOfMonth).length,
      });
    }
    return data;
  })();

  // Category revenue
  const categoryRevenueData = (() => {
    const productCategoryMap: Record<string, string> = {};
    allProducts.forEach(p => {
      productCategoryMap[p.id] = (p.categories as any)?.nome || 'Outros';
    });
    const rev: Record<string, number> = {};
    orders.forEach(order => {
      const itens = (order.itens as any) || [];
      if (Array.isArray(itens)) {
        itens.forEach((item: any) => {
          const cat = productCategoryMap[item.product_id || item.productId] || 'Outros';
          rev[cat] = (rev[cat] || 0) + (item.quantity || 1) * (item.price || item.preco || 0);
        });
      }
    });
    return Object.entries(rev)
      .map(([category, revenue]) => ({ category, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  })();

  // State data
  const stateData = (() => {
    const counts: Record<string, number> = {};
    orders.forEach(order => {
      if (order.endereco_entrega && typeof order.endereco_entrega === 'object') {
        const state = (order.endereco_entrega as any).state || 'N/A';
        counts[state] = (counts[state] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([state, count]) => ({ state, orders: count }))
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 6);
  })();

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [profiles, ordersList, { data: products }] = await Promise.all([
          fetchAdminProfiles(),
          fetchAdminOrders(),
          supabase.from('products').select('id, categoria_id, categories(nome)')
        ]);
        setAllProfiles(profiles);
        setAllOrders(ordersList);
        setAllProducts(products || []);
      } catch (e) {
        console.error('Error fetching report data:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-900 to-violet-900 bg-clip-text mb-2 text-slate-50">
            📊 Relatórios
          </h1>
          <p className="text-muted-foreground">Central de análise e insights</p>
        </div>
        <Button className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700">
          <Download className="w-4 h-4 mr-2" />
          Gerar PDF
        </Button>
      </div>

      <Card className="border-purple-100">
        <CardHeader>
          <div className="flex gap-4 items-center">
            <div className="flex-1"><CardTitle>Filtros</CardTitle></div>
            <Select value={periodDays} onValueChange={setPeriodDays}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="14">Últimos 14 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 3 meses</SelectItem>
                <SelectItem value="365">Último ano</SelectItem>
                <SelectItem value="all">Todo o período</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-purple-100">
          <CardHeader><CardTitle>📈 Crescimento: Clientes vs Fornecedores</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="clientes" stroke="#3B82F6" strokeWidth={2} name="Clientes" />
                <Line type="monotone" dataKey="fornecedores" stroke="#8B5CF6" strokeWidth={2} name="Fornecedores" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-purple-100">
          <CardHeader><CardTitle>💰 Receita por Categoria</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryRevenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="category" stroke="#6b7280" />
                <YAxis stroke="#6b7280" tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="revenue" fill="#8B5CF6" radius={[8, 8, 0, 0]} name="Receita" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-purple-100">
          <CardHeader><CardTitle>🗺️ Pedidos por Estado</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stateData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" stroke="#6b7280" />
                <YAxis dataKey="state" type="category" stroke="#6b7280" width={60} />
                <Tooltip />
                <Bar dataKey="orders" fill="#6366F1" radius={[0, 8, 8, 0]} name="Pedidos" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-purple-100 bg-gradient-to-br from-purple-50 to-violet-50">
          <CardHeader>
            <CardTitle className="text-stone-950">📋 Resumo do Período</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex justify-between items-center py-3 border-b">
             <span className="text-sm text-muted-foreground">Total de Pedidos</span>
              <span className="font-bold text-2xl text-neutral-700">{orders.length.toLocaleString('pt-BR')}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b">
              <span className="text-sm text-muted-foreground">Volume Total</span>
              <span className="font-bold text-2xl text-neutral-700">{formatCurrency(gmvTotal)}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b">
              <span className="text-sm text-muted-foreground">Novos Clientes</span>
              <span className="font-bold text-2xl text-blue-700">{clientesNoPeriodo.toLocaleString('pt-BR')}</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-sm text-muted-foreground">Novos Fornecedores</span>
              <span className="font-bold text-2xl text-purple-700">{fornecedoresNoPeriodo.toLocaleString('pt-BR')}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Relatorios;
