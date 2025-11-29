import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  DollarSign, 
  TrendingUp, 
  Eye, 
  HelpCircle,
  AlertTriangle,
  ArrowRight,
  Info,
  ExternalLink
} from "lucide-react";
import { useSupabaseOrders, Order } from "@/hooks/useSupabaseOrders";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { StripeConnectModal } from "@/components/fornecedor/StripeConnectModal";
import { StripeBanner } from "@/components/fornecedor/StripeBanner";
import { useNavigate } from "react-router-dom";

const Financeiro = () => {
  const navigate = useNavigate();
  const { orders } = useSupabaseOrders();
  const { profile } = useSupabaseAuth();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // TODO: Verificar se Stripe está conectado
  const isStripeConnected = !!(profile as any)?.stripe_account_id;

  // Cálculos de valores (placeholders - serão substituídos por dados reais do Stripe)
  const totalVendido = orders
    .filter(o => o.order_status !== 'cancelled' && o.payment_status === 'paid')
    .reduce((sum, o) => sum + Number(o.total), 0);

  const getStatusLabel = (status: Order['order_status']) => {
    const labels: { [key: string]: string } = {
      pending: 'Aguardando Pagamento',
      preparing: 'Pagamento Confirmado',
      shipped: 'Enviado',
      delivered: 'Entregue',
      cancelled: 'Cancelado',
    };
    return labels[status] || status;
  };

  const getPaymentStatusBadge = (order: Order) => {
    if (!isStripeConnected && order.payment_status === 'paid') {
      return (
        <Badge variant="outline" className="text-amber-600 border-amber-600 text-xs">
          Valor pendente - Conecte Stripe
        </Badge>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Banner de conexão Stripe */}
      <StripeBanner isStripeConnected={isStripeConnected} />

      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold">Financeiro</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/fornecedor/recebimentos')}
          >
            Ver Recebimentos
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowHelpModal(true)}
          >
            <HelpCircle className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Cards de Resumo - Placeholders até Stripe ser integrado */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card className="p-4 sm:p-6 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                Total Vendido
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3" />
                  </TooltipTrigger>
                  <TooltipContent>
                    Soma total das vendas no período
                  </TooltipContent>
                </Tooltip>
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-primary">
                R$ {totalVendido.toFixed(2)}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 sm:h-10 sm:w-10 text-primary/20" />
          </div>
        </Card>

        <Card className="p-4 sm:p-6 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                Saldo Disponível
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3" />
                  </TooltipTrigger>
                  <TooltipContent>
                    {isStripeConnected 
                      ? "Valor disponível para payout automático" 
                      : "Conecte Stripe para ver seu saldo"}
                  </TooltipContent>
                </Tooltip>
              </p>
              {isStripeConnected ? (
                <p className="text-2xl sm:text-3xl font-bold text-green-600">
                  R$ 0,00
                  {/* TODO: Popular via Stripe Balance API */}
                </p>
              ) : (
                <Button 
                  variant="link" 
                  className="text-amber-600 p-0 h-auto text-lg"
                  onClick={() => setShowConnectModal(true)}
                >
                  Conectar Stripe
                </Button>
              )}
            </div>
            <DollarSign className="h-8 w-8 sm:h-10 sm:w-10 text-green-600/20" />
          </div>
        </Card>

        <Card className="p-4 sm:p-6 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                Saldo Pendente
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3" />
                  </TooltipTrigger>
                  <TooltipContent>
                    {isStripeConnected 
                      ? "Valor em processamento" 
                      : "Conecte Stripe para ver"}
                  </TooltipContent>
                </Tooltip>
              </p>
              {isStripeConnected ? (
                <p className="text-2xl sm:text-3xl font-bold text-orange-600">
                  R$ 0,00
                  {/* TODO: Popular via Stripe Pending Balance API */}
                </p>
              ) : (
                <p className="text-lg text-muted-foreground">---</p>
              )}
            </div>
            <DollarSign className="h-8 w-8 sm:h-10 sm:w-10 text-orange-600/20" />
          </div>
        </Card>
      </div>

      {/* Aviso de conexão Stripe */}
      {!isStripeConnected && (
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/20">
          <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <AlertTriangle className="h-8 w-8 text-amber-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-amber-800 dark:text-amber-200">
                  Conecte sua conta Stripe
                </h3>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  Para receber seus pagamentos automaticamente, conecte sua conta Stripe.
                </p>
              </div>
            </div>
            <Button 
              onClick={() => setShowConnectModal(true)}
              className="w-full sm:w-auto"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Conectar Stripe
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Histórico de Vendas */}
      <Card className="overflow-hidden">
        <CardHeader className="p-4 sm:p-6 border-b">
          <CardTitle className="text-base sm:text-xl font-bold flex items-center justify-between">
            <span>Histórico de Vendas</span>
            <Button variant="ghost" size="sm" onClick={() => setShowHelpModal(true)}>
              Como funciona
            </Button>
          </CardTitle>
        </CardHeader>
        <div className="divide-y">
          {orders.filter(o => o.order_status !== 'cancelled').length > 0 ? (
            orders.filter(o => o.order_status !== 'cancelled').map((order) => (
              <div key={order.id} className="p-4 sm:p-6 hover:bg-muted/20 transition-colors">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm sm:text-base mb-1">Pedido #{order.order_number}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {format(new Date(order.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="outline" className="text-xs">
                      {getStatusLabel(order.order_status)}
                    </Badge>
                    {getPaymentStatusBadge(order)}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
                  <div>
                    <p className="text-muted-foreground">Cliente</p>
                    <p className="font-medium">{(order.endereco_entrega as any)?.name || 'Cliente'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-muted-foreground">Valor</p>
                    <p className="font-semibold text-base sm:text-lg text-primary">
                      R$ {Number(order.total).toFixed(2)}
                    </p>
                  </div>
                </div>
                
                <div className="mt-3 flex justify-end">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-xs sm:text-sm"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Ver Detalhes
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-muted-foreground">
              <p>Nenhuma venda realizada ainda</p>
            </div>
          )}
        </div>
      </Card>

      {/* Explicação do cálculo */}
      <Card className="bg-muted/30">
        <CardContent className="p-4 text-xs text-muted-foreground">
          <strong>Como é calculado o valor líquido:</strong>
          <p className="mt-1">
            Valor Líquido = Valor Bruto − Comissão Plataforma (7,5% no plano Grátis, 0% no Premium) − Taxa Stripe (~3,4%)
          </p>
        </CardContent>
      </Card>

      {/* Modal de Detalhes do Pedido */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Pedido #{selectedOrder?.order_number}</DialogTitle>
            <DialogDescription>
              Informações completas do pedido
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Cliente</p>
                  <p className="font-medium">{(selectedOrder.endereco_entrega as any)?.name || 'Cliente'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor Bruto</p>
                  <p className="font-medium text-lg">R$ {Number(selectedOrder.total).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data</p>
                  <p className="font-medium">{format(new Date(selectedOrder.created_at), "dd/MM/yyyy", { locale: ptBR })}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium">{getStatusLabel(selectedOrder.order_status)}</p>
                </div>
              </div>

              {/* Placeholder para valores Stripe */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium text-sm mb-3">Detalhamento do Pagamento</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valor bruto:</span>
                    <span>R$ {Number(selectedOrder.total).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Comissão plataforma (7,5%):</span>
                    <span className="text-red-600">- R$ {(Number(selectedOrder.total) * 0.075).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Taxa Stripe (estimada ~3,4%):</span>
                    <span className="text-red-600">- R$ {(Number(selectedOrder.total) * 0.034).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t font-medium">
                    <span>Valor líquido (estimado):</span>
                    <span className="text-green-600">
                      R$ {(Number(selectedOrder.total) * 0.891).toFixed(2)}
                    </span>
                  </div>
                </div>
                {/* TODO: Substituir valores estimados por valores reais do Stripe */}
              </div>

              {selectedOrder.proof_url && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Comprovante de Pagamento</p>
                  <img 
                    src={selectedOrder.proof_url} 
                    alt="Comprovante" 
                    className="max-w-full h-auto rounded-lg border"
                  />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Conexão Stripe */}
      <StripeConnectModal open={showConnectModal} onOpenChange={setShowConnectModal} />

      {/* Modal de Ajuda */}
      <Dialog open={showHelpModal} onOpenChange={setShowHelpModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Como funcionam os pagamentos</DialogTitle>
            <DialogDescription>
              Entenda o fluxo de recebimentos
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <p>
              Todos os pagamentos são processados pela Stripe. Assim que o cliente paga pelo pedido, 
              o valor é dividido automaticamente entre a plataforma (comissão), você (vendedor) e a taxa Stripe.
            </p>
            <p>
              Os vendedores recebem <strong>pagamentos semanais automáticos</strong>. 
              Não existe saque manual.
            </p>
            <p>
              Caso você ainda não tenha conectado a Stripe, o valor permanece pendente 
              até a conexão ser realizada.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Financeiro;
