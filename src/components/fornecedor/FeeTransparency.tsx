import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info, Percent, CreditCard, Zap, Ban } from "lucide-react";

export function FeeTransparency() {
  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Info className="h-5 w-5 text-blue-600" />
          Como funcionam as taxas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          <div className="flex items-start gap-3 p-3 bg-white/60 dark:bg-white/10 rounded-lg">
            <Percent className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">Comissão Nellor</p>
              <p className="text-xs text-muted-foreground">
                7,5% sobre cada venda (plano Grátis) ou 0% (plano Premium R$79/mês)
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-white/60 dark:bg-white/10 rounded-lg">
            <CreditCard className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">Taxa Stripe</p>
              <p className="text-xs text-muted-foreground">
                Variável (~3,4% + R$0,60 por transação) - cobrada pelo processador de pagamentos
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-white/60 dark:bg-white/10 rounded-lg">
            <Zap className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">Pagamentos automáticos</p>
              <p className="text-xs text-muted-foreground">
                Você recebe semanalmente direto na conta bancária cadastrada no Stripe
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-white/60 dark:bg-white/10 rounded-lg">
            <Ban className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">Sem saque manual</p>
              <p className="text-xs text-muted-foreground">
                A Nellor não retém saldo. Tudo é processado automaticamente pelo Stripe.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-lg">
          <p className="text-xs text-blue-800 dark:text-blue-200">
            <strong>Exemplo:</strong> Venda de R$100 → Comissão Nellor (7,5%): R$7,50 → 
            Taxa Stripe (~3,4%): R$3,40 → <strong>Você recebe: R$89,10</strong>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
