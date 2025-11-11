import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ShoppingBag, MessageSquare, Truck, TrendingUp, Smartphone, UserPlus, ShoppingCart, Star } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import nellorApp from "@/assets/nellor-app.png";
const Home = () => {
  const benefits = [{
    icon: ShoppingBag,
    title: "Produtos direto da fábrica",
    description: "Acesse milhares de produtos com os melhores preços do mercado."
  }, {
    icon: MessageSquare,
    title: "Chat com fornecedores",
    description: "Negocie diretamente com fornecedores pelo chat integrado."
  }, {
    icon: Truck,
    title: "Frete rápido e seguro",
    description: "Entrega garantida e rastreamento em tempo real."
  }, {
    icon: TrendingUp,
    title: "Melhores preços para lojistas",
    description: "Margens competitivas para você lucrar mais."
  }];
  const steps = [{
    icon: Smartphone,
    title: "Baixe o app",
    description: "Disponível para Android e iOS"
  }, {
    icon: UserPlus,
    title: "Crie sua conta",
    description: "Cadastro rápido e gratuito"
  }, {
    icon: ShoppingCart,
    title: "Compre e revenda",
    description: "Comece a lucrar hoje mesmo"
  }];
  const testimonials = [{
    name: "Maria Silva",
    role: "Lojista",
    comment: "Aumentei minhas vendas em 40% depois que comecei a usar o nellor!",
    rating: 5
  }, {
    name: "João Santos",
    role: "Revendedor",
    comment: "Produtos de qualidade e entrega rápida. Recomendo!",
    rating: 5
  }, {
    name: "Ana Costa",
    role: "Empreendedora",
    comment: "Melhor plataforma para encontrar fornecedores confiáveis.",
    rating: 5
  }];
  return <div className="min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden gradient-hero">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-white space-y-6">
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-heading font-bold leading-tight">
                A nova forma de conectar fornecedores e lojistas
              </h1>
              <p className="text-xl sm:text-2xl text-white/90">
                Compre, revenda e cresça — tudo em um só app.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link to="/download">
                  <Button size="lg" className="w-full sm:w-auto bg-white text-primary hover:bg-white/90">
                    Baixar o App
                  </Button>
                </Link>
                <Link to="/fornecedor">
                  <Button size="lg" className="w-full sm:w-auto bg-white/10 backdrop-blur-sm border-2 border-white text-white hover:bg-white hover:text-primary">
                    Sou fornecedor
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="relative hidden lg:block">
              <img src={nellorApp} alt="App mockup" className="w-full max-w-sm mx-auto rounded-3xl shadow-2xl animate-fade-in" />
            </div>
          </div>
        </div>
      </section>

      {/* Benefícios */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6">
          <h2 className="text-4xl sm:text-5xl font-heading font-bold text-center mb-4 text-primary">
            Por que usar o nellor?
          </h2>
          <p className="text-center text-muted-foreground text-xl mb-12 max-w-2xl mx-auto">
            Descubra as vantagens que vão transformar seu negócio
          </p>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => <Card key={index} className="p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-heading font-bold mb-2 text-lg text-primary">{benefit.title}</h3>
                <p className="text-muted-foreground text-sm">{benefit.description}</p>
              </Card>)}
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section className="py-20 bg-muted">
        <div className="container mx-auto px-4 sm:px-6">
          <h2 className="text-4xl sm:text-5xl font-heading font-bold text-center mb-4 text-primary">
            Como Funciona
          </h2>
          <p className="text-center text-muted-foreground text-xl mb-12 max-w-2xl mx-auto">
            Em apenas 3 passos você já pode começar a lucrar
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-12">
            {steps.map((step, index) => <div key={index} className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-4 relative">
                  <step.icon className="h-10 w-10 text-white" />
                  <div className="absolute -top-1 -right-1 w-8 h-8 bg-white rounded-full flex items-center justify-center text-primary font-bold text-sm">
                    {index + 1}
                  </div>
                </div>
                <h3 className="font-heading font-bold mb-2 text-lg text-primary">{step.title}</h3>
                <p className="text-muted-foreground text-sm">{step.description}</p>
              </div>)}
          </div>
          
          <div className="text-center">
            <Link to="/download">
              
            </Link>
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <section className="py-20 gradient-hero text-white">
        <div className="container mx-auto px-4 sm:px-6">
          <h2 className="text-4xl sm:text-5xl font-heading font-bold text-center mb-4">
            O que nossos clientes dizem
          </h2>
          <p className="text-center text-white/90 text-xl mb-12 max-w-2xl mx-auto">
            Histórias reais de sucesso com o nellor
          </p>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((testimonial, index) => <Card key={index} className="p-6 bg-white/95">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />)}
                </div>
                <p className="mb-4 italic text-sm">"{testimonial.comment}"</p>
                <div className="border-t pt-4">
                  <p className="font-bold text-primary">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </Card>)}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-gradient-to-r from-primary to-secondary text-white">
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-4xl sm:text-5xl font-heading font-bold mb-4">
            Conecte-se aos melhores fornecedores do Brasil
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Baixe agora o app e comece a lucrar hoje mesmo
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            
            
          </div>
        </div>
      </section>

      <Footer />
    </div>;
};
export default Home;