import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  ShoppingBag, 
  MessageSquare, 
  Truck, 
  TrendingUp,
  Smartphone,
  UserPlus,
  ShoppingCart,
  Star
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Home = () => {
  const benefits = [
    {
      icon: ShoppingBag,
      title: "Produtos direto da fábrica",
      description: "Acesse milhares de produtos com os melhores preços do mercado."
    },
    {
      icon: MessageSquare,
      title: "Chat com fornecedores",
      description: "Negocie diretamente com fornecedores pelo chat integrado."
    },
    {
      icon: Truck,
      title: "Frete rápido e seguro",
      description: "Entrega garantida e rastreamento em tempo real."
    },
    {
      icon: TrendingUp,
      title: "Melhores preços para lojistas",
      description: "Margens competitivas para você lucrar mais."
    }
  ];

  const steps = [
    {
      icon: Smartphone,
      title: "Baixe o app",
      description: "Disponível para Android e iOS"
    },
    {
      icon: UserPlus,
      title: "Crie sua conta",
      description: "Cadastro rápido e gratuito"
    },
    {
      icon: ShoppingCart,
      title: "Compre e revenda",
      description: "Comece a lucrar hoje mesmo"
    }
  ];

  const testimonials = [
    {
      name: "Maria Silva",
      role: "Lojista",
      comment: "Aumentei minhas vendas em 40% depois que comecei a usar o nellor!",
      rating: 5
    },
    {
      name: "João Santos",
      role: "Revendedor",
      comment: "Produtos de qualidade e entrega rápida. Recomendo!",
      rating: 5
    },
    {
      name: "Ana Costa",
      role: "Empreendedora",
      comment: "Melhor plataforma para encontrar fornecedores confiáveis.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden bg-gradient-to-br from-primary via-secondary to-accent">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
        
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-white space-y-8 animate-slide-in">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold leading-tight">
                O marketplace que conecta lojistas e fornecedores em segundos
              </h1>
              <p className="text-lg sm:text-xl text-white/90">
                Compre, revenda e cresça — tudo em um só app.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/download">
                  <Button size="lg" className="w-full sm:w-auto bg-white text-primary hover:bg-white/90 text-lg px-8 py-6">
                    Baixar o App
                  </Button>
                </Link>
                <Link to="/fornecedor">
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="w-full sm:w-auto border-2 border-white text-white hover:bg-white hover:text-primary text-lg px-8 py-6"
                  >
                    Sou fornecedor
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="relative animate-fade-in">
              <div className="relative z-10 mx-auto max-w-sm">
                <img 
                  src="https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=800&fit=crop" 
                  alt="App mockup"
                  className="w-full h-auto drop-shadow-2xl rounded-3xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefícios */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-center mb-12">
            Por que usar o nellor?
          </h2>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <Card key={index} className="p-6 shadow-card hover:shadow-hover transition-smooth text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-heading font-semibold mb-2">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section className="py-20 bg-muted">
        <div className="container mx-auto px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-center mb-12">
            Como Funciona
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {steps.map((step, index) => (
              <div key={index} className="text-center relative">
                <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <step.icon className="h-10 w-10 text-white" />
                </div>
                <h3 className="font-heading font-semibold mb-2 text-lg">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
                
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-primary/30"></div>
                )}
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link to="/download">
              <Button size="lg" className="bg-gradient-to-r from-accent to-secondary">
                Baixar o App
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <section className="py-20 bg-primary text-white">
        <div className="container mx-auto px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-center mb-12">
            O que nossos clientes dizem
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-6 bg-white text-foreground">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="mb-4 text-sm italic">"{testimonial.comment}"</p>
                <div>
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-gradient-to-r from-accent to-secondary text-white">
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold mb-4">
            Conecte-se aos melhores fornecedores do Brasil
          </h2>
          <p className="text-lg sm:text-xl mb-8 text-white/90">
            Baixe agora o app e comece a lucrar
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-primary hover:bg-white/90">
              <svg className="h-6 w-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              App Store
            </Button>
            <Button size="lg" className="bg-white text-primary hover:bg-white/90">
              <svg className="h-6 w-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.5,12.92 20.16,13.19L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
              </svg>
              Google Play
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
