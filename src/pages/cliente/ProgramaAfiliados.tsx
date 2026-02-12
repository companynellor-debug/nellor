import ComingSoonOverlay from "@/components/ComingSoonOverlay";
import { BottomNav } from "@/components/cliente/BottomNav";

const ProgramaAfiliados = () => {
  return (
    <div className="min-h-screen bg-background pb-20">
      <ComingSoonOverlay
        title="Programa de Afiliados"
        description="O programa de afiliados está em desenvolvimento. Em breve você poderá ganhar comissões indicando produtos."
      />
      <BottomNav />
    </div>
  );
};

export default ProgramaAfiliados;
