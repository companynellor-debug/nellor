import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface PlanoData {
  companyName: string;
  email: string;
  password: string;
}

const EscolherPlano = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const { planoData } = location.state || {};
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  if (!planoData) {
    navigate("/login-fornecedor");
    return null;
  }

  const plans = [
    {
      id: "basico",
      name: "Básico",
      price: "R$ 49,90",
      period: "/mês",
      description: "Ideal para começar",
      features: [
        "Até 50 produtos",
        "Painel administrativo",
        "Chat com clientes",
        "Relatórios básicos",
        "Suporte por email"
      ],
      popular: false
    },
    {
      id: "profissional",
      name: "Profissional",
      price: "R$ 99,90",
      period: "/mês",
      description: "Para quem quer crescer",
      features: [
        "Até 200 produtos",
        "Painel administrativo completo",
        "Chat com clientes",
        "Relatórios avançados",
        "Destaque na plataforma",
        "Suporte prioritário",
        "Ferramentas de marketing"
      ],
      popular: true
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: "R$ 199,90",
      period: "/mês",
      description: "Solução completa",
      features: [
        "Produtos ilimitados",
        "Painel administrativo premium",
        "Chat com clientes",
        "Relatórios e analytics completos",
        "Destaque premium",
        "Suporte 24/7",
        "Ferramentas de marketing avançadas",
        "API de integração",
        "Gerente de conta dedicado"
      ],
      popular: false
    }
  ];

  const handleContinue = () => {
    if (!selectedPlan) return;
    
    const plan = plans.find(p => p.id === selectedPlan);
    
    // Criar conta do fornecedor diretamente
    login(planoData.email, planoData.password, planoData.companyName, 'fornecedor');
    
    toast.success(`Plano ${plan?.name} ativado! Bem-vindo à nellor!`);
    
    setTimeout(() => {
      navigate("/fornecedor");
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent via-secondary to-primary p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Escolha seu Plano
          </h1>
          <p className="text-white/80 text-lg">
            Selecione o plano ideal para sua empresa
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative p-6 cursor-pointer transition-all hover:shadow-2xl ${
                selectedPlan === plan.id
                  ? "ring-4 ring-white shadow-2xl scale-105"
                  : "hover:scale-105"
              }`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent">
                  Mais Popular
                </Badge>
              )}

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  {plan.name}
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  {plan.description}
                </p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-primary">
                    {plan.price}
                  </span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full ${
                  selectedPlan === plan.id
                    ? "bg-primary"
                    : "bg-secondary"
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPlan(plan.id);
                }}
              >
                {selectedPlan === plan.id ? "Selecionado" : "Selecionar"}
              </Button>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button
            size="lg"
            onClick={handleContinue}
            disabled={!selectedPlan}
            className="bg-white text-primary hover:bg-white/90 px-12"
          >
            Ativar Plano e Criar Conta
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EscolherPlano;
