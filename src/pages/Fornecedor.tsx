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
      <section className="pt-32 pb-32 particles-bg gradient-hero">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-10 animate-slide-in text-white">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-heading font-extrabold leading-tight text-white">
                Venda seus produtos para milhares de lojistas
              </h1>
              <p className="text-xl sm:text-2xl text-white/90 leading-relaxed">
                Cadastre-se no nellor e aumente seu alcance em todo o Brasil.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 pt-4">
                <Link to="/login-fornecedor">
                  <Button size="lg" className="w-full sm:w-auto bg-white text-primary hover:bg-white/90 px-10 py-7 rounded-full text-lg font-semibold shadow-purple-glow btn-glow">
                    Entrar como Fornecedor
                  </Button>
                </Link>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="w-full sm:w-auto border-2 border-white/80 text-white hover:bg-white hover:text-primary px-10 py-7 rounded-full backdrop-blur-sm bg-white/10"
                  onClick={() => window.open('https://wa.me/5511999999999', '_blank')}
                >
                  <MessageSquare className="mr-2 h-6 w-6" />
                  Falar com Suporte
                </Button>
              </div>
            </div>
            
            <div className="relative animate-fade-in">
              <div className="absolute inset-0 bg-purple-500/30 blur-3xl rounded-full"></div>
              <img 
                src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop" 
                alt="Dashboard fornecedor"
                className="relative rounded-3xl shadow-purple-glow transform hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Vantagens */}
      <section className="py-32 bg-muted particles-bg">
        <div className="container mx-auto px-4 sm:px-6">
          <h2 className="text-4xl sm:text-5xl font-heading font-bold text-center mb-6 text-primary">
            Vantagens de ser fornecedor
          </h2>
          <p className="text-center text-muted-foreground text-lg mb-20 max-w-2xl mx-auto">
            Amplie seu negócio e alcance novos mercados
          </p>
          
          <div className="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto">
            {advantages.map((advantage, index) => (
              <Card key={index} className="p-10 text-center shadow-card hover-lift transition-smooth rounded-3xl border-none gradient-card">
                <div className="w-24 h-24 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-6 shadow-purple-glow animate-glow-pulse">
                  <advantage.icon className="h-12 w-12 text-white" />
                </div>
                <h3 className="font-heading font-bold mb-3 text-xl text-primary">{advantage.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-base">{advantage.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Planos */}
      <section className="py-32 bg-background">
        <div className="container mx-auto px-4 sm:px-6">
          <h2 className="text-4xl sm:text-5xl font-heading font-bold text-center mb-6 text-primary">
            Planos e Destaques
          </h2>
          <p className="text-center text-muted-foreground text-lg mb-20 max-w-2xl mx-auto">
            Escolha o plano ideal para o seu negócio e comece a crescer
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <Card 
                key={index} 
                className={`p-10 relative rounded-3xl transition-all duration-300 ${
                  plan.highlighted 
                    ? 'border-2 border-primary shadow-purple-glow scale-105 gradient-card' 
                    : 'shadow-card hover-lift gradient-card'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-primary to-secondary text-white text-sm font-bold px-6 py-2 rounded-full shadow-lg">
                    MAIS POPULAR
                  </div>
                )}
                <h3 className="text-3xl font-heading font-bold mb-3 text-primary">{plan.name}</h3>
                <div className="mb-8">
                  <span className="text-5xl font-heading font-extrabold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">{plan.price}</span>
                  <span className="text-muted-foreground text-lg">{plan.period}</span>
                </div>
                <ul className="space-y-4 mb-10">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-base leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className={`w-full py-6 rounded-full text-lg font-semibold shadow-lg btn-glow ${
                    plan.highlighted 
                      ? 'gradient-cta text-white hover:scale-105' 
                      : 'bg-primary text-white hover:bg-primary/90'
                  }`}
                >
                  Assinar Agora
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <section className="py-32 gradient-hero text-white particles-bg">
        <div className="container mx-auto px-4 sm:px-6">
          <h2 className="text-4xl sm:text-5xl font-heading font-bold text-center mb-6 text-white">
            Fornecedores que confiam no nellor
          </h2>
          <p className="text-center text-white/80 text-lg mb-20 max-w-2xl mx-auto">
            Resultados reais de quem já transformou seu negócio
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-8 bg-white/95 backdrop-blur-sm text-foreground rounded-3xl shadow-hover hover-lift transition-smooth">
                <h4 className="font-heading font-bold mb-2 text-xl text-primary">{testimonial.company}</h4>
                <p className="text-sm text-muted-foreground mb-6">{testimonial.city}</p>
                <p className="text-base italic leading-relaxed text-gray-700">"{testimonial.comment}"</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-32 gradient-cta text-white particles-bg">
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-extrabold mb-6 text-white leading-tight">
            Pronto para vender mais?
          </h2>
          <p className="text-xl sm:text-2xl mb-12 text-white/90 max-w-3xl mx-auto leading-relaxed">
            Cadastre sua loja agora mesmo e comece a lucrar hoje
          </p>
          <Link to="/login-fornecedor">
            <Button size="lg" className="bg-white text-primary hover:bg-white/90 px-12 py-7 rounded-full text-lg font-semibold shadow-2xl btn-glow hover:scale-105 transition-transform">
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
