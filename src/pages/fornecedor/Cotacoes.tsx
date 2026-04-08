import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Send, Clock, CheckCircle2, Package } from "lucide-react";
import { useOpenQuotations, useMyProposals, useCreateProposal } from "@/hooks/useQuotations";
import { useSupabaseCategories } from "@/hooks/useSupabaseCategories";
import { formatCurrency } from "@/utils/formatCurrency";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const Cotacoes = () => {
  const { categories } = useSupabaseCategories();
  const [catFilter, setCatFilter] = useState<string>();
  const { data: openQuotations, isLoading } = useOpenQuotations(catFilter);
  const { data: myProposals } = useMyProposals();
  const createProposal = useCreateProposal();

  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [form, setForm] = useState({ unit_price: "", freight: "0,00", offer_validity_days: "7", notes: "" });

  const alreadyProposed = new Set((myProposals || []).map((p: any) => p.request_id));

  const handleSubmit = () => {
    if (!selectedRequest || !form.unit_price) return;
    createProposal.mutate(
      {
        request_id: selectedRequest.id,
        unit_price: parseFloat(form.unit_price.replace(',', '.')) || 0,
        freight: parseFloat(form.freight.replace(',', '.')) || 0,
        offer_validity_days: Number(form.offer_validity_days) || 7,
        notes: form.notes || undefined,
      },
      { onSuccess: () => { setSelectedRequest(null); setForm({ unit_price: "", freight: "0", offer_validity_days: "7", notes: "" }); } }
    );
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">Cotações</h1>
      <p className="text-sm text-muted-foreground mb-6">Responda pedidos de cotação de compradores e conquiste novos clientes.</p>

      <Tabs defaultValue="open">
        <TabsList className="mb-4">
          <TabsTrigger value="open">Abertas</TabsTrigger>
          <TabsTrigger value="mine">Minhas Propostas</TabsTrigger>
        </TabsList>

        <TabsContent value="open">
          {categories.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
              <button onClick={() => setCatFilter(undefined)} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border ${!catFilter ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border"}`}>
                Todas
              </button>
              {categories.map((c) => (
                <button key={c.id} onClick={() => setCatFilter(c.id)} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border ${catFilter === c.id ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border"}`}>
                  {c.nome}
                </button>
              ))}
            </div>
          )}

          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Carregando cotações...</p>
          ) : !openQuotations?.length ? (
            <Card className="p-8 text-center">
              <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhuma cotação aberta no momento</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {openQuotations.map((q) => (
                <Card key={q.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm">{q.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        <Package className="inline h-3 w-3 mr-1" />
                        {q.quantity} {q.unit} · {q.category_name || "Geral"}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className="text-[10px] text-muted-foreground">{format(new Date(q.created_at), "dd MMM", { locale: ptBR })}</p>
                      {q.deadline && <p className="text-[10px] text-muted-foreground">Prazo: {format(new Date(q.deadline), "dd/MM")}</p>}
                    </div>
                  </div>
                  {q.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{q.description}</p>}
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px]">
                      {q.proposals_count} proposta{q.proposals_count !== 1 ? "s" : ""}
                    </Badge>
                    {alreadyProposed.has(q.id) ? (
                      <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px]"><CheckCircle2 className="h-3 w-3 mr-1" /> Proposta enviada</Badge>
                    ) : (
                      <Button size="sm" className="h-7 text-xs" onClick={() => setSelectedRequest(q)}>
                        <Send className="h-3 w-3 mr-1" /> Enviar Proposta
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="mine">
          {!myProposals?.length ? (
            <Card className="p-8 text-center">
              <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Você ainda não enviou propostas</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {myProposals.map((p: any) => (
                <Card key={p.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-sm">{p.quotation_requests?.title || "Cotação"}</h3>
                      <p className="text-xs text-muted-foreground">{p.quotation_requests?.quantity} {p.quotation_requests?.unit}</p>
                    </div>
                    <Badge variant="outline" className={p.status === "accepted" ? "bg-green-100 text-green-700" : p.status === "rejected" ? "bg-red-100 text-red-700" : ""}>
                      {p.status === "pending" ? "Aguardando" : p.status === "accepted" ? "Aceita ✓" : "Recusada"}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div><p className="text-[10px] text-muted-foreground">Preço</p><p className="text-sm font-bold">{formatCurrency(p.unit_price)}</p></div>
                    <div><p className="text-[10px] text-muted-foreground">Frete</p><p className="text-sm font-bold">{formatCurrency(p.freight)}</p></div>
                    <div><p className="text-[10px] text-muted-foreground">Validade</p><p className="text-sm font-bold">{p.offer_validity_days}d</p></div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal de envio de proposta */}
      <Dialog open={!!selectedRequest} onOpenChange={(v) => !v && setSelectedRequest(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar Proposta</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <Card className="p-3 bg-muted/50">
                <p className="font-semibold text-sm">{selectedRequest.title}</p>
                <p className="text-xs text-muted-foreground">{selectedRequest.quantity} {selectedRequest.unit}</p>
                {selectedRequest.description && <p className="text-xs text-muted-foreground mt-1">{selectedRequest.description}</p>}
              </Card>
              <div>
                <Label>Preço Unitário (R$) *</Label>
                <Input type="text" inputMode="decimal" placeholder="0,00" value={form.unit_price} onChange={(e) => setForm({ ...form, unit_price: e.target.value.replace(/[^0-9.,]/g, '') })} onBlur={(e) => { const v = parseFloat(e.target.value.replace(',', '.')); if (!isNaN(v)) setForm(f => ({ ...f, unit_price: v.toFixed(2).replace('.', ',') })); }} />
              </div>
              <div>
                <Label>Frete (R$)</Label>
                <Input type="text" inputMode="decimal" placeholder="0,00" value={form.freight} onChange={(e) => setForm({ ...form, freight: e.target.value.replace(/[^0-9.,]/g, '') })} onBlur={(e) => { const v = parseFloat(e.target.value.replace(',', '.')); if (!isNaN(v)) setForm(f => ({ ...f, freight: v.toFixed(2).replace('.', ',') })); }} />
              </div>
              <div>
                <Label>Validade da Oferta (dias)</Label>
                <Input type="number" min="1" value={form.offer_validity_days} onChange={(e) => setForm({ ...form, offer_validity_days: e.target.value })} />
              </div>
              <div>
                <Label>Observações</Label>
                <Textarea placeholder="Prazo de entrega, condições..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
              <Button className="w-full" onClick={handleSubmit} disabled={createProposal.isPending || !form.unit_price}>
                {createProposal.isPending ? "Enviando..." : "Enviar Proposta"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Cotacoes;
