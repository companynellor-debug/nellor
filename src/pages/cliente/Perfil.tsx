import { BottomNav } from "@/components/cliente/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, MapPin, Bell, Package, LogOut, Edit, CreditCard, ChevronRight, Users, Briefcase, Zap, ShoppingBag, Truck, HeadphonesIcon, Store } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useSupabaseOrders } from "@/hooks/useSupabaseOrders";
import { usePWA } from "@/hooks/usePWA";
import nellorLogo from "@/assets/nellor-logo.png";

const Perfil = () => {
  const navigate = useNavigate();
  const { profile, signOut } = useSupabaseAuth();
  const { orders } = useSupabaseOrders();
  const { canInstall, isInstalled } = usePWA();

  const handleLogout = async () => {
    await signOut();
  };

  const pendingPayment = orders.filter((o: any) => o?.payment_status === "pending").length;
  const toShip = orders.filter((o: any) => o?.order_status === "confirmed" || o?.order_status === "processing").length;
  const toReceive = orders.filter((o: any) => o?.order_status === "shipped").length;

  return (
    <div className="min-h-screen bg-muted/30 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <img src={nellorLogo} alt="Nellor" className="h-6 brightness-0 invert" />
          <h1 className="text-base font-semibold">Meu Perfil</h1>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/cliente/notificacoes")} className="relative">
              <Bell className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-5 space-y-5">
        {/* Profile Card */}
        <div className="flex flex-col items-center -mt-1">
          {profile?.foto_perfil_url ? (
            <img
              src={profile.foto_perfil_url}
              alt="Perfil"
              className="w-20 h-20 rounded-full object-cover border-4 border-primary/20"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center border-4 border-primary/20">
              <User className="h-10 w-10 text-primary-foreground" />
            </div>
          )}
          <h2 className="text-lg font-bold mt-2">{profile?.nome || "Carregando..."}</h2>
          <span className="text-[10px] font-semibold uppercase tracking-wider bg-primary/10 text-primary px-3 py-0.5 rounded-full mt-1">
            Membro Nellor
          </span>
          <Button
            onClick={() => navigate("/cliente/editar-perfil")}
            variant="outline"
            size="sm"
            className="mt-3 rounded-full border-primary/30 text-primary hover:bg-primary/5"
          >
            <Edit className="h-3.5 w-3.5 mr-1.5" />
            Editar Perfil
          </Button>
        </div>

        {/* Meus Pedidos */}
        <Card className="p-4 border shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">Meus Pedidos</h3>
            <button
              onClick={() => navigate("/cliente/meus-pedidos")}
              className="text-xs text-primary font-medium flex items-center gap-0.5"
            >
              Ver histórico
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => navigate("/cliente/meus-pedidos")}
              className="flex flex-col items-center gap-1.5 py-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center relative">
                <CreditCard className="h-5 w-5 text-orange-600" />
                {pendingPayment > 0 && (
                  <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {pendingPayment}
                  </span>
                )}
              </div>
              <span className="text-xs text-muted-foreground">A Pagar</span>
            </button>
            <button
              onClick={() => navigate("/cliente/meus-pedidos")}
              className="flex flex-col items-center gap-1.5 py-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center relative">
                <Package className="h-5 w-5 text-blue-600" />
                {toShip > 0 && (
                  <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {toShip}
                  </span>
                )}
              </div>
              <span className="text-xs text-muted-foreground">A Enviar</span>
            </button>
            <button
              onClick={() => navigate("/cliente/meus-pedidos")}
              className="flex flex-col items-center gap-1.5 py-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center relative">
                <Truck className="h-5 w-5 text-purple-600" />
                {toReceive > 0 && (
                  <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {toReceive}
                  </span>
                )}
              </div>
              <span className="text-xs text-muted-foreground">A Receber</span>
            </button>
          </div>
        </Card>

        {/* Menu principal */}
        <div className="space-y-1">
          {[
            { icon: MapPin, label: "Meus Endereços", route: "/cliente/enderecos" },
            { icon: CreditCard, label: "Métodos de Pagamento", route: "/cliente/metodos-pagamento" },
            { icon: Bell, label: "Notificações", route: "/cliente/notificacoes" },
            { icon: Users, label: "Programa de Afiliados", route: "/cliente/afiliados" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={() => navigate(item.route)}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <Icon className="h-5 w-5 text-primary" />
                <span className="flex-1 text-left text-sm font-medium">{item.label}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            );
          })}
        </div>

        {/* Serviços Nellor */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-2 px-1">Serviços Nellor</h3>
          <Card className="border shadow-sm divide-y">
            {[
              { icon: Zap, label: "Nellor Drop", desc: "Estoque compartilhado", route: "/drop" },
              { icon: Store, label: "Revender Produtos", desc: "Lucre revendendo", route: "/drop" },
              { icon: Briefcase, label: "Prestador de Serviços", desc: "Ofereça seus talentos", route: "/cliente/prestador-servicos" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={() => navigate(item.route)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/30 transition-colors first:rounded-t-lg last:rounded-b-lg"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              );
            })}
          </Card>
        </div>

        {/* Suporte */}
        <Button
          onClick={() => navigate("/cliente/suporte")}
          variant="outline"
          className="w-full rounded-full border-primary text-primary hover:bg-primary/5 font-medium"
        >
          <HeadphonesIcon className="h-4 w-4 mr-2" />
          Central de Suporte Nellor
        </Button>

        {/* Sair */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 text-destructive text-sm font-medium hover:opacity-80 transition-opacity"
        >
          <LogOut className="h-4 w-4" />
          Sair da Conta
        </button>
      </main>

      <BottomNav />
    </div>
  );
};

export default Perfil;
