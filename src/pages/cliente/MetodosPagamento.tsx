import { ParticlesBackground } from "@/components/cliente/ParticlesBackground";
import { BottomNav } from "@/components/cliente/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, CreditCard, Plus, Trash2, QrCode, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";

const MetodosPagamento = () => {
  const navigate = useNavigate();
  const { paymentMethods, addPaymentMethod, deletePaymentMethod, setDefaultPaymentMethod } = usePaymentMethods();
  
  const [pixDialogOpen, setPixDialogOpen] = useState(false);
  const [cardDialogOpen, setCardDialogOpen] = useState(false);
  const [newPixKey, setNewPixKey] = useState("");
  const [cardForm, setCardForm] = useState({
    cardNumber: "",
    cardHolder: "",
    cardExpiry: "",
    cardCVV: ""
  });

  const handleSavePixKey = () => {
    if (!newPixKey.trim()) {
      toast.error("Digite uma chave Pix válida");
      return;
    }

    addPaymentMethod({
      type: 'pix',
      pixKey: newPixKey,
      isDefault: paymentMethods.length === 0
    });

    setNewPixKey("");
    setPixDialogOpen(false);
    toast.success("Chave Pix adicionada!");
  };

  const handleSaveCard = () => {
    if (!cardForm.cardNumber || !cardForm.cardHolder || !cardForm.cardExpiry) {
      toast.error("Preencha todos os campos do cartão");
      return;
    }

    const brand = getCardBrand(cardForm.cardNumber);
    const lastDigits = cardForm.cardNumber.slice(-4);

    addPaymentMethod({
      type: 'card',
      cardNumber: lastDigits,
      cardHolder: cardForm.cardHolder.toUpperCase(),
      cardBrand: brand,
      cardExpiry: cardForm.cardExpiry,
      isDefault: paymentMethods.length === 0
    });

    setCardForm({
      cardNumber: "",
      cardHolder: "",
      cardExpiry: "",
      cardCVV: ""
    });
    setCardDialogOpen(false);
    toast.success("Cartão adicionado!");
  };

  const handleDeleteMethod = (id: string) => {
    deletePaymentMethod(id);
    toast.success("Método de pagamento removido!");
  };

  const handleSetDefault = (id: string) => {
    setDefaultPaymentMethod(id);
    toast.success("Método padrão atualizado!");
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

  const pixMethods = paymentMethods.filter(m => m.type === 'pix');
  const cardMethods = paymentMethods.filter(m => m.type === 'card');

  return (
    <div className="min-h-screen bg-background pb-20">
      <ParticlesBackground />

      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate("/cliente/perfil")} className="hover:bg-accent p-2 rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-primary">Métodos de Pagamento</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 relative z-10 space-y-6">
        {/* Chaves Pix */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-lg">Chaves Pix</h2>
            <Button size="sm" className="gap-2" onClick={() => setPixDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Adicionar
            </Button>
          </div>
          <div className="space-y-3">
            {pixMethods.length > 0 ? (
              pixMethods.map((method) => (
                <Card key={method.id} className="bg-white border shadow-sm p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                        <QrCode className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">Chave Pix</p>
                          {method.isDefault && (
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{method.pixKey}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!method.isDefault && (
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
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDeleteMethod(method.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="bg-white border shadow-sm p-6 text-center">
                <p className="text-sm text-muted-foreground">Nenhuma chave Pix cadastrada</p>
              </Card>
            )}
          </div>
        </div>

        {/* Cartões Salvos */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-lg">Cartões</h2>
            <Button size="sm" className="gap-2" onClick={() => setCardDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Adicionar
            </Button>
          </div>
          <div className="space-y-3">
            {cardMethods.length > 0 ? (
              cardMethods.map((method) => (
                <Card key={method.id} className="bg-white border shadow-sm p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                        <CreditCard className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{method.cardBrand} •••• {method.cardNumber}</p>
                          {method.isDefault && (
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{method.cardHolder}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!method.isDefault && (
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
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDeleteMethod(method.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="bg-white border shadow-sm p-6 text-center">
                <p className="text-sm text-muted-foreground">Nenhum cartão cadastrado</p>
              </Card>
            )}
          </div>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Seus métodos de pagamento são armazenados de forma segura
        </p>
      </main>

      {/* Dialog Adicionar Pix */}
      <Dialog open={pixDialogOpen} onOpenChange={setPixDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Chave Pix</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Chave Pix</Label>
              <Input
                placeholder="email@exemplo.com, CPF, telefone ou chave aleatória"
                value={newPixKey}
                onChange={(e) => setNewPixKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Insira sua chave Pix cadastrada no banco
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPixDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSavePixKey}>
                Adicionar
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

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
