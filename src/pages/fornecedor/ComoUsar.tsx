import { Package, MessageSquare, Users, Star, Truck, BookOpen, Lightbulb, Camera, FileText, Clock, ThumbsUp } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";

const DarkGlassIcon = ({ icon: Icon, size = "lg" }: { icon: React.ElementType; size?: "lg" | "sm" }) => {
  const dims = size === "lg" ? "w-12 h-12" : "w-9 h-9";
  const iconSize = size === "lg" ? "h-5 w-5" : "h-4 w-4";
  return (
    <div className={`relative ${dims} flex-shrink-0 ${size === "sm" ? "mt-0.5" : ""}`}>
      <div className="absolute inset-0 rounded-full bg-slate-900/90 border border-purple-500/30 shadow-[inset_0_1px_2px_rgba(255,255,255,0.1),0_4px_12px_rgba(0,0,0,0.4)]" />
      <div className="absolute top-0 left-[10%] right-[10%] h-[45%] rounded-t-full bg-gradient-to-b from-white/15 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-1/2 rounded-b-full bg-gradient-to-tr from-purple-600/20 to-transparent" />
      <div className="relative z-10 w-full h-full flex items-center justify-center">
        <Icon className={`${iconSize} text-purple-400 drop-shadow-[0_0_6px_rgba(168,85,247,0.5)]`} strokeWidth={1.8} />
      </div>
    </div>
  );
};

const guides = [
  {
    id: "produtos",
    icon: Package,
    
    title: "Como cadastrar produtos corretamente",
    steps: [
      { icon: Camera, text: "Use fotos de alta qualidade com fundo limpo. Adicione pelo menos 3 fotos mostrando diferentes ângulos." },
      { icon: FileText, text: "Escreva descrições detalhadas: material, dimensões, peso e composição. Quanto mais informação, mais confiança o cliente tem." },
      { icon: Package, text: "Adicione variações de cor e tamanho. Produtos com variações aparecem mais nas buscas e atraem mais clientes." },
      { icon: Lightbulb, text: "Defina um preço competitivo e informe a quantidade mínima. Pesquise a concorrência para se posicionar bem." },
    ],
  },
  {
    id: "negociacao",
    icon: MessageSquare,
    
    title: "Como negociar pelo chat",
    steps: [
      { icon: Clock, text: "Responda rápido! Fornecedores que respondem em até 1 hora têm 3x mais chances de fechar negócio." },
      { icon: MessageSquare, text: "Seja claro sobre prazos de entrega, formas de pagamento aceitas e condições de frete." },
      { icon: ThumbsUp, text: "Faça contra-propostas quando necessário. Negocie quantidade x preço para incentivar pedidos maiores." },
      { icon: Lightbulb, text: "Envie fotos adicionais e vídeos dos produtos quando o cliente pedir. Isso gera confiança." },
    ],
  },
  {
    id: "clientes",
    icon: Users,
    
    title: "Técnicas para conseguir mais clientes",
    steps: [
      { icon: Camera, text: "Complete 100% do seu perfil: foto, banner, bio, cidade e estado. Perfis completos aparecem primeiro nas buscas." },
      { icon: Package, text: "Cadastre pelo menos 10 produtos com fotos de qualidade. Lojas com mais produtos recebem mais visitas." },
      { icon: Star, text: "Peça avaliações aos clientes após cada negociação. Avaliações positivas aumentam sua visibilidade." },
      { icon: Lightbulb, text: "Mantenha preços competitivos e atualizados. Compare com outros fornecedores do seu segmento." },
    ],
  },
  {
    id: "avaliacoes",
    icon: Star,
    
    title: "Como funciona o sistema de avaliação",
    steps: [
      { icon: Star, text: "Clientes avaliam de 1 a 5 estrelas após a entrega. Sua nota média aparece no perfil da loja." },
      { icon: ThumbsUp, text: "Para receber boas avaliações: entregue no prazo, embale bem e mantenha comunicação clara." },
      { icon: Lightbulb, text: "Responda avaliações negativas com educação. Mostre que você se importa com a experiência do cliente." },
      { icon: Users, text: "Fornecedores com nota acima de 4.5 ganham destaque no marketplace e selo de qualidade." },
    ],
  },
  {
    id: "frete",
    icon: Truck,
    
    title: "Como configurar frete",
    steps: [
      { icon: Truck, text: "Acesse 'Editar Loja' e configure suas regiões de entrega e valores de frete por região." },
      { icon: FileText, text: "Informe prazos realistas de entrega. Atrasos geram avaliações negativas e disputas." },
      { icon: Lightbulb, text: "Ofereça frete grátis para pedidos acima de um valor mínimo. Isso incentiva compras maiores." },
      { icon: Package, text: "Combine os detalhes de envio diretamente com o cliente no chat durante a negociação." },
    ],
  },
];

const ComoUsar = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          Como Usar a Nellor
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Guia completo para aproveitar ao máximo a plataforma
        </p>
      </div>

      {/* Quick tips banner */}
      <Card className="p-4 bg-primary/5 border-primary/20">
        <div className="flex items-start gap-3">
          <Lightbulb className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground">Dica rápida</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Fornecedores com perfil completo, fotos de qualidade e respostas rápidas recebem até 5x mais contatos de clientes.
            </p>
          </div>
        </div>
      </Card>

      <Accordion type="multiple" className="space-y-3">
        {guides.map((guide) => (
          <AccordionItem key={guide.id} value={guide.id} className="border rounded-xl overflow-hidden">
            <AccordionTrigger className="px-4 py-4 hover:no-underline hover:bg-muted/30 [&[data-state=open]]:bg-muted/30">
              <div className="flex items-center gap-3">
                <DarkGlassIcon icon={guide.icon} size="lg" />
                <span className="text-sm font-semibold text-left">{guide.title}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-3 pt-2">
                {guide.steps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <DarkGlassIcon icon={step.icon} size="sm" />
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.text}</p>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default ComoUsar;
