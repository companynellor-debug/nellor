import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, BellRing, Volume2, VolumeX, Smartphone, Check, X, RefreshCw } from 'lucide-react';
import { showPushNotification, requestNotificationPermission, getNotificationPermission } from '@/utils/pushNotifications';
import { useToast } from '@/hooks/use-toast';

const TesteNotificacoes = () => {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [swStatus, setSwStatus] = useState<'checking' | 'active' | 'inactive'>('checking');
  const [testCount, setTestCount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    setPermission(getNotificationPermission());
    checkServiceWorker();
  }, []);

  const checkServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      setSwStatus(registration?.active ? 'active' : 'inactive');
    } else {
      setSwStatus('inactive');
    }
  };

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    setPermission(getNotificationPermission());
    
    toast({
      title: granted ? '✅ Permissão Concedida!' : '❌ Permissão Negada',
      description: granted 
        ? 'Agora você pode receber notificações push' 
        : 'Habilite as notificações nas configurações do navegador',
    });
  };

  const playTestSound = () => {
    try {
      const audio = new Audio('/notification-sound.mp3');
      audio.volume = 0.8;
      audio.play().then(() => {
        toast({
          title: '🔊 Som Tocando',
          description: 'O som de notificação está funcionando!',
        });
      }).catch(error => {
        toast({
          title: '❌ Erro no Som',
          description: 'Não foi possível tocar o som. Interaja com a página primeiro.',
          variant: 'destructive',
        });
        console.error('Audio error:', error);
      });
    } catch (error) {
      console.error('Error creating audio:', error);
    }
  };

  const sendTestNotification = async () => {
    setTestCount(prev => prev + 1);
    const orderNumber = `TEST-${String(testCount + 1).padStart(4, '0')}`;
    const total = (Math.random() * 500 + 50).toFixed(2);

    await showPushNotification('💰 Novo Pedido Recebido!', {
      body: `Você recebeu um novo pedido #${orderNumber}\nR$ ${total}`,
      tag: `test-order-${Date.now()}`,
      data: {
        type: 'test',
        orderNumber,
        url: '/fornecedor/pedidos',
      },
    });

    toast({
      title: '📱 Notificação Enviada!',
      description: `Pedido #${orderNumber} - R$ ${total}`,
    });
  };

  const sendMultipleNotifications = async () => {
    for (let i = 0; i < 3; i++) {
      setTimeout(async () => {
        const orderNumber = `MULTI-${Date.now().toString().slice(-4)}`;
        const total = (Math.random() * 200 + 30).toFixed(2);
        
        await showPushNotification('🛒 Pedido #' + (i + 1), {
          body: `Pedido ${orderNumber} - R$ ${total}`,
          tag: `multi-${Date.now()}-${i}`,
          data: { url: '/fornecedor/pedidos' },
        });
      }, i * 1000);
    }

    toast({
      title: '📱 3 Notificações Programadas',
      description: 'Serão enviadas com 1 segundo de intervalo',
    });
  };

  const isPWA = window.matchMedia('(display-mode: standalone)').matches 
    || (window.navigator as any).standalone === true;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      <div>
        <h1 className="text-2xl font-bold">🔔 Teste de Notificações Push</h1>
        <p className="text-muted-foreground">
          Verifique se as notificações estão funcionando corretamente no seu dispositivo
        </p>
      </div>

      {/* Status do Dispositivo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Status do Dispositivo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span>Plataforma</span>
              <Badge variant="outline">
                {isIOS ? 'iOS' : isAndroid ? 'Android' : 'Desktop'}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span>Modo PWA</span>
              <Badge variant={isPWA ? 'default' : 'secondary'}>
                {isPWA ? <Check className="h-3 w-3 mr-1" /> : <X className="h-3 w-3 mr-1" />}
                {isPWA ? 'Instalado' : 'Navegador'}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span>Permissão</span>
              <Badge variant={
                permission === 'granted' ? 'default' : 
                permission === 'denied' ? 'destructive' : 
                'secondary'
              }>
                {permission === 'granted' ? '✅ Concedida' : 
                 permission === 'denied' ? '❌ Negada' : 
                 permission === 'unsupported' ? '⚠️ Não Suportado' :
                 '⏳ Pendente'}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span>Service Worker</span>
              <Badge variant={swStatus === 'active' ? 'default' : 'secondary'}>
                {swStatus === 'checking' && <RefreshCw className="h-3 w-3 mr-1 animate-spin" />}
                {swStatus === 'active' ? '✅ Ativo' : 
                 swStatus === 'inactive' ? '❌ Inativo' : 
                 'Verificando...'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ações de Teste */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Ações de Teste
          </CardTitle>
          <CardDescription>
            Execute os testes abaixo para verificar cada funcionalidade
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Passo 1: Permissão */}
          <div className="p-4 border rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <Badge>1</Badge>
              <span className="font-medium">Solicitar Permissão</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Primeiro, você precisa permitir que o app envie notificações.
            </p>
            <Button 
              onClick={handleRequestPermission}
              disabled={permission === 'granted'}
              className="w-full"
            >
              {permission === 'granted' ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Permissão Concedida
                </>
              ) : (
                <>
                  <Bell className="h-4 w-4 mr-2" />
                  Solicitar Permissão
                </>
              )}
            </Button>
          </div>

          {/* Passo 2: Testar Som */}
          <div className="p-4 border rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <Badge>2</Badge>
              <span className="font-medium">Testar Som</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Verifique se o som de notificação está funcionando.
            </p>
            <Button 
              onClick={playTestSound}
              variant="outline"
              className="w-full"
            >
              <Volume2 className="h-4 w-4 mr-2" />
              Tocar Som de Notificação
            </Button>
          </div>

          {/* Passo 3: Notificação Push */}
          <div className="p-4 border rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <Badge>3</Badge>
              <span className="font-medium">Enviar Notificação de Teste</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Simula uma notificação de novo pedido. A notificação deve aparecer na barra de status do celular.
            </p>
            <Button 
              onClick={sendTestNotification}
              disabled={permission !== 'granted'}
              className="w-full"
            >
              <BellRing className="h-4 w-4 mr-2" />
              Enviar Notificação de Pedido
            </Button>
          </div>

          {/* Passo 4: Múltiplas Notificações */}
          <div className="p-4 border rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <Badge>4</Badge>
              <span className="font-medium">Testar Múltiplas Notificações</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Envia 3 notificações em sequência para testar se cada uma aparece separadamente.
            </p>
            <Button 
              onClick={sendMultipleNotifications}
              disabled={permission !== 'granted'}
              variant="outline"
              className="w-full"
            >
              <BellRing className="h-4 w-4 mr-2" />
              Enviar 3 Notificações
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dicas */}
      <Card>
        <CardHeader>
          <CardTitle>💡 Dicas para Celular</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
            <p className="font-medium text-foreground mb-2">📱 Para funcionar no celular:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Instale o app (Adicionar à Tela de Início)</li>
              <li>Abra o app instalado (não pelo navegador)</li>
              <li>Clique em "Solicitar Permissão" e permita</li>
              <li>Teste enviando uma notificação</li>
            </ol>
          </div>
          <p>• <strong>iOS (iPhone/iPad):</strong> Notificações push SÓ funcionam se o app estiver instalado como PWA. Abra no Safari → Compartilhar → Adicionar à Tela de Início.</p>
          <p>• <strong>Android:</strong> Funciona tanto no navegador quanto como PWA. Recomendado instalar para melhor experiência.</p>
          <p>• <strong>Desktop:</strong> Funciona normalmente em Chrome, Firefox e Edge.</p>
          <p>• <strong>Som:</strong> Verifique se o celular não está no modo silencioso.</p>
          <p>• <strong>Modo Não Perturbe:</strong> Desative nas configurações do celular.</p>
          <p>• <strong>Configurações do App:</strong> Verifique se as notificações do app estão habilitadas nas configurações do celular.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default TesteNotificacoes;
