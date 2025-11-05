import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, DollarSign, TrendingUp, TrendingDown, Calendar as CalendarIcon, ArrowUpRight } from "lucide-react";
import { useSupplierOrders } from "@/hooks/useSupplierOrders";
import { useState } from "react";

const Dashboard = () => {
  const { orders } = useSupplierOrders();
  const [selectedDate, setSelectedDate] = useState(19);

  const pendingOrders = orders.filter(o => o.status === 'awaiting_payment').length;
  const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
  const totalOrders = orders.length;
  const pendingBalance = orders
    .filter(o => o.status !== 'delivered' && o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.value, 0);
  const totalRevenue = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.value, 0);

  const revenueData = [
    { month: 'Jan', value: 4500 },
    { month: 'Fev', value: 3800 },
    { month: 'Mar', value: 6200 },
    { month: 'Abr', value: 4100 },
    { month: 'Mai', value: 7500 },
    { month: 'Jun', value: 3200 },
  ];

  const maxValue = Math.max(...revenueData.map(d => d.value));

  const currentMonth = "Setembro 2024";
  const calendarDays = [
    { day: 17, label: "Tue" },
    { day: 18, label: "Wed" },
    { day: 19, label: "Thu" },
    { day: 20, label: "Fri" },
    { day: 21, label: "Sat" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do seu desempenho</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">Dia</Button>
          <Button variant="outline" size="sm">Semana</Button>
          <Button variant="default" size="sm">Mês</Button>
          <Button variant="outline" size="sm">Ano</Button>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue - Destaque */}
        <Card className="bg-gradient-to-br from-gray-900 to-gray-800 text-white p-6 col-span-1 md:col-span-2 lg:col-span-1">
          <p className="text-sm opacity-80 mb-2">Receita Total</p>
          <p className="text-4xl font-bold mb-1">R$ {totalRevenue.toFixed(0)}</p>
          <div className="flex items-center gap-1 text-sm">
            <TrendingUp className="h-4 w-4 text-green-400" />
            <span className="text-green-400">8.5%</span>
            <span className="opacity-60">do mês passado</span>
          </div>
        </Card>

        {/* Active Users */}
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-2">Pedidos Ativos</p>
          <p className="text-3xl font-bold mb-1">{totalOrders - deliveredOrders}</p>
          <div className="flex items-center gap-1 text-sm text-green-600">
            <TrendingUp className="h-3 w-3" />
            <span>4.1%</span>
            <span className="text-muted-foreground">do mês passado</span>
          </div>
        </Card>

        {/* New Orders */}
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-2">Novos Pedidos</p>
          <p className="text-3xl font-bold mb-1">{pendingOrders}</p>
          <div className="flex items-center gap-1 text-sm text-red-600">
            <TrendingDown className="h-3 w-3" />
            <span>4.3%</span>
            <span className="text-muted-foreground">do mês passado</span>
          </div>
        </Card>

        {/* Total Mentors */}
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-2">Pedidos Entregues</p>
          <p className="text-3xl font-bold mb-1">{deliveredOrders}</p>
          <div className="flex items-center gap-1 text-sm text-green-600">
            <TrendingUp className="h-3 w-3" />
            <span>0.4%</span>
            <span className="text-muted-foreground">do mês passado</span>
          </div>
        </Card>
      </div>

      {/* Revenue Chart + Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Receita Total</h2>
            <Button variant="outline" size="icon">
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-end justify-between gap-4 h-80">
            {revenueData.map((item, idx) => (
              <div key={item.month} className="flex flex-col items-center flex-1 gap-3">
                <div className="w-full relative" style={{ height: '100%' }}>
                  <div 
                    className="w-full bg-gray-900 rounded-t-xl absolute bottom-0 transition-all hover:bg-gray-800 cursor-pointer"
                    style={{ height: `${(item.value / maxValue) * 100}%` }}
                  />
                </div>
                <p className="text-sm font-medium text-muted-foreground">{item.month}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Calendar & Growth */}
        <div className="space-y-4">
          {/* Calendar Card */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <button className="text-muted-foreground hover:text-foreground">←</button>
              <p className="font-semibold">{currentMonth}</p>
              <button className="text-muted-foreground hover:text-foreground">→</button>
            </div>
            
            <div className="grid grid-cols-5 gap-2">
              {calendarDays.map((item) => (
                <div key={item.day} className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                  <button
                    onClick={() => setSelectedDate(item.day)}
                    className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedDate === item.day
                        ? 'bg-gray-900 text-white'
                        : 'hover:bg-muted'
                    }`}
                  >
                    {item.day}
                  </button>
                </div>
              ))}
            </div>
          </Card>

          {/* Community Growth */}
          <Card className="p-6">
            <h3 className="font-semibold mb-2">Crescimento de Vendas</h3>
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20">
                <svg className="transform -rotate-90" width="80" height="80">
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
                    stroke="#1f2937"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 32 * 0.65} ${2 * Math.PI * 32}`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold">65%</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-green-600 font-medium">+8.90% do mês passado</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Recent Orders Table */}
      <Card className="overflow-hidden">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold">Pedidos Recentes</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="icon">
              <CalendarIcon className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/30">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold">Pedido</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Cliente</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">ID do Pedido</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Valor</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.slice(0, 5).map((order) => (
                <tr key={order.id} className="hover:bg-muted/20">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                        <Package className="h-5 w-5" />
                      </div>
                      <span className="font-medium">{order.product}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">{order.customerName}</td>
                  <td className="px-6 py-4 text-muted-foreground">{order.id}</td>
                  <td className="px-6 py-4 font-semibold">R$ {order.value.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      order.status === 'delivered'
                        ? 'bg-gray-900 text-white'
                        : order.status === 'cancelled'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {order.status === 'delivered' ? 'Pago' : order.status === 'cancelled' ? 'Cancelado' : 'Pendente'}
                    </span>
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

export default Dashboard;
