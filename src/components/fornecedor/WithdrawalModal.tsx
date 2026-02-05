import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowDownToLine, Loader2, Info, AlertTriangle } from "lucide-react";
import { useIdentityVerification } from "@/hooks/useIdentityVerification";
import { toast } from "sonner";

interface WithdrawalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableBalance: number;
}

export function WithdrawalModal({ open, onOpenChange, availableBalance }: WithdrawalModalProps) {
  const { data: verificationData, canWithdraw } = useIdentityVerification();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const handleWithdraw = async () => {
    if (!canWithdraw) {
      toast.error("Você precisa verificar sua conta antes de solicitar saques");
      return;
    }

    const amountValue = parseFloat(amount.replace(',', '.'));
    
    if (isNaN(amountValue) || amountValue <= 0) {
      toast.error("Informe um valor válido");
      return;
    }

    if (amountValue > availableBalance) {
      toast.error("Valor maior que o saldo disponível");
      return;
    }

    if (amountValue < 10) {
      toast.error("Valor mínimo para saque é R$ 10,00");
      return;
    }

    setLoading(true);

    // Simula delay de processamento
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Placeholder: Na integração real, chamar API do gateway
    toast.success(`Saque de ${formatCurrency(amountValue)} solicitado com sucesso! Será processado em até 24h.`);
    
    setLoading(false);
    setAmount("");
    onOpenChange(false);
  };

  const handleSetMax = () => {
    setAmount(availableBalance.toFixed(2).replace('.', ','));
  };

  if (!canWithdraw) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              Verificação Necessária
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Para solicitar saques, você precisa primeiro verificar sua conta com documentos válidos.
            </p>
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
              <p className="text-sm text-amber-800">
                Complete a verificação de identidade na aba "Verificação" da página Financeiro.
              </p>
            </div>
            <Button className="w-full" onClick={() => onOpenChange(false)}>
              Entendi
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowDownToLine className="h-5 w-5" />
            Solicitar Saque
          </DialogTitle>
          <DialogDescription>
            O valor será transferido via Pix em até 24 horas
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Saldo disponível */}
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <p className="text-sm text-muted-foreground">Saldo disponível</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(availableBalance)}</p>
          </div>

          {/* Campo de valor */}
          <div className="space-y-2">
            <Label htmlFor="withdraw-amount">Valor do saque</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
              <Input
                id="withdraw-amount"
                type="text"
                placeholder="0,00"
                value={amount}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^\d,]/g, '');
                  setAmount(value);
                }}
                className="pl-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 text-xs"
                onClick={handleSetMax}
              >
                Máx
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Valor mínimo: R$ 10,00</p>
          </div>

          {/* Chave Pix */}
          <div className="bg-muted/50 p-3 rounded-lg text-sm">
            <p className="flex items-center gap-1 mb-1 text-muted-foreground">
              <Info className="h-3 w-3" />
              O valor será transferido para:
            </p>
            <p className="font-medium">{verificationData.pixKey || 'Chave Pix não cadastrada'}</p>
          </div>

          {/* Botão de confirmar */}
          <Button 
            className="w-full" 
            onClick={handleWithdraw}
            disabled={loading || availableBalance <= 0 || !amount}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Processando...
              </>
            ) : (
              <>
                <ArrowDownToLine className="h-4 w-4 mr-2" />
                Confirmar Saque
              </>
            )}
          </Button>

          {/* Aviso */}
          <p className="text-xs text-center text-muted-foreground">
            Saques são processados em dias úteis, de segunda a sexta.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
