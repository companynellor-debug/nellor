import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DollarSign,
  TrendingUp,
  Eye,
  HelpCircle,
  AlertTriangle,
  ArrowRight,
  Info,
  CheckCircle,
  Clock,
  Banknote,
  Wallet,
  ArrowDownToLine,
  Shield,
  FileText,
} from "lucide-react";
import { useSupabaseOrders, Order } from "@/hooks/useSupabaseOrders";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useIdentityVerification } from "@/hooks/useIdentityVerification";
import { formatCurrency } from "@/utils/formatCurrency";


const Financeiro = () => {
  const navigate = useNavigate();
  const { orders } = useSupabaseOrders();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  
  const { data: verificationData, statusLabel, canWithdraw, save: saveVerification, lastError } = useIdentityVerification();

  // Cálculos de valores baseados nos pedidos
  const totalVendido = orders
    .filter(o => o.order_status !== 'cancelled' && o.payment_status === 'paid')
    .reduce((sum, o) => sum + Number(o.total), 0);

  // Comissão Nellor: 7,5%
  const comissaoNellor = totalVendido * 0.075;
  // Valor líquido (apenas taxa da plataforma)
  const valorLiquido = totalVendido - comissaoNellor;

  // Simulação de saldo (placeholder - será real com backend)
  const saldoDisponivel = valorLiquido * 0.7; // 70% disponível
  const saldoPendente = valorLiquido * 0.3; // 30% pendente

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

  const handleWithdraw = () => {
    if (!canWithdraw) {
      toast.error("Você precisa verificar sua conta antes de solicitar saques");
      return;
    }
    
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Informe um valor válido");
      return;
    }
    
    if (amount > saldoDisponivel) {
      toast.error("Valor maior que o saldo disponível");
      return;
    }

    // Placeholder: Na integração real, chamar API do Asaas
    toast.success(`Saque de ${formatCurrency(amount)} solicitado com sucesso!`);
    setShowWithdrawModal(false);
    setWithdrawAmount("");
  };

  const getVerificationBadge = () => {
    if (verificationData.status === 'verified') {
      return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="h-3 w-3 mr-1" />Verificado</Badge>;
    }
    if (verificationData.status === 'review') {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200"><Clock className="h-3 w-3 mr-1" />Em Análise</Badge>;
    }
    return <Badge className="bg-red-100 text-red-800 border-red-200"><AlertTriangle className="h-3 w-3 mr-1" />Não Verificado</Badge>;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
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

      {/* Status de Verificação */}
      <Card className={`border ${verificationData.status === 'verified' ? 'border-green-200 bg-green-50/50' : verificationData.status === 'review' ? 'border-yellow-200 bg-yellow-50/50' : 'border-red-200 bg-red-50/50'}`}>
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className={`h-6 w-6 ${verificationData.status === 'verified' ? 'text-green-600' : verificationData.status === 'review' ? 'text-yellow-600' : 'text-red-600'}`} />
            <div>
              <p className="font-semibold flex items-center gap-2">
                Status da conta: {getVerificationBadge()}
              </p>
              <p className="text-sm text-muted-foreground">
                {verificationData.status === 'verified' 
                  ? "Sua conta está verificada. Você pode vender e sacar normalmente." 
                  : verificationData.status === 'review'
                  ? "Seus documentos estão em análise. Aguarde a aprovação."
                  : "Verifique sua conta para poder vender e sacar."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Resumo Financeiro */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Saldo Disponível */}
        <Card className="p-4 relative overflow-hidden border-green-200 dark:border-green-800 bg-green-50/30 dark:bg-green-900/10">
          <div className="flex flex-col h-full">
            <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
              <Wallet className="h-3 w-3 text-green-600" />
              Saldo Disponível
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3" />
                </TooltipTrigger>
                <TooltipContent>
                  Valor disponível para saque imediato
                </TooltipContent>
              </Tooltip>
            </p>
            <p className="text-xl sm:text-2xl font-bold text-green-600">
              {formatCurrency(saldoDisponivel)}
            </p>
            <Button 
              size="sm" 
              className="mt-2 w-full"
              disabled={!canWithdraw || saldoDisponivel <= 0}
              onClick={() => setShowWithdrawModal(true)}
            >
              <ArrowDownToLine className="h-4 w-4 mr-1" />
              Solicitar Saque
            </Button>
          </div>
        </Card>

        {/* Saldo Pendente */}
        <Card className="p-4 relative overflow-hidden border-yellow-200 dark:border-yellow-800 bg-yellow-50/30 dark:bg-yellow-900/10">
          <div className="flex flex-col h-full">
            <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
              <Clock className="h-3 w-3 text-yellow-600" />
              Saldo Pendente
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3" />
                </TooltipTrigger>
                <TooltipContent>
                  Valores a serem liberados em até 14 dias
                </TooltipContent>
              </Tooltip>
            </p>
            <p className="text-xl sm:text-2xl font-bold text-yellow-600">
              {formatCurrency(saldoPendente)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Libera em até 14 dias
            </p>
          </div>
        </Card>

        {/* Aguardando Pagamento */}
        <Card className="p-4 relative overflow-hidden border-orange-200 dark:border-orange-800 bg-orange-50/30 dark:bg-orange-900/10">
          <div className="flex flex-col h-full">
            <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
              <Banknote className="h-3 w-3 text-orange-600" />
              Aguardando Pagamento
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3" />
                </TooltipTrigger>
                <TooltipContent>
                  Pedidos que o cliente ainda não pagou
                </TooltipContent>
              </Tooltip>
            </p>
            <p className="text-xl sm:text-2xl font-bold text-orange-600">
              {formatCurrency(totalPendente)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {pendingOrders.length} pedido(s)
            </p>
          </div>
        </Card>

        {/* Total Recebido */}
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
                  Soma total de todas as vendas pagas
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

      {/* Resumo de Taxas */}
      <Card className="bg-muted/20">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Total Bruto</p>
              <p className="font-semibold">{formatCurrency(totalVendido)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Comissão Nellor (7,5%)</p>
              <p className="font-semibold text-purple-600">- {formatCurrency(comissaoNellor)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Valor Líquido</p>
              <p className="font-semibold text-green-600">{formatCurrency(valorLiquido)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

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

      {/* Modal de Ajuda */}
      <Dialog open={showHelpModal} onOpenChange={setShowHelpModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Como funciona o financeiro
            </DialogTitle>
          </DialogHeader>
          <DialogDescription asChild>
            <div className="space-y-4 text-sm">
              <p>
                Todos os pagamentos dos clientes são processados de forma segura. 
                Após a confirmação do pagamento, o valor fica retido por um período de segurança.
              </p>
              
              <div className="bg-muted p-3 rounded-lg">
                <h4 className="font-medium mb-2">Taxas aplicadas:</h4>
                <ul className="space-y-1 text-xs">
                  <li>• Comissão Nellor: 7,5%</li>
                </ul>
              </div>

              <div className="bg-muted p-3 rounded-lg">
                <h4 className="font-medium mb-2">Exemplo de venda R$ 100:</h4>
                <ul className="space-y-1 text-xs">
                  <li>• Valor bruto: R$ 100,00</li>
                  <li>• Comissão (7,5%): - R$ 7,50</li>
                  <li className="font-bold pt-1 border-t">• Você recebe: R$ 92,50</li>
                </ul>
              </div>

              <p className="text-xs text-muted-foreground">
                Os saques são liberados em até 14 dias após a confirmação do pagamento. 
                Para solicitar saques, é necessário ter a conta verificada.
              </p>
            </div>
          </DialogDescription>
        </DialogContent>
      </Dialog>

      {/* Modal de Saque */}
      <Dialog open={showWithdrawModal} onOpenChange={setShowWithdrawModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowDownToLine className="h-5 w-5" />
              Solicitar Saque
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-sm text-muted-foreground">Saldo disponível</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(saldoDisponivel)}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Valor do saque</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0,00"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
              />
            </div>

            <div className="bg-muted/50 p-3 rounded-lg text-xs text-muted-foreground">
              <p className="flex items-center gap-1 mb-1">
                <Info className="h-3 w-3" />
                O valor será transferido para sua chave Pix cadastrada
              </p>
              <p className="font-medium">Chave Pix: {verificationData.pixKey || 'Não cadastrada'}</p>
            </div>

            <Button 
              className="w-full" 
              onClick={handleWithdraw}
              disabled={!canWithdraw || saldoDisponivel <= 0}
            >
              Confirmar Saque
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Detalhes do Pedido */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes do Pedido #{selectedOrder?.order_number}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Data</p>
                  <p className="font-medium">
                    {format(new Date(selectedOrder.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status Pagamento</p>
                  <Badge variant={selectedOrder.payment_status === 'paid' ? 'default' : 'secondary'}>
                    {selectedOrder.payment_status === 'paid' ? 'Pago' : 'Pendente'}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Status Pedido</p>
                  <p className="font-medium">{getStatusLabel(selectedOrder.order_status)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total</p>
                  <p className="font-bold text-lg text-primary">
                    {formatCurrency(Number(selectedOrder.total))}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-muted-foreground text-sm mb-2">Itens do pedido:</p>
                <div className="space-y-2">
                  {(selectedOrder.itens as any[])?.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>{item.quantity}x {item.name}</span>
                      <span>{formatCurrency(Number(item.price) * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Financeiro;
