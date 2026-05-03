import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";

const TermosDeUso = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Termos de Uso | Nellor</title>
        <meta name="description" content="Termos de uso da plataforma Nellor - Marketplace atacadista de negociação direta." />
      </Helmet>

      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Termos de Uso</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl prose prose-sm">
        <h1 className="text-2xl font-bold text-foreground mb-6">Termos de Uso da Plataforma Nellor</h1>
        <p className="text-sm text-muted-foreground mb-6">Última atualização: 08 de abril de 2026</p>

        <section className="space-y-4 mb-8">
          <h2 className="text-lg font-semibold text-foreground">1. Definição da Plataforma</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            A Nellor é uma plataforma digital que atua exclusivamente como <strong>intermediadora e aproximadora</strong> entre compradores e fornecedores no segmento atacadista. A Nellor <strong>não participa</strong> das transações financeiras, entregas, negociações de preço ou qualquer acordo comercial firmado entre as partes.
          </p>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-lg font-semibold text-foreground">2. Responsabilidades da Nellor</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">A Nellor se compromete a:</p>
          <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-2">
            <li>Disponibilizar a plataforma para conexão entre compradores e fornecedores;</li>
            <li>Oferecer ferramentas de comunicação (chat) e registro de negociações;</li>
            <li>Manter registros auditáveis das conversas e acordos realizados na plataforma;</li>
            <li>Mediar disputas entre as partes, quando solicitado, de forma imparcial;</li>
            <li>Verificar a documentação de fornecedores que solicitem o selo de verificação.</li>
          </ul>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-lg font-semibold text-foreground">3. Isenção de Responsabilidade</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">A Nellor <strong>NÃO se responsabiliza</strong> por:</p>
          <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-2">
            <li>Qualidade, estado, autenticidade ou conformidade dos produtos anunciados;</li>
            <li>Atrasos, falhas ou não realização de entregas;</li>
            <li>Inadimplência ou falta de pagamento por qualquer das partes;</li>
            <li>Danos diretos ou indiretos resultantes de negociações realizadas através da plataforma;</li>
            <li>Informações falsas ou imprecisas fornecidas por usuários cadastrados;</li>
            <li>Acordos firmados fora da plataforma entre as partes.</li>
          </ul>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-lg font-semibold text-foreground">4. Obrigações dos Usuários</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">Ao utilizar a Nellor, o usuário se compromete a:</p>
          <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-2">
            <li>Fornecer informações verdadeiras e atualizadas no cadastro;</li>
            <li>Utilizar a plataforma de boa-fé para fins comerciais legítimos;</li>
            <li>Registrar as negociações através das ferramentas disponibilizadas na plataforma;</li>
            <li>Não utilizar a plataforma para atividades ilícitas, fraudulentas ou que violem a legislação vigente;</li>
            <li>Respeitar os demais usuários e manter conduta ética nas interações.</li>
          </ul>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-lg font-semibold text-foreground">5. Sistema de Disputas</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Em caso de descumprimento de acordos registrados na plataforma, qualquer parte pode abrir uma disputa. A Nellor atuará como mediadora, podendo tomar medidas como suspensão ou banimento de usuários que comprovadamente agirem de má-fé. A decisão final sobre ações jurídicas cabe exclusivamente às partes envolvidas.
          </p>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-lg font-semibold text-foreground">6. Pagamentos e Monetização</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            A Nellor pode cobrar valores de fornecedores por serviços como assinaturas, destaque de produtos ou funcionalidades premium. Esses valores são independentes das transações comerciais entre compradores e fornecedores.
          </p>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-lg font-semibold text-foreground">7. Privacidade e Dados</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Os dados pessoais coletados são utilizados exclusivamente para o funcionamento da plataforma. A Nellor não compartilha dados com terceiros sem consentimento, exceto quando exigido por lei. Dados de contato de fornecedores podem ser ocultados até que haja interação formal via chat.
          </p>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-lg font-semibold text-foreground">8. Alterações nos Termos</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            A Nellor reserva-se o direito de alterar estes termos a qualquer momento, notificando os usuários através da plataforma. O uso continuado após alterações implica aceitação dos novos termos.
          </p>
        </section>

        <div className="border-t pt-6 mt-8">
          <p className="text-xs text-muted-foreground text-center">
            Ao criar uma conta na Nellor, você declara ter lido e concordado com estes Termos de Uso.
          </p>
        </div>
      </main>
    </div>
  );
};

export default TermosDeUso;
