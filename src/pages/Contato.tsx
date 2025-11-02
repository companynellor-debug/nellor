import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Mail, MapPin, MessageSquare } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { toast } from "sonner";

const Contato = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Mensagem enviada com sucesso! Entraremos em contato em breve.");
    setFormData({ name: "", email: "", message: "" });
  };

  return (
    <div className="min-h-screen">
      <Header />
      
      <section className="pt-32 pb-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-4xl sm:text-5xl font-heading font-bold mb-4 text-center">
              Entre em Contato
            </h1>
            <p className="text-center text-muted-foreground mb-12">
              Estamos aqui para ajudar. Envie sua mensagem e responderemos em breve.
            </p>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* Formulário */}
              <Card className="p-8 shadow-card">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Nome</label>
                    <Input 
                      type="text"
                      placeholder="Seu nome completo"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">E-mail</label>
                    <Input 
                      type="email"
                      placeholder="seu@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Mensagem</label>
                    <Textarea 
                      placeholder="Como podemos ajudar?"
                      rows={6}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      required
                    />
                  </div>
                  
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                    Enviar Mensagem
                  </Button>
                </form>
              </Card>
              
              {/* Informações de Contato */}
              <div className="space-y-6">
                <Card className="p-6 shadow-card">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Mail className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-heading font-semibold mb-1">E-mail</h3>
                      <p className="text-sm text-muted-foreground">contato@nellor.com.br</p>
                      <p className="text-sm text-muted-foreground">suporte@nellor.com.br</p>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-6 shadow-card">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-heading font-semibold mb-1">Endereço</h3>
                      <p className="text-sm text-muted-foreground">
                        Av. Paulista, 1000<br />
                        São Paulo - SP, 01310-100<br />
                        Brasil
                      </p>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-6 shadow-card bg-primary text-white">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-heading font-semibold mb-2">WhatsApp</h3>
                      <p className="text-sm text-white/90 mb-4">
                        Precisa de ajuda rápida? Fale conosco pelo WhatsApp!
                      </p>
                      <Button 
                        variant="secondary"
                        className="bg-white text-primary hover:bg-white/90"
                        onClick={() => window.open('https://wa.me/5511999999999', '_blank')}
                      >
                        Abrir WhatsApp
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contato;
