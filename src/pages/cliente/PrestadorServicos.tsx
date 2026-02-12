import ComingSoonOverlay from "@/components/ComingSoonOverlay";
import { BottomNav } from "@/components/cliente/BottomNav";

const PrestadorServicos = () => {
  return (
    <div className="min-h-screen bg-background pb-20">
      <ComingSoonOverlay
        title="Prestador de Serviços"
        description="A funcionalidade de prestador de serviços está em desenvolvimento. Disponível em breve."
      />
      <BottomNav />
    </div>
  );
};

export default PrestadorServicos;
