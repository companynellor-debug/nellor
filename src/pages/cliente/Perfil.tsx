import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, MapPin, Bell, Package, Edit, CreditCard, MessageCircle, Smartphone, Users, Briefcase, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useFavorites } from "@/hooks/useFavorites";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useSupabaseOrders } from "@/hooks/useSupabaseOrders";
import { usePWA } from "@/hooks/usePWA";

const Perfil = () => {
  const navigate = useNavigate();
  const { favorites } = useFavorites();
  const { profile } = useSupabaseAuth();
  const { orders } = useSupabaseOrders();
  const { canInstall, isInstalled } = usePWA();

  const menuItems = [
    { icon: Edit, label: "Editar Perfil", action: () => navigate("/cliente/editar-perfil") },
    { icon: Package, label: "Meus Pedidos", action: () => navigate("/cliente/meus-pedidos") },
    { icon: MapPin, label: "Endereços", action: () => navigate("/cliente/enderecos") },
    { icon: CreditCard, label: "Métodos de Pagamento", action: () => navigate("/cliente/metodos-pagamento") },
    { icon: Bell, label: "Notificações", action: () => navigate("/cliente/notificacoes") },
    { icon: Users, label: "Programa de Afiliados", action: () => navigate("/cliente/afiliados"), highlight: true },
    { icon: Zap, label: "Nellor Drop", action: () => navigate("/drop"), highlight: true, description: "Revenda produtos" },
    { icon: Briefcase, label: "Prestador de Serviços", action: () => navigate("/cliente/prestador-servicos") },
    ...(canInstall && !isInstalled ? [{ icon: Smartphone, label: "Instalar App", action: () => navigate("/cliente/instalar") }] : []),
    { icon: MessageCircle, label: "Suporte", action: () => navigate("/cliente/suporte") },
  ];

  return (
    <div className="min-h-full pb-20 lg:pb-6">
      <div className="container mx-auto px-4 py-6">
        {/* Page Title - visible on mobile since sidebar has it on desktop */}
        <h1 className="text-2xl font-bold text-foreground mb-6 lg:hidden">Meu Perfil</h1>

        {/* Profile Card */}
        <Card className="p-6 mb-6 text-center shadow-sm">
          {profile?.foto_perfil_url ? (
            <img src={profile.foto_perfil_url} alt="Perfil" className="w-24 h-24 rounded-full object-cover mx-auto mb-4 ring-4 ring-primary/20" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-4xl mx-auto mb-4">
              <User className="h-12 w-12 text-white" />
            </div>
          )}
          <h2 className="text-xl font-bold mb-1">{profile?.nome || 'Carregando...'}</h2>
          <p className="text-sm text-muted-foreground mb-4">{profile?.email || ''}</p>
          <Button onClick={() => navigate("/cliente/editar-perfil")} className="bg-primary hover:bg-primary/90">
            <Edit className="h-4 w-4 mr-2" />
            Editar Perfil
          </Button>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="p-4 text-center shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate("/cliente/meus-pedidos")}>
            <p className="text-2xl font-bold text-primary">{orders.length}</p>
            <p className="text-xs text-muted-foreground">Pedidos</p>
          </Card>
          <Card className="p-4 text-center shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate("/cliente/favoritos")}>
            <p className="text-2xl font-bold text-primary">{favorites.length}</p>
            <p className="text-xs text-muted-foreground">Favoritos</p>
          </Card>
          <Card className="p-4 text-center shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate("/cliente/avaliacoes")}>
            <p className="text-2xl font-bold text-primary">0</p>
            <p className="text-xs text-muted-foreground">Avaliações</p>
          </Card>
        </div>

        {/* Menu - hidden on desktop (sidebar has it) */}
        <div className="space-y-3 lg:hidden">
          {menuItems.map((item: any) => {
            const Icon = item.icon;
            const isHighlight = item.highlight;
            return (
              <Card
                key={item.label}
                onClick={item.action}
                className={`p-4 cursor-pointer hover:shadow-md transition-all ${
                  isHighlight ? "border-primary bg-primary/5" : ""
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    isHighlight ? "bg-primary" : "bg-primary/20"
                  }`}>
                    <Icon className={`h-6 w-6 ${isHighlight ? "text-white" : "text-primary"}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{item.label}</h3>
                    {item.description && (
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Version - visible on mobile */}
        <p className="text-center text-xs text-muted-foreground mt-8 lg:hidden">
          Versão 1.0.0
        </p>
      </div>
    </div>
  );
};

export default Perfil;
