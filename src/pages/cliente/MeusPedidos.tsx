import { ParticlesBackground } from "@/components/cliente/ParticlesBackground";
import { BottomNav } from "@/components/cliente/BottomNav";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Package, Truck, CheckCircle, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

const MeusPedidos = () => {
  const navigate = useNavigate();

  const orders = [
    {
      id: "PED001",
      date: "15/03/2024",
      total: 1250.00,
      status: "entregue",
      items: 3,
      products: ["Carne Premium 1kg", "Picanha 500g", "Costela 2kg"]
    },
    {
      id: "PED002",
      date: "10/03/2024",
      total: 890.00,
      status: "em_transito",
      items: 2,
      products: ["Alcatra 1kg", "Fraldinha 500g"]
    },
    {
      id: "PED003",
      date: "05/03/2024",
      total: 560.00,
      status: "processando",
      items: 1,
      products: ["Maminha 1kg"]
    },
  ];

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "entregue":
        return { label: "Entregue", variant: "default" as const, icon: CheckCircle, color: "text-green-600" };
      case "em_transito":
        return { label: "Em Trânsito", variant: "secondary" as const, icon: Truck, color: "text-blue-600" };
      case "processando":
        return { label: "Processando", variant: "outline" as const, icon: Clock, color: "text-orange-600" };
      default:
        return { label: "Pendente", variant: "outline" as const, icon: Package, color: "text-gray-600" };
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <ParticlesBackground />

      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate("/cliente/perfil")} className="hover:bg-accent p-2 rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-primary">Meus Pedidos</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 relative z-10">
        <div className="space-y-4">
          {orders.map((order) => {
            const statusInfo = getStatusInfo(order.status);
            const StatusIcon = statusInfo.icon;
            
            return (
              <Card key={order.id} className="bg-white border shadow-sm p-4 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-lg">Pedido #{order.id}</h3>
                    <p className="text-sm text-muted-foreground">{order.date}</p>
                  </div>
                  <Badge variant={statusInfo.variant} className="gap-1">
                    <StatusIcon className="h-3 w-3" />
                    {statusInfo.label}
                  </Badge>
                </div>

                <div className="space-y-2 mb-3">
                  {order.products.map((product, idx) => (
                    <p key={idx} className="text-sm text-muted-foreground">• {product}</p>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{order.items} {order.items === 1 ? 'item' : 'itens'}</span>
                  </div>
                  <p className="font-bold text-lg text-primary">
                    R$ {order.total.toFixed(2).replace('.', ',')}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>

        {orders.length === 0 && (
          <Card className="bg-white border shadow-sm p-8 text-center">
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-bold text-lg mb-2">Nenhum pedido ainda</h3>
            <p className="text-sm text-muted-foreground">
              Seus pedidos aparecerão aqui após a compra
            </p>
          </Card>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default MeusPedidos;
