import { Card } from "@/components/ui/card";
import { Package, DollarSign, CheckCircle, Star } from "lucide-react";
import { useSupplierOrders } from "@/hooks/useSupplierOrders";

const Dashboard = () => {
  const { orders } = useSupplierOrders();

  const pendingOrders = orders.filter(o => o.status === 'awaiting_payment').length;
  const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
  const pendingBalance = orders
    .filter(o => o.status !== 'delivered' && o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.value, 0);

  const lastSevenDays = [
    { day: 'Seg', value: 450 },
    { day: 'Ter', value: 380 },
    { day: 'Qua', value: 520 },
    { day: 'Qui', value: 340 },
    { day: 'Sex', value: 600 },
    { day: 'Sáb', value: 720 },
    { day: 'Dom', value: 550 },
  ];

  const maxValue = Math.max(...lastSevenDays.map(d => d.value));

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pedidos Pendentes</p>
              <p className="text-3xl font-bold text-primary">{pendingOrders}</p>
            </div>
            <Package className="h-10 w-10 text-primary/20" />
          </div>
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
              <p className="text-sm text-muted-foreground">Pedidos Entregues</p>
              <p className="text-3xl font-bold text-green-600">{deliveredOrders}</p>
            </div>
            <CheckCircle className="h-10 w-10 text-green-600/20" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avaliação Média</p>
              <p className="text-3xl font-bold text-yellow-600">4.8</p>
            </div>
            <Star className="h-10 w-10 text-yellow-600/20" />
          </div>
        </Card>
      </div>

      {/* Gráfico de Desempenho */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-6">Vendas dos Últimos 7 Dias</h2>
        <div className="flex items-end justify-between gap-4 h-64">
          {lastSevenDays.map((day) => (
            <div key={day.day} className="flex flex-col items-center flex-1 gap-2">
              <div className="w-full bg-primary/10 rounded-t-lg relative" style={{ height: '100%' }}>
                <div 
                  className="w-full bg-primary rounded-t-lg absolute bottom-0 transition-all"
                  style={{ height: `${(day.value / maxValue) * 100}%` }}
                />
              </div>
              <p className="text-sm font-medium">{day.day}</p>
              <p className="text-xs text-muted-foreground">R$ {day.value}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Notificações Recentes */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Notificações Recentes</h2>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
            <Package className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Novo pedido aguardando confirmação</p>
              <p className="text-xs text-muted-foreground">Pedido #{orders[0]?.id} - há 2 horas</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Cliente enviou comprovante no pedido #1452</p>
              <p className="text-xs text-muted-foreground">há 4 horas</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
