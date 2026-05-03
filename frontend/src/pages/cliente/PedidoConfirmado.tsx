import { useSearchParams } from "react-router-dom";
import { ParticlesBackground } from "@/components/cliente/ParticlesBackground";
import { StepConcluido } from "@/components/checkout/StepConcluido";

const PedidoConfirmado = () => {
  const [searchParams] = useSearchParams();
  const orderNumber = searchParams.get("order") || `#${Date.now().toString().slice(-8)}`;
  const paymentMethod = (searchParams.get("method") as "cartao" | "pix") || "cartao";

  return (
    <div className="min-h-screen bg-background pb-8">
      <ParticlesBackground />
      <main className="container mx-auto px-4 py-8 relative z-10">
        <StepConcluido orderNumber={orderNumber} paymentMethod={paymentMethod} />
      </main>
    </div>
  );
};

export default PedidoConfirmado;
