import { useState } from "react";
import { BottomNav } from "@/components/cliente/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, Search, MessageCircle, FileText, Star, AlertTriangle, Compass, HeadphonesIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

import nellorLogo from "@/assets/nellor-logo.png";

const tutorialCards = [
  { icon: Compass, title: "Encontrar Fornecedores", desc: "Use a busca ou categorias para encontrar fornecedores atacadistas.", detail: "Na homepage, navegue pelas categorias ou use a barra de busca. Procure pelo badge 'Fornecedor Verificado' para garantir que o CNPJ foi validado pela Nellor." },
  { icon: MessageCircle, title: "Negociar pelo Chat", desc: "Inicie conversas diretas com fornecedores.", detail: "Abra a página de qualquer produto e clique em 'Negociar com Fornecedor'. Isso abre o chat onde você pode combinar quantidade, preço, forma de pagamento e prazo de entrega." },
  { icon: FileText, title: "Registrar Negociação", desc: "Formalize o acordo dentro do chat.", detail: "Após combinar os detalhes, clique em 'Registrar Negociação' dentro do chat. Preencha produto, quantidade, valor e forma de pagamento. Isso cria um registro oficial." },
  { icon: FileText, title: "Gerar PDF do Acordo", desc: "Crie um documento com todos os detalhes.", detail: "Após registrar a negociação, clique em 'Gerar PDF do Acordo'. O documento é gerado automaticamente e pode ser salvo ou enviado ao fornecedor como comprovante." },
  { icon: Star, title: "Avaliar Fornecedor", desc: "Deixe sua avaliação após receber o pedido.", detail: "Após confirmar o recebimento na negociação, um formulário de avaliação aparece automaticamente. Dê de 1 a 5 estrelas e deixe um comentário." },
  { icon: AlertTriangle, title: "Reportar Problema", desc: "Abra uma disputa se algo deu errado.", detail: "Na negociação, clique em 'Reportar Problema'. Descreva o ocorrido e a Nellor abrirá uma disputa, notificando o fornecedor que tem 5 minutos para responder." },
];

const faqCategories = [
  {
    name: "Começando",
    items: [
      { q: "O que é a Nellor e como funciona?", a: "A Nellor é um marketplace que conecta compradores diretamente com fornecedores atacadistas. Você encontra o produto, negocia pelo chat, combina pagamento e entrega diretamente com o fornecedor." },
      { q: "A Nellor processa pagamentos?", a: "Não. Os pagamentos são feitos diretamente entre você e o fornecedor via PIX, transferência ou outra forma combinada. A Nellor é a plataforma de conexão e negociação." },
      { q: "Como faço para me cadastrar?", a: "Clique em Criar Conta, preencha seus dados e verifique seu email. O cadastro é gratuito para compradores." },
      { q: "Preciso de CNPJ para comprar?", a: "Não necessariamente. Alguns fornecedores vendem apenas para CNPJ, mas a maioria aceita CPF também. Verifique no perfil de cada fornecedor." },
    ],
  },
  {
    name: "Encontrando Produtos",
    items: [
      { q: "Como encontro fornecedores confiáveis?", a: "Procure pelo badge Fornecedor Verificado em verde — esses fornecedores tiveram CNPJ e documentos validados pela Nellor." },
      { q: "O que significa cada tipo de venda?", a: "Unidade: venda peça por peça. Caixa Fechada: quantidade fixa de produtos iguais por caixa. Fardo: pacote com mix de produtos. Kit: conjunto de produtos vendidos juntos." },
      { q: "Como uso os filtros de busca?", a: "Na busca, use os filtros para selecionar categoria, tipo de venda, região do fornecedor e se quer apenas fornecedores verificados." },
      { q: "Como salvo produtos para ver depois?", a: "Clique no ícone de coração em qualquer produto ou loja para salvar nos seus favoritos. Acesse pelo ícone de coração na navegação." },
    ],
  },
  {
    name: "Negociando",
    items: [
      { q: "Como inicio uma negociação?", a: "Abra a página do produto e clique em Negociar com Fornecedor. Isso abre o chat com uma mensagem de interesse já preenchida." },
      { q: "O chat é seguro?", a: "Sim. Todas as conversas são salvas e auditadas pela Nellor. Em caso de disputa, o histórico completo fica disponível para análise." },
      { q: "Como registro um acordo?", a: "Dentro do chat, clique em Registrar Negociação, preencha os detalhes combinados — produto, quantidade, valor, forma de pagamento e prazo — e confirme." },
      { q: "Como gero o PDF do acordo?", a: "Após registrar a negociação, clique em Gerar PDF do Acordo. O documento é gerado automaticamente com todos os detalhes e pode ser salvo ou enviado." },
      { q: "O PDF tem validade legal?", a: "O PDF é um registro da intenção de negociação. Recomendamos guardar como comprovante. Para maior segurança em negociações de alto valor, consulte um advogado." },
    ],
  },
  {
    name: "Após a Compra",
    items: [
      { q: "Como confirmo que recebi meu pedido?", a: "Acesse suas negociações, encontre o pedido e clique em Confirmar Recebimento. Isso libera a avaliação do fornecedor." },
      { q: "Como avalio um fornecedor?", a: "Após confirmar o recebimento, um formulário de avaliação aparece automaticamente. Dê uma nota de 1 a 5 estrelas e deixe um comentário." },
      { q: "O que faço se não recebi o produto?", a: "Na negociação, clique em Reportar Problema. Descreva o ocorrido e a Nellor abrirá uma disputa notificando o fornecedor." },
      { q: "Em quanto tempo o fornecedor precisa responder uma disputa?", a: "O fornecedor tem 5 minutos para responder. Se não responder, a Nellor analisa o caso com base no histórico de chat." },
    ],
  },
  {
    name: "Segurança",
    items: [
      { q: "Como identifico um fornecedor suspeito?", a: "Desconfie de fornecedores sem badge verificado, sem avaliações, com preços muito abaixo do mercado ou que pedem pagamento fora da plataforma antes de qualquer conversa." },
      { q: "Como reporto um golpe?", a: "Acesse o perfil do fornecedor e clique em Denunciar. Descreva o problema com detalhes. Nossa equipe analisa em até 24 horas." },
      { q: "Minhas conversas são privadas?", a: "Suas conversas são privadas entre você e o fornecedor. A Nellor acessa apenas em caso de disputa ou denúncia, conforme nossa política de privacidade." },
    ],
  },
];

const Ajuda = () => {
  const navigate = useNavigate();
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-muted/30 pb-20">
      <header className="sticky top-0 z-40 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-base font-semibold flex-1">Ajuda e FAQ</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-5 space-y-6">
        {/* Section 1 - Tutorial Cards */}
        <div>
          <h2 className="text-lg font-bold mb-3">Como usar a Nellor</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {tutorialCards.map((card, i) => {
              const Icon = card.icon;
              const isExpanded = expandedCard === i;
              return (
                <Card
                  key={i}
                  className={`p-4 cursor-pointer border shadow-sm transition-all hover:shadow-md ${isExpanded ? "ring-2 ring-primary/30" : ""}`}
                  onClick={() => setExpandedCard(isExpanded ? null : i)}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{card.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{card.desc}</p>
                    </div>
                  </div>
                  {isExpanded && (
                    <p className="text-sm text-muted-foreground mt-3 pt-3 border-t leading-relaxed">
                      {card.detail}
                    </p>
                  )}
                </Card>
              );
            })}
          </div>
        </div>

        {/* Section 2 - FAQ */}
        <div>
          <h2 className="text-lg font-bold mb-3">Perguntas Frequentes</h2>
          <div className="space-y-4">
            {faqCategories.map((cat) => (
              <div key={cat.name}>
                <h3 className="text-sm font-semibold text-primary mb-2">{cat.name}</h3>
                <Accordion type="single" collapsible className="space-y-1">
                  {cat.items.map((item, j) => (
                    <AccordionItem key={j} value={`${cat.name}-${j}`} className="border rounded-lg px-3">
                      <AccordionTrigger className="text-sm text-left py-3 hover:no-underline">
                        {item.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground pb-3 leading-relaxed">
                        {item.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3 - Suporte Direto */}
        <Card className="p-6 bg-primary text-primary-foreground rounded-2xl border-0">
          <h3 className="text-lg font-bold mb-2">Ainda com dúvidas?</h3>
          <p className="text-sm opacity-90 mb-4">Nossa equipe está disponível para te ajudar.</p>
          <Button
            variant="secondary"
            className="w-full rounded-full font-medium"
            onClick={() => window.open("https://wa.me/5500000000000", "_blank")}
          >
            <HeadphonesIcon className="h-4 w-4 mr-2" />
            Falar com o Suporte
          </Button>
          <p className="text-xs opacity-70 mt-3 text-center">
            O botão ? disponível em todas as telas também te direciona para cá.
          </p>
        </Card>
      </main>

      <BottomNav />
    </div>
  );
};

export default Ajuda;
