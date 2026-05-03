import { FileText, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const SolicitacoesFornecedor = () => {
  const navigate = useNavigate();
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Solicitações de Compra</h1>
          <p className="text-sm text-muted-foreground">
            Pedidos publicados por compradores. Envie sua proposta direto.
          </p>
        </div>
      </div>

      <Card className="rounded-2xl p-10 text-center border-dashed">
        <Sparkles className="h-10 w-10 text-primary mx-auto mb-3" />
        <h2 className="text-lg font-semibold mb-1">Em breve</h2>
        <p className="text-sm text-muted-foreground mb-5 max-w-md mx-auto">
          Estamos finalizando o mural de solicitações dos compradores. Você poderá ver pedidos
          em aberto na sua categoria e enviar propostas em segundos.
        </p>
        <Button onClick={() => navigate("/fornecedor/dashboard")} variant="outline" className="rounded-full">
          Voltar ao Painel
        </Button>
      </Card>
    </div>
  );
};

export default SolicitacoesFornecedor;
