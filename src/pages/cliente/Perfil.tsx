import { ParticlesBackground } from "@/components/cliente/ParticlesBackground";
import { BottomNav } from "@/components/cliente/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, MapPin, Bell, Package, LogOut, Edit, CreditCard, MessageCircle, Download, Smartphone, Users, Briefcase } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useFavorites } from "@/hooks/useFavorites";
import { useProfile } from "@/hooks/useProfile";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useSupabaseOrders } from "@/hooks/useSupabaseOrders";
import { usePWA } from "@/hooks/usePWA";

const Perfil = () => {
  const navigate = useNavigate();
  const { favorites } = useFavorites();
  const { profile, signOut } = useSupabaseAuth();
  const { orders } = useSupabaseOrders();
  const { canInstall, isInstalled } = usePWA();

  const handleLogout = async () => {
    await signOut();
  };

  const menuItems = [
    { icon: Edit, label: "Editar Perfil", action: () => navigate("/cliente/editar-perfil") },
    { icon: Package, label: "Meus Pedidos", action: () => navigate("/cliente/meus-pedidos") },
    { icon: MapPin, label: "Endereços", action: () => navigate("/cliente/enderecos") },
    { icon: CreditCard, label: "Métodos de Pagamento", action: () => navigate("/cliente/metodos-pagamento") },
    { icon: Bell, label: "Notificações", action: () => navigate("/cliente/notificacoes") },
    { icon: Users, label: "Programa de Afiliados", action: () => navigate("/cliente/afiliados"), highlight: true },
    { icon: Briefcase, label: "Prestador de Serviços", action: () => navigate("/cliente/prestador-servicos") },
    ...(canInstall && !isInstalled ? [{ icon: Smartphone, label: "Instalar App", action: () => navigate("/cliente/instalar") }] : []),
    { icon: MessageCircle, label: "Suporte", action: () => navigate("/cliente/suporte") },
    { icon: LogOut, label: "Sair", action: handleLogout },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <ParticlesBackground />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-primary">Meu Perfil</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 relative z-10">
        {/* Perfil Card */}
        <Card className="bg-white border shadow-sm p-6 mb-6 text-center">
          {profile?.foto_perfil_url ? (
            <img src={profile.foto_perfil_url} alt="Perfil" className="w-24 h-24 rounded-full object-cover mx-auto mb-4" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-4xl mx-auto mb-4">
              <User className="h-12 w-12 text-white" />
            </div>
          )}
          <h2 className="text-xl font-bold mb-1">{profile?.nome || 'Carregando...'}</h2>
          <p className="text-sm text-muted-foreground mb-4">{profile?.email || ''}</p>
          <Button onClick={() => navigate("/cliente/editar-perfil")} className="bg-primary hover:bg-primary/90 text-white">
            <Edit className="h-4 w-4 mr-2" />
            Editar Perfil
          </Button>
        </Card>

        {/* Estatísticas */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="bg-white border shadow-sm p-4 text-center">
            <p className="text-2xl font-bold text-primary">{orders.length}</p>
            <p className="text-xs text-muted-foreground">Pedidos</p>
          </Card>
          <Card className="bg-white border shadow-sm p-4 text-center">
            <p className="text-2xl font-bold text-primary">{favorites.length}</p>
            <p className="text-xs text-muted-foreground">Favoritos</p>
          </Card>
          <Card className="bg-white border shadow-sm p-4 text-center">
            <p className="text-2xl font-bold text-primary">0</p>
            <p className="text-xs text-muted-foreground">Avaliações</p>
          </Card>
        </div>

        {/* Menu */}
        <div className="space-y-3">
          {menuItems.map((item: any) => {
            const Icon = item.icon;
            const isLogout = item.label === "Sair";
            const isHighlight = item.highlight;
            return (
              <Card
                key={item.label}
                onClick={item.action}
                className={`bg-white border shadow-sm p-4 cursor-pointer hover:shadow-md transition-all ${
                  isLogout ? "border-red-500/30" : ""
                } ${isHighlight ? "border-primary bg-primary/5" : ""}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    isLogout ? "bg-red-500/20" : isHighlight ? "bg-primary" : "bg-primary/20"
                  }`}>
                    <Icon className={`h-6 w-6 ${isLogout ? "text-red-500" : isHighlight ? "text-white" : "text-primary"}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-medium ${isLogout ? "text-red-500" : ""}`}>
                      {item.label}
                    </h3>
                    {isHighlight && (
                      <p className="text-xs text-muted-foreground">Acesso rápido na tela inicial</p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Versão */}
        <p className="text-center text-xs text-muted-foreground mt-8">
          Versão 1.0.0
        </p>
      </main>

      <BottomNav />
    </div>
  );
};

export default Perfil;
