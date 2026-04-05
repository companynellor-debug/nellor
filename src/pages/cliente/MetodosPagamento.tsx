import { ParticlesBackground } from "@/components/cliente/ParticlesBackground";
import { BottomNav } from "@/components/cliente/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, CreditCard, Plus, Trash2, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";
import { useSupabasePaymentMethods } from "@/hooks/useSupabasePaymentMethods";

const MetodosPagamento = () => {
  const navigate = useNavigate();
  const { paymentMethods, addPaymentMethod, deletePaymentMethod, setDefaultPaymentMethod } = useSupabasePaymentMethods();
  
  const [cardDialogOpen, setCardDialogOpen] = useState(false);
  const [cardForm, setCardForm] = useState({
    cardNumber: "",
    cardHolder: "",
    cardExpiry: "",
    cardCVV: ""
  });

  const handleSaveCard = async () => {
    if (!cardForm.cardNumber || !cardForm.cardHolder || !cardForm.cardExpiry) {
      toast.error("Preencha todos os campos do cartão");
      return;
    }

    const brand = getCardBrand(cardForm.cardNumber);
    const lastDigits = cardForm.cardNumber.replace(/\s/g, '').slice(-4);

    try {
      await addPaymentMethod({
        type: 'card',
        card_number_last4: lastDigits,
        card_holder: cardForm.cardHolder.toUpperCase(),
        card_brand: brand,
        card_expiry: cardForm.cardExpiry,
        is_default: paymentMethods.length === 0
      });

      setCardForm({
        cardNumber: "",
        cardHolder: "",
        cardExpiry: "",
        cardCVV: ""
      });
      setCardDialogOpen(false);
    } catch (error) {
      console.error('Error adding card:', error);
    }
  };

  const handleDeleteMethod = (id: string) => {
    deletePaymentMethod(id);
    toast.success("Cartão removido!");
  };

  const handleSetDefault = (id: string) => {
    setDefaultPaymentMethod(id);
    toast.success("Cartão padrão atualizado!");
  };

  const getCardBrand = (number: string) => {
    const firstDigit = number[0];
    if (firstDigit === '4') return 'Visa';
    if (firstDigit === '5') return 'Mastercard';
    if (firstDigit === '3') return 'Amex';
    return 'Outro';
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted.slice(0, 19);
  };

  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
    }
    return cleaned;
  };

  const cardMethods = paymentMethods.filter(m => m.type === 'card');

  return (
    <div className="min-h-screen bg-background pb-20">
      <ParticlesBackground />

      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate("/cliente/perfil")} className="hover:bg-accent p-2 rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-primary">Cartões Salvos</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 relative z-10 space-y-6">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-lg">Meus Cartões</h2>
            <Button size="sm" className="gap-2" onClick={() => setCardDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Adicionar
            </Button>
          </div>
          <div className="space-y-3">
            {cardMethods.length > 0 ? (
              cardMethods.map((method) => (
                <Card key={method.id} className="bg-card border shadow-sm p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                        <CreditCard className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{method.card_brand} •••• {method.card_number_last4}</p>
                          {method.is_default && (
                            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{method.card_holder}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!method.is_default && (
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleSetDefault(method.id)}
                        >
                          Padrão
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteMethod(method.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="bg-card border shadow-sm p-6 text-center">
                <CreditCard className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Nenhum cartão cadastrado</p>
              </Card>
            )}
          </div>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Seus cartões são armazenados de forma segura
        </p>
      </main>

      {/* Dialog Adicionar Cartão */}
      <Dialog open={cardDialogOpen} onOpenChange={setCardDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Cartão</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Número do Cartão</Label>
              <Input
                placeholder="0000 0000 0000 0000"
                value={cardForm.cardNumber}
                onChange={(e) => setCardForm({ ...cardForm, cardNumber: formatCardNumber(e.target.value) })}
                maxLength={19}
              />
            </div>
            <div>
              <Label>Nome no Cartão</Label>
              <Input
                placeholder="NOME COMPLETO"
                value={cardForm.cardHolder}
                onChange={(e) => setCardForm({ ...cardForm, cardHolder: e.target.value.toUpperCase() })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Validade</Label>
                <Input
                  placeholder="MM/AA"
                  value={cardForm.cardExpiry}
                  onChange={(e) => setCardForm({ ...cardForm, cardExpiry: formatExpiry(e.target.value) })}
                  maxLength={5}
                />
              </div>
              <div>
                <Label>CVV</Label>
                <Input
                  type="password"
                  placeholder="000"
                  value={cardForm.cardCVV}
                  onChange={(e) => setCardForm({ ...cardForm, cardCVV: e.target.value.replace(/\D/g, '').slice(0, 3) })}
                  maxLength={3}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Apenas os 4 últimos dígitos serão salvos
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCardDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveCard}>
                Adicionar
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

export default MetodosPagamento;
