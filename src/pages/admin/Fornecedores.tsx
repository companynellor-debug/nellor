import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Store, TrendingUp, Loader2, Shield, UserX, Star, Ban, Trash2, CheckCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { formatCurrency } from "@/utils/formatCurrency";
import { useAdminOrders, useAdminProfiles } from "@/hooks/useAdminPrefetch";

const Fornecedores = () => {
  const { orders, loading: ordersLoading } = useAdminOrders();
  const { profiles, loading: profilesLoading, refetch } = useAdminProfiles();
  const loading = ordersLoading || profilesLoading;
  const [selectedFornecedor, setSelectedFornecedor] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: 'ban' | 'unban' | 'delete'; fornecedor: any } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const { fornecedores, topSuppliers, topSupplier, novosNoMes } = useMemo(() => {
    const fornecedoresList = profiles.filter((p) => p.tipo === "fornecedor");
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const novos = fornecedoresList.filter((f) => new Date(f.created_at) >= startOfMonth).length;
    const paidOrders = orders.filter((o) => o.payment_status === "paid" && o.order_status !== "cancelled");
    const fornecedoresData = fornecedoresList.map((fornecedor) => {
      const pedidosFornecedor = paidOrders.filter((o) => o.supplier_id === fornecedor.id);
      const receita = pedidosFornecedor.reduce((sum, o) => sum + Number(o.total), 0);
      return {
        id: fornecedor.id,
        name: fornecedor.nome,
        email: fornecedor.email,
        category: "Diversos",
        orders: pedidosFornecedor.length,
        revenue: receita,
        vendas: receita,
        plano: "Grátis",
        verified: true,
        lastPayout: null,
        ativo: fornecedor.ativo !== false,
      };
    });
    const top5 = [...fornecedoresData].sort((a, b) => b.vendas - a.vendas).slice(0, 5).map(f => ({ name: f.name, vendas: f.vendas }));
    return { fornecedores: fornecedoresData, topSuppliers: top5, topSupplier: top5[0] || null, novosNoMes: novos };
  }, [orders, profiles]);

  const handleViewDetails = (fornecedor: any) => {
    setSelectedFornecedor(fornecedor);
    setShowDetailsModal(true);
  };

  const executeAction = async () => {
    if (!confirmAction) return;
    setActionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-user-actions', {
        body: { action: confirmAction.type, user_id: confirmAction.fornecedor.id }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const messages = {
        ban: `Fornecedor ${confirmAction.fornecedor.name} banido com sucesso`,
        unban: `Fornecedor ${confirmAction.fornecedor.name} desbanido com sucesso`,
        delete: `Fornecedor ${confirmAction.fornecedor.name} excluído permanentemente`,
      };
      toast.success(messages[confirmAction.type]);
      setConfirmAction(null);
      refetch();
    } catch (error: any) {
      console.error('Action error:', error);
      toast.error('Erro ao executar ação: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const statsCards = [
    { title: "Fornecedores Ativos", value: fornecedores.filter(f => f.ativo).length.toString(), icon: Store, color: "from-purple-500 to-purple-600" },
    { title: "Novos no Mês", value: novosNoMes.toString(), icon: TrendingUp, color: "from-green-500 to-green-600" },
    { title: "Contas Verificadas", value: fornecedores.filter(f => f.verified).length.toString(), icon: Shield, color: "from-blue-500 to-blue-600" },
    { title: "Maior Volume", value: topSupplier?.name || "-", icon: Star, color: "from-yellow-500 to-yellow-600" },
  ];

  if (loading && fornecedores.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando fornecedores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-900 to-violet-900 bg-clip-text mb-2 text-slate-50">
            🏢 Fornecedores
          </h1>
          <p className="text-muted-foreground">Acompanhamento de lojas e verificação de contas</p>
        </div>
        {loading && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map(stat => (
          <Card key={stat.title} className="border-purple-100 hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
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
                    <TableHead>Pedidos</TableHead>
                    <TableHead>Total Vendido</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fornecedores.length > 0 ? fornecedores.slice(0, 20).map((supplier) => (
                    <TableRow key={supplier.id} className="hover:bg-purple-50/50">
                      <TableCell className="font-medium">
                        <div>
                          <p>{supplier.name}</p>
                          <p className="text-xs text-muted-foreground">{supplier.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{supplier.orders}</TableCell>
                      <TableCell>{formatCurrency(supplier.revenue)}</TableCell>
                      <TableCell>
                        {supplier.ativo ? (
                          <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                        ) : (
                          <Badge variant="destructive">Banido</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => handleViewDetails(supplier)} title="Ver detalhes">
                            <Shield className="h-4 w-4" />
                          </Button>
                          {supplier.ativo ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setConfirmAction({ type: 'ban', fornecedor: supplier })}
                              title="Banir fornecedor"
                              className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setConfirmAction({ type: 'unban', fornecedor: supplier })}
                              title="Desbanir fornecedor"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setConfirmAction({ type: 'delete', fornecedor: supplier })}
                            title="Excluir permanentemente"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">Nenhum fornecedor cadastrado</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-purple-100">
            <CardHeader><CardTitle>Top 5 Vendedores</CardTitle></CardHeader>
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
            <CardHeader><CardTitle className="text-lg">⭐ Destaque da Semana</CardTitle></CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">{topSupplier?.name || 'N/A'}</div>
                <p className="text-sm mt-2">{topSupplier ? `${formatCurrency(topSupplier.vendas)} em vendas` : 'Sem dados'}</p>
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

      {/* Modal de Detalhes */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do Fornecedor</DialogTitle>
            <DialogDescription>Informações da conta e verificação</DialogDescription>
          </DialogHeader>
          {selectedFornecedor && (
            <div className="space-y-4">
              <div><p className="text-sm text-muted-foreground">Fornecedor</p><p className="font-medium">{selectedFornecedor.name}</p></div>
              <div><p className="text-sm text-muted-foreground">Email</p><p className="font-medium">{selectedFornecedor.email}</p></div>
              <div><p className="text-sm text-muted-foreground">Total Vendido</p><p className="font-medium">{formatCurrency(selectedFornecedor.revenue)}</p></div>
              <div><p className="text-sm text-muted-foreground">Pedidos</p><p className="font-medium">{selectedFornecedor.orders}</p></div>
              <div className="flex gap-2 pt-2">
                {selectedFornecedor.ativo ? (
                  <Button variant="outline" className="text-orange-600 border-orange-200" onClick={() => { setShowDetailsModal(false); setConfirmAction({ type: 'ban', fornecedor: selectedFornecedor }); }}>
                    <Ban className="h-4 w-4 mr-2" /> Banir
                  </Button>
                ) : (
                  <Button variant="outline" className="text-green-600 border-green-200" onClick={() => { setShowDetailsModal(false); setConfirmAction({ type: 'unban', fornecedor: selectedFornecedor }); }}>
                    <CheckCircle className="h-4 w-4 mr-2" /> Desbanir
                  </Button>
                )}
                <Button variant="destructive" onClick={() => { setShowDetailsModal(false); setConfirmAction({ type: 'delete', fornecedor: selectedFornecedor }); }}>
                  <Trash2 className="h-4 w-4 mr-2" /> Excluir Permanentemente
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação */}
      <Dialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmAction?.type === 'ban' && '🚫 Banir Fornecedor'}
              {confirmAction?.type === 'unban' && '✅ Desbanir Fornecedor'}
              {confirmAction?.type === 'delete' && '⚠️ Excluir Permanentemente'}
            </DialogTitle>
            <DialogDescription>
              {confirmAction?.type === 'ban' && `Banir "${confirmAction.fornecedor?.name}" impedirá que ele acesse a plataforma. Você pode desbanir depois.`}
              {confirmAction?.type === 'unban' && `Desbanir "${confirmAction.fornecedor?.name}" vai restaurar o acesso à plataforma.`}
              {confirmAction?.type === 'delete' && `ATENÇÃO: Excluir "${confirmAction.fornecedor?.name}" é uma ação IRREVERSÍVEL. O usuário e todos os seus dados de autenticação serão removidos permanentemente do sistema.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmAction(null)} disabled={actionLoading}>Cancelar</Button>
            <Button
              variant={confirmAction?.type === 'unban' ? 'default' : 'destructive'}
              onClick={executeAction}
              disabled={actionLoading}
            >
              {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {confirmAction?.type === 'ban' && 'Confirmar Ban'}
              {confirmAction?.type === 'unban' && 'Confirmar Desban'}
              {confirmAction?.type === 'delete' && 'Excluir Permanentemente'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Fornecedores;
