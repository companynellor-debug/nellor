import { ParticlesBackground } from "@/components/cliente/ParticlesBackground";
import { BottomNav } from "@/components/cliente/BottomNav";
import { Card } from "@/components/ui/card";
import { ArrowLeft, CreditCard } from "lucide-react";
import { useNavigate } from "react-router-dom";

const MetodosPagamento = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20">
      <ParticlesBackground />

      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate("/cliente/perfil")} className="hover:bg-accent p-2 rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-primary">Métodos de Pagamento</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 relative z-10 space-y-6">
        <Card className="bg-card border shadow-sm p-6 text-center">
          <CreditCard className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <h2 className="font-semibold text-lg mb-2">Pagamentos são feitos diretamente</h2>
          <p className="text-sm text-muted-foreground">
            Na Nellor, os pagamentos são acordados diretamente entre você e o fornecedor durante a negociação. 
            Não é necessário cadastrar métodos de pagamento na plataforma.
          </p>
        </Card>
      </main>

      <BottomNav />
    </div>
  );
};

export default MetodosPagamento;
