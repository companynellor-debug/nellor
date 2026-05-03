import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus, Send, Loader2, MessageSquare, Clock, CheckCircle2,
  XCircle, Package, MapPin, Calendar, ArrowLeft, FileText, Tag, Banknote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { formatCurrency } from "@/utils/formatCurrency";

type QuotationStatus = "open" | "closed" | "cancelled";

type QuotationRequest = {
  id: string;
  buyer_id: string;
  title: string;
  description: string | null;
  category: string | null;
  quantity: number;
  budget_max: number | null;
  deadline: string | null;
  city: string | null;
  state: string | null;
  status: QuotationStatus;
  proposals_count: number;
  created_at: string;
  closed_at: string | null;
};

type Proposal = {
  id: string;
  request_id: string;
  supplier_id: string;
  unit_price: number;
  total_price: number | null;
  delivery_days: number | null;
  message: string | null;
  status: string;
  created_at: string;
  supplier?: {
    nome: string | null;
    foto_perfil_url: string | null;
  };
};

const CATEGORIES = [
  "Eletrônicos",
  "Moda e Acessórios",
  "Casa e Decoração",
  "Beleza e Saúde",
  "Esportes e Lazer",
  "Automotivo",
  "Pet Shop",
  "Infantil",
  "Alimentos e Bebidas",
  "Papelaria",
  "Outros",
];

const statusInfo = (s: QuotationStatus) => {
  if (s === "open") return { label: "Aberta", className: "bg-emerald-100 text-emerald-700" };
  if (s === "closed") return { label: "Fechada", className: "bg-blue-100 text-blue-700" };
  return { label: "Cancelada", className: "bg-rose-100 text-rose-700" };
};

const MinhasSolicitacoes = () => {
  const navigate = useNavigate();
  const { user, profile } = useSupabaseAuth();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<QuotationRequest[]>([]);
  const [openCreate, setOpenCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<QuotationRequest | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [proposalsLoading, setProposalsLoading] = useState(false);

  // Form state
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    quantity: 1,
    budget_max: "",
    deadline: "",
    city: "",
    state: "",
  });

  const loadRequests = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("quotation_requests")
        .select("*")
        .eq("buyer_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setRequests((data || []) as QuotationRequest[]);
    } catch (err: any) {
      console.error("loadRequests error", err);
      toast.error("Erro ao carregar solicitações: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const loadProposals = async (requestId: string) => {
    setProposalsLoading(true);
    try {
      const { data, error } = await supabase
        .from("quotation_proposals")
        .select("*")
        .eq("request_id", requestId)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const props = (data || []) as Proposal[];
      const supplierIds = Array.from(new Set(props.map((p) => p.supplier_id))).filter(Boolean);
      let map: Record<string, { nome: string | null; foto_perfil_url: string | null }> = {};
      if (supplierIds.length) {
        const { data: profs } = await supabase
          .from("public_supplier_profiles")
          .select("id, nome, foto_perfil_url")
          .in("id", supplierIds);
        (profs || []).forEach((p: any) => {
          map[p.id] = { nome: p.nome, foto_perfil_url: p.foto_perfil_url };
        });
      }
      setProposals(props.map((p) => ({ ...p, supplier: map[p.supplier_id] })));
    } catch (err: any) {
      console.error("loadProposals error", err);
      toast.error("Erro ao carregar propostas");
    } finally {
      setProposalsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!user?.id) return toast.error("Você precisa estar logado");
    if (!form.title.trim()) return toast.error("Informe o que você está procurando");
    if (form.quantity < 1) return toast.error("Quantidade deve ser ao menos 1");

    setSubmitting(true);
    try {
      const payload = {
        buyer_id: user.id,
        title: form.title.trim(),
        description: form.description.trim() || null,
        category: form.category || null,
        quantity: form.quantity,
        budget_max: form.budget_max ? Number(form.budget_max) : null,
        deadline: form.deadline || null,
        city: form.city.trim() || null,
        state: form.state.trim() || null,
        status: "open" as const,
      };
      const { error } = await supabase.from("quotation_requests").insert(payload as any);
      if (error) throw error;
      toast.success("Solicitação publicada! Fornecedores receberão e enviarão propostas.");
      setOpenCreate(false);
      setForm({
        title: "",
        description: "",
        category: "",
        quantity: 1,
        budget_max: "",
        deadline: "",
        city: "",
        state: "",
      });
      void loadRequests();
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao publicar: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseRequest = async (id: string) => {
    try {
      const { error } = await supabase
        .from("quotation_requests")
        .update({ status: "closed", closed_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      toast.success("Solicitação encerrada");
      void loadRequests();
      setSelectedRequest(null);
    } catch (err: any) {
      toast.error("Erro: " + err.message);
    }
  };

  const handleAcceptProposal = async (proposal: Proposal) => {
    try {
      const { error: pErr } = await supabase
        .from("quotation_proposals")
        .update({ status: "accepted" })
        .eq("id", proposal.id);
      if (pErr) throw pErr;

      const { error: rErr } = await supabase
        .from("quotation_requests")
        .update({ status: "closed", closed_at: new Date().toISOString() })
        .eq("id", proposal.request_id);
      if (rErr) throw rErr;

      toast.success("Proposta aceita! Inicie a conversa com o fornecedor.");
      // Open chat with the supplier
      navigate(`/cliente/chat?fornecedor=${proposal.supplier_id}`);
    } catch (err: any) {
      toast.error("Erro: " + err.message);
    }
  };

  const openCount = useMemo(() => requests.filter((r) => r.status === "open").length, [requests]);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-muted rounded-full transition-colors"
            data-testid="back-btn"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold truncate">Minhas solicitações</h1>
            <p className="text-xs text-muted-foreground">
              {openCount} aberta(s) · {requests.length} no total
            </p>
          </div>
          <Dialog open={openCreate} onOpenChange={setOpenCreate}>
            <DialogTrigger asChild>
              <Button className="rounded-full gap-2" data-testid="new-request-btn">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Nova solicitação</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Publicar solicitação</DialogTitle>
                <DialogDescription>
                  Descreva o que você precisa. Fornecedores enviarão propostas direto pra você.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>O que você está procurando? *</Label>
                  <Input
                    placeholder="Ex: 200 camisetas básicas pretas tamanho M"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    data-testid="req-title-input"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Quantidade *</Label>
                    <Input
                      type="number"
                      min={1}
                      value={form.quantity}
                      onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })}
                      data-testid="req-quantity-input"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Categoria</Label>
                    <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                      <SelectTrigger data-testid="req-category-select"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Detalhes</Label>
                  <Textarea
                    rows={3}
                    placeholder="Materiais, prazo de entrega ideal, especificações, etc."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    data-testid="req-description-input"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Orçamento máx. (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Opcional"
                      value={form.budget_max}
                      onChange={(e) => setForm({ ...form, budget_max: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Prazo</Label>
                    <Input
                      type="date"
                      value={form.deadline}
                      onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 space-y-1.5">
                    <Label>Cidade</Label>
                    <Input
                      placeholder="São Paulo"
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>UF</Label>
                    <Input
                      placeholder="SP"
                      maxLength={2}
                      value={form.state}
                      onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase() })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpenCreate(false)} disabled={submitting}>
                  Cancelar
                </Button>
                <Button onClick={handleCreate} disabled={submitting} data-testid="req-submit-btn">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                  Publicar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : requests.length === 0 ? (
          <Card className="rounded-2xl border-dashed py-12 text-center">
            <CardContent className="pt-6">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-lg font-semibold">Você ainda não publicou nada</h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                Publique uma solicitação e receba propostas dos fornecedores em segundos.
              </p>
              <Button onClick={() => setOpenCreate(true)} className="mt-5 rounded-full">
                <Plus className="h-4 w-4 mr-2" /> Criar primeira solicitação
              </Button>
            </CardContent>
          </Card>
        ) : (
          requests.map((r) => {
            const info = statusInfo(r.status);
            return (
              <button
                key={r.id}
                onClick={() => {
                  setSelectedRequest(r);
                  void loadProposals(r.id);
                }}
                className="w-full text-left"
                data-testid={`request-card-${r.id}`}
              >
                <Card className="rounded-2xl hover:shadow-md hover:border-primary/40 transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold truncate">{r.title}</h3>
                        {r.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {r.description}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Package className="h-3 w-3" /> {r.quantity} un.
                          </span>
                          {r.category && (
                            <span className="flex items-center gap-1">
                              <Tag className="h-3 w-3" /> {r.category}
                            </span>
                          )}
                          {r.budget_max && (
                            <span className="flex items-center gap-1">
                              <Banknote className="h-3 w-3" /> até {formatCurrency(r.budget_max)}
                            </span>
                          )}
                          {(r.city || r.state) && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {[r.city, r.state].filter(Boolean).join("/")}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <Badge variant="secondary" className={`rounded-full ${info.className}`}>
                          {info.label}
                        </Badge>
                        <span className="flex items-center gap-1 text-xs font-semibold text-primary">
                          <MessageSquare className="h-3 w-3" /> {r.proposals_count}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </button>
            );
          })
        )}
      </main>

      {/* Proposals dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={(o) => !o && setSelectedRequest(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">
              {selectedRequest?.title}
            </DialogTitle>
            <DialogDescription>
              {selectedRequest?.proposals_count || 0} proposta(s) recebida(s)
            </DialogDescription>
          </DialogHeader>

          {proposalsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : proposals.length === 0 ? (
            <div className="py-10 text-center">
              <Clock className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Aguardando propostas dos fornecedores...
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {proposals.map((p) => (
                <Card key={p.id} className="rounded-xl" data-testid={`proposal-${p.id}`}>
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-muted overflow-hidden flex items-center justify-center text-sm font-semibold text-muted-foreground shrink-0">
                        {p.supplier?.foto_perfil_url ? (
                          <img src={p.supplier.foto_perfil_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          (p.supplier?.nome?.[0] || "F").toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{p.supplier?.nome || "Fornecedor"}</p>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-1">
                          <span>Unitário: <strong className="text-foreground">{formatCurrency(p.unit_price)}</strong></span>
                          {p.total_price && <span>Total: <strong className="text-foreground">{formatCurrency(p.total_price)}</strong></span>}
                          {p.delivery_days && <span>Entrega: {p.delivery_days}d</span>}
                        </div>
                        {p.message && <p className="text-xs mt-1.5 text-muted-foreground line-clamp-3">{p.message}</p>}
                        {selectedRequest?.status === "open" && p.status === "pending" && (
                          <div className="flex gap-2 mt-2">
                            <Button
                              size="sm"
                              className="rounded-full h-8 text-xs"
                              onClick={() => handleAcceptProposal(p)}
                              data-testid={`accept-proposal-${p.id}`}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Aceitar e abrir chat
                            </Button>
                          </div>
                        )}
                        {p.status === "accepted" && (
                          <Badge variant="secondary" className="mt-2 bg-emerald-100 text-emerald-700">Aceita</Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {selectedRequest?.status === "open" && (
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => handleCloseRequest(selectedRequest.id)}
                className="rounded-full"
                data-testid="close-request-btn"
              >
                <XCircle className="h-4 w-4 mr-2" /> Encerrar solicitação
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MinhasSolicitacoes;
