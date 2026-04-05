import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Users, UserPlus, DollarSign, Loader2, Percent, Ban, Trash2, CheckCircle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, subMonths, startOfMonth } from "date-fns";
import { useMemo, useState } from "react";
import { useAdminOrders, useAdminProfiles } from "@/hooks/useAdminPrefetch";
import { formatCurrency } from "@/utils/formatCurrency";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Usuarios = () => {
  const { orders, loading: ordersLoading } = useAdminOrders();
  const { profiles, loading: profilesLoading, refetch } = useAdminProfiles();
  const loading = ordersLoading || profilesLoading;
  const [confirmAction, setConfirmAction] = useState<{ type: 'ban' | 'unban' | 'delete'; user: any } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const { totalClientes, novosNoMes, ticketMedio, taxaRetencao, totalGasto, clientes, growthData } = useMemo(() => {
    const clientesList = profiles.filter((p) => p.tipo === "cliente");
    const total = clientesList.length;
    const startOfCurrentMonth = startOfMonth(new Date());
    const novos = clientesList.filter((c) => new Date(c.created_at) >= startOfCurrentMonth).length;
    const paidOrders = orders.filter((o) => o.payment_status === "paid" && o.order_status !== "cancelled");
    let ticket = 0;
    let totalReceita = 0;
    if (paidOrders.length > 0) {
      totalReceita = paidOrders.reduce((sum, order) => sum + Number(order.total), 0);
      ticket = totalReceita / paidOrders.length;
    }
    const pedidosPorCliente: Record<string, number> = {};
    paidOrders.forEach(order => {
      if (order.buyer_id) pedidosPorCliente[order.buyer_id] = (pedidosPorCliente[order.buyer_id] || 0) + 1;
    });
    const clientesComPedidos = Object.keys(pedidosPorCliente).length;
    const clientesRecorrentes = Object.values(pedidosPorCliente).filter(count => count > 1).length;
    const retencao = clientesComPedidos > 0 ? (clientesRecorrentes / clientesComPedidos) * 100 : 0;
    const clientesComPedidosList = clientesList.slice(0, 20).map(cliente => {
      const pedidosCliente = paidOrders.filter(o => o.buyer_id === cliente.id);
      const totalGastoCliente = pedidosCliente.reduce((sum, o) => sum + Number(o.total), 0);
      const ultimoPedido = pedidosCliente.length > 0
        ? format(new Date(Math.max(...pedidosCliente.map(o => new Date(o.created_at).getTime()))), 'dd/MM/yyyy')
        : '-';
      return {
        id: cliente.id,
        name: cliente.nome || 'Sem nome',
        email: cliente.email,
        lastOrder: ultimoPedido,
        totalSpent: totalGastoCliente,
        orders: pedidosCliente.length,
        createdAt: format(new Date(cliente.created_at), 'dd/MM/yyyy'),
        ativo: cliente.ativo !== false,
      };
    });
    const growth = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthStart = startOfMonth(date);
      const countUntilMonth = clientesList.filter((c) => new Date(c.created_at) <= monthStart).length;
      const novosNoMes = clientesList.filter((c) => {
        const createdAt = new Date(c.created_at);
        return createdAt.getMonth() === date.getMonth() && createdAt.getFullYear() === date.getFullYear();
      }).length;
      growth.push({ month: format(date, "MMM"), total: countUntilMonth + novosNoMes, novos: novosNoMes });
    }
    return { totalClientes: total, novosNoMes: novos, ticketMedio: ticket, taxaRetencao: retencao, totalGasto: totalReceita, clientes: clientesComPedidosList, growthData: growth };
  }, [orders, profiles]);

  const executeAction = async () => {
    if (!confirmAction) return;
    setActionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-user-actions', {
        body: { action: confirmAction.type, user_id: confirmAction.user.id }
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const messages = {
        ban: `Usuário ${confirmAction.user.name} banido com sucesso`,
        unban: `Usuário ${confirmAction.user.name} desbanido com sucesso`,
        delete: `Usuário ${confirmAction.user.name} excluído permanentemente`,
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
    { title: "Total de Clientes", value: totalClientes.toString(), icon: Users, color: "from-blue-500 to-blue-600" },
    { title: "Novos no Mês", value: novosNoMes.toString(), icon: UserPlus, color: "from-green-500 to-green-600" },
    { title: "Taxa de Retenção", value: `${taxaRetencao.toFixed(1)}%`, subtitle: "Clientes com +1 pedido", icon: Percent, color: "from-purple-500 to-purple-600" },
    { title: "Ticket Médio", value: `R$ ${ticketMedio.toFixed(2)}`, icon: DollarSign, color: "from-orange-500 to-orange-600" },
  ];

  if (loading && clientes.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando usuários...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-900 to-violet-900 bg-clip-text mb-2 text-slate-50">
            👥 Usuários
          </h1>
          <p className="text-muted-foreground">Dados gerais dos clientes da plataforma</p>
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
              <div className="text-3xl font-bold">{stat.value}</div>
              {(stat as any).subtitle && <p className="text-xs text-muted-foreground mt-1">{(stat as any).subtitle}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-purple-100">
          <CardHeader><CardTitle>Clientes Cadastrados</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Cadastro</TableHead>
                    <TableHead className="text-right">Total Gasto</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientes.length > 0 ? clientes.map((user) => (
                    <TableRow key={user.id} className="hover:bg-purple-50/50">
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{user.email}</TableCell>
                      <TableCell>{user.createdAt}</TableCell>
                      <TableCell className="text-right font-medium">R$ {user.totalSpent.toFixed(2)}</TableCell>
                      <TableCell>
                        {user.ativo ? (
                          <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                        ) : (
                          <Badge variant="destructive">Banido</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {user.ativo ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setConfirmAction({ type: 'ban', user })}
                              title="Banir usuário"
                              className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setConfirmAction({ type: 'unban', user })}
                              title="Desbanir usuário"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setConfirmAction({ type: 'delete', user })}
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
                      <TableCell colSpan={6} className="text-center text-muted-foreground">Nenhum cliente cadastrado</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-100">
          <CardHeader><CardTitle>Crescimento de Clientes</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="total" name="Total" stroke="#8B5CF6" strokeWidth={2} />
                <Line type="monotone" dataKey="novos" name="Novos" stroke="#10B981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border-purple-100 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950 dark:to-violet-950">
        <CardHeader><CardTitle>📊 Resumo de Gastos dos Clientes</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Gasto (Todos)</p>
              <p className="text-2xl font-bold">R$ {totalGasto.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ticket Médio</p>
              <p className="text-2xl font-bold">R$ {ticketMedio.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Clientes c/ Pedidos</p>
              <p className="text-2xl font-bold">{clientes.filter(c => c.orders > 0).length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
              <p className="text-2xl font-bold">
                {totalClientes > 0 ? ((clientes.filter(c => c.orders > 0).length / totalClientes) * 100).toFixed(1) : 0}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Confirmação */}
      <Dialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmAction?.type === 'ban' && '🚫 Banir Usuário'}
              {confirmAction?.type === 'unban' && '✅ Desbanir Usuário'}
              {confirmAction?.type === 'delete' && '⚠️ Excluir Permanentemente'}
            </DialogTitle>
            <DialogDescription>
              {confirmAction?.type === 'ban' && `Banir "${confirmAction.user?.name}" impedirá que ele acesse a plataforma. Você pode desbanir depois.`}
              {confirmAction?.type === 'unban' && `Desbanir "${confirmAction.user?.name}" vai restaurar o acesso completo à plataforma.`}
              {confirmAction?.type === 'delete' && `ATENÇÃO: Excluir "${confirmAction.user?.name}" é uma ação IRREVERSÍVEL. O usuário e todos os seus dados de autenticação serão removidos permanentemente do sistema.`}
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

export default Usuarios;
