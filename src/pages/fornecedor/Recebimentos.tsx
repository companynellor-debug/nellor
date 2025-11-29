import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  DollarSign, 
  Clock, 
  Calendar, 
  HelpCircle, 
  AlertTriangle,
  ArrowRight,
  Info
} from "lucide-react";
import { StripeConnectModal } from "@/components/fornecedor/StripeConnectModal";
import { StripeBanner } from "@/components/fornecedor/StripeBanner";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const Recebimentos = () => {
  const { profile } = useSupabaseAuth();
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  
  // TODO: Verificar se Stripe está conectado via profile.stripe_account_id
  // Por enquanto, assumimos que não está conectado (será populado após integração)
  const isStripeConnected = !!(profile as any)?.stripe_account_id;

  // Placeholder de transações (será populado via webhook do Stripe)
  const placeholderTransactions = [
    { id: 1, date: "--/--/----", order: "#-----", gross: "---", platformFee: "---", stripeFee: "---", net: "---", status: "placeholder" },
    { id: 2, date: "--/--/----", order: "#-----", gross: "---", platformFee: "---", stripeFee: "---", net: "---", status: "placeholder" },
    { id: 3, date: "--/--/----", order: "#-----", gross: "---", platformFee: "---", stripeFee: "---", net: "---", status: "placeholder" },
  ];

  return (
    <div className="space-y-6">
      {/* Banner de conexão Stripe */}
      <StripeBanner isStripeConnected={isStripeConnected} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Recebimentos</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Acompanhe seus pagamentos e transações
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setShowHelpModal(true)}
        >
          <HelpCircle className="h-4 w-4 mr-2" />
          Como funciona
        </Button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Saldo Disponível */}
        <Card className="relative overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              Saldo Disponível
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3" />
                </TooltipTrigger>
                <TooltipContent>
                  Valor disponível para saque automático
                </TooltipContent>
              </Tooltip>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isStripeConnected ? (
              <>
                <p className="text-3xl font-bold text-green-600" data-test="vendor-balance">
                  R$ 0,00
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {/* TODO: Popular via Stripe Balance API */}
                </p>
              </>
            ) : (
              <div className="space-y-2">
                <p className="text-lg text-muted-foreground">---</p>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-xs"
                  onClick={() => setShowConnectModal(true)}
                >
                  Conectar Stripe para ver
                </Button>
              </div>
            )}
          </CardContent>
          <DollarSign className="absolute right-4 top-4 h-8 w-8 text-green-600/20" />
        </Card>

        {/* Saldo Pendente */}
        <Card className="relative overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              Saldo Pendente
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3" />
                </TooltipTrigger>
                <TooltipContent>
                  Valor em processamento (até 7 dias)
                </TooltipContent>
              </Tooltip>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isStripeConnected ? (
              <p className="text-3xl font-bold text-orange-600">R$ 0,00</p>
            ) : (
              <div className="space-y-2">
                <p className="text-lg text-muted-foreground">---</p>
                <p className="text-xs text-muted-foreground">Conecte Stripe</p>
              </div>
            )}
          </CardContent>
          <Clock className="absolute right-4 top-4 h-8 w-8 text-orange-600/20" />
        </Card>

        {/* Próximo Pagamento */}
        <Card className="relative overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              Próximo Pagamento
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3" />
                </TooltipTrigger>
                <TooltipContent>
                  Payouts automáticos semanais
                </TooltipContent>
              </Tooltip>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isStripeConnected ? (
              <>
                <p className="text-xl font-bold text-primary">Toda segunda-feira</p>
                <p className="text-xs text-muted-foreground mt-1">Payout automático via Stripe</p>
              </>
            ) : (
              <div className="space-y-2">
                <p className="text-lg text-muted-foreground">---</p>
                <p className="text-xs text-muted-foreground">Conecte Stripe para ativar</p>
              </div>
            )}
          </CardContent>
          <Calendar className="absolute right-4 top-4 h-8 w-8 text-primary/20" />
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
                  Conecte sua conta Stripe para receber pagamentos
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

      {/* Botão de Solicitar Saque (desabilitado) */}
      <div className="flex justify-end">
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Button disabled variant="outline">
                Solicitar Saque
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p>
              Saques são automáticos via Stripe. Após conectar sua conta, você receberá 
              seus pagamentos automaticamente toda semana.
            </p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Lista de Transações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Transações Recentes</span>
            <Button variant="ghost" size="sm" onClick={() => setShowHelpModal(true)}>
              <HelpCircle className="h-4 w-4 mr-1" />
              Ver exemplo
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Data</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Pedido</th>
                  <th className="text-right py-3 px-2 font-medium text-muted-foreground">Valor Bruto</th>
                  <th className="text-right py-3 px-2 font-medium text-muted-foreground">Taxa Plataforma</th>
                  <th className="text-right py-3 px-2 font-medium text-muted-foreground">Taxa Stripe</th>
                  <th className="text-right py-3 px-2 font-medium text-muted-foreground">Valor Líquido</th>
                  <th className="text-center py-3 px-2 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {/* TODO: Popular via webhook do Stripe - transações reais */}
                {placeholderTransactions.map((tx) => (
                  <tr key={tx.id} className="border-b hover:bg-muted/20">
                    <td className="py-3 px-2 text-muted-foreground">{tx.date}</td>
                    <td className="py-3 px-2 text-muted-foreground">{tx.order}</td>
                    <td className="py-3 px-2 text-right text-muted-foreground">{tx.gross}</td>
                    <td className="py-3 px-2 text-right text-muted-foreground">{tx.platformFee}</td>
                    <td className="py-3 px-2 text-right text-muted-foreground">{tx.stripeFee}</td>
                    <td className="py-3 px-2 text-right text-muted-foreground">{tx.net}</td>
                    <td className="py-3 px-2 text-center">
                      <Badge variant="secondary" className="text-xs">
                        ---
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!isStripeConnected && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">Conecte sua conta Stripe para ver suas transações</p>
            </div>
          )}

          {/* Explicação do cálculo */}
          <div className="mt-4 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
            <strong>Como é calculado:</strong> Valor Líquido = Valor Bruto − Comissão Plataforma (7,5% no plano Grátis) − Taxa Stripe (estimada ~2,9% + R$0,60)
          </div>
        </CardContent>
      </Card>

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
