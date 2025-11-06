import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, TrendingUp, TrendingDown, Calendar as CalendarIcon, ArrowUpRight } from "lucide-react";
import { useSupplierOrders } from "@/hooks/useSupplierOrders";

const Dashboard = () => {
  const { orders } = useSupplierOrders();

  const pendingOrders = orders.filter(o => o.status === 'awaiting_payment').length;
  const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
  const totalOrders = orders.length;
  const totalRevenue = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.value, 0);

  const revenueData: { month: string; value: number }[] = [];

  const maxValue = revenueData.length > 0 ? Math.max(...revenueData.map(d => d.value)) : 1;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Visão geral do seu desempenho</p>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* Total Revenue - Destaque */}
        <Card className="bg-gradient-to-br from-gray-900 to-gray-800 text-white p-4 sm:p-6 col-span-2">
          <p className="text-xs sm:text-sm opacity-80 mb-1 sm:mb-2">Receita Total</p>
          <p className="text-2xl sm:text-4xl font-bold mb-1">R$ {totalRevenue.toFixed(0)}</p>
        </Card>

        {/* Active Orders */}
        <Card className="p-4 sm:p-6">
          <p className="text-xs sm:text-sm text-muted-foreground mb-1 sm:mb-2">Pedidos Ativos</p>
          <p className="text-xl sm:text-3xl font-bold mb-1">{totalOrders - deliveredOrders}</p>
        </Card>

        {/* New Orders */}
        <Card className="p-4 sm:p-6">
          <p className="text-xs sm:text-sm text-muted-foreground mb-1 sm:mb-2">Novos Pedidos</p>
          <p className="text-xl sm:text-3xl font-bold mb-1">{pendingOrders}</p>
        </Card>

        {/* Total Delivered */}
        <Card className="p-4 sm:p-6 col-span-2 sm:col-span-1">
          <p className="text-xs sm:text-sm text-muted-foreground mb-1 sm:mb-2">Pedidos Entregues</p>
          <p className="text-xl sm:text-3xl font-bold mb-1">{deliveredOrders}</p>
        </Card>
      </div>

      {revenueData.length > 0 && (
        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-base sm:text-xl font-bold">Receita Total</h2>
            <Button variant="outline" size="icon" className="h-8 w-8 sm:h-10 sm:w-10">
              <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
          
          <div className="flex items-end justify-between gap-2 sm:gap-4 h-48 sm:h-80">
            {revenueData.map((item) => (
              <div key={item.month} className="flex flex-col items-center flex-1 gap-2 sm:gap-3">
                <div className="w-full relative" style={{ height: '100%' }}>
                  <div 
                    className="w-full bg-gray-900 rounded-t-xl absolute bottom-0 transition-all hover:bg-gray-800 cursor-pointer"
                    style={{ height: `${(item.value / maxValue) * 100}%` }}
                  />
                </div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">{item.month}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent Orders */}
      <Card className="overflow-hidden">
        <div className="p-4 sm:p-6 border-b flex items-center justify-between">
          <h2 className="text-base sm:text-xl font-bold">Pedidos Recentes</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8 sm:h-10 sm:w-10">
              <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8 sm:h-10 sm:w-10">
              <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>
        
        <div className="divide-y">
          {orders.length === 0 ? (
            <div className="p-8 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum pedido recente</p>
            </div>
          ) : (
            orders.slice(0, 5).map((order) => (
              <div key={order.id} className="p-4 sm:p-6 hover:bg-muted/20 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <Package className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm sm:text-base mb-1">{order.product}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-2">{order.customerName}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-muted-foreground">ID: {order.id}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        order.status === 'delivered'
                          ? 'bg-gray-900 text-white'
                          : order.status === 'cancelled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status === 'delivered' ? 'Pago' : order.status === 'cancelled' ? 'Cancelado' : 'Pendente'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-sm sm:text-base">R$ {order.value.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;