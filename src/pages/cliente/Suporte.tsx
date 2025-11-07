import { ParticlesBackground } from "@/components/cliente/ParticlesBackground";
import { BottomNav } from "@/components/cliente/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send, MessageCircle, Phone, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";

const Suporte = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [subject, setSubject] = useState("");

  const handleSendMessage = () => {
    if (!subject || !message) {
      toast.error("Preencha o assunto e a mensagem");
      return;
    }
    
    toast.success("Mensagem enviada! Responderemos em breve.");
    setSubject("");
    setMessage("");
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <ParticlesBackground />

      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate("/cliente/perfil")} className="hover:bg-accent p-2 rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-primary">Suporte</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 relative z-10 max-w-2xl space-y-6">
        <Card className="bg-white border shadow-sm p-6 text-center">
          <MessageCircle className="h-16 w-16 mx-auto text-primary mb-4" />
          <h2 className="text-xl font-bold mb-2">Como podemos ajudar?</h2>
          <p className="text-sm text-muted-foreground">
            Nossa equipe está pronta para resolver suas dúvidas
          </p>
        </Card>

        <Card className="bg-white border shadow-sm p-6">
          <h3 className="font-bold text-lg mb-4">Envie uma mensagem</h3>
          <div className="space-y-4">
            <div>
              <Input
                placeholder="Assunto"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <div>
              <Textarea
                placeholder="Descreva seu problema ou dúvida..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
              />
            </div>
            <Button className="w-full gap-2" onClick={handleSendMessage}>
              <Send className="h-4 w-4" />
              Enviar Mensagem
            </Button>
          </div>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="bg-white border shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Phone className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-medium">Telefone</p>
                <p className="text-sm text-muted-foreground">(11) 9 9999-9999</p>
              </div>
            </div>
          </Card>
          <Card className="bg-white border shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-medium">Email</p>
                <p className="text-sm text-muted-foreground">suporte@nellor.com</p>
              </div>
            </div>
          </Card>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Suporte;
