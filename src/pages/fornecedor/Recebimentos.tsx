import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  DollarSign, 
  Clock, 
  Calendar, 
  HelpCircle, 
  AlertTriangle,
  ArrowRight,
  Info,
  CheckCircle2,
  XCircle,
  Loader2
} from "lucide-react";
import { StripeConnectModal } from "@/components/fornecedor/StripeConnectModal";
import { StripeBanner } from "@/components/fornecedor/StripeBanner";
import { FeeTransparency } from "@/components/fornecedor/FeeTransparency";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useSupabaseOrders } from "@/hooks/useSupabaseOrders";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { format, subDays, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

const Recebimentos = () => {
  const { profile, user } = useSupabaseAuth();
  const { orders, loading: ordersLoading } = useSupabaseOrders();
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [dateFilter, setDateFilter] = useState<'7days' | '30days' | '90days' | 'all'>('30days');
  
  const isStripeConnected = !!(profile as any)?.stripe_account_id;

  // Filtrar pedidos pagos (não cancelados) do fornecedor
  const getFilteredOrders = () => {
    const now = new Date();
    let startDate: Date | null = null;
    
    if (dateFilter === '7days') startDate = subDays(now, 7);
    else if (dateFilter === '30days') startDate = subDays(now, 30);
    else if (dateFilter === '90days') startDate = subDays(now, 90);
    
    return orders.filter(order => {
      const isPaid = order.payment_status === 'paid' && order.order_status !== 'cancelled';
      if (!isPaid) return false;
      if (!startDate) return true;
      return new Date(order.created_at) >= startOfDay(startDate);
    });
  };

  const filteredOrders = getFilteredOrders();

  // Cálculos financeiros
  const totalBruto = filteredOrders.reduce((sum, o) => sum + Number(o.total), 0);
  const comissaoNellor = totalBruto * 0.075;
  const taxaStripeEstimada = totalBruto * 0.034;
  const valorLiquido = totalBruto - comissaoNellor - taxaStripeEstimada;

  // Transações (baseado em pedidos reais)
  const transactions = filteredOrders.map(order => ({
    id: order.id,
    date: format(new Date(order.created_at), "dd/MM/yyyy", { locale: ptBR }),
    order: `#${order.order_number}`,
    gross: Number(order.total),
    platformFee: Number(order.total) * 0.075,
    stripeFee: Number(order.total) * 0.034,
    net: Number(order.total) - (Number(order.total) * 0.075) - (Number(order.total) * 0.034),
    status: order.order_status
  }));

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      delivered: { label: "Pago", variant: "default" },
      shipped: { label: "Em processamento", variant: "secondary" },
      preparing: { label: "Em processamento", variant: "secondary" },
      pending: { label: "Aguardando", variant: "outline" },
      cancelled: { label: "Cancelado", variant: "destructive" }
    };
    return map[status] || { label: status, variant: "outline" };
  };

  if (ordersLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Banner de conexão Stripe */}
      <StripeBanner isStripeConnected={isStripeConnected} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Pagamentos & Recebimentos</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Acompanhe seus pagamentos e transações
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateFilter} onValueChange={(v: any) => setDateFilter(v)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">7 dias</SelectItem>
              <SelectItem value="30days">30 dias</SelectItem>
              <SelectItem value="90days">90 dias</SelectItem>
              <SelectItem value="all">Todo período</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => setShowHelpModal(true)}>
            <HelpCircle className="h-4 w-4 mr-2" />
            Como funciona
          </Button>
        </div>
      </div>

      {/* Status da Conta Stripe */}
      <Card className={isStripeConnected ? "border-green-200 bg-green-50/50 dark:bg-green-900/20" : "border-red-200 bg-red-50/50 dark:bg-red-900/20"}>
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isStripeConnected ? (
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            ) : (
              <XCircle className="h-6 w-6 text-red-600" />
            )}
            <div>
              <p className="font-semibold">
                {isStripeConnected ? "🟢 Conta Stripe conectada" : "🔴 Conta Stripe não conectada"}
              </p>
              <p className="text-sm text-muted-foreground">
                {isStripeConnected 
                  ? "Você receberá pagamentos automaticamente" 
                  : "Conecte para receber pagamentos das suas vendas"}
              </p>
            </div>
          </div>
          {!isStripeConnected && (
            <Button onClick={() => setShowConnectModal(true)}>
              Conectar conta Stripe
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Texto explicativo */}
      <Card className="bg-muted/30 border-border">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">
            Os pagamentos são feitos automaticamente via Stripe.
            A Nellor não retém saldo e não realiza pagamentos manuais.
          </p>
        </CardContent>
      </Card>

      {/* Cards de Resumo Financeiro */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              Total Vendido
              <Tooltip>
                <TooltipTrigger><Info className="h-3 w-3" /></TooltipTrigger>
                <TooltipContent>Valor bruto das vendas no período</TooltipContent>
              </Tooltip>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">
              R$ {totalBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
          <DollarSign className="absolute right-4 top-4 h-8 w-8 text-primary/20" />
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              Comissão Nellor (7,5%)
              <Tooltip>
                <TooltipTrigger><Info className="h-3 w-3" /></TooltipTrigger>
                <TooltipContent>Comissão da plataforma sobre vendas</TooltipContent>
              </Tooltip>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-600">
              - R$ {comissaoNellor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              Taxas Stripe (est.)
              <Tooltip>
                <TooltipTrigger><Info className="h-3 w-3" /></TooltipTrigger>
                <TooltipContent>Taxa estimada do processador (~3,4%)</TooltipContent>
              </Tooltip>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">
              - R$ {taxaStripeEstimada.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-green-200 bg-green-50/50 dark:bg-green-900/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              Valor Líquido
              <Tooltip>
                <TooltipTrigger><Info className="h-3 w-3" /></TooltipTrigger>
                <TooltipContent>Valor que você recebe após taxas</TooltipContent>
              </Tooltip>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              R$ {valorLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status de Recebimento */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="relative overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Próximo Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isStripeConnected ? (
              <>
                <p className="text-lg font-bold text-primary">Toda segunda-feira</p>
                <p className="text-xs text-muted-foreground">Payout automático via Stripe</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Conecte Stripe para ativar</p>
            )}
          </CardContent>
          <Calendar className="absolute right-4 top-4 h-8 w-8 text-primary/20" />
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saldo Pendente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold text-orange-600">
              {isStripeConnected ? "R$ 0,00" : "---"}
            </p>
            <p className="text-xs text-muted-foreground">Em processamento (até 7 dias)</p>
          </CardContent>
          <Clock className="absolute right-4 top-4 h-8 w-8 text-orange-600/20" />
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length > 0 ? (
              <>
                <Badge variant="default" className="bg-green-600">
                  Em dia
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">
                  {transactions.length} transações no período
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma transação</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Aviso se não conectou */}
      {!isStripeConnected && (
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/20">
          <CardContent className="p-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <AlertTriangle className="h-10 w-10 text-amber-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-amber-800 dark:text-amber-200">
                  ⚠️ Para receber pagamentos, é obrigatório conectar sua conta Stripe.
                </h3>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  Sem a conexão, você não poderá receber o dinheiro das suas vendas.
                </p>
              </div>
            </div>
            <Button onClick={() => setShowConnectModal(true)}>
              Conectar Stripe
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Lista de Transações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Transações Recentes</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Data</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Pedido</th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">Valor Bruto</th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">Comissão</th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">Taxa Stripe</th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">Valor Líquido</th>
                    <th className="text-center py-3 px-2 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => {
                    const badge = getStatusBadge(tx.status);
                    return (
                      <tr key={tx.id} className="border-b hover:bg-muted/20">
                        <td className="py-3 px-2">{tx.date}</td>
                        <td className="py-3 px-2 font-medium">{tx.order}</td>
                        <td className="py-3 px-2 text-right">R$ {tx.gross.toFixed(2)}</td>
                        <td className="py-3 px-2 text-right text-purple-600">- R$ {tx.platformFee.toFixed(2)}</td>
                        <td className="py-3 px-2 text-right text-orange-600">- R$ {tx.stripeFee.toFixed(2)}</td>
                        <td className="py-3 px-2 text-right text-green-600 font-medium">R$ {tx.net.toFixed(2)}</td>
                        <td className="py-3 px-2 text-center">
                          <Badge variant={badge.variant} className="text-xs">
                            {badge.label}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">Nenhuma transação encontrada no período selecionado</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transparência de Taxas */}
      <FeeTransparency />

      {/* Modal de Conexão Stripe */}
      <StripeConnectModal open={showConnectModal} onOpenChange={setShowConnectModal} />

      {/* Modal de Ajuda */}
      <Dialog open={showHelpModal} onOpenChange={setShowHelpModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Como funcionam os pagamentos</DialogTitle>
            <DialogDescription>
              Entenda o fluxo de recebimentos na plataforma
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <p>
              Todos os pagamentos são processados pela Stripe. Assim que o cliente paga pelo pedido, 
              o valor é dividido automaticamente entre a plataforma (comissão), o vendedor e a taxa Stripe.
            </p>
            <p>
              Os vendedores recebem <strong>pagamentos semanais automáticos</strong>. 
              Não existe saque manual.
            </p>
            <p>
              Caso o fornecedor ainda não tenha conectado a Stripe, o valor permanece pendente 
              até a conexão ser realizada.
            </p>
            
            <div className="bg-muted p-3 rounded-lg">
              <h4 className="font-medium mb-2">Exemplo de transação:</h4>
              <ul className="space-y-1 text-xs">
                <li>• Valor da venda: R$ 100,00</li>
                <li>• Comissão plataforma (7,5%): - R$ 7,50</li>
                <li>• Taxa Stripe (~3,4%): - R$ 3,40</li>
                <li>• <strong>Valor líquido: R$ 89,10</strong></li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Recebimentos;
