import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, Smartphone, Chrome, Apple, Share2, Plus, MoreVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Install() {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('desktop');

  useEffect(() => {
    // Detectar plataforma
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    
    if (isIOS) {
      setPlatform('ios');
    } else if (isAndroid) {
      setPlatform('android');
    } else {
      setPlatform('desktop');
    }

    // Verificar se já está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Capturar evento de instalação (Chrome/Edge/Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">nellor</h1>
          <Button variant="ghost" onClick={() => navigate(-1)}>
            Voltar
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Hero Section */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6 animate-scale-in">
            <Download className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Instale o App nellor
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Acesse rapidamente, receba notificações e tenha uma experiência completa de aplicativo nativo
          </p>
        </div>

        {/* Status de instalação */}
        {isInstalled && (
          <Card className="p-6 mb-8 bg-primary/5 border-primary/20 animate-fade-in">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Download className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">App já instalado! 🎉</h3>
                <p className="text-sm text-muted-foreground">
                  O nellor já está instalado no seu dispositivo
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Botão de instalação rápida (Chrome/Android) */}
        {deferredPrompt && !isInstalled && (
          <Card className="p-6 mb-8 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 animate-scale-in">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex-1">
                <h3 className="font-semibold text-xl mb-2">Instalação Rápida</h3>
                <p className="text-muted-foreground">
                  Clique no botão abaixo para instalar o app com um clique
                </p>
              </div>
              <Button 
                size="lg" 
                onClick={handleInstallClick}
                className="gap-2 min-w-[200px]"
              >
                <Download className="w-5 h-5" />
                Instalar Agora
              </Button>
            </div>
          </Card>
        )}

        {/* Instruções por plataforma */}
        <div className="space-y-6">
          {/* Android/Chrome */}
          {(platform === 'android' || platform === 'desktop') && (
            <Card className="p-6 md:p-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Chrome className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Chrome / Android</h2>
                  <p className="text-sm text-muted-foreground">Navegadores baseados em Chromium</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex gap-4 items-start group hover:bg-accent/50 p-4 rounded-lg transition-colors">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                    1
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">Abra o menu do navegador</h3>
                    <p className="text-muted-foreground mb-3">
                      Toque nos três pontos verticais <MoreVertical className="w-4 h-4 inline" /> no canto superior direito
                    </p>
                    <div className="bg-muted/50 p-4 rounded-lg inline-flex items-center gap-2">
                      <MoreVertical className="w-6 h-6 text-foreground" />
                      <span className="text-sm">Menu</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 items-start group hover:bg-accent/50 p-4 rounded-lg transition-colors">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                    2
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">Selecione "Instalar app" ou "Adicionar à tela inicial"</h3>
                    <p className="text-muted-foreground mb-3">
                      Procure pela opção com ícone de download ou adicionar
                    </p>
                    <div className="bg-muted/50 p-4 rounded-lg inline-flex items-center gap-2">
                      <Download className="w-6 h-6 text-foreground" />
                      <span className="text-sm">Instalar app</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 items-start group hover:bg-accent/50 p-4 rounded-lg transition-colors">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                    3
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">Confirme a instalação</h3>
                    <p className="text-muted-foreground">
                      Toque em "Instalar" na janela de confirmação e pronto!
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* iOS/Safari */}
          {(platform === 'ios' || platform === 'desktop') && (
            <Card className="p-6 md:p-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Apple className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Safari / iOS</h2>
                  <p className="text-sm text-muted-foreground">iPhone e iPad</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex gap-4 items-start group hover:bg-accent/50 p-4 rounded-lg transition-colors">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                    1
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">Toque no botão Compartilhar</h3>
                    <p className="text-muted-foreground mb-3">
                      Localizado na barra inferior do Safari
                    </p>
                    <div className="bg-muted/50 p-4 rounded-lg inline-flex items-center gap-2">
                      <Share2 className="w-6 h-6 text-foreground" />
                      <span className="text-sm">Compartilhar</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 items-start group hover:bg-accent/50 p-4 rounded-lg transition-colors">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                    2
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">Role para baixo e selecione "Adicionar à Tela de Início"</h3>
                    <p className="text-muted-foreground mb-3">
                      Procure pela opção com ícone de mais (+)
                    </p>
                    <div className="bg-muted/50 p-4 rounded-lg inline-flex items-center gap-2">
                      <Plus className="w-6 h-6 text-foreground" />
                      <span className="text-sm">Adicionar à Tela de Início</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 items-start group hover:bg-accent/50 p-4 rounded-lg transition-colors">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                    3
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">Confirme tocando em "Adicionar"</h3>
                    <p className="text-muted-foreground">
                      O ícone do nellor aparecerá na sua tela inicial
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Benefícios */}
        <Card className="p-6 md:p-8 mt-8 bg-gradient-to-br from-primary/5 to-secondary/5 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <h2 className="text-2xl font-bold mb-6 text-center">Por que instalar?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Acesso Rápido</h3>
              <p className="text-sm text-muted-foreground">
                Ícone na tela inicial para abrir instantaneamente
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Download className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Funciona Offline</h3>
              <p className="text-sm text-muted-foreground">
                Navegue mesmo sem conexão com a internet
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Chrome className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Experiência Nativa</h3>
              <p className="text-sm text-muted-foreground">
                Interface completa sem barra do navegador
              </p>
            </div>
          </div>
        </Card>

        {/* CTA Final */}
        <div className="text-center mt-12">
          <Button 
            size="lg" 
            onClick={() => navigate('/cliente/home')}
            variant="outline"
            className="gap-2"
          >
            Continuar no Navegador
          </Button>
        </div>
      </div>
    </div>
  );
}
