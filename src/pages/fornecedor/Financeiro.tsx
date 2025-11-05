import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingUp, Eye } from "lucide-react";
import { useSupplierOrders } from "@/hooks/useSupplierOrders";
import { toast } from "sonner";

const Financeiro = () => {
  const { orders } = useSupplierOrders();

  const availableBalance = orders
    .filter(o => o.status === 'delivered')
    .reduce((sum, o) => sum + o.value, 0);

  const pendingBalance = orders
    .filter(o => o.status !== 'delivered' && o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.value, 0);

  const monthTotal = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.value, 0);

  const handleWithdraw = () => {
    toast.success("Solicitação de saque enviada! Você receberá em até 2 dias úteis.");
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      awaiting_payment: 'Pendente',
      preparing: 'Pendente',
      shipped: 'Pendente',
      delivered: 'Pago',
      cancelled: 'Cancelado',
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Financeiro</h1>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Saldo Disponível</p>
              <p className="text-3xl font-bold text-green-600">
                R$ {availableBalance.toFixed(2)}
              </p>
            </div>
            <DollarSign className="h-10 w-10 text-green-600/20" />
          </div>
          <Button
            className="w-full mt-4 bg-green-600 hover:bg-green-700"
            onClick={handleWithdraw}
            disabled={availableBalance === 0}
          >
            Solicitar Saque
          </Button>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Saldo Pendente</p>
              <p className="text-3xl font-bold text-orange-600">
                R$ {pendingBalance.toFixed(2)}
              </p>
            </div>
            <DollarSign className="h-10 w-10 text-orange-600/20" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Vendido no Mês</p>
              <p className="text-3xl font-bold text-primary">
                R$ {monthTotal.toFixed(2)}
              </p>
            </div>
            <TrendingUp className="h-10 w-10 text-primary/20" />
          </div>
        </Card>
      </div>

      {/* Tabela de Transações */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold">Histórico de Transações</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium">Data</th>
                <th className="px-6 py-3 text-left text-sm font-medium">Pedido</th>
                <th className="px-6 py-3 text-left text-sm font-medium">Cliente</th>
                <th className="px-6 py-3 text-left text-sm font-medium">Valor</th>
                <th className="px-6 py-3 text-left text-sm font-medium">Status</th>
                <th className="px-6 py-3 text-left text-sm font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-muted/30">
                  <td className="px-6 py-4">{order.date}</td>
                  <td className="px-6 py-4 font-medium">{order.id}</td>
                  <td className="px-6 py-4">{order.customerName}</td>
                  <td className="px-6 py-4 font-medium">R$ {order.value.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      order.status === 'delivered'
                        ? 'bg-green-100 text-green-800'
                        : order.status === 'cancelled'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-orange-100 text-orange-800'
                    }`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Financeiro;
