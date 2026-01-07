import { 
  Store, 
  ShoppingBag, 
  Link2, 
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Clock,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const marketplaces = [
  {
    id: 'mercadolivre',
    name: 'Mercado Livre',
    color: 'bg-yellow-500',
    status: 'available',
    description: 'Maior marketplace da América Latina',
    products: 0,
    orders: 0
  },
  {
    id: 'shopee',
    name: 'Shopee',
    color: 'bg-orange-500',
    status: 'available',
    description: 'Marketplace em crescimento no Brasil',
    products: 0,
    orders: 0
  },
  {
    id: 'amazon',
    name: 'Amazon',
    color: 'bg-orange-400',
    status: 'coming_soon',
    description: 'Gigante global do e-commerce',
    products: 0,
    orders: 0
  },
  {
    id: 'tiktok',
    name: 'TikTok Shop',
    color: 'bg-black',
    status: 'coming_soon',
    description: 'Social commerce em ascensão',
    products: 0,
    orders: 0
  },
];

const DropMarketplaces = () => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'connected':
        return { 
          icon: CheckCircle, 
          label: 'Conectado', 
          color: 'text-green-600 bg-green-500/10 border-green-500/20' 
        };
      case 'available':
        return { 
          icon: Link2, 
          label: 'Disponível', 
          color: 'text-primary bg-primary/10 border-primary/20' 
        };
      case 'coming_soon':
        return { 
          icon: Clock, 
          label: 'Em breve', 
          color: 'text-muted-foreground bg-muted border-border' 
        };
      default:
        return { 
          icon: AlertCircle, 
          label: status, 
          color: 'text-muted-foreground bg-muted border-border' 
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Marketplaces</h1>
        <p className="text-muted-foreground mt-1">
          Conecte suas contas e sincronize produtos automaticamente
        </p>
      </div>

      {/* Info Card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4 lg:p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <Store className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-foreground font-semibold">Venda em múltiplos canais</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Conecte seus marketplaces para sincronizar produtos, receber pedidos automaticamente 
                e gerenciar tudo em um só lugar. Estoque e preços são atualizados em tempo real.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Marketplaces Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {marketplaces.map((marketplace) => {
          const statusConfig = getStatusConfig(marketplace.status);
          const isAvailable = marketplace.status === 'available' || marketplace.status === 'connected';
          
          return (
            <Card 
              key={marketplace.id}
              className={cn(
                "bg-card border transition-all",
                isAvailable 
                  ? "border-border hover:border-primary/50" 
                  : "border-border/50 opacity-70"
              )}
            >
              <CardContent className="p-5 lg:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "h-14 w-14 rounded-xl flex items-center justify-center overflow-hidden",
                      marketplace.color
                    )}>
                      {marketplace.id === 'mercadolivre' && (
                        <span className="text-2xl font-bold text-white">ML</span>
                      )}
                      {marketplace.id === 'shopee' && (
                        <span className="text-2xl font-bold text-white">S</span>
                      )}
                      {marketplace.id === 'amazon' && (
                        <span className="text-xl font-bold text-white">amz</span>
                      )}
                      {marketplace.id === 'tiktok' && (
                        <span className="text-xl font-bold text-white">TT</span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-foreground font-semibold text-lg">{marketplace.name}</h3>
                      <p className="text-muted-foreground text-sm">{marketplace.description}</p>
                    </div>
                  </div>
                  
                  <Badge 
                    variant="outline"
                    className={cn("flex items-center gap-1.5", statusConfig.color)}
                  >
                    <statusConfig.icon className="h-3.5 w-3.5" />
                    {statusConfig.label}
                  </Badge>
                </div>

                {marketplace.status === 'connected' && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-muted/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-muted-foreground text-xs">
                          <ShoppingBag className="h-3 w-3" />
                          Produtos
                        </div>
                        <p className="text-foreground font-bold text-lg mt-1">
                          {marketplace.products}
                        </p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-muted-foreground text-xs">
                          <Store className="h-3 w-3" />
                          Pedidos
                        </div>
                        <p className="text-foreground font-bold text-lg mt-1">
                          {marketplace.orders}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-4 flex gap-2">
                  {marketplace.status === 'available' && (
                    <Button className="flex-1">
                      <Link2 className="h-4 w-4 mr-2" />
                      Conectar
                    </Button>
                  )}
                  {marketplace.status === 'connected' && (
                    <>
                      <Button variant="outline" className="flex-1">
                        <Settings className="h-4 w-4 mr-2" />
                        Configurar
                      </Button>
                      <Button variant="outline">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  {marketplace.status === 'coming_soon' && (
                    <Button variant="outline" className="flex-1" disabled>
                      <Clock className="h-4 w-4 mr-2" />
                      Em breve
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Coming Features */}
      <Card className="bg-card border-border">
        <CardContent className="p-5 lg:p-6">
          <h3 className="text-foreground font-semibold mb-4">Funcionalidades em desenvolvimento</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              "Sincronização automática de estoque",
              "Importação de pedidos em tempo real",
              "Atualização de preços em lote",
              "Mapeamento de categorias",
              "Relatórios por marketplace",
              "Webhooks de notificação"
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-muted-foreground text-sm">
                <Clock className="h-4 w-4 text-primary flex-shrink-0" />
                {feature}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DropMarketplaces;
