import { ParticlesBackground } from "@/components/cliente/ParticlesBackground";
import { BottomNav } from "@/components/cliente/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, CreditCard, Plus, Trash2, QrCode } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";

const MetodosPagamento = () => {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pixKey, setPixKey] = useState("usuario@email.com");
  const [newPixKey, setNewPixKey] = useState("");

  const savedCards = [
    { id: 1, lastDigits: "4532", brand: "Visa", holder: "JOÃO SILVA" },
  ];

  const handleSavePixKey = () => {
    setPixKey(newPixKey);
    setDialogOpen(false);
    toast.success("Chave Pix atualizada!");
  };

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
        {/* Chave Pix */}
        <div>
          <h2 className="font-bold text-lg mb-3">Chave Pix Padrão</h2>
          <Card className="bg-white border shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <QrCode className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Chave Pix</p>
                  <p className="text-sm text-muted-foreground">{pixKey}</p>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => setDialogOpen(true)}>
                Editar
              </Button>
            </div>
          </Card>
        </div>

        {/* Cartões Salvos */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-lg">Cartões Salvos</h2>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Adicionar
            </Button>
          </div>
          <div className="space-y-3">
            {savedCards.map((card) => (
              <Card key={card.id} className="bg-white border shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <CreditCard className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{card.brand} •••• {card.lastDigits}</p>
                      <p className="text-sm text-muted-foreground">{card.holder}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Seus métodos de pagamento são armazenados de forma segura
        </p>
      </main>

      {/* Dialog Editar Pix */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Chave Pix</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nova Chave Pix</Label>
              <Input
                placeholder="email@exemplo.com"
                value={newPixKey}
                onChange={(e) => setNewPixKey(e.target.value)}
              />
            </div>
            <Button className="w-full" onClick={handleSavePixKey}>
              Salvar Chave
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

export default MetodosPagamento;
