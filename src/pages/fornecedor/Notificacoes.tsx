import { Card } from "@/components/ui/card";
import { Package, MessageSquare, XCircle, CheckCircle, Bell } from "lucide-react";

const Notificacoes = () => {
  const notifications: any[] = [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Bell className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Notificações</h1>
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <Card className="p-8 text-center">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhuma notificação no momento</p>
          </Card>
        ) : (
          notifications.map((notification) => {
            const Icon = notification.icon;
            return (
              <Card key={notification.id} className={`p-4 ${notification.bg} border-none`}>
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-full bg-white`}>
                    <Icon className={`h-6 w-6 ${notification.color}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{notification.title}</h3>
                    <p className="text-muted-foreground">{notification.message}</p>
                    <p className="text-sm text-muted-foreground mt-1">{notification.time}</p>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Notificacoes;
