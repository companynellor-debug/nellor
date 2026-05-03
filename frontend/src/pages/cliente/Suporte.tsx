import { ParticlesBackground } from "@/components/cliente/ParticlesBackground";
import { BottomNav } from "@/components/cliente/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send, MessageCircle, ChevronRight, Clock, CheckCircle2, AlertCircle, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { DarkGlassIcon } from "@/components/ui/dark-glass-icon";
import { Badge } from "@/components/ui/badge";

interface SupportTicket {
  id: string;
  assunto: string;
  mensagem: string;
  resposta_admin: string | null;
  status: "open" | "pending" | "closed" | null;
  created_at: string | null;
  updated_at: string | null;
}

const statusConfig = {
  open: { label: "Aberto", icon: AlertCircle, className: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  pending: { label: "Aguardando", icon: Clock, className: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  closed: { label: "Fechado", icon: CheckCircle2, className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
};

const Suporte = () => {
  const navigate = useNavigate();
  const [assunto, setAssunto] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

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

    const channel = supabase
      .channel('my-support-tickets')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'support_tickets' },
        (payload) => {
          const updated = payload.new as SupportTicket;
          setTickets(prev => prev.map(t => t.id === updated.id ? { ...t, ...updated } : t));
          setSelectedTicket(prev => prev?.id === updated.id ? { ...prev, ...updated } : prev);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleSend = async () => {
    if (!assunto.trim()) { toast.error("Informe o assunto"); return; }
    if (!mensagem.trim()) { toast.error("Digite sua mensagem"); return; }

    try {
      setSending(true);
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) { toast.error("Você precisa estar logado"); return; }

      const { error } = await supabase.from("support_tickets").insert({
        user_id: authData.user.id,
        assunto: assunto.trim(),
        mensagem: mensagem.trim(),
        status: "open",
      });

      if (error) throw error;
      toast.success("Ticket enviado! Vamos te responder em breve.");
      setAssunto("");
      setMensagem("");
      await fetchTickets();
    } catch (error) {
      console.error("Error creating support ticket:", error);
      toast.error("Erro ao enviar ticket");
    } finally {
      setSending(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  // ---- Ticket detail view ----
  if (selectedTicket) {
    const cfg = statusConfig[selectedTicket.status || "open"];
    const StatusIcon = cfg.icon;
    return (
      <div className="min-h-screen bg-background pb-20 flex flex-col">
        <ParticlesBackground />
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b shadow-sm">
          <div className="container mx-auto px-4 py-4 flex items-center gap-3">
            <button onClick={() => setSelectedTicket(null)} className="hover:bg-accent p-2 rounded-xl transition-colors" aria-label="Voltar">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-bold truncate">{selectedTicket.assunto}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="outline" className={`text-[10px] px-2 py-0 ${cfg.className}`}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {cfg.label}
                </Badge>
                <span className="text-[10px] text-muted-foreground">{formatDate(selectedTicket.created_at)}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 relative z-10">
          <div className="container mx-auto px-4 py-4 max-w-2xl space-y-3">
            {/* User message */}
            <div className="flex justify-end">
              <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-md px-4 py-3 max-w-[85%] shadow-sm">
                <p className="text-sm whitespace-pre-wrap">{selectedTicket.mensagem}</p>
                <p className="text-[10px] opacity-70 text-right mt-1">{formatDate(selectedTicket.created_at)}</p>
              </div>
            </div>

            {/* Admin response */}
            {selectedTicket.resposta_admin ? (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl rounded-tl-md px-4 py-3 max-w-[85%] shadow-sm">
                  <p className="text-xs font-semibold text-primary mb-1">Suporte Nellor</p>
                  <p className="text-sm whitespace-pre-wrap">{selectedTicket.resposta_admin}</p>
                  <p className="text-[10px] text-muted-foreground text-right mt-1">{formatDate(selectedTicket.updated_at)}</p>
                </div>
              </div>
            ) : (
              <div className="flex justify-center py-6">
                <p className="text-xs text-muted-foreground bg-muted/50 px-4 py-2 rounded-full">Aguardando resposta do suporte...</p>
              </div>
            )}
          </div>
        </main>

        <BottomNav />
      </div>
    );
  }

  // ---- Main view ----
  return (
    <div className="min-h-screen bg-background pb-20 flex flex-col">
      <ParticlesBackground />

      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate("/cliente/perfil")} className="hover:bg-accent p-2 rounded-xl transition-colors" aria-label="Voltar">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <DarkGlassIcon icon={MessageCircle} size="md" />
          <div>
            <h1 className="text-lg font-bold">Suporte Nellor</h1>
            <p className="text-xs text-muted-foreground">Como podemos ajudar?</p>
          </div>
        </div>
      </header>

      <main className="flex-1 relative z-10">
        <div className="container mx-auto px-4 py-4 max-w-2xl space-y-4">
          {/* New ticket form - highlighted */}
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background shadow-lg p-5 rounded-2xl">
            <h2 className="font-semibold text-base mb-3 flex items-center gap-2">
              <Send className="h-4 w-4 text-primary" />
              Novo ticket
            </h2>
            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label className="text-xs font-medium">Assunto</Label>
                <Input
                  placeholder="Ex: Problema no pedido"
                  value={assunto}
                  onChange={(e) => setAssunto(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs font-medium">Mensagem</Label>
                <Textarea
                  placeholder="Descreva o que aconteceu..."
                  value={mensagem}
                  onChange={(e) => setMensagem(e.target.value)}
                  rows={3}
                  className="rounded-xl resize-none"
                />
              </div>
              <Button onClick={handleSend} disabled={sending} className="gap-2 rounded-xl h-11">
                <Send className="h-4 w-4" />
                {sending ? "Enviando..." : "Enviar ticket"}
              </Button>
            </div>
          </Card>

          {/* Tickets list - compact */}
          <div>
            <h2 className="font-semibold text-sm text-muted-foreground mb-2 px-1">Seus tickets</h2>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 rounded-xl bg-muted/40 animate-pulse" />
                ))}
              </div>
            ) : tickets.length === 0 ? (
              <Card className="p-8 rounded-2xl text-center">
                <MessageCircle className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">Nenhum ticket aberto ainda.</p>
              </Card>
            ) : (
              <div className="space-y-2">
                {tickets.map((t) => {
                  const cfg = statusConfig[t.status || "open"];
                  const StatusIcon = cfg.icon;
                  const hasResponse = !!t.resposta_admin;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTicket(t)}
                      className="w-full text-left bg-card border rounded-2xl p-4 flex items-center gap-3 hover:shadow-md hover:border-primary/20 transition-all active:scale-[0.98]"
                    >
                      <DarkGlassIcon icon={cfg.icon} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{t.assunto}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 border ${cfg.className}`}>
                            {cfg.label}
                          </Badge>
                          {hasResponse && (
                            <span className="text-[10px] text-primary font-medium">• Respondido</span>
                          )}
                          <span className="text-[10px] text-muted-foreground ml-auto">{formatDate(t.created_at)}</span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Suporte;
