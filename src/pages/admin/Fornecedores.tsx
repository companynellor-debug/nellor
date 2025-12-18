import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Store, TrendingUp, Loader2, CreditCard, RefreshCw, UserX, Star } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { fetchAdminOrders, fetchAdminProfiles } from "@/lib/adminRpc";

const Fornecedores = () => {
  const [loading, setLoading] = useState(true);
  const [totalFornecedores, setTotalFornecedores] = useState(0);
  const [novosNoMes, setNovosNoMes] = useState(0);
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [topSuppliers, setTopSuppliers] = useState<any[]>([]);
  const [topSupplier, setTopSupplier] = useState<any>(null);
  const [selectedFornecedor, setSelectedFornecedor] = useState<any>(null);
  const [showReconnectModal, setShowReconnectModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Buscar fornecedores via RPC (bypass RLS)
      const profiles = await fetchAdminProfiles();
      const fornecedoresList = profiles
        .filter((p) => p.tipo === "fornecedor")
        .map((p) => ({ ...p, created_at: p.created_at }));

      setTotalFornecedores(fornecedoresList.length);

      // Fornecedores novos no mês
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const novos = fornecedoresList.filter((f) => new Date(f.created_at) >= startOfMonth).length;
      setNovosNoMes(novos);

      // Buscar produtos e pedidos por fornecedor
      const { data: products } = await supabase.from("products").select("supplier_id, categoria_id, categories(nome)");

      const orders = (await fetchAdminOrders()).filter(
        (o) => o.payment_status === "paid" && o.order_status !== "cancelled"
      );

      // Calcular dados dos fornecedores com faturamento REAL
      const fornecedoresData = fornecedoresList.map((fornecedor) => {
        const produtosFornecedor = products?.filter((p) => p.supplier_id === fornecedor.id) || [];
        const pedidosFornecedor = orders?.filter((o) => o.supplier_id === fornecedor.id) || [];
        const receita = pedidosFornecedor.reduce((sum, o) => sum + Number(o.total), 0);
        const categoria = (produtosFornecedor[0] as any)?.categories?.nome || "Diversos";

        return {
          id: fornecedor.id,
          name: fornecedor.nome,
          email: fornecedor.email,
          category: categoria,
          orders: pedidosFornecedor.length,
          revenue: receita,
          vendas: receita,
          plano: "Grátis",
          stripeConnected: !!fornecedor.stripe_account_id,
          stripeAccountId: fornecedor.stripe_account_id,
          lastPayout: null,
          ativo: fornecedor.ativo !== false,
        };
      });

      setFornecedores(fornecedoresData);

      // Top 5 vendedores por faturamento real
      const top5 = [...fornecedoresData]
        .sort((a, b) => b.vendas - a.vendas)
        .slice(0, 5)
        .map(f => ({ name: f.name, vendas: f.vendas }));
      setTopSuppliers(top5);

      if (top5.length > 0) {
        setTopSupplier(top5[0]);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleForceReconnect = (fornecedor: any) => {
    setSelectedFornecedor(fornecedor);
    setShowReconnectModal(true);
  };

  const handleDeactivate = async (fornecedor: any) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ ativo: false })
        .eq('id', fornecedor.id);

      if (error) throw error;
      
      toast.success(`Fornecedor ${fornecedor.name} desativado`);
      fetchData();
    } catch (error) {
      console.error('Error deactivating:', error);
      toast.error('Erro ao desativar fornecedor');
    }
  };

  const handleActivate = async (fornecedor: any) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ ativo: true })
        .eq('id', fornecedor.id);

      if (error) throw error;
      
      toast.success(`Fornecedor ${fornecedor.name} ativado`);
      fetchData();
    } catch (error) {
      console.error('Error activating:', error);
      toast.error('Erro ao ativar fornecedor');
    }
  };


  const statsCards = [
    {
      title: "Fornecedores Ativos",
      value: fornecedores.filter(f => f.ativo).length.toString(),
      icon: Store,
      color: "from-purple-500 to-purple-600"
    },
    {
      title: "Novos no Mês",
      value: novosNoMes.toString(),
      icon: TrendingUp,
      color: "from-green-500 to-green-600"
    },
    {
      title: "Com Stripe Conectado",
      value: fornecedores.filter(f => f.stripeConnected).length.toString(),
      icon: CreditCard,
      color: "from-blue-500 to-blue-600"
    },
    {
      title: "Maior Volume",
      value: topSupplier?.name || "-",
      icon: Star,
      color: "from-yellow-500 to-yellow-600"
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-900 to-violet-900 bg-clip-text mb-2 text-slate-50">
          🏢 Fornecedores
        </h1>
        <p className="text-muted-foreground">Acompanhamento de lojas e integração Stripe Connect</p>
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
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-purple-100">
          <CardHeader>
            <CardTitle>Desempenho dos Fornecedores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Loja</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Stripe</TableHead>
                    <TableHead>Pedidos</TableHead>
                    <TableHead>Total Vendido</TableHead>
                    <TableHead>Último Payout</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fornecedores.length > 0 ? fornecedores.slice(0, 10).map((supplier) => (
                    <TableRow key={supplier.id} className="hover:bg-purple-50/50">
                      <TableCell className="font-medium">
                        <div>
                          <p>{supplier.name}</p>
                          <p className="text-xs text-muted-foreground">{supplier.category}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={supplier.plano === 'Premium' ? 'default' : 'secondary'}>
                          {supplier.plano}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {supplier.stripeConnected ? (
                          <Badge className="bg-green-100 text-green-800">Conectado</Badge>
                        ) : (
                          <Badge variant="outline" className="text-amber-600 border-amber-600">
                            Pendente
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{supplier.orders}</TableCell>
                      <TableCell>R$ {supplier.revenue.toFixed(2)}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {supplier.lastPayout || '---'}
                        {/* TODO: Popular via Stripe API */}
                      </TableCell>
                      <TableCell>
                        {supplier.ativo ? (
                          <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                        ) : (
                          <Badge variant="destructive">Inativo</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleForceReconnect(supplier)}
                            title="Forçar reconexão Stripe"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          {supplier.ativo ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeactivate(supplier)}
                              title="Desativar fornecedor"
                              className="text-red-600 hover:text-red-700"
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleActivate(supplier)}
                              title="Ativar fornecedor"
                              className="text-green-600 hover:text-green-700"
                            >
                              <Store className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground">
                        Nenhum fornecedor cadastrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
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

          <Card className="border-purple-100 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950 dark:to-violet-950">
            <CardHeader>
              <CardTitle className="text-lg">⭐ Destaque da Semana</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {topSupplier?.name || 'N/A'}
                </div>
                <p className="text-sm mt-2">
                  {topSupplier ? `R$ ${topSupplier.vendas.toFixed(2)} em vendas` : 'Sem dados'}
                </p>
                {topSupplier && (
                  <div className="flex items-center justify-center gap-2 mt-3">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-bold text-lg">4.8</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de Forçar Reconexão */}
      <Dialog open={showReconnectModal} onOpenChange={setShowReconnectModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Forçar Reconexão Stripe</DialogTitle>
            <DialogDescription>
              Instruções para reconectar a conta Stripe do fornecedor
            </DialogDescription>
          </DialogHeader>
          {selectedFornecedor && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Fornecedor</p>
                <p className="font-medium">{selectedFornecedor.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{selectedFornecedor.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status Stripe</p>
                <p className="font-medium">
                  {selectedFornecedor.stripeConnected ? 'Conectado' : 'Não conectado'}
                </p>
              </div>
              
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">Instruções:</h4>
                <ol className="text-sm space-y-2 list-decimal list-inside">
                  <li>Entre em contato com o fornecedor</li>
                  <li>Solicite que ele acesse o painel e clique em "Conectar Stripe"</li>
                  <li>Caso haja problemas, ele pode desconectar e reconectar via Stripe Dashboard</li>
                </ol>
              </div>

              <Button 
                className="w-full"
                onClick={() => {
                  // TODO: Implementar envio de link de reconexão via email
                  toast.info("Funcionalidade de envio de link será implementada após integração Stripe");
                  setShowReconnectModal(false);
                }}
              >
                Enviar Link de Reconexão (em breve)
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Fornecedores;
