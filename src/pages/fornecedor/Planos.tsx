import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Star, Zap, Shield, HelpCircle, CreditCard } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { toast } from "sonner";

type PlanType = "free" | "premium";

const Planos = () => {
  const { profile } = useSupabaseAuth();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // TODO: Obter plano atual do perfil do fornecedor (será populado via backend)
  const [currentPlan] = useState<PlanType>("free");

  const handleSelectPlan = (plan: string) => {
    if (plan === "premium") {
      setSelectedPlan(plan);
      setShowPaymentModal(true);
    } else {
      // Plano grátis - já está no plano grátis
      toast.info("Você já está no plano Grátis!");
    }
  };

  const handleSubscribe = () => {
    // TODO: Integração com gateway de pagamento para assinatura
    console.log("TODO: Chamar endpoint de pagamento para subscription Premium");
    toast.info("Funcionalidade em desenvolvimento. Em breve você poderá assinar o plano Premium.");
    setShowPaymentModal(false);
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Planos do Fornecedor</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Escolha o melhor plano para o seu negócio
        </p>
      </div>

      {/* Cards de Planos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
        {/* Plano Grátis */}
        <Card className={`relative overflow-hidden transition-all ${currentPlan === "free" ? "ring-2 ring-primary" : "hover:shadow-lg"}`}>
          {currentPlan === "free" && (
            <Badge className="absolute top-4 right-4 bg-primary">Plano Atual</Badge>
          )}
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-600" />
              Plano Grátis
            </CardTitle>
            <div className="mt-4">
              <span className="text-4xl font-bold">R$ 0</span>
              <span className="text-muted-foreground">/mês</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Sem mensalidade. Comissão de 7,5% por venda + taxa do processador por transação. Ideal para testar.
            </p>
            
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Cadastro de produtos ilimitados
              </li>
              <li className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Recebimento via Pix
              </li>
              <li className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Chat com clientes
              </li>
              <li className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Painel de estatísticas básico
              </li>
              <li className="flex items-center gap-2 text-sm text-orange-600">
                <span className="h-4 w-4 flex items-center justify-center">•</span>
                Comissão de 7,5% por venda
              </li>
            </ul>

            <Button 
              variant={currentPlan === "free" ? "secondary" : "outline"} 
              className="w-full"
              disabled={currentPlan === "free"}
              onClick={() => handleSelectPlan("free")}
            >
              {currentPlan === "free" ? "Plano Atual" : "Escolher Plano Grátis"}
            </Button>
          </CardContent>
        </Card>

        {/* Plano Premium */}
        <Card className={`relative overflow-hidden transition-all border-2 border-purple-200 dark:border-purple-800 ${currentPlan === "premium" ? "ring-2 ring-purple-600" : "hover:shadow-lg hover:border-purple-400"}`}>
          {currentPlan === "premium" && (
            <Badge className="absolute top-4 right-4 bg-purple-600">Plano Atual</Badge>
          )}
          <div className="absolute top-0 right-0 bg-gradient-to-l from-purple-600 to-purple-500 text-white text-xs px-3 py-1 rounded-bl-lg">
            Recomendado
          </div>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-purple-600" />
              Plano Premium
            </CardTitle>
            <div className="mt-4">
              <span className="text-4xl font-bold text-purple-600">R$ 79</span>
              <span className="text-muted-foreground">/mês</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              R$79/mês. Sem comissão da plataforma. Apenas taxa do processador por transação. Ideal para alto volume.
            </p>
            
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Tudo do plano Grátis
              </li>
              <li className="flex items-center gap-2 text-sm font-medium text-purple-600">
                <CheckCircle2 className="h-4 w-4 text-purple-600" />
                0% de comissão da plataforma
              </li>
              <li className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Destaque nos resultados de busca
              </li>
              <li className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Relatórios avançados
              </li>
              <li className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Suporte prioritário
              </li>
            </ul>

            <Button 
              className="w-full bg-purple-600 hover:bg-purple-700"
              disabled={currentPlan === "premium"}
              onClick={() => handleSelectPlan("premium")}
            >
              {currentPlan === "premium" ? "Plano Atual" : "Assinar Premium"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Seção: Como funcionam os pagamentos */}
      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            Como funcionam os pagamentos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            Todos os pagamentos são processados de forma segura. Assim que o cliente paga pelo pedido, 
            o valor é dividido automaticamente entre a plataforma (comissão), o vendedor e a taxa do processador. 
          </p>
          <p>
            Os vendedores podem <strong className="text-foreground">solicitar saques a qualquer momento</strong> após o período de carência. 
            O valor é transferido via Pix para a conta cadastrada.
          </p>
          <p>
            Para receber pagamentos, é necessário verificar sua conta com documentos válidos.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium text-foreground mb-2">Plano Grátis - Exemplo:</h4>
              <ul className="space-y-1 text-xs">
                <li>Venda: R$ 100,00</li>
                <li>Comissão plataforma (7,5%): - R$ 7,50</li>
                <li>Taxa processador (~3,49%): - R$ 3,49</li>
                <li className="font-bold text-foreground pt-1 border-t">Você recebe: R$ 89,01</li>
              </ul>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
              <h4 className="font-medium text-foreground mb-2">Plano Premium - Exemplo:</h4>
              <ul className="space-y-1 text-xs">
                <li>Venda: R$ 100,00</li>
                <li>Comissão plataforma (0%): - R$ 0,00</li>
                <li>Taxa processador (~3,49%): - R$ 3,49</li>
                <li className="font-bold text-purple-600 pt-1 border-t border-purple-300">Você recebe: R$ 96,51</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Pagamento Premium */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-purple-600" />
              Assinar Plano Premium
            </DialogTitle>
            <DialogDescription>
              R$79/mês - Cancele quando quiser
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <h4 className="font-medium mb-2">O que você ganha:</h4>
              <ul className="text-sm space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-purple-600" />
                  0% de comissão em todas as vendas
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-purple-600" />
                  Destaque nos resultados de busca
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-purple-600" />
                  Relatórios e análises avançadas
                </li>
              </ul>
            </div>

            <p className="text-xs text-muted-foreground">
              O pagamento será processado de forma segura. Você pode cancelar sua assinatura a qualquer momento.
            </p>

            <Button 
              className="w-full bg-purple-600 hover:bg-purple-700"
              onClick={handleSubscribe}
              data-test="subscribe-premium-btn"
            >
              Assinar por R$79/mês
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Planos;
