import { BottomNav } from "@/components/cliente/BottomNav";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SecurityTab from "@/components/cliente/SecurityTab";
import nellorLogo from "@/assets/nellor-logo.png";

const Seguranca = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-muted/30 pb-20">
      <header className="sticky top-0 z-40 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </button>
          <img src={nellorLogo} alt="Nellor" className="h-6 brightness-0 invert" />
          <h1 className="text-base font-semibold flex-1">Segurança</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-5">
        <SecurityTab />
      </main>

      <BottomNav />
    </div>
  );
};

export default Seguranca;
