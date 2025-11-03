import { ParticlesBackground } from "@/components/cliente/ParticlesBackground";
import { BottomNav } from "@/components/cliente/BottomNav";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Package, Bell, Tag, Truck } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Notificacoes = () => {
  const navigate = useNavigate();

  const notifications = [
    {
      id: 1,
      type: "pedido",
      title: "Pedido entregue",
      message: "Seu pedido #PED001 foi entregue com sucesso!",
      time: "2 horas atrás",
      read: false,
      icon: Package,
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    {
      id: 2,
      type: "entrega",
      title: "Pedido em trânsito",
      message: "Seu pedido #PED002 está a caminho",
      time: "5 horas atrás",
      read: false,
      icon: Truck,
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      id: 3,
      type: "promocao",
      title: "Promoção exclusiva",
      message: "50% OFF em carnes premium neste fim de semana!",
      time: "1 dia atrás",
      read: true,
      icon: Tag,
      color: "text-purple-600",
      bgColor: "bg-purple-100"
    },
    {
      id: 4,
      type: "geral",
      title: "Novo produto disponível",
      message: "Confira nossa nova linha de carnes premium",
      time: "2 dias atrás",
      read: true,
      icon: Bell,
      color: "text-orange-600",
      bgColor: "bg-orange-100"
    }
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <ParticlesBackground />

      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate("/cliente/perfil")} className="hover:bg-accent p-2 rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-primary">Notificações</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 relative z-10">
        <div className="space-y-3">
          {notifications.map((notification) => {
            const Icon = notification.icon;
            return (
              <Card
                key={notification.id}
                className={`bg-white border shadow-sm p-4 hover:shadow-md transition-all ${
                  !notification.read ? 'border-primary/30' : ''
                }`}
              >
                <div className="flex gap-4">
                  <div className={`w-12 h-12 rounded-full ${notification.bgColor} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`h-6 w-6 ${notification.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-bold text-sm">{notification.title}</h3>
                      {!notification.read && (
                        <Badge variant="default" className="bg-primary text-white text-xs px-2 py-0">
                          Nova
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                    <p className="text-xs text-muted-foreground">{notification.time}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {notifications.length === 0 && (
          <Card className="bg-white border shadow-sm p-8 text-center">
            <Bell className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-bold text-lg mb-2">Nenhuma notificação</h3>
            <p className="text-sm text-muted-foreground">
              Você está em dia! Não há notificações no momento.
            </p>
          </Card>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Notificacoes;
