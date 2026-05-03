import { useEffect, useMemo, useState } from "react";
import {
  FileText, Send, Loader2, Filter, Package, MapPin, Calendar, Tag, Banknote,
  CheckCircle2, MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
};

const CATEGORIES = [
  "Eletrônicos", "Moda e Acessórios", "Casa e Decoração", "Beleza e Saúde",
  "Esportes e Lazer", "Automotivo", "Pet Shop", "Infantil",
  "Alimentos e Bebidas", "Papelaria", "Outros",
];

const SolicitacoesFornecedor = () => {
  const { user, profile } = useSupabaseAuth();
  const [requests, setRequests] = useState<QuotationRequest[]>([]);
  const [myProposals, setMyProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [selected, setSelected] = useState<QuotationRequest | null>(null);
  const [proposalForm, setProposalForm] = useState({
    unit_price: "",
    delivery_days: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const loadAll = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [{ data: reqs }, { data: props }] = await Promise.all([
        supabase
          .from("quotation_requests")
          .select("*")
          .eq("status", "open")
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("quotation_proposals")
          .select("*")
          .eq("supplier_id", user.id)
          .order("created_at", { ascending: false }),
      ]);
      setRequests((reqs || []) as QuotationRequest[]);
      setMyProposals((props || []) as Proposal[]);
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao carregar: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const proposedSet = useMemo(() => new Set(myProposals.map((p) => p.request_id)), [myProposals]);

  const filtered = useMemo(() => {
    if (filterCategory === "all") return requests;
    return requests.filter((r) => r.category === filterCategory);
  }, [requests, filterCategory]);

  const handleSubmitProposal = async () => {
    if (!selected || !user?.id) return;
    const unitPrice = Number(proposalForm.unit_price);
    if (!unitPrice || unitPrice <= 0) return toast.error("Informe o preço unitário");

    setSubmitting(true);
    try {
      const total = unitPrice * selected.quantity;
      const payload = {
        request_id: selected.id,
        supplier_id: user.id,
        unit_price: unitPrice,
        total_price: total,
        delivery_days: proposalForm.delivery_days ? Number(proposalForm.delivery_days) : null,
        message: proposalForm.message.trim() || null,
        status: "pending" as const,
      };
      const { error } = await supabase.from("quotation_proposals").insert(payload as any);
      if (error) throw error;

      // Bump proposals_count atomically (best effort)
      await supabase
        .from("quotation_requests")
        .update({ proposals_count: (selected.proposals_count || 0) + 1 })
        .eq("id", selected.id);

      toast.success("Proposta enviada! O comprador será notificado.");
      setSelected(null);
      setProposalForm({ unit_price: "", delivery_days: "", message: "" });
      void loadAll();
    } catch (err: any) {
      console.error(err);
      toast.error(
        err.message?.includes("duplicate")
          ? "Você já enviou uma proposta para esta solicitação"
          : "Erro: " + err.message
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Solicitações de Compra</h1>
            <p className="text-sm text-muted-foreground">
              Pedidos publicados por compradores. Envie sua proposta direto.
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="open" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="open" data-testid="tab-open">
            Abertas <span className="ml-1 text-xs opacity-70">({requests.length})</span>
          </TabsTrigger>
          <TabsTrigger value="mine" data-testid="tab-mine">
            Minhas propostas <span className="ml-1 text-xs opacity-70">({myProposals.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* OPEN REQUESTS */}
        <TabsContent value="open" className="space-y-4 pt-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[220px] rounded-full" data-testid="filter-category">
                <SelectValue placeholder="Filtrar por categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <Card className="rounded-2xl border-dashed py-12 text-center">
              <CardContent className="pt-6">
                <FileText className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Nenhuma solicitação aberta no momento. Volte em breve!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filtered.map((r) => {
                const alreadyProposed = proposedSet.has(r.id);
                return (
                  <Card key={r.id} className="rounded-2xl hover:shadow-md transition-all" data-testid={`request-${r.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-sm flex-1">{r.title}</h3>
                        {alreadyProposed && (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-700 rounded-full shrink-0">
                            Proposta enviada
                          </Badge>
                        )}
                      </div>
                      {r.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{r.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-3">
                        <span className="flex items-center gap-1"><Package className="h-3 w-3" /> {r.quantity} un.</span>
                        {r.category && <span className="flex items-center gap-1"><Tag className="h-3 w-3" /> {r.category}</span>}
                        {r.budget_max && <span className="flex items-center gap-1"><Banknote className="h-3 w-3" /> até {formatCurrency(r.budget_max)}</span>}
                        {(r.city || r.state) && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {[r.city, r.state].filter(Boolean).join("/")}</span>}
                        {r.deadline && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> até {new Date(r.deadline).toLocaleDateString("pt-BR")}</span>}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelected(r);
                          setProposalForm({ unit_price: "", delivery_days: "", message: "" });
                        }}
                        disabled={alreadyProposed}
                        className="w-full rounded-full"
                        data-testid={`propose-btn-${r.id}`}
                      >
                        <Send className="h-3.5 w-3.5 mr-2" />
                        {alreadyProposed ? "Proposta já enviada" : "Enviar proposta"}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* MY PROPOSALS */}
        <TabsContent value="mine" className="space-y-3 pt-4">
          {myProposals.length === 0 ? (
            <Card className="rounded-2xl border-dashed py-12 text-center">
              <CardContent className="pt-6">
                <Send className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Você ainda não enviou propostas
                </p>
              </CardContent>
            </Card>
          ) : (
            myProposals.map((p) => {
              const req = requests.find((r) => r.id === p.request_id);
              return (
                <Card key={p.id} className="rounded-2xl" data-testid={`my-proposal-${p.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-sm truncate">{req?.title || "Solicitação"}</h3>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-1">
                          <span>Unitário: <strong className="text-foreground">{formatCurrency(p.unit_price)}</strong></span>
                          {p.total_price && <span>Total: <strong className="text-foreground">{formatCurrency(p.total_price)}</strong></span>}
                          {p.delivery_days && <span>Entrega: {p.delivery_days}d</span>}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1.5">
                          Enviada em {new Date(p.created_at).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className={`rounded-full ${
                          p.status === "accepted" ? "bg-emerald-100 text-emerald-700"
                          : p.status === "rejected" ? "bg-rose-100 text-rose-700"
                          : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {p.status === "accepted" ? "Aceita" : p.status === "rejected" ? "Recusada" : "Aguardando"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>

      {/* Send proposal dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Enviar proposta</DialogTitle>
            <DialogDescription className="line-clamp-2">{selected?.title}</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-3">
              <div className="rounded-xl bg-muted/40 p-3 text-xs space-y-1">
                <p><strong>Quantidade:</strong> {selected.quantity} un.</p>
                {selected.category && <p><strong>Categoria:</strong> {selected.category}</p>}
                {selected.budget_max && <p><strong>Orçamento máx:</strong> {formatCurrency(selected.budget_max)}</p>}
                {selected.deadline && <p><strong>Prazo:</strong> {new Date(selected.deadline).toLocaleDateString("pt-BR")}</p>}
                {(selected.city || selected.state) && (
                  <p><strong>Local:</strong> {[selected.city, selected.state].filter(Boolean).join("/")}</p>
                )}
                {selected.description && <p className="pt-1 border-t border-border/50">{selected.description}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Preço unitário (R$) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min={0.01}
                    value={proposalForm.unit_price}
                    onChange={(e) => setProposalForm({ ...proposalForm, unit_price: e.target.value })}
                    data-testid="prop-unit-price"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Entrega (dias)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={proposalForm.delivery_days}
                    onChange={(e) => setProposalForm({ ...proposalForm, delivery_days: e.target.value })}
                    data-testid="prop-delivery-days"
                  />
                </div>
              </div>

              {proposalForm.unit_price && Number(proposalForm.unit_price) > 0 && (
                <p className="text-xs text-muted-foreground">
                  Total estimado: <strong className="text-foreground">{formatCurrency(Number(proposalForm.unit_price) * selected.quantity)}</strong>
                </p>
              )}

              <div className="space-y-1.5">
                <Label>Mensagem (opcional)</Label>
                <Textarea
                  rows={3}
                  placeholder="Descreva diferenciais, prazos, frete..."
                  value={proposalForm.message}
                  onChange={(e) => setProposalForm({ ...proposalForm, message: e.target.value })}
                  data-testid="prop-message"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)} disabled={submitting}>
              Cancelar
            </Button>
            <Button onClick={handleSubmitProposal} disabled={submitting} data-testid="prop-submit">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              Enviar proposta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SolicitacoesFornecedor;
