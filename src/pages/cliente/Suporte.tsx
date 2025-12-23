import { ParticlesBackground } from "@/components/cliente/ParticlesBackground";
import { BottomNav } from "@/components/cliente/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";

interface SupportTicket {
  id: string;
  assunto: string;
  mensagem: string;
  resposta_admin: string | null;
  status: "open" | "pending" | "closed" | null;
  created_at: string | null;
  updated_at: string | null;
}

const Suporte = () => {
  const navigate = useNavigate();
  const [assunto, setAssunto] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        setTickets([]);
        return;
      }

      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTickets((data || []) as SupportTicket[]);
    } catch (error) {
      console.error("Error fetching support tickets:", error);
      toast.error("Erro ao carregar suporte");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    
    // Subscribe to real-time updates for responses
    const channel = supabase
      .channel('my-support-tickets')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'support_tickets'
        },
        (payload) => {
          // Update the ticket in state when admin responds
          setTickets(prev => prev.map(t => 
            t.id === payload.new.id 
              ? { ...t, ...payload.new } as SupportTicket
              : t
          ));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [tickets.length]);

  const handleSend = async () => {
    if (!assunto.trim()) {
      toast.error("Informe o assunto");
      return;
    }
    if (!mensagem.trim()) {
      toast.error("Digite sua mensagem");
      return;
    }

    try {
      setSending(true);

      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        toast.error("Você precisa estar logado");
        return;
      }

      const { error } = await supabase.from("support_tickets").insert({
        user_id: authData.user.id,
        assunto: assunto.trim(),
        mensagem: mensagem.trim(),
        status: "open",
      });

      if (error) throw error;

      toast.success("Ticket enviado! Vamos te responder em breve.");
      setMensagem("");
      // mantém assunto para facilitar envio de follow-up
      await fetchTickets();
    } catch (error) {
      console.error("Error creating support ticket:", error);
      toast.error("Erro ao enviar ticket");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 flex flex-col">
      <ParticlesBackground />

      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate("/cliente/perfil")}
            className="hover:bg-accent p-2 rounded-lg transition-colors"
            aria-label="Voltar"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <MessageCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-primary">Suporte Nellor</h1>
              <p className="text-xs text-muted-foreground">Tickets e respostas</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 relative z-10">
        <div className="container mx-auto px-4 py-4 max-w-2xl space-y-4">
          <Card className="bg-white border shadow-sm p-5">
            <div className="grid gap-3">
              <div className="grid gap-2">
                <Label>Assunto</Label>
                <Input
                  placeholder="Ex: Problema no pedido"
                  value={assunto}
                  onChange={(e) => setAssunto(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Mensagem</Label>
                <Input
                  placeholder="Descreva o que aconteceu..."
                  value={mensagem}
                  onChange={(e) => setMensagem(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSend();
                  }}
                />
              </div>
              <Button onClick={handleSend} disabled={sending} className="gap-2">
                <Send className="h-4 w-4" />
                {sending ? "Enviando..." : "Enviar"}
              </Button>
            </div>
          </Card>

          <Card className="bg-white border shadow-sm p-5">
            <h2 className="font-semibold mb-3">Seus tickets</h2>
            {loading ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : tickets.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Você ainda não abriu nenhum ticket.
              </p>
            ) : (
              <ScrollArea className="h-[45vh] pr-3">
                <div className="space-y-3">
                  {tickets.map((t) => (
                    <div key={t.id} className="rounded-xl border p-4">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <p className="font-medium truncate">{t.assunto}</p>
                        <span className="text-xs text-muted-foreground">
                          {t.status === "open"
                            ? "Aberto"
                            : t.status === "pending"
                              ? "Aguardando"
                              : "Fechado"}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {t.mensagem}
                      </p>
                      {t.resposta_admin && (
                        <div className="mt-3 rounded-lg bg-primary/10 p-3">
                          <p className="text-sm font-medium">Resposta do suporte</p>
                          <p className="text-sm whitespace-pre-wrap">{t.resposta_admin}</p>
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            )}
          </Card>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Suporte;
