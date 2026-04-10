import { ParticlesBackground } from "@/components/cliente/ParticlesBackground";
import { BottomNav } from "@/components/cliente/BottomNav";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, 
  Bell, 
  Package, 
  MessageSquare, 
  Tag, 
  TrendingDown, 
  Truck, 
  CreditCard,
  Volume2,
  Mail,
  Smartphone,
  BellRing,
  CheckCircle2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNotificationPreferences } from "@/hooks/useNotificationPreferences";
import { useSupabaseNotifications } from "@/hooks/useSupabaseNotifications";

const ConfiguracoesNotificacoes = () => {
  const navigate = useNavigate();
  const { preferences, loading, saving, updatePreference } = useNotificationPreferences();
  const { pushPermission, requestPushPermission } = useSupabaseNotifications();

  const notificationTypes = [
    {
      key: 'order_updates' as const,
      icon: Package,
      title: 'Atualizações de pedidos',
      description: 'Receba alertas quando o status do seu pedido mudar',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      key: 'delivery_updates' as const,
      icon: Truck,
      title: 'Atualizações de entrega',
      description: 'Rastreamento e informações de envio',
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      key: 'payment_confirmations' as const,
      icon: CreditCard,
      title: 'Confirmações de pagamento',
      description: 'Alertas sobre pagamentos processados',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      key: 'messages' as const,
      icon: MessageSquare,
      title: 'Mensagens',
      description: 'Notificações de novas mensagens de fornecedores',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100'
    },
    {
      key: 'promotions' as const,
      icon: Tag,
      title: 'Promoções e ofertas',
      description: 'Ofertas especiais e novidades',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      key: 'price_alerts' as const,
      icon: TrendingDown,
      title: 'Alertas de preço',
      description: 'Quando produtos favoritos baixarem de preço',
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    }
  ];

  const deliveryMethods = [
    {
      key: 'push_enabled' as const,
      icon: Smartphone,
      title: 'Notificações push',
      description: 'Alertas instantâneos no seu dispositivo',
      requiresPermission: true
    },
    {
      key: 'sound_enabled' as const,
      icon: Volume2,
      title: 'Som de notificação',
      description: 'Tocar som ao receber notificações',
      requiresPermission: false
    },
    {
      key: 'email_enabled' as const,
      icon: Mail,
      title: 'Notificações por e-mail',
      description: 'Receber resumos por e-mail',
      requiresPermission: false
    }
  ];

  const handlePushToggle = async (value: boolean) => {
    if (value && pushPermission !== 'granted') {
      const granted = await requestPushPermission();
      if (!granted) return;
    }
    updatePreference('push_enabled', value);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <ParticlesBackground />
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b shadow-sm">
          <div className="container mx-auto px-4 py-4 flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="hover:bg-accent p-2 rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-2xl font-bold text-primary">Configurações</h1>
          </div>
        </header>
        <main className="container mx-auto px-4 py-6">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i} className="p-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="w-12 h-6 rounded-full" />
                </div>
              </Card>
            ))}
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <ParticlesBackground />

      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="hover:bg-accent p-2 rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-primary">Configurações de Notificações</h1>
            <p className="text-xs text-muted-foreground">Personalize seus alertas</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 relative z-10">
        {/* Push Permission Banner */}
        {pushPermission !== 'granted' && (
          <Card className="bg-gradient-to-r from-primary/10 to-purple-100 border-primary/20 p-4 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <BellRing className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-sm mb-1">Ativar notificações push</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Permita notificações para receber alertas em tempo real sobre seus pedidos.
                </p>
                <Button size="sm" onClick={requestPushPermission}>
                  Permitir notificações
                </Button>
              </div>
            </div>
          </Card>
        )}

        {pushPermission === 'granted' && (
          <div className="flex items-center gap-2 mb-4 text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm font-medium">Notificações push ativadas</span>
          </div>
        )}

        {/* Delivery Methods */}
        <section className="mb-8">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Como receber
          </h2>
          <div className="space-y-3">
            {deliveryMethods.map((method) => {
              const Icon = method.icon;
              const isEnabled = preferences?.[method.key] ?? false;
              
              return (
                <Card key={method.key} className="bg-white border shadow-sm p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm">{method.title}</h3>
                      <p className="text-xs text-muted-foreground">{method.description}</p>
                    </div>
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={(value) => {
                        if (method.key === 'push_enabled') {
                          handlePushToggle(value);
                        } else {
                          updatePreference(method.key, value);
                        }
                      }}
                      disabled={saving || (method.key === 'push_enabled' && pushPermission === 'denied')}
                    />
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Notification Types */}
        <section>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Tipos de notificação
          </h2>
          <div className="space-y-3">
            {notificationTypes.map((type) => {
              const Icon = type.icon;
              const isEnabled = preferences?.[type.key] ?? false;
              
              return (
                <Card key={type.key} className="bg-white border shadow-sm p-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full ${type.bgColor} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`h-6 w-6 ${type.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm">{type.title}</h3>
                      <p className="text-xs text-muted-foreground">{type.description}</p>
                    </div>
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={(value) => updatePreference(type.key, value)}
                      disabled={saving}
                    />
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Info */}
        <Card className="bg-muted/50 border-dashed mt-8 p-4">
          <p className="text-xs text-muted-foreground text-center">
            As alterações são salvas automaticamente. Você pode alterar suas preferências a qualquer momento.
          </p>
        </Card>
      </main>

      <BottomNav />
    </div>
  );
};

export default ConfiguracoesNotificacoes;
