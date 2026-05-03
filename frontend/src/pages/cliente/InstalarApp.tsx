import { ParticlesBackground } from "@/components/cliente/ParticlesBackground";
import { BottomNav } from "@/components/cliente/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  Download, 
  Smartphone, 
  Zap, 
  Bell, 
  Wifi, 
  Share, 
  Plus,
  CheckCircle2,
  Apple,
  Chrome
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePWA } from "@/hooks/usePWA";

const InstalarApp = () => {
  const navigate = useNavigate();
  const { isInstallable, isInstalled, isIOS, isStandalone, installApp, canInstall } = usePWA();

  const handleInstall = async () => {
    const success = await installApp();
    if (success) {
      // App installed successfully
    }
  };

  const features = [
    {
      icon: Zap,
      title: "Acesso rápido",
      description: "Abra o app direto da tela inicial"
    },
    {
      icon: Bell,
      title: "Notificações push",
      description: "Receba alertas sobre seus pedidos"
    },
    {
      icon: Wifi,
      title: "Funciona offline",
      description: "Navegue mesmo sem internet"
    },
    {
      icon: Smartphone,
      title: "Experiência nativa",
      description: "Visual e performance de app nativo"
    }
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <ParticlesBackground />

      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="hover:bg-accent p-2 rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-primary">Instalar App</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 relative z-10">
        {/* Hero Section */}
        <Card className="bg-gradient-to-br from-primary to-purple-700 text-white p-6 mb-6 text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <Download className="h-10 w-10" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Instale o Nellor</h2>
          <p className="text-white/80 mb-4">
            Tenha o marketplace na palma da sua mão com acesso rápido e notificações em tempo real.
          </p>
          
          {isInstalled || isStandalone ? (
            <div className="flex items-center justify-center gap-2 bg-white/20 rounded-lg py-3 px-4">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">App já instalado!</span>
            </div>
          ) : isInstallable ? (
            <Button 
              size="lg" 
              className="w-full bg-white text-primary hover:bg-white/90"
              onClick={handleInstall}
            >
              <Download className="h-5 w-5 mr-2" />
              Instalar agora
            </Button>
          ) : isIOS ? (
            <div className="text-left bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <p className="font-medium mb-2 flex items-center gap-2">
                <Apple className="h-5 w-5" />
                Como instalar no iPhone/iPad:
              </p>
              <ol className="space-y-2 text-sm text-white/90">
                <li className="flex items-start gap-2">
                  <span className="bg-white/20 rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">1</span>
                  <span>Toque no botão <Share className="inline h-4 w-4" /> Compartilhar</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-white/20 rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">2</span>
                  <span>Role e toque em "Adicionar à Tela Inicial"</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-white/20 rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">3</span>
                  <span>Toque em "Adicionar" no canto superior direito</span>
                </li>
              </ol>
            </div>
          ) : (
            <div className="text-left bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <p className="font-medium mb-2 flex items-center gap-2">
                <Chrome className="h-5 w-5" />
                Como instalar no Android:
              </p>
              <ol className="space-y-2 text-sm text-white/90">
                <li className="flex items-start gap-2">
                  <span className="bg-white/20 rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">1</span>
                  <span>Toque no menu ⋮ do navegador</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-white/20 rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">2</span>
                  <span>Toque em "Instalar app" ou "Adicionar à tela inicial"</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-white/20 rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">3</span>
                  <span>Confirme a instalação</span>
                </li>
              </ol>
            </div>
          )}
        </Card>

        {/* Features */}
        <h3 className="font-bold text-lg mb-4">Vantagens do app</h3>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="bg-white border shadow-sm p-4">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h4 className="font-semibold text-sm mb-1">{feature.title}</h4>
                <p className="text-xs text-muted-foreground">{feature.description}</p>
              </Card>
            );
          })}
        </div>

        {/* Already Installed Info */}
        {(isInstalled || isStandalone) && (
          <Card className="bg-green-50 border-green-200 p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <div>
                <h4 className="font-semibold text-green-800">Você já está usando o app!</h4>
                <p className="text-sm text-green-700">O Nellor está instalado no seu dispositivo.</p>
              </div>
            </div>
          </Card>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default InstalarApp;
