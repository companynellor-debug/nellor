import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Star, Zap, Crown, Rocket, Infinity } from "lucide-react";
import { useSupplierSubscription } from "@/hooks/useSupplierSubscription";
import { toast } from "sonner";

const plans = [
  {
    name: "Grátis",
    price: 0,
    maxProducts: 10,
    icon: Zap,
    color: "text-blue-600",
    border: "border-border",
    features: ["Até 10 produtos", "Chat com clientes", "Estatísticas básicas"],
  },
  {
    name: "Inicial",
    price: 39.9,
    maxProducts: 50,
    icon: Star,
    color: "text-amber-500",
    border: "border-amber-200 dark:border-amber-800",
    features: ["Até 50 produtos", "Chat com clientes", "Estatísticas completas", "Suporte por chat"],
  },
  {
    name: "Intermediário",
    price: 67.9,
    maxProducts: 170,
    icon: Rocket,
    color: "text-purple-600",
    border: "border-purple-200 dark:border-purple-800",
    popular: true,
    features: ["Até 170 produtos", "Destaque na busca", "Relatórios avançados", "Suporte prioritário"],
  },
  {
    name: "Avançado",
    price: 149,
    maxProducts: 500,
    icon: Crown,
    color: "text-emerald-600",
    border: "border-emerald-200 dark:border-emerald-800",
    features: ["Até 500 produtos", "Destaque máximo", "Relatórios premium", "Suporte dedicado"],
  },
  {
    name: "Ultra",
    price: 249,
    maxProducts: null,
    icon: Infinity,
    color: "text-rose-600",
    border: "border-rose-200 dark:border-rose-800",
    features: ["Produtos ilimitados", "Destaque exclusivo", "Relatórios em tempo real", "Gerente de conta"],
  },
];

const Planos = () => {
  const { subscription, createSubscription } = useSupplierSubscription();
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const currentPlan = subscription?.plan_name || "Grátis";

  const handleSubscribe = async (plan: typeof plans[0]) => {
    if (plan.name === currentPlan) return;
    if (plan.price === 0) {
      toast.info("Você já pode usar o plano Grátis!");
      return;
    }
    setSubscribing(plan.name);
    try {
      await createSubscription.mutateAsync("pix");
      toast.success(`Solicitação para o plano ${plan.name} enviada! Aguarde a confirmação.`);
    } catch {
      toast.error("Erro ao solicitar assinatura.");
    } finally {
      setSubscribing(null);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Planos</h1>
        <p className="text-muted-foreground text-sm mt-1">Escolha o melhor plano para o seu negócio</p>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 -mx-3 px-3 sm:mx-0 sm:px-0 snap-x snap-mandatory">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const isCurrent = plan.name === currentPlan;
          return (
            <Card
              key={plan.name}
              className={`relative min-w-[260px] max-w-[300px] flex-shrink-0 snap-center transition-all ${plan.border} ${isCurrent ? "ring-2 ring-primary shadow-lg" : "hover:shadow-md"} ${plan.popular ? "border-2" : ""}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-purple-600 text-white text-[10px] px-2">Mais Popular</Badge>
                </div>
              )}
              {isCurrent && (
                <Badge className="absolute top-3 right-3 bg-primary text-[10px]">Atual</Badge>
              )}
              <CardContent className="p-5 flex flex-col h-full">
                <div className="flex items-center gap-2 mb-3">
                  <Icon className={`h-5 w-5 ${plan.color}`} />
                  <span className="font-bold text-lg">{plan.name}</span>
                </div>
                <div className="mb-4">
                  <span className="text-3xl font-bold">
                    {plan.price === 0 ? "Grátis" : `R$ ${plan.price.toFixed(2).replace(".", ",")}`}
                  </span>
                  {plan.price > 0 && <span className="text-muted-foreground text-sm">/mês</span>}
                </div>
                <div className="mb-4">
                  <span className="text-sm font-medium text-muted-foreground">
                    {plan.maxProducts ? `Até ${plan.maxProducts} produtos` : "Produtos ilimitados"}
                  </span>
                </div>
                <ul className="space-y-2 flex-1 mb-4">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={isCurrent ? "secondary" : plan.popular ? "default" : "outline"}
                  disabled={isCurrent || subscribing === plan.name}
                  onClick={() => handleSubscribe(plan)}
                >
                  {isCurrent ? "Plano Atual" : subscribing === plan.name ? "Enviando..." : `Assinar ${plan.name}`}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Planos;
