import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Minus } from "lucide-react";
import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const categories = [
    {
      title: "Sobre o nellor",
      faqs: [
        {
          q: "O que é o nellor?",
          a: "O nellor é um marketplace B2B que conecta lojistas e revendedores a fornecedores verificados em todo o Brasil. Nossa plataforma permite que você compre produtos direto da fábrica com os melhores preços, negocie com fornecedores e gerencie todo seu negócio em um só lugar.",
        },
        {
          q: "Como funciona o nellor?",
          a: "É muito simples: você se cadastra gratuitamente, navega pelo nosso catálogo com mais de 100.000 produtos, escolhe os itens que deseja, negocia com os fornecedores através do chat integrado e finaliza sua compra. Tudo isso com segurança e rastreamento em tempo real.",
        },
        {
          q: "O nellor é seguro?",
          a: "Sim! Todos os fornecedores são verificados e certificados pela nossa equipe. Suas transações são protegidas por criptografia de ponta a ponta e você tem garantia de recebimento ou devolução do dinheiro em caso de problemas.",
        },
        {
          q: "Qual a diferença entre lojista e fornecedor?",
          a: "Lojistas são empresários que compram produtos para revender aos consumidores finais. Fornecedores são fabricantes ou distribuidores que vendem produtos em maior quantidade para lojistas. No nellor, ambos encontram oportunidades de crescimento.",
        },
      ],
    },
    {
      title: "Cadastro e Conta",
      faqs: [
        {
          q: "Como faço para me cadastrar?",
          a: "Baixe nosso app na App Store ou Google Play, clique em 'Criar Conta' e preencha seus dados básicos. O processo leva menos de 2 minutos e você já pode começar a explorar os produtos disponíveis.",
        },
        {
          q: "Preciso pagar para me cadastrar?",
          a: "Não! O cadastro no nellor é completamente gratuito. Você só paga quando realizar compras de produtos. Oferecemos também planos premium com benefícios adicionais, mas não são obrigatórios.",
        },
        {
          q: "Posso ter mais de uma conta?",
          a: "Cada pessoa ou empresa pode ter apenas uma conta ativa. Se você tem mais de um negócio, pode gerenciar todos dentro da mesma conta através da funcionalidade de múltiplas lojas.",
        },
        {
          q: "Como altero meus dados cadastrais?",
          a: "Acesse Menu > Configurações > Meus Dados e atualize as informações que desejar. Alterações de dados bancários e documentos podem levar até 48h para serem aprovadas por questões de segurança.",
        },
        {
          q: "Esqueci minha senha, o que faço?",
          a: "Na tela de login, clique em 'Esqueci minha senha', digite seu email cadastrado e você receberá instruções para criar uma nova senha. O link de recuperação é válido por 24 horas.",
        },
      ],
    },
    {
      title: "Compras e Pedidos",
      faqs: [
        {
          q: "Como faço um pedido?",
          a: "Navegue pelos produtos, adicione ao carrinho os itens desejados, revise seu pedido e escolha a forma de pagamento. Você pode negociar preços e condições diretamente com o fornecedor antes de finalizar.",
        },
        {
          q: "Qual o valor mínimo de pedido?",
          a: "Não há valor mínimo na plataforma, mas cada fornecedor pode estabelecer seu próprio pedido mínimo. Essa informação fica visível na página do produto e do fornecedor.",
        },
        {
          q: "Posso cancelar um pedido?",
          a: "Sim, você pode cancelar pedidos que ainda não foram aprovados pelo fornecedor. Após a aprovação, será necessário entrar em acordo com o fornecedor para cancelamento. Pedidos já enviados seguem as políticas de troca e devolução.",
        },
        {
          q: "Como acompanho meu pedido?",
          a: "Todos os pedidos podem ser acompanhados em tempo real através do app na seção 'Meus Pedidos'. Você receberá notificações a cada atualização de status: aprovado, em separação, enviado, em trânsito e entregue.",
        },
        {
          q: "O que fazer se não receber meu pedido?",
          a: "Entre em contato imediatamente com nosso suporte através do chat. Temos garantia de entrega: se o produto não chegar no prazo ou apresentar problemas, você recebe seu dinheiro de volta ou uma reposição.",
        },
      ],
    },
    {
      title: "Pagamentos",
      faqs: [
        {
          q: "Quais formas de pagamento são aceitas?",
          a: "Aceitamos cartão de crédito (Visa, Mastercard, Elo, Amex), boleto bancário, PIX e para clientes aprovados, oferecemos crédito parcelado em até 12x. A disponibilidade pode variar conforme o fornecedor.",
        },
        {
          q: "O pagamento é seguro?",
          a: "Sim, totalmente seguro! Utilizamos certificados SSL e criptografia de dados. Seus dados de pagamento são processados por gateways certificados e nunca ficam armazenados em nossos servidores.",
        },
        {
          q: "Posso parcelar minhas compras?",
          a: "Sim! Oferecemos parcelamento em até 12x no cartão de crédito. Para clientes aprovados, também temos a opção de crédito nellor com condições especiais e prazos estendidos.",
        },
        {
          q: "Como funciona o crédito nellor?",
          a: "É uma linha de crédito pré-aprovada para lojistas com bom histórico. Você compra agora e paga depois, com prazos de até 60 dias e possibilidade de parcelamento. Solicite análise através do app.",
        },
        {
          q: "Quanto tempo leva para processar meu pagamento?",
          a: "PIX e cartão de crédito são confirmados instantaneamente. Boleto bancário pode levar até 3 dias úteis para compensação. Assim que confirmado, o fornecedor é notificado para processar seu pedido.",
        },
      ],
    },
    {
      title: "Entrega e Frete",
      faqs: [
        {
          q: "Como funciona a entrega?",
          a: "Cada fornecedor trabalha com parceiros logísticos próprios ou utiliza nossos parceiros recomendados. O prazo de entrega varia conforme a localização e o produto, mas você sempre terá essa informação antes de fechar a compra.",
        },
        {
          q: "Quanto custa o frete?",
          a: "O valor do frete é calculado automaticamente no checkout baseado no peso, dimensões do produto e distância. Fornecedores podem oferecer frete grátis para compras acima de determinado valor.",
        },
        {
          q: "Posso retirar o pedido pessoalmente?",
          a: "Sim, se o fornecedor oferecer essa opção, você pode escolher 'Retirada no Local' no checkout. O endereço e horários de funcionamento serão informados.",
        },
        {
          q: "O que fazer se meu produto chegar danificado?",
          a: "Tire fotos imediatamente, não aceite a entrega se possível, e abra um chamado no app em até 48h. Analisaremos seu caso e providenciaremos reposição ou reembolso total.",
        },
      ],
    },
    {
      title: "Para Fornecedores",
      faqs: [
        {
          q: "Como me tornar um fornecedor no nellor?",
          a: "Acesse nellor.com.br/fornecedor e preencha o formulário de cadastro. Nossa equipe analisará seus documentos e, após aprovação (geralmente em até 5 dias úteis), você poderá começar a vender.",
        },
        {
          q: "Quanto custa vender no nellor?",
          a: "Não cobramos taxa de adesão ou mensalidade. Cobramos apenas uma pequena comissão sobre vendas realizadas (varia de 5% a 15% conforme o plano e categoria). Você só paga quando vende.",
        },
        {
          q: "Como recebo o dinheiro das vendas?",
          a: "Os pagamentos são liberados automaticamente para sua conta bancária cadastrada em até 14 dias após a confirmação da entrega pelo cliente. Fornecedores premium podem ter prazos reduzidos.",
        },
        {
          q: "Posso anunciar quantos produtos quiser?",
          a: "Sim! Não há limite de produtos anunciados. Quanto mais completo seu catálogo, maiores suas chances de venda. Oferecemos ferramentas de importação em massa para facilitar.",
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-40 pb-32 gradient-hero text-white particles-bg">
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-3xl md:text-6xl lg:text-8xl font-heading font-extrabold mb-10 leading-tight text-white">
            Perguntas Frequentes
          </h1>
          <p className="text-2xl sm:text-3xl max-w-4xl mx-auto leading-relaxed">
            Tire todas as suas dúvidas sobre o nellor
          </p>
        </div>
      </section>

      {/* FAQ Categories */}
      <section className="py-40 bg-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-5xl mx-auto space-y-24">
            {categories.map((category, categoryIndex) => (
              <div key={categoryIndex}>
                <h2 className="text-5xl font-heading font-bold mb-16 text-primary">
                  {category.title}
                </h2>
                <div className="space-y-6">
                  {category.faqs.map((faq, faqIndex) => {
                    const globalIndex = categoryIndex * 100 + faqIndex;
                    const isOpen = openIndex === globalIndex;
                    
                    return (
                      <Card
                        key={faqIndex}
                        className="rounded-3xl shadow-card overflow-hidden transition-all duration-300 hover:shadow-hover"
                      >
                        <button
                          className="w-full p-10 text-left flex items-start justify-between gap-6 hover:bg-[#F6F0FF] transition-colors"
                          onClick={() => setOpenIndex(isOpen ? null : globalIndex)}
                        >
                          <h3 className="text-2xl font-heading font-bold text-primary flex-1">
                            {faq.q}
                          </h3>
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            {isOpen ? (
                              <Minus className="h-6 w-6 text-primary" />
                            ) : (
                              <Plus className="h-6 w-6 text-primary" />
                            )}
                          </div>
                        </button>
                        {isOpen && (
                          <div className="px-10 pb-10">
                            <p className="text-xl text-[#6B7280] leading-relaxed">
                              {faq.a}
                            </p>
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Support */}
      <section className="py-40 bg-[#F6F0FF]">
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-5xl sm:text-6xl font-heading font-bold mb-10 text-primary">
            Não encontrou sua resposta?
          </h2>
          <p className="text-2xl text-[#6B7280] mb-16 max-w-3xl mx-auto leading-relaxed">
            Nossa equipe de suporte está pronta para ajudar você
          </p>
          <div className="flex flex-col sm:flex-row gap-8 justify-center">
            <Button
              className="h-12 px-8 md:h-20 md:px-16 text-base md:text-xl rounded-full bg-primary hover:bg-primary/90 text-white shadow-purple-glow font-bold"
            >
              Falar com Suporte
            </Button>
            <Button
              variant="outline"
              className="h-12 px-8 md:h-20 md:px-16 text-base md:text-xl rounded-full border-2 border-primary text-primary hover:bg-primary hover:text-white font-bold"
            >
              Enviar Email
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FAQ;