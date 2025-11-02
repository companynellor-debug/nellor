import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Sobre = () => {
  return (
    <div className="min-h-screen">
      <Header />
      
      <section className="pt-32 pb-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl font-heading font-bold mb-6 text-center">
              Quem Somos
            </h1>
            
            <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
              <p>
                O <span className="font-semibold text-primary">nellor</span> nasceu com o propósito de conectar lojistas e fornecedores em um só lugar. 
                Nosso objetivo é simplificar o comércio e impulsionar pequenas e grandes empresas em todo o país.
              </p>
              
              <p>
                Acreditamos que a tecnologia pode transformar a forma como compradores e vendedores se relacionam, 
                tornando o processo mais eficiente, transparente e lucrativo para todos os envolvidos.
              </p>
              
              <div className="my-12">
                <img 
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=400&fit=crop" 
                  alt="Equipe nellor"
                  className="rounded-2xl shadow-xl w-full"
                />
              </div>
              
              <h2 className="text-3xl font-heading font-bold text-foreground mt-12 mb-4">
                Nossa Missão
              </h2>
              <p>
                Democratizar o acesso a produtos de qualidade, conectando fornecedores confiáveis com lojistas 
                de todo o Brasil através de uma plataforma moderna, segura e fácil de usar.
              </p>
              
              <h2 className="text-3xl font-heading font-bold text-foreground mt-12 mb-4">
                Nossos Valores
              </h2>
              <ul className="list-disc list-inside space-y-2">
                <li>Transparência em todas as transações</li>
                <li>Comprometimento com a qualidade</li>
                <li>Inovação constante</li>
                <li>Suporte excepcional ao cliente</li>
                <li>Crescimento sustentável</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Sobre;
