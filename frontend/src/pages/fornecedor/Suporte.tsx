import { useEffect, useState } from "react";
import {
  HelpCircle, MessageSquare, Send, Loader2, CheckCircle2, Clock, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

type Ticket = {
  id: string;
  user_id: string;
  assunto: string;
  mensagem: string;
  status: string;
  resposta_admin: string | null;
  created_at: string;
  updated_at: string;
};

const statusInfo = (s: string) => {
  if (s === "open" || s === "aberto") return { label: "Aberto", icon: Clock, cls: "bg-amber-100 text-amber-700" };
  if (s === "pending" || s === "answered" || s === "respondido") return { label: "Respondido", icon: CheckCircle2, cls: "bg-emerald-100 text-emerald-700" };
  if (s === "closed" || s === "fechado") return { label: "Fechado", icon: CheckCircle2, cls: "bg-muted text-muted-foreground" };
  return { label: s, icon: AlertCircle, cls: "bg-blue-100 text-blue-700" };
};

const SuporteFornecedor = () => {
  const { user } = useSupabaseAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ assunto: "", mensagem: "" });

  const load = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setTickets((data || []) as Ticket[]);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleSubmit = async () => {
    if (!user?.id) return toast.error("Faça login primeiro");
    if (!form.assunto.trim() || !form.mensagem.trim()) {
      return toast.error("Preencha assunto e mensagem");
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("support_tickets").insert({
        user_id: user.id,
        assunto: form.assunto.trim(),
        mensagem: form.mensagem.trim(),
        status: "open",
      } as any);
      if (error) throw error;
      toast.success("Chamado enviado! Nosso time responde em até 5 minutos.");
      setForm({ assunto: "", mensagem: "" });
      void load();
    } catch (err: any) {
      toast.error("Erro: " + (err.message || "tente novamente"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <HelpCircle className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Suporte</h1>
          <p className="text-sm text-muted-foreground">
            Fale direto com nosso time. Respondemos rápido — diretamente aqui.
          </p>
        </div>
      </div>

      {/* New ticket */}
      <Card className="rounded-2xl border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Abrir novo chamado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Assunto</Label>
            <Input
              placeholder="Ex: Não consigo finalizar venda"
              value={form.assunto}
              onChange={(e) => setForm({ ...form, assunto: e.target.value })}
              data-testid="ticket-assunto"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Descrição</Label>
            <Textarea
              rows={5}
              placeholder="Descreva o problema com o máximo de detalhes possível..."
              value={form.mensagem}
              onChange={(e) => setForm({ ...form, mensagem: e.target.value })}
              data-testid="ticket-mensagem"
            />
          </div>
          <Button onClick={handleSubmit} disabled={submitting} data-testid="ticket-submit">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
            Enviar chamado
          </Button>
        </CardContent>
      </Card>

      {/* Tickets list */}
      <div>
        <h2 className="text-base font-bold mb-3 flex items-center gap-2">
          <MessageSquare className="h-4 w-4" /> Meus chamados
        </h2>
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : tickets.length === 0 ? (
          <Card className="rounded-2xl border-dashed py-10 text-center">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                Você ainda não abriu nenhum chamado.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {tickets.map((t) => {
              const info = statusInfo(t.status);
              const Icon = info.icon;
              return (
                <Card key={t.id} className="rounded-2xl" data-testid={`ticket-${t.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="font-semibold text-sm">{t.assunto}</h3>
                      <Badge variant="secondary" className={`rounded-full ${info.cls} flex items-center gap-1`}>
                        <Icon className="h-3 w-3" /> {info.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-3">
                      {t.mensagem}
                    </p>
                    {t.resposta_admin && (
                      <div className="mt-3 pt-3 border-t border-border/60">
                        <p className="text-[10px] font-bold text-primary tracking-wider mb-1">RESPOSTA DO SUPORTE</p>
                        <p className="text-xs whitespace-pre-wrap">{t.resposta_admin}</p>
                      </div>
                    )}
                    <p className="text-[10px] text-muted-foreground/70 mt-2">
                      Aberto em {new Date(t.created_at).toLocaleDateString("pt-BR")} às{" "}
                      {new Date(t.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SuporteFornecedor;
