import { useState } from "react";
import { HelpCircle, Mail, MessageCircle, Send, Loader2, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

const TOPICOS = [
  { value: "pedido", label: "Problema com pedido" },
  { value: "pagamento", label: "Pagamento / Financeiro" },
  { value: "produto", label: "Cadastro de produto" },
  { value: "loja", label: "Configuração da loja" },
  { value: "conta", label: "Minha conta" },
  { value: "tecnico", label: "Problema técnico" },
  { value: "outro", label: "Outro assunto" },
];

const FAQ = [
  { q: "Como aumento minhas vendas?", a: "Mantenha estoque atualizado, responda mensagens em até 5 minutos, capriche nas fotos dos produtos e descreva detalhadamente." },
  { q: "Quando recebo o pagamento?", a: "Após a confirmação de entrega pelo cliente, o valor entra na sua carteira em 2 dias úteis." },
  { q: "Como funciona o frete?", a: "Você configura suas opções de frete em Configurações → Frete. Pode usar Correios, transportadora ou retirada no local." },
  { q: "Posso pausar produtos?", a: "Sim, na aba Produtos você pode pausar/ativar qualquer item a qualquer momento." },
];

const SuporteFornecedor = () => {
  const { user, profile } = useSupabaseAuth();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ topic: "", subject: "", message: "" });

  const handleSubmit = async () => {
    if (!user?.id) return toast.error("Faça login primeiro");
    if (!form.topic || !form.subject.trim() || !form.message.trim()) {
      return toast.error("Preencha todos os campos");
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("support_tickets").insert({
        user_id: user.id,
        topic: form.topic,
        subject: form.subject.trim(),
        message: form.message.trim(),
        status: "open",
      } as any);
      if (error) throw error;
      toast.success("Ticket enviado! Nosso time responde em até 5 minutos.");
      setForm({ topic: "", subject: "", message: "" });
    } catch (err: any) {
      toast.error("Erro: " + err.message);
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
          <h1 className="text-2xl font-bold">Suporte</h1>
          <p className="text-sm text-muted-foreground">Estamos aqui pra ajudar você a vender mais.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <a href="mailto:suporte@nellor.app" className="block">
          <Card className="rounded-2xl hover:border-primary/40 hover:shadow-md transition-all">
            <CardContent className="p-5 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center"><Mail className="h-5 w-5 text-primary" /></div>
              <div>
                <p className="text-sm font-semibold">E-mail</p>
                <p className="text-xs text-muted-foreground">suporte@nellor.app</p>
              </div>
            </CardContent>
          </Card>
        </a>
        <a href="https://wa.me/5500000000000" target="_blank" rel="noreferrer" className="block">
          <Card className="rounded-2xl hover:border-primary/40 hover:shadow-md transition-all">
            <CardContent className="p-5 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center"><MessageCircle className="h-5 w-5" /></div>
              <div>
                <p className="text-sm font-semibold">WhatsApp</p>
                <p className="text-xs text-muted-foreground">Resposta em até 5min</p>
              </div>
            </CardContent>
          </Card>
        </a>
        <Card className="rounded-2xl">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center"><Phone className="h-5 w-5" /></div>
            <div>
              <p className="text-sm font-semibold">Telefone</p>
              <p className="text-xs text-muted-foreground">Seg-Sex 9h-18h</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Abrir um chamado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Tópico</Label>
            <Select value={form.topic} onValueChange={(v) => setForm({ ...form, topic: v })}>
              <SelectTrigger data-testid="support-topic"><SelectValue placeholder="Escolha um tópico" /></SelectTrigger>
              <SelectContent>
                {TOPICOS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Assunto</Label>
            <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} data-testid="support-subject" />
          </div>
          <div className="space-y-1.5">
            <Label>Descrição detalhada</Label>
            <Textarea rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} data-testid="support-message" />
          </div>
          <Button onClick={handleSubmit} disabled={submitting} className="w-full sm:w-auto" data-testid="support-submit">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
            Enviar chamado
          </Button>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-base font-bold mb-3">Perguntas frequentes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {FAQ.map((f) => (
            <Card key={f.q} className="rounded-2xl">
              <CardContent className="p-4">
                <p className="text-sm font-semibold mb-1">{f.q}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.a}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SuporteFornecedor;
