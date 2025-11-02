import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Planos = () => {
  const plans = [
    {
      name: "Básico",
      price: "Grátis",
      period: "para sempre",
      description: "Perfeito para começar seu negócio",
      features: [
        "Acesso a 1.000+ fornecedores",
        "Chat básico com fornecedores",
        "5 pedidos por mês",
        "Suporte por email",
        "Catálogo de produtos básico",
      ],
      highlighted: false,
    },
    {
      name: "Profissional",
      price: "R$ 97",
      period: "/mês",
      description: "Para lojistas que querem crescer",
      features: [
        "Acesso ilimitado a fornecedores",
        "Chat prioritário 24/7",
        "Pedidos ilimitados",
        "Suporte prioritário",
        "Catálogo completo de produtos",
        "Análises e relatórios avançados",
        "Desconto de até 15% em produtos",
        "Gerenciamento de estoque",
        "API de integração",
      ],
      highlighted: true,
    },
    {
      name: "Empresarial",
      price: "R$ 297",
      period: "/mês",
      description: "Solução completa para grandes empresas",
      features: [
        "Tudo do Profissional, mais:",
        "Gerente de conta dedicado",
        "Desconto de até 25% em produtos",
        "Integração com ERPs",
        "Treinamento personalizado",
        "Suporte técnico premium",
        "Dashboard personalizado",
        "Relatórios customizados",
        "Acesso antecipado a novos recursos",
        "Condições de pagamento especiais",
      ],
      highlighted: false,
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-40 pb-32 gradient-hero text-white particles-bg">
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-6xl sm:text-7xl lg:text-8xl font-heading font-extrabold mb-10 leading-tight [text-fill-color:white] [-webkit-text-fill-color:white]">
            Planos que cabem no seu bolso
          </h1>
          <p className="text-2xl sm:text-3xl max-w-4xl mx-auto leading-relaxed mb-12">
            Escolha o plano ideal para o tamanho do seu negócio e comece a lucrar hoje
          </p>
          <div className="inline-block bg-white/20 backdrop-blur-sm rounded-full px-10 py-5">
            <p className="text-xl font-semibold">✨ Experimente grátis por 30 dias, sem cartão de crédito</p>
          </div>
        </div>
      </section>

      {/* Planos */}
      <section className="py-40 bg-[#F6F0FF]">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-3 gap-10 max-w-7xl mx-auto">
            {plans.map((plan, index) => (
              <Card
                key={index}
                className={`p-12 rounded-3xl transition-all duration-300 ${
                  plan.highlighted
                    ? "gradient-card shadow-purple-glow scale-105 border-4 border-primary"
                    : "bg-white shadow-card hover-lift"
                }`}
              >
                {plan.highlighted && (
                  <div className="bg-gradient-primary text-white text-center py-3 rounded-full mb-8 font-bold text-lg">
                    MAIS POPULAR
                  </div>
                )}
                <h3 className="text-3xl font-heading font-bold mb-4 text-primary">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-6xl font-extrabold text-primary">{plan.price}</span>
                  <span className="text-2xl text-muted-foreground ml-2">{plan.period}</span>
                </div>
                <p className="text-xl text-muted-foreground mb-10 leading-relaxed">{plan.description}</p>
                
                <Button
                  size="lg"
                  className={`w-full h-16 text-xl rounded-full mb-10 font-bold ${
                    plan.highlighted
                      ? "bg-primary hover:bg-primary/90 shadow-purple-glow"
                      : "bg-white text-primary border-2 border-primary hover:bg-primary hover:text-white"
                  }`}
                >
                  Começar Agora
                </Button>

                <div className="space-y-5">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-4">
                      <Check className={`h-7 w-7 flex-shrink-0 ${plan.highlighted ? 'text-primary' : 'text-primary/70'}`} />
                      <span className="text-lg leading-relaxed">{feature}</span>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Comparação de recursos */}
      <section className="py-40 bg-white">
        <div className="container mx-auto px-4 sm:px-6">
          <h2 className="text-5xl sm:text-6xl font-heading font-bold text-center mb-10 text-primary">
            Compare todos os recursos
          </h2>
          <p className="text-center text-[#6B7280] text-2xl mb-24 max-w-3xl mx-auto">
            Veja em detalhes o que cada plano oferece
          </p>

          <div className="max-w-6xl mx-auto overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-primary">
                  <th className="text-left py-8 px-6 text-2xl font-heading font-bold text-primary">Recursos</th>
                  <th className="text-center py-8 px-6 text-2xl font-heading font-bold text-primary">Básico</th>
                  <th className="text-center py-8 px-6 text-2xl font-heading font-bold text-primary bg-primary/10">Profissional</th>
                  <th className="text-center py-8 px-6 text-2xl font-heading font-bold text-primary">Empresarial</th>
                </tr>
              </thead>
              <tbody className="text-lg">
                {[
                  { feature: "Acesso a fornecedores", basic: "1.000+", pro: "Ilimitado", enterprise: "Ilimitado" },
                  { feature: "Pedidos por mês", basic: "5", pro: "Ilimitados", enterprise: "Ilimitados" },
                  { feature: "Suporte", basic: "Email", pro: "Chat 24/7", enterprise: "Premium + Gerente" },
                  { feature: "Desconto em produtos", basic: "-", pro: "Até 15%", enterprise: "Até 25%" },
                  { feature: "API de integração", basic: "-", pro: "✓", enterprise: "✓" },
                  { feature: "Relatórios avançados", basic: "-", pro: "✓", enterprise: "Customizados" },
                ].map((row, idx) => (
                  <tr key={idx} className="border-b hover:bg-[#F6F0FF] transition-colors">
                    <td className="py-6 px-6 font-semibold">{row.feature}</td>
                    <td className="text-center py-6 px-6">{row.basic}</td>
                    <td className="text-center py-6 px-6 bg-primary/5">{row.pro}</td>
                    <td className="text-center py-6 px-6">{row.enterprise}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-40 bg-[#F6F0FF]">
        <div className="container mx-auto px-4 sm:px-6">
          <h2 className="text-5xl sm:text-6xl font-heading font-bold text-center mb-10 text-primary">
            Perguntas Frequentes
          </h2>
          <p className="text-center text-[#6B7280] text-2xl mb-24 max-w-3xl mx-auto">
            Tire suas dúvidas sobre nossos planos
          </p>

          <div className="max-w-4xl mx-auto space-y-8">
            {[
              {
                q: "Posso cancelar a qualquer momento?",
                a: "Sim! Você pode cancelar seu plano a qualquer momento, sem multas ou taxas. Seu acesso continuará até o fim do período pago.",
              },
              {
                q: "Como funciona o período de teste gratuito?",
                a: "Você tem 30 dias para testar todos os recursos do plano Profissional gratuitamente. Não é necessário cartão de crédito para começar.",
              },
              {
                q: "Posso mudar de plano depois?",
                a: "Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento. O valor será ajustado proporcionalmente.",
              },
              {
                q: "Quais são as formas de pagamento aceitas?",
                a: "Aceitamos cartão de crédito, boleto bancário, PIX e transferência bancária. Para planos anuais, oferecemos desconto adicional.",
              },
            ].map((faq, idx) => (
              <Card key={idx} className="p-10 rounded-3xl shadow-card hover-lift transition-smooth">
                <h3 className="text-2xl font-heading font-bold mb-5 text-primary">{faq.q}</h3>
                <p className="text-xl text-[#6B7280] leading-relaxed">{faq.a}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-40 gradient-cta text-white particles-bg">
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-heading font-extrabold mb-10 text-white leading-tight [text-fill-color:white] [-webkit-text-fill-color:white]">
            Pronto para começar?
          </h2>
          <p className="text-2xl sm:text-3xl mb-16 text-white max-w-4xl mx-auto leading-relaxed">
            Junte-se a milhares de lojistas que já transformaram seus negócios
          </p>
          <Button
            size="lg"
            className="h-20 px-16 text-xl rounded-full bg-white text-primary hover:bg-white/90 shadow-2xl hover:scale-105 transition-all duration-300 font-bold"
          >
            Começar Teste Grátis
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Planos;