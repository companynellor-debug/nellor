import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info, Percent, Zap, ArrowDownToLine } from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";

export function FeeTransparency() {
  const exemploVenda = 100;
  const comissao = exemploVenda * 0.075;
  const liquido = exemploVenda - comissao;

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
              <p className="font-medium text-sm">Taxa da plataforma</p>
              <p className="text-xs text-muted-foreground">7,5% sobre cada venda.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-white/60 dark:bg-white/10 rounded-lg">
            <Zap className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">Saques sob demanda</p>
              <p className="text-xs text-muted-foreground">Solicite saques via Pix após o período de carência.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-white/60 dark:bg-white/10 rounded-lg">
            <ArrowDownToLine className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">Prazo de liberação</p>
              <p className="text-xs text-muted-foreground">Valores ficam disponíveis para saque em até 14 dias após o pagamento.</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-lg">
          <p className="text-xs text-blue-800 dark:text-blue-200">
            <strong>Exemplo:</strong> Venda de {formatCurrency(exemploVenda)} → Taxa da plataforma (7,5%): {formatCurrency(comissao)} →{' '}
            <strong>Você recebe: {formatCurrency(liquido)}</strong>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
