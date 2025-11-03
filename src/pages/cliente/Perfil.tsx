import { ParticlesBackground } from "@/components/cliente/ParticlesBackground";
import { BottomNav } from "@/components/cliente/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, MapPin, Bell, Package, LogOut, Edit } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Perfil = () => {
  const navigate = useNavigate();

  const menuItems = [
    { icon: Edit, label: "Editar Perfil", action: () => {} },
    { icon: Package, label: "Meus Pedidos", action: () => {} },
    { icon: MapPin, label: "Endereços", action: () => {} },
    { icon: Bell, label: "Notificações", action: () => {} },
    { icon: LogOut, label: "Sair", action: () => navigate("/") },
  ];

  return (
    <div className="min-h-screen bg-[hsl(var(--cliente-bg))] text-[hsl(var(--cliente-text))] pb-20">
      <ParticlesBackground />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-[hsl(var(--cliente-surface))]/95 backdrop-blur-lg border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Meu Perfil</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 relative z-10">
        {/* Perfil Card */}
        <Card className="bg-white/5 backdrop-blur-sm border-white/10 p-6 mb-6 text-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-4xl mx-auto mb-4">
            <User className="h-12 w-12 text-white" />
          </div>
          <h2 className="text-xl font-bold mb-1">Maria Silva</h2>
          <p className="text-sm text-[hsl(var(--cliente-text-muted))] mb-4">maria.silva@email.com</p>
          <Button className="bg-[hsl(var(--cliente-accent))] hover:bg-[hsl(var(--cliente-accent))]/90 text-white">
            <Edit className="h-4 w-4 mr-2" />
            Editar Perfil
          </Button>
        </Card>

        {/* Estatísticas */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="bg-white/5 backdrop-blur-sm border-white/10 p-4 text-center">
            <p className="text-2xl font-bold text-[hsl(var(--cliente-accent))]">12</p>
            <p className="text-xs text-[hsl(var(--cliente-text-muted))]">Pedidos</p>
          </Card>
          <Card className="bg-white/5 backdrop-blur-sm border-white/10 p-4 text-center">
            <p className="text-2xl font-bold text-[hsl(var(--cliente-accent))]">5</p>
            <p className="text-xs text-[hsl(var(--cliente-text-muted))]">Favoritos</p>
          </Card>
          <Card className="bg-white/5 backdrop-blur-sm border-white/10 p-4 text-center">
            <p className="text-2xl font-bold text-[hsl(var(--cliente-accent))]">8</p>
            <p className="text-xs text-[hsl(var(--cliente-text-muted))]">Avaliações</p>
          </Card>
        </div>

        {/* Menu */}
        <div className="space-y-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.label}
                onClick={item.action}
                className={`bg-white/5 backdrop-blur-sm border-white/10 p-4 cursor-pointer hover:bg-white/10 transition-all ${
                  item.label === "Sair" ? "border-red-500/30" : ""
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    item.label === "Sair" ? "bg-red-500/20" : "bg-[hsl(var(--cliente-accent))]/20"
                  }`}>
                    <Icon className={`h-6 w-6 ${item.label === "Sair" ? "text-red-400" : "text-[hsl(var(--cliente-accent))]"}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-medium ${item.label === "Sair" ? "text-red-400" : ""}`}>
                      {item.label}
                    </h3>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Versão */}
        <p className="text-center text-xs text-[hsl(var(--cliente-text-muted))] mt-8">
          Versão 1.0.0
        </p>
      </main>

      <BottomNav />
    </div>
  );
};

export default Perfil;
