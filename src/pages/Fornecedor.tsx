import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Globe, MessageSquare, BarChart3, Check } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Fornecedor = () => {
  const advantages = [
    {
      icon: Globe,
      title: "Alcance nacional",
      description: "Seus produtos disponíveis em todo o Brasil"
    },
    {
      icon: BarChart3,
      title: "Painel simples",
      description: "Gerencie pedidos de forma fácil e rápida"
    },
    {
      icon: MessageSquare,
      title: "Chat com clientes",
      description: "Suporte personalizado e atendimento direto"
    }
  ];

  const plans = [
    {
      name: "Grátis",
      price: "R$ 0",
      period: "/mês",
      features: [
        "Até 10 produtos",
        "Painel básico",
        "Chat com clientes",
        "Suporte por email"
      ],
      highlighted: false
    },
    {
      name: "Premium",
      price: "R$ 99",
      period: "/mês",
      features: [
        "Até 50 produtos",
        "Destaque no app",
        "Suporte VIP",
        "Relatórios avançados",
        "Selo verificado"
      ],
      highlighted: true
    },
    {
      name: "Ultimate",
      price: "R$ 199",
      period: "/mês",
      features: [
        "Até 200 produtos",
        "Destaque nacional",
        "Gerente de conta dedicado",
        "API personalizada",
        "Selo verificado premium"
      ],
      highlighted: false
    }
  ];

  const testimonials = [
    {
      company: "Confecções Silva",
      city: "São Paulo - SP",
      comment: "Aumentamos nossas vendas em 300% em apenas 3 meses."
    },
    {
      company: "Acessórios Plus",
      city: "Rio de Janeiro - RJ",
      comment: "Plataforma perfeita para expandir nosso negócio."
    },
    {
      company: "Tecidos Premium",
      city: "Belo Horizonte - MG",
      comment: "Suporte excelente e vendas consistentes todos os dias."
    }
  ];

  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-background to-muted">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 animate-slide-in">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold leading-tight">
                Venda seus produtos para milhares de lojistas
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground">
                Cadastre-se no nellor e aumente seu alcance em todo o Brasil.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/login-fornecedor">
                  <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90">
                    Entrar como Fornecedor
                  </Button>
                </Link>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => window.open('https://wa.me/5511999999999', '_blank')}
                >
                  <MessageSquare className="mr-2 h-5 w-5" />
                  Falar com Suporte
                </Button>
              </div>
            </div>
            
            <div className="relative animate-fade-in">
              <img 
                src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop" 
                alt="Dashboard fornecedor"
                className="rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Vantagens */}
      <section className="py-20 bg-accent/10">
        <div className="container mx-auto px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-center mb-12">
            Vantagens de ser fornecedor
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {advantages.map((advantage, index) => (
              <Card key={index} className="p-8 text-center shadow-card hover:shadow-hover transition-smooth">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <advantage.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-heading font-semibold mb-2 text-lg">{advantage.title}</h3>
                <p className="text-muted-foreground">{advantage.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Planos */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-center mb-4">
            Planos e Destaques
          </h2>
          <p className="text-center text-muted-foreground mb-12">
            Escolha o plano ideal para o seu negócio
          </p>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <Card 
                key={index} 
                className={`p-8 ${
                  plan.highlighted 
                    ? 'border-2 border-primary shadow-hover scale-105' 
                    : 'shadow-card'
                }`}
              >
                {plan.highlighted && (
                  <div className="bg-primary text-white text-xs font-semibold px-3 py-1 rounded-full inline-block mb-4">
                    MAIS POPULAR
                  </div>
                )}
                <h3 className="text-2xl font-heading font-bold mb-2">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-heading font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className={`w-full ${
                    plan.highlighted 
                      ? 'bg-primary hover:bg-primary/90' 
                      : 'bg-secondary hover:bg-secondary/90'
                  }`}
                >
                  Assinar
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <section className="py-20 bg-primary text-white">
        <div className="container mx-auto px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-center mb-12">
            Fornecedores que confiam no nellor
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-6 bg-white text-foreground">
                <h4 className="font-heading font-semibold mb-1">{testimonial.company}</h4>
                <p className="text-xs text-muted-foreground mb-4">{testimonial.city}</p>
                <p className="text-sm italic">"{testimonial.comment}"</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-gradient-to-r from-accent to-secondary text-white">
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold mb-4">
            Pronto para vender mais?
          </h2>
          <p className="text-lg sm:text-xl mb-8 text-white/90">
            Cadastre sua loja agora mesmo e comece hoje
          </p>
          <Link to="/login-fornecedor">
            <Button size="lg" className="bg-white text-primary hover:bg-white/90">
              Entrar como Fornecedor
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Fornecedor;
