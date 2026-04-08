import { useState } from "react";
import { BottomNav } from "@/components/cliente/BottomNav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, FileText, Clock, CheckCircle2, XCircle, ChevronLeft, ArrowLeft, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMyQuotations, useCreateQuotation, useQuotationProposals, useUpdateQuotationStatus, useAcceptProposal } from "@/hooks/useQuotations";
import { useSupabaseCategories } from "@/hooks/useSupabaseCategories";
import { formatCurrency } from "@/utils/formatCurrency";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  open: { label: "Aberta", color: "bg-green-100 text-green-700 border-green-200", icon: Clock },
  closed: { label: "Fechada", color: "bg-blue-100 text-blue-700 border-blue-200", icon: CheckCircle2 },
  cancelled: { label: "Cancelada", color: "bg-red-100 text-red-700 border-red-200", icon: XCircle },
};

const ProposalsView = ({ requestId, requestTitle, requestQuantity, requestUnit, onBack, isOpen }: { requestId: string; requestTitle: string; requestQuantity: number; requestUnit: string; onBack: () => void; isOpen: boolean }) => {
  const { data: proposals, isLoading } = useQuotationProposals(requestId);
  const acceptProposal = useAcceptProposal();
  const navigate = useNavigate();

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground mb-4 hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar às cotações
      </button>
      <h2 className="text-lg font-bold mb-1">Propostas recebidas</h2>
      <p className="text-sm text-muted-foreground mb-4">Para: {requestTitle}</p>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : !proposals?.length ? (
        <Card className="p-8 text-center">
          <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Nenhuma proposta recebida ainda</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {proposals.map((p, i) => {
            const best = i === 0;
            return (
              <Card key={p.id} className={`p-4 ${best ? "border-primary/40 ring-1 ring-primary/20" : ""}`}>
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={p.supplier_avatar || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">{(p.supplier_name || "F")[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{p.supplier_name}</p>
                    {best && <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">Melhor preço</Badge>}
                  </div>
                  <Badge variant="outline" className={p.status === "accepted" ? "bg-green-100 text-green-700" : p.status === "rejected" ? "bg-red-100 text-red-700" : ""}>{p.status === "pending" ? "Pendente" : p.status === "accepted" ? "Aceita" : "Rejeitada"}</Badge>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center mb-3">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">Preço Unit.</p>
                    <p className="font-bold text-sm">{formatCurrency(p.unit_price)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">Frete</p>
                    <p className="font-bold text-sm">{formatCurrency(p.freight)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">Validade</p>
                    <p className="font-bold text-sm">{p.offer_validity_days}d</p>
                  </div>
                </div>
                {p.notes && <p className="text-xs text-muted-foreground mb-3">"{p.notes}"</p>}
                {isOpen && p.status === "pending" && (
                  <Button size="sm" className="w-full" onClick={() => acceptProposal.mutate({ 
                    proposalId: p.id, 
                    requestId,
                    proposal: { supplier_id: p.supplier_id, unit_price: p.unit_price, freight: p.freight, notes: p.notes },
                    request: { title: requestTitle, quantity: requestQuantity, unit: requestUnit },
                  }, {
                    onSuccess: () => navigate("/cliente/negociacoes"),
                  })} disabled={acceptProposal.isPending}>
                    <CheckCircle2 className="h-4 w-4 mr-1" /> Aceitar e Negociar
                  </Button>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

const Cotacoes = () => {
  const navigate = useNavigate();
  const { data: quotations, isLoading } = useMyQuotations();
  const createQuotation = useCreateQuotation();
  const updateStatus = useUpdateQuotationStatus();
  const { categories } = useSupabaseCategories();
  const [open, setOpen] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", description: "", quantity: "1", unit: "unidade", category_id: "", deadline: "" });

  const handleCreate = () => {
    if (!form.title.trim()) return;
    createQuotation.mutate(
      { title: form.title, description: form.description || undefined, quantity: Number(form.quantity) || 1, unit: form.unit, category_id: form.category_id || undefined, deadline: form.deadline || undefined },
      { onSuccess: () => { setOpen(false); setForm({ title: "", description: "", quantity: "1", unit: "unidade", category_id: "", deadline: "" }); } }
    );
  };

  const viewingQuotation = quotations?.find((q) => q.id === viewingId);

  return (
    <div className="min-h-screen bg-muted/30 pb-24">
      <header className="sticky top-0 z-40 bg-background border-b px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)}>
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="text-lg font-bold flex-1">Minhas Cotações</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nova Cotação</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Nova Cotação</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>O que você precisa? *</Label>
                <Input placeholder="Ex: Camisetas básicas algodão" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <Label>Detalhes / Especificações</Label>
                <Textarea placeholder="Descreva tamanho, cor, material..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Quantidade</Label>
                  <Input type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
                </div>
                <div>
                  <Label>Unidade</Label>
                  <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unidade">Unidade</SelectItem>
                      <SelectItem value="caixa">Caixa</SelectItem>
                      <SelectItem value="kg">Kg</SelectItem>
                      <SelectItem value="fardo">Fardo</SelectItem>
                      <SelectItem value="par">Par</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {categories.length > 0 && (
                <div>
                  <Label>Categoria</Label>
                  <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label>Prazo limite para propostas</Label>
                <Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
              </div>
              <Button className="w-full" onClick={handleCreate} disabled={createQuotation.isPending || !form.title.trim()}>
                {createQuotation.isPending ? "Criando..." : "Publicar Cotação"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      <main className="container mx-auto px-4 py-4">
        {viewingId && viewingQuotation ? (
          <ProposalsView requestId={viewingId} requestTitle={viewingQuotation.title} requestQuantity={viewingQuotation.quantity} requestUnit={viewingQuotation.unit} onBack={() => setViewingId(null)} isOpen={viewingQuotation.status === "open"} />
        ) : isLoading ? (
          <p className="text-center text-muted-foreground py-12">Carregando...</p>
        ) : !quotations?.length ? (
          <Card className="p-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-bold mb-1">Nenhuma cotação ainda</h3>
            <p className="text-sm text-muted-foreground mb-4">Publique o que você precisa e receba propostas de fornecedores verificados.</p>
            <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" /> Criar Primeira Cotação</Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {quotations.map((q) => {
              const sc = statusConfig[q.status] || statusConfig.open;
              const StatusIcon = sc.icon;
              return (
                <Card key={q.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm truncate">{q.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {q.quantity} {q.unit} · {q.category_name || "Sem categoria"}
                      </p>
                    </div>
                    <Badge variant="outline" className={`${sc.color} text-[10px] flex-shrink-0 ml-2`}>
                      <StatusIcon className="h-3 w-3 mr-1" /> {sc.label}
                    </Badge>
                  </div>
                  {q.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{q.description}</p>}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{format(new Date(q.created_at), "dd MMM yyyy", { locale: ptBR })}</span>
                      {q.deadline && <span>· Prazo: {format(new Date(q.deadline), "dd/MM")}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setViewingId(q.id)}>
                        <Eye className="h-3 w-3 mr-1" /> {q.proposals_count} proposta{q.proposals_count !== 1 ? "s" : ""}
                      </Button>
                      {q.status === "open" && (
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive" onClick={() => updateStatus.mutate({ id: q.id, status: "cancelled" })}>
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
};

export default Cotacoes;
