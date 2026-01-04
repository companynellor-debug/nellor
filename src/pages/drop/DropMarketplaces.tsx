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
import { cn } from "@/lib/utils";

const marketplaces = [
  {
    id: 'mercadolivre',
    name: 'Mercado Livre',
    logo: 'https://http2.mlstatic.com/frontend-assets/ui-navigation/5.19.5/mercadolibre/logo__large_plus.png',
    color: 'bg-yellow-500',
    status: 'available',
    description: 'Maior marketplace da América Latina',
    products: 0,
    orders: 0
  },
  {
    id: 'shopee',
    name: 'Shopee',
    logo: 'https://deo.shopeemobile.com/shopee/shopee-pcmall-live-sg/assets/icon_favicon_1_32.png',
    color: 'bg-orange-500',
    status: 'available',
    description: 'Marketplace em crescimento no Brasil',
    products: 0,
    orders: 0
  },
  {
    id: 'amazon',
    name: 'Amazon',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg',
    color: 'bg-orange-400',
    status: 'coming_soon',
    description: 'Gigante global do e-commerce',
    products: 0,
    orders: 0
  },
  {
    id: 'tiktok',
    name: 'TikTok Shop',
    logo: 'https://lf16-tiktok-web.ttwstatic.com/obj/tiktok-web/tiktok/webapp/main/webapp-desktop/8152caf0c8e8bc67ae0d.png',
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
          color: 'text-drop-success bg-drop-success/10 border-drop-success/20' 
        };
      case 'available':
        return { 
          icon: Link2, 
          label: 'Disponível', 
          color: 'text-drop-accent bg-drop-accent/10 border-drop-accent/20' 
        };
      case 'coming_soon':
        return { 
          icon: Clock, 
          label: 'Em breve', 
          color: 'text-drop-text-muted bg-drop-surface border-drop-border' 
        };
      default:
        return { 
          icon: AlertCircle, 
          label: status, 
          color: 'text-drop-text-muted bg-drop-surface border-drop-border' 
        };
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-drop-text">Marketplaces</h1>
        <p className="text-drop-text-muted mt-1">
          Conecte suas contas e sincronize produtos automaticamente
        </p>
      </div>

      {/* Info Card */}
      <div className="bg-drop-accent/10 border border-drop-accent/20 rounded-2xl p-4 lg:p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-drop-accent/20">
            <Store className="h-6 w-6 text-drop-accent" />
          </div>
          <div>
            <h3 className="text-drop-text font-semibold">Venda em múltiplos canais</h3>
            <p className="text-drop-text-muted text-sm mt-1">
              Conecte seus marketplaces para sincronizar produtos, receber pedidos automaticamente 
              e gerenciar tudo em um só lugar. Estoque e preços são atualizados em tempo real.
            </p>
          </div>
        </div>
      </div>

      {/* Marketplaces Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {marketplaces.map((marketplace) => {
          const statusConfig = getStatusConfig(marketplace.status);
          const isAvailable = marketplace.status === 'available' || marketplace.status === 'connected';
          
          return (
            <div 
              key={marketplace.id}
              className={cn(
                "bg-drop-card border rounded-2xl p-5 lg:p-6 transition-all",
                isAvailable 
                  ? "border-drop-border hover:border-drop-accent/50" 
                  : "border-drop-border/50 opacity-70"
              )}
            >
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
                    <h3 className="text-drop-text font-semibold text-lg">{marketplace.name}</h3>
                    <p className="text-drop-text-muted text-sm">{marketplace.description}</p>
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
                <div className="mt-4 pt-4 border-t border-drop-border">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-drop-surface rounded-lg p-3">
                      <div className="flex items-center gap-2 text-drop-text-muted text-xs">
                        <ShoppingBag className="h-3 w-3" />
                        Produtos
                      </div>
                      <p className="text-drop-text font-bold text-lg mt-1">
                        {marketplace.products}
                      </p>
                    </div>
                    <div className="bg-drop-surface rounded-lg p-3">
                      <div className="flex items-center gap-2 text-drop-text-muted text-xs">
                        <Store className="h-3 w-3" />
                        Pedidos
                      </div>
                      <p className="text-drop-text font-bold text-lg mt-1">
                        {marketplace.orders}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4 flex gap-2">
                {marketplace.status === 'available' && (
                  <Button 
                    className="flex-1 bg-drop-accent hover:bg-drop-accent/90 text-white"
                  >
                    <Link2 className="h-4 w-4 mr-2" />
                    Conectar
                  </Button>
                )}
                {marketplace.status === 'connected' && (
                  <>
                    <Button 
                      variant="outline"
                      className="flex-1 border-drop-border text-drop-text hover:bg-drop-surface-hover"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Configurar
                    </Button>
                    <Button 
                      variant="outline"
                      className="border-drop-border text-drop-text hover:bg-drop-surface-hover"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </>
                )}
                {marketplace.status === 'coming_soon' && (
                  <Button 
                    variant="outline"
                    disabled
                    className="flex-1 border-drop-border text-drop-text-muted"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Em breve
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Coming Features */}
      <div className="bg-drop-surface border border-drop-border rounded-2xl p-5 lg:p-6">
        <h3 className="text-drop-text font-semibold mb-4">Funcionalidades em desenvolvimento</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            "Sincronização automática de estoque",
            "Importação de pedidos em tempo real",
            "Atualização de preços em lote",
            "Mapeamento de categorias",
            "Relatórios por marketplace",
            "Webhooks de notificação"
          ].map((feature, i) => (
            <div key={i} className="flex items-center gap-3 text-drop-text-muted text-sm">
              <Clock className="h-4 w-4 text-drop-accent flex-shrink-0" />
              {feature}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DropMarketplaces;
