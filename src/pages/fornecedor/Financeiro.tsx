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

      {/* Cards de Resumo - 4 estados do fluxo financeiro */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. Aguardando Pagamento - Pedidos que o cliente ainda não pagou */}
        <Card className="p-4 relative overflow-hidden border-yellow-200 dark:border-yellow-800 bg-yellow-50/30 dark:bg-yellow-900/10">
          <div className="flex flex-col h-full">
            <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
              <Clock className="h-3 w-3 text-yellow-600" />
              Aguardando Pagamento
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3" />
                </TooltipTrigger>
                <TooltipContent>
                  Pedidos criados mas cliente ainda não finalizou pagamento no Stripe
                </TooltipContent>
              </Tooltip>
            </p>
            <p className="text-xl sm:text-2xl font-bold text-yellow-600">
              {formatCurrency(totalPendente)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {pendingOrders.length} pedido(s)
            </p>
          </div>
        </Card>

        {/* 2. Em Processamento - Stripe pending (já pagos, aguardando liberação) */}
        <Card className="p-4 relative overflow-hidden border-orange-200 dark:border-orange-800 bg-orange-50/30 dark:bg-orange-900/10">
          <div className="flex flex-col h-full">
            <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
              <RefreshCw className="h-3 w-3 text-orange-600" />
              Em Processamento
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3" />
                </TooltipTrigger>
                <TooltipContent>
                  Pagamentos confirmados mas Stripe ainda retendo (2-14 dias)
                </TooltipContent>
              </Tooltip>
            </p>
            {loadingBalance ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : isStripeConnected && stripeBalance?.connected ? (
              <>
                <p className="text-xl sm:text-2xl font-bold text-orange-600">
                  {formatCurrency(stripeBalance.pending)}
                </p>
                {stripeBalance.inTransit && stripeBalance.inTransit > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    + {formatCurrency(stripeBalance.inTransit)} em trânsito
                  </p>
                )}
              </>
            ) : (
              <p className="text-lg text-muted-foreground">---</p>
            )}
          </div>
        </Card>

        {/* 3. Disponível para Saque */}
        <Card className="p-4 relative overflow-hidden border-green-200 dark:border-green-800 bg-green-50/30 dark:bg-green-900/10">
          <div className="flex flex-col h-full">
            <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
              <CheckCircle className="h-3 w-3 text-green-600" />
              Disponível p/ Saque
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3" />
                </TooltipTrigger>
                <TooltipContent>
                  Valor liberado pelo Stripe, transferido automaticamente para sua conta
                </TooltipContent>
              </Tooltip>
            </p>
            {loadingBalance ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : isStripeConnected && stripeBalance?.connected ? (
              <>
                <p className="text-xl sm:text-2xl font-bold text-green-600">
                  {formatCurrency(stripeBalance.available)}
                </p>
                {stripeBalance.lastUpdated && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Atualizado {format(new Date(stripeBalance.lastUpdated), "HH:mm", { locale: ptBR })}
                  </p>
                )}
              </>
            ) : (
              <p className="text-lg text-muted-foreground">---</p>
            )}
          </div>
        </Card>

        {/* 4. Total Recebido - Soma de todas vendas pagas */}
        <Card className="p-4 relative overflow-hidden border-primary/20 bg-primary/5">
          <div className="flex flex-col h-full">
            <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
              <TrendingUp className="h-3 w-3 text-primary" />
              Total Recebido
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3" />
                </TooltipTrigger>
                <TooltipContent>
                  Soma total de todas as vendas com pagamento confirmado
                </TooltipContent>
              </Tooltip>
            </p>
            <p className="text-xl sm:text-2xl font-bold text-primary">
              {formatCurrency(totalVendido)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {orders.filter(o => o.payment_status === 'paid' && o.order_status !== 'cancelled').length} venda(s)
            </p>
          </div>
        </Card>
      </div>

      {/* Resumo visual do fluxo */}
      <Card className="bg-muted/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-yellow-500" />
              <span>Aguardando</span>
              <span className="font-semibold">{formatCurrency(totalPendente)}</span>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-orange-500" />
              <span>Processando</span>
              <span className="font-semibold">{formatCurrency(stripeBalance?.pending || 0)}</span>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500" />
              <span>Disponível</span>
              <span className="font-semibold">{formatCurrency(stripeBalance?.available || 0)}</span>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-primary" />
              <span>Total Recebido</span>
              <span className="font-semibold">{formatCurrency(totalVendido)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerta de pedidos pendentes (se houver muitos) */}
      {pendingOrders.length > 0 && (
        <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-900/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Banknote className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 text-sm">
                  {pendingOrders.length} pedido(s) aguardando pagamento do cliente
                </h3>
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                  O status será atualizado automaticamente quando o cliente finalizar o pagamento no Stripe.
                </p>
              </div>
            </div>
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
