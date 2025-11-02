import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  ShoppingCart, 
  MessageSquare, 
  TrendingUp, 
  Shield, 
  Zap, 
  BarChart3,
  Smartphone,
  Lock,
  CreditCard,
  Bell,
  Users,
  Package
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Recursos = () => {
  const features = [
    {
      icon: ShoppingCart,
      title: "Marketplace Completo",
      description: "Acesso a milhares de produtos de centenas de fornecedores verificados em um único lugar. Navegue por categorias, compare preços e encontre exatamente o que precisa.",
      benefits: [
        "Catálogo com mais de 100.000 produtos",
        "Filtros avançados de busca",
        "Comparação de preços em tempo real",
        "Avaliações e reviews de outros lojistas"
      ]
    },
    {
      icon: MessageSquare,
      title: "Chat Integrado",
      description: "Negocie diretamente com fornecedores através do nosso chat em tempo real. Tire dúvidas, negocie preços e feche negócios mais rápido.",
      benefits: [
        "Mensagens instantâneas",
        "Compartilhamento de imagens e documentos",
        "Histórico completo de conversas",
        "Notificações push em tempo real"
      ]
    },
    {
      icon: TrendingUp,
      title: "Análises e Relatórios",
      description: "Dashboard completo com todas as métricas do seu negócio. Acompanhe vendas, lucros, produtos mais vendidos e muito mais.",
      benefits: [
        "Dashboard personalizado",
        "Relatórios de vendas detalhados",
        "Análise de performance de produtos",
        "Projeções e previsões de lucro"
      ]
    },
    {
      icon: Shield,
      title: "Segurança Garantida",
      description: "Todos os fornecedores são verificados e certificados. Suas transações são protegidas e você tem garantia de recebimento ou devolução do dinheiro.",
      benefits: [
        "Fornecedores verificados",
        "Pagamento seguro",
        "Garantia de entrega",
        "Proteção contra fraudes"
      ]
    },
    {
      icon: Zap,
      title: "Logística Integrada",
      description: "Gestão completa de entregas com rastreamento em tempo real. Escolha entre diversos parceiros logísticos e encontre o melhor custo-benefício.",
      benefits: [
        "Rastreamento em tempo real",
        "Múltiplos parceiros de entrega",
        "Cálculo automático de frete",
        "Notificações de status de entrega"
      ]
    },
    {
      icon: BarChart3,
      title: "Gestão de Estoque",
      description: "Controle completo do seu estoque com alertas automáticos de reposição. Nunca mais perca vendas por falta de produtos.",
      benefits: [
        "Controle de entrada e saída",
        "Alertas de estoque baixo",
        "Sincronização com pedidos",
        "Relatórios de giro de estoque"
      ]
    },
    {
      icon: CreditCard,
      title: "Múltiplas Formas de Pagamento",
      description: "Pague seus fornecedores da forma que preferir: cartão, boleto, PIX ou parcelado. Flexibilidade total para gerenciar seu fluxo de caixa.",
      benefits: [
        "Cartão de crédito parcelado",
        "Boleto bancário",
        "PIX instantâneo",
        "Crédito para clientes aprovados"
      ]
    },
    {
      icon: Smartphone,
      title: "App Mobile Completo",
      description: "Gerencie seu negócio de qualquer lugar com nosso app disponível para iOS e Android. Todas as funcionalidades na palma da sua mão.",
      benefits: [
        "Interface otimizada para mobile",
        "Notificações push",
        "Modo offline para consultas",
        "Scanner de código de barras"
      ]
    },
    {
      icon: Lock,
      title: "Privacidade de Dados",
      description: "Seus dados e informações comerciais são completamente privados e criptografados. Conformidade total com LGPD.",
      benefits: [
        "Criptografia de ponta a ponta",
        "Conformidade com LGPD",
        "Backup automático diário",
        "Controle de permissões de acesso"
      ]
    },
    {
      icon: Bell,
      title: "Notificações Inteligentes",
      description: "Receba alertas sobre novos produtos, promoções, pedidos e atualizações importantes para não perder nenhuma oportunidade.",
      benefits: [
        "Alertas de promoções",
        "Notificações de novos produtos",
        "Updates de pedidos",
        "Lembretes personalizados"
      ]
    },
    {
      icon: Users,
      title: "Gestão de Equipe",
      description: "Adicione colaboradores e defina permissões específicas para cada membro da sua equipe. Controle total de acessos.",
      benefits: [
        "Usuários ilimitados",
        "Níveis de permissão customizáveis",
        "Log de atividades",
        "Gestão de roles e responsabilidades"
      ]
    },
    {
      icon: Package,
      title: "Gestão de Pedidos",
      description: "Acompanhe todos os seus pedidos em um só lugar. Desde a compra até a entrega, tenha controle total de toda operação.",
      benefits: [
        "Histórico completo de pedidos",
        "Rastreamento de status",
        "Integração com fornecedores",
        "Relatórios de performance"
      ]
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-40 pb-32 gradient-hero text-white particles-bg">
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-6xl sm:text-7xl lg:text-8xl font-heading font-extrabold mb-10 leading-tight [text-fill-color:white] [-webkit-text-fill-color:white]">
            Recursos que impulsionam seu negócio
          </h1>
          <p className="text-2xl sm:text-3xl max-w-4xl mx-auto leading-relaxed">
            Tudo que você precisa para comprar, vender e crescer em um único lugar
          </p>
        </div>
      </section>

      {/* Recursos */}
      <section className="py-40 bg-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="space-y-32">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`grid lg:grid-cols-2 gap-16 items-center ${
                  index % 2 === 1 ? "lg:flex-row-reverse" : ""
                }`}
              >
                <div className={index % 2 === 1 ? "lg:order-2" : ""}>
                  <div className="w-32 h-32 bg-gradient-to-br from-primary to-secondary rounded-3xl flex items-center justify-center mb-10 shadow-purple-glow">
                    <feature.icon className="h-16 w-16 text-white" />
                  </div>
                  <h2 className="text-5xl font-heading font-bold mb-8 text-primary">
                    {feature.title}
                  </h2>
                  <p className="text-2xl text-[#6B7280] mb-10 leading-relaxed">
                    {feature.description}
                  </p>
                  <div className="space-y-5">
                    {feature.benefits.map((benefit, idx) => (
                      <div key={idx} className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                          <div className="w-3 h-3 rounded-full bg-primary"></div>
                        </div>
                        <span className="text-xl leading-relaxed">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className={index % 2 === 1 ? "lg:order-1" : ""}>
                  <Card className="p-12 rounded-3xl shadow-card bg-[#F6F0FF] h-[500px] flex items-center justify-center">
                    <feature.icon className="h-64 w-64 text-primary/20" />
                  </Card>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-40 gradient-hero text-white particles-bg">
        <div className="container mx-auto px-4 sm:px-6">
          <h2 className="text-5xl sm:text-6xl font-heading font-bold text-center mb-24 [text-fill-color:white] [-webkit-text-fill-color:white]">
            Números que impressionam
          </h2>
          <div className="grid md:grid-cols-4 gap-12 max-w-7xl mx-auto">
            {[
              { number: "50K+", label: "Lojistas Ativos" },
              { number: "5K+", label: "Fornecedores Verificados" },
              { number: "100K+", label: "Produtos Disponíveis" },
              { number: "98%", label: "Satisfação dos Clientes" },
            ].map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="text-7xl font-extrabold mb-6">{stat.number}</div>
                <div className="text-2xl">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-40 bg-white">
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-heading font-extrabold mb-10 text-primary leading-tight">
            Experimente todos os recursos gratuitamente
          </h2>
          <p className="text-2xl sm:text-3xl mb-16 text-[#6B7280] max-w-4xl mx-auto leading-relaxed">
            30 dias de teste grátis, sem cartão de crédito
          </p>
          <Button
            size="lg"
            className="h-20 px-16 text-xl rounded-full bg-primary hover:bg-primary/90 text-white shadow-purple-glow hover:scale-105 transition-all duration-300 font-bold"
          >
            Começar Teste Grátis
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Recursos;