import { useState, useEffect } from "react";
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
  ExternalLink,
  RefreshCw,
  Loader2,
  CheckCircle,
  Clock,
  Banknote
} from "lucide-react";
import { useSupabaseOrders, Order } from "@/hooks/useSupabaseOrders";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { StripeConnectModal } from "@/components/fornecedor/StripeConnectModal";
import { StripeBanner } from "@/components/fornecedor/StripeBanner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StripeBalance {
  connected: boolean;
  stripe_ready?: boolean;
  available: number;
  pending: number;
  inTransit?: number;
  currency: string;
  recentPayouts?: Array<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    arrival_date: number;
    created: number;
  }>;
  lastUpdated?: string;
  error?: string;
}

const Financeiro = () => {
  const navigate = useNavigate();
  const { orders } = useSupabaseOrders();
  const { profile } = useSupabaseAuth();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [stripeBalance, setStripeBalance] = useState<StripeBalance | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);

  const isStripeConnected = !!(profile as any)?.stripe_account_id;

  // Fetch Stripe balance
  const fetchStripeBalance = async () => {
    if (!isStripeConnected) return;
    
    setLoadingBalance(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Sessão expirada");
        return;
      }

      const response = await supabase.functions.invoke("stripe-get-balance", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        console.error("Error fetching balance:", response.error);
        toast.error("Erro ao buscar saldo");
        return;
      }

      setStripeBalance(response.data);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Erro ao conectar com Stripe");
    } finally {
      setLoadingBalance(false);
    }
  };

  // Fetch balance on mount and when stripe connection changes
  useEffect(() => {
    if (isStripeConnected) {
      fetchStripeBalance();
    }
  }, [isStripeConnected]);

  // Cálculos de valores baseados nos pedidos
  const totalVendido = orders
    .filter(o => o.order_status !== 'cancelled' && o.payment_status === 'paid')
    .reduce((sum, o) => sum + Number(o.total), 0);

  // Pedidos pendentes (aguardando pagamento)
  const pendingOrders = orders.filter(o => o.payment_status === 'pending' && o.order_status !== 'cancelled');
  const totalPendente = pendingOrders.reduce((sum, o) => sum + Number(o.total), 0);

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

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Banner de conexão Stripe */}
      <StripeBanner isStripeConnected={isStripeConnected} />

      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold">Financeiro</h1>
        <div className="flex gap-2">
          {isStripeConnected && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={fetchStripeBalance}
              disabled={loadingBalance}
            >
              {loadingBalance ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="ml-1 hidden sm:inline">Atualizar</span>
            </Button>
          )}
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

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Total Vendido */}
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
                    Soma total das vendas pagas
                  </TooltipContent>
                </Tooltip>
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-primary">
                {formatCurrency(totalVendido)}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 sm:h-10 sm:w-10 text-primary/20" />
          </div>
        </Card>

        {/* Saldo Disponível - Stripe Real */}
        <Card className="p-4 sm:p-6 relative overflow-hidden border-green-200 dark:border-green-800">
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
                      ? "Valor disponível para saque automático (dados reais do Stripe)" 
                      : "Conecte Stripe para ver seu saldo"}
                  </TooltipContent>
                </Tooltip>
              </p>
              {loadingBalance ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Carregando...</span>
                </div>
              ) : isStripeConnected && stripeBalance?.connected ? (
                <div>
                  <p className="text-2xl sm:text-3xl font-bold text-green-600">
                    {formatCurrency(stripeBalance.available)}
                  </p>
                  {stripeBalance.lastUpdated && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Atualizado: {format(new Date(stripeBalance.lastUpdated), "HH:mm", { locale: ptBR })}
                    </p>
                  )}
                </div>
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

        {/* Saldo Pendente - Stripe Real */}
        <Card className="p-4 sm:p-6 relative overflow-hidden border-orange-200 dark:border-orange-800">
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
                      ? "Valor em processamento no Stripe (liberação em 2-14 dias)" 
                      : "Conecte Stripe para ver"}
                  </TooltipContent>
                </Tooltip>
              </p>
              {loadingBalance ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : isStripeConnected && stripeBalance?.connected ? (
                <p className="text-2xl sm:text-3xl font-bold text-orange-600">
                  {formatCurrency(stripeBalance.pending)}
                </p>
              ) : (
                <p className="text-lg text-muted-foreground">---</p>
              )}
            </div>
            <Clock className="h-8 w-8 sm:h-10 sm:w-10 text-orange-600/20" />
          </div>
        </Card>
      </div>

      {/* Card adicional: Pedidos aguardando pagamento */}
      {pendingOrders.length > 0 && (
        <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-900/20">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start gap-4">
              <Banknote className="h-8 w-8 text-yellow-600 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
                  {pendingOrders.length} pedido(s) aguardando pagamento
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  Total pendente: {formatCurrency(totalPendente)}
                </p>
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                  O pagamento será confirmado automaticamente via Stripe webhook.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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

      {/* Últimos Payouts do Stripe */}
      {isStripeConnected && stripeBalance?.recentPayouts && stripeBalance.recentPayouts.length > 0 && (
        <Card>
          <CardHeader className="p-4 sm:p-6 border-b">
            <CardTitle className="text-base sm:text-xl font-bold flex items-center gap-2">
              <Banknote className="h-5 w-5" />
              Últimos Repasses Automáticos
            </CardTitle>
          </CardHeader>
          <div className="divide-y">
            {stripeBalance.recentPayouts.map((payout) => (
              <div key={payout.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{formatCurrency(payout.amount)}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(payout.created * 1000), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
                <Badge 
                  variant={payout.status === 'paid' ? 'default' : 'secondary'}
                  className={payout.status === 'paid' ? 'bg-green-100 text-green-800' : ''}
                >
                  {payout.status === 'paid' ? 'Pago' : 
                   payout.status === 'pending' ? 'Processando' : 
                   payout.status === 'in_transit' ? 'Em trânsito' : payout.status}
                </Badge>
              </div>
            ))}
          </div>
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
            orders.filter(o => o.order_status !== 'cancelled').slice(0, 10).map((order) => (
              <div key={order.id} className="p-4 sm:p-6 hover:bg-muted/20 transition-colors">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm sm:text-base mb-1">Pedido #{order.order_number}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {format(new Date(order.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        order.payment_status === 'paid' 
                          ? 'bg-green-100 text-green-800 border-green-200' 
                          : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                      }`}
                    >
                      {order.payment_status === 'paid' ? (
                        <><CheckCircle className="h-3 w-3 mr-1" />Pago</>
                      ) : (
                        <><Clock className="h-3 w-3 mr-1" />Pendente</>
                      )}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {getStatusLabel(order.order_status)}
                    </Badge>
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
                      {formatCurrency(Number(order.total))}
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
          <p className="mt-2">
            <strong>Repasses automáticos:</strong> O Stripe transfere automaticamente seu saldo disponível para sua conta bancária semanalmente.
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
                  <p className="font-medium text-lg">{formatCurrency(Number(selectedOrder.total))}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data</p>
                  <p className="font-medium">{format(new Date(selectedOrder.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium">{getStatusLabel(selectedOrder.order_status)}</p>
                </div>
              </div>

              {/* Valores reais se disponíveis */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium text-sm mb-3">Detalhamento do Pagamento</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valor bruto:</span>
                    <span>{formatCurrency(Number(selectedOrder.total))}</span>
                  </div>
                  {selectedOrder.platform_fee ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Comissão plataforma (7,5%):</span>
                        <span className="text-red-600">- {formatCurrency(Number(selectedOrder.platform_fee))}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t font-medium">
                        <span>Valor líquido:</span>
                        <span className="text-green-600">
                          {formatCurrency(Number(selectedOrder.supplier_amount || (Number(selectedOrder.total) - Number(selectedOrder.platform_fee))))}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Comissão plataforma (7,5%):</span>
                        <span className="text-red-600">- {formatCurrency(Number(selectedOrder.total) * 0.075)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Taxa Stripe (estimada ~3,4%):</span>
                        <span className="text-red-600">- {formatCurrency(Number(selectedOrder.total) * 0.034)}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t font-medium">
                        <span>Valor líquido (estimado):</span>
                        <span className="text-green-600">
                          {formatCurrency(Number(selectedOrder.total) * 0.891)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {selectedOrder.paid_at && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>Pago em {format(new Date(selectedOrder.paid_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
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
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium">Pagamento automático</p>
                <p className="text-muted-foreground">
                  Quando o cliente paga, o Stripe confirma automaticamente via webhook. Não há confirmação manual.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <p className="font-medium">Saldo pendente</p>
                <p className="text-muted-foreground">
                  Após o pagamento, o valor fica pendente por 2-14 dias (período de segurança do Stripe).
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Banknote className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium">Repasses semanais automáticos</p>
                <p className="text-muted-foreground">
                  O Stripe transfere automaticamente seu saldo disponível para sua conta bancária. Não há saque manual.
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Financeiro;
