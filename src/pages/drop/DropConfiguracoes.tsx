import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Settings, 
  User, 
  Store, 
  Bell, 
  Shield,
  CreditCard,
  HelpCircle,
  LogOut,
  ChevronRight,
  Save,
  Building
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useClientDrop } from "@/hooks/useClientDrop";
import { useAppMode } from "@/hooks/useAppMode";
import { cn } from "@/lib/utils";

const settingsSections = [
  {
    id: 'profile',
    title: 'Perfil do Negócio',
    icon: Building,
    description: 'Nome e informações da sua loja'
  },
  {
    id: 'notifications',
    title: 'Notificações',
    icon: Bell,
    description: 'Configure alertas e avisos'
  },
  {
    id: 'payments',
    title: 'Pagamentos',
    icon: CreditCard,
    description: 'Métodos de recebimento'
  },
  {
    id: 'security',
    title: 'Segurança',
    icon: Shield,
    description: 'Senha e autenticação'
  },
];

const DropConfiguracoes = () => {
  const { dropProfile, activateDropMode } = useClientDrop();
  const { setMode } = useAppMode();
  const navigate = useNavigate();
  const [businessName, setBusinessName] = useState(dropProfile?.business_name || '');
  const [activeSection, setActiveSection] = useState('profile');

  const handleSaveProfile = async () => {
    await activateDropMode.mutateAsync(businessName);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground mt-1">Gerencie as preferências do seu Nellor Drop</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          {settingsSections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left",
                activeSection === section.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <section.icon className="h-5 w-5" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{section.title}</p>
                <p className={cn(
                  "text-xs truncate",
                  activeSection === section.id ? "text-primary-foreground/70" : "text-muted-foreground"
                )}>
                  {section.description}
                </p>
              </div>
              <ChevronRight className={cn(
                "h-4 w-4",
                activeSection === section.id ? "text-primary-foreground/50" : "text-muted-foreground"
              )} />
            </button>
          ))}
          
          {/* Exit Drop Mode */}
          <button
            onClick={() => { setMode('cliente'); navigate('/cliente'); }}
            className="w-full flex items-center gap-3 p-3 rounded-xl text-left text-destructive hover:bg-destructive/10 transition-all mt-4"
          >
            <LogOut className="h-5 w-5" />
            <div className="flex-1">
              <p className="font-medium text-sm">Sair do Modo Drop</p>
              <p className="text-xs opacity-70">Voltar ao modo cliente</p>
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {activeSection === 'profile' && (
            <Card className="bg-card border-border p-5 lg:p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Perfil do Negócio</h2>
                <p className="text-muted-foreground text-sm">
                  Informações exibidas aos fornecedores
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-foreground text-sm font-medium">Nome do Negócio</label>
                  <Input
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Ex: Loja do João"
                    className="mt-1.5 bg-background border-border"
                  />
                  <p className="text-muted-foreground text-xs mt-1">
                    Este nome será usado nas comunicações com fornecedores
                  </p>
                </div>

                <div className="pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-foreground font-medium">Status Nellor Drop</p>
                      <p className="text-muted-foreground text-sm">
                        {dropProfile?.drop_enabled ? 'Ativo' : 'Inativo'}
                      </p>
                    </div>
                    <Badge className={cn(
                      dropProfile?.drop_enabled 
                        ? "bg-green-500/10 text-green-600 border-green-500/20"
                        : "bg-muted text-muted-foreground"
                    )}>
                      {dropProfile?.drop_enabled ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleSaveProfile}
                disabled={activateDropMode.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {activateDropMode.isPending ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </Card>
          )}

          {activeSection === 'notifications' && (
            <Card className="bg-card border-border p-5 lg:p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Notificações</h2>
                <p className="text-muted-foreground text-sm">
                  Configure quais alertas deseja receber
                </p>
              </div>

              <div className="space-y-4">
                {[
                  { key: 'orders', label: 'Novos pedidos', description: 'Quando uma venda for realizada' },
                  { key: 'payments', label: 'Pagamentos', description: 'Confirmações de pagamento' },
                  { key: 'shipping', label: 'Envios', description: 'Atualizações de entrega' },
                  { key: 'stock', label: 'Estoque baixo', description: 'Quando produtos estiverem acabando' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                    <div>
                      <p className="text-foreground font-medium">{item.label}</p>
                      <p className="text-muted-foreground text-sm">{item.description}</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                ))}
              </div>
            </Card>
          )}

          {activeSection === 'payments' && (
            <Card className="bg-card border-border p-5 lg:p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Pagamentos</h2>
                <p className="text-muted-foreground text-sm">
                  Configure como deseja receber seus lucros
                </p>
              </div>

              <div className="bg-muted/50 rounded-xl p-4 border border-border">
                <div className="flex items-center gap-3 mb-4">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <span className="text-foreground font-medium">Método de Recebimento</span>
                </div>
                <p className="text-muted-foreground text-sm">
                  Os lucros das suas vendas são creditados automaticamente após a confirmação 
                  do pagamento do cliente final.
                </p>
              </div>



            </Card>
          )}

          {activeSection === 'security' && (
            <Card className="bg-card border-border p-5 lg:p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Segurança</h2>
                <p className="text-muted-foreground text-sm">
                  Proteja sua conta
                </p>
              </div>

              <div className="space-y-4">
                <Button 
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Shield className="h-4 w-4 mr-3" />
                  Alterar senha
                </Button>
                <Button 
                  variant="outline"
                  className="w-full justify-start"
                >
                  <HelpCircle className="h-4 w-4 mr-3" />
                  Suporte
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default DropConfiguracoes;
