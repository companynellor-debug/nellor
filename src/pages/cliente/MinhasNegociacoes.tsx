import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Star, Package, AlertTriangle, CheckCircle, Clock, Truck, FileText, ArrowLeft, ShieldAlert } from "lucide-react";
import { generateNegotiationPDF } from "@/components/cliente/NegotiationContractPDF";
import { useNegotiations, getTimeUntilAllowed, formatCountdown } from "@/hooks/useNegotiations";
import { useDisputes } from "@/hooks/useDisputes";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useSupabaseReviews } from "@/hooks/useSupabaseReviews";
import { formatCurrency } from "@/utils/formatCurrency";
import { BottomNav } from "@/components/cliente/BottomNav";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";
import { DarkGlassIcon } from "@/components/ui/dark-glass-icon";

const MinhasNegociacoes = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeFilter = searchParams.get("filtro") || "todas";
  const { user } = useSupabaseAuth();
  const { negotiations, confirmDelivery, updateNegotiationStatus } = useNegotiations();
  const { createDispute } = useDisputes();
  const { createReview } = useSupabaseReviews();

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [selectedNegotiation, setSelectedNegotiation] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [disputeDescription, setDisputeDescription] = useState("");

  const allMyNegotiations = negotiations.filter(n => n.buyer_id === user?.id);

  const myNegotiations = allMyNegotiations.filter(n => {
    if (activeFilter === "pendentes") return n.status === "pending" || n.status === "accepted";
    if (activeFilter === "envio") return n.status === "shipped";
    if (activeFilter === "concluidas") return n.status === "delivered";
    return true;
  });

  // Negotiations that need buyer action (shipped and waiting confirmation)
  const needsAction = allMyNegotiations.filter(n => n.status === "shipped");

  const filters = [
    { key: "todas", label: "Todas", icon: Package, color: "purple" as const, count: allMyNegotiations.length },
    { key: "pendentes", label: "Pendentes", icon: Clock, color: "amber" as const, count: allMyNegotiations.filter(n => n.status === "pending" || n.status === "accepted").length },
    { key: "envio", label: "Em Envio", icon: Truck, color: "blue" as const, count: allMyNegotiations.filter(n => n.status === "shipped").length },
    { key: "concluidas", label: "Concluídas", icon: CheckCircle, color: "emerald" as const, count: allMyNegotiations.filter(n => n.status === "delivered").length },
  ];

  const handleConfirmDelivery = async (neg: any) => {
    setSelectedNegotiation(neg);
    await confirmDelivery(neg.id);
    setShowReviewForm(true);
  };

  const handleNotReceived = (neg: any) => {
    const expectedDate = neg.expected_delivery ? new Date(neg.expected_delivery) : null;
    const now = new Date();
    const daysPast = expectedDate ? Math.floor((now.getTime() - expectedDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;

    if (daysPast < 7 && expectedDate) {
      toast.error(`Aguarde até ${new Date(expectedDate.getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')} para abrir uma disputa.`);
      return;
    }

    setSelectedNegotiation(neg);
    setShowDisputeForm(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedNegotiation) return;
    try {
      if (selectedNegotiation.product_id) {
        await createReview({
          product_id: selectedNegotiation.product_id,
          rating,
          comment: reviewComment || undefined,
        });
      }
      toast.success("Avaliação enviada com sucesso!");
      setShowReviewForm(false);
      setSelectedNegotiation(null);
      setRating(5);
      setReviewComment("");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleSubmitDispute = async () => {
    if (!selectedNegotiation) return;
    try {
      await createDispute({
        negotiation_id: selectedNegotiation.id,
        supplier_id: selectedNegotiation.supplier_id,
        reason: 'not_received',
        description: disputeDescription,
      });
      await updateNegotiationStatus(selectedNegotiation.id, 'disputed');
      setShowDisputeForm(false);
      setSelectedNegotiation(null);
      setDisputeDescription("");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const statusConfig: Record<string, { label: string; color: string }> = {
    pending: { label: "Pendente", color: "bg-yellow-100 text-yellow-700" },
    accepted: { label: "Aceita", color: "bg-blue-100 text-blue-700" },
    shipped: { label: "Enviado", color: "bg-orange-100 text-orange-700" },
    delivered: { label: "Entregue", color: "bg-green-100 text-green-700" },
    disputed: { label: "Em Disputa", color: "bg-destructive/10 text-destructive" },
    cancelled: { label: "Cancelada", color: "bg-muted text-muted-foreground" },
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate("/cliente/perfil")} className="hover:bg-accent p-2 rounded-xl transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <DarkGlassIcon icon={Package} size="md" />
          <div>
            <h1 className="text-lg font-bold">Minhas Negociações</h1>
            <p className="text-xs text-muted-foreground">{myNegotiations.length} negociações</p>
          </div>
        </div>
        {/* Filter pills */}
        <div className="container mx-auto px-4 pb-3 flex gap-2 overflow-x-auto no-scrollbar">
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setSearchParams(f.key === "todas" ? {} : { filtro: f.key })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                activeFilter === f.key
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted"
              }`}
            >
              {f.label}
              {f.count > 0 && (
                <span className={`text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center ${
                  activeFilter === f.key ? "bg-white/20" : "bg-primary/10 text-primary"
                }`}>{f.count}</span>
              )}
            </button>
          ))}
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-3">
        {/* Action required banner */}
        {needsAction.length > 0 && activeFilter === "todas" && (
          <Card className="p-3 border-orange-200 bg-orange-50 dark:bg-orange-950/20">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-orange-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-orange-800 dark:text-orange-200">
                  {needsAction.length} {needsAction.length === 1 ? 'entrega aguardando' : 'entregas aguardando'} confirmação
                </p>
                <p className="text-xs text-orange-600 dark:text-orange-300">
                  Confirme o recebimento dos produtos enviados
                </p>
              </div>
              <Button size="sm" variant="outline" className="border-orange-300 text-orange-700" onClick={() => setSearchParams({ filtro: "envio" })}>
                Ver
              </Button>
            </div>
          </Card>
        )}

        {myNegotiations.length === 0 ? (
          <Card className="p-8 text-center">
            <Package className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Nenhuma negociação registrada</p>
            <Button onClick={() => navigate('/cliente/produtos')} className="mt-3" size="sm">
              Explorar Produtos
            </Button>
          </Card>
        ) : (
          myNegotiations.map((neg) => {
            const config = statusConfig[neg.status] || statusConfig.pending;
            const isDeliveryDue = neg.expected_delivery && new Date(neg.expected_delivery) <= new Date();
            const canDispute = neg.expected_delivery && new Date(neg.expected_delivery).getTime() + 7 * 24 * 60 * 60 * 1000 <= Date.now();
            const isShipped = neg.status === 'shipped';
            const isAcceptedAndDue = neg.status === 'accepted' && isDeliveryDue;

            return (
              <Card key={neg.id} className={`p-4 ${isShipped ? 'border-orange-300 shadow-md' : ''}`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-sm">{neg.product_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {neg.quantity}x • {formatCurrency(neg.agreed_price)}
                    </p>
                  </div>
                  <Badge className={config.color}>{config.label}</Badge>
                </div>

                <div className="text-xs text-muted-foreground space-y-0.5 mb-3">
                  <p>Pagamento: {neg.payment_method}</p>
                  {neg.expected_delivery && (
                    <p>Entrega prevista: {new Date(neg.expected_delivery).toLocaleDateString('pt-BR')}</p>
                  )}
                  <p>Criada: {new Date(neg.created_at).toLocaleDateString('pt-BR')}</p>
                </div>

                {/* SHIPPED: Show confirmation buttons - buyer must confirm */}
                {isShipped && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs text-orange-600 bg-orange-50 dark:bg-orange-950/30 rounded p-2 mb-2">
                      <Truck className="h-3.5 w-3.5" />
                      <span className="font-medium">Fornecedor confirmou o envio. Confirme quando receber.</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 gap-1 bg-green-600 hover:bg-green-700"
                        onClick={() => handleConfirmDelivery(neg)}
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        Sim, recebi
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className={`flex-1 gap-1 ${canDispute ? 'text-destructive border-destructive/30' : 'text-muted-foreground'}`}
                        onClick={() => handleNotReceived(neg)}
                        disabled={!canDispute}
                      >
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Não recebi
                      </Button>
                    </div>
                    {!canDispute && neg.expected_delivery && (
                      <p className="text-[10px] text-muted-foreground text-center">
                        Poderá abrir disputa a partir de {new Date(new Date(neg.expected_delivery).getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                )}

                {/* ACCEPTED + delivery date passed: warn buyer */}
                {isAcceptedAndDue && (
                  <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 rounded p-2">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>Data de entrega prevista já passou. Aguardando envio do fornecedor.</span>
                  </div>
                )}

                {/* PENDING: waiting */}
                {neg.status === 'pending' && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    Aguardando resposta do fornecedor
                  </div>
                )}

                {/* ACCEPTED: not due yet */}
                {neg.status === 'accepted' && !isDeliveryDue && (
                  <div className="flex items-center gap-1.5 text-xs text-blue-600">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Negociação aceita, aguardando envio
                  </div>
                )}

                {/* PDF button for accepted/shipped/delivered */}
                {(neg.status === 'accepted' || neg.status === 'shipped' || neg.status === 'delivered') && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 mt-2"
                    onClick={() => generateNegotiationPDF({
                      ...neg,
                      buyerName: user?.email || 'Comprador',
                      supplierName: 'Fornecedor',
                    })}
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Gerar Resumo do Acordo
                  </Button>
                )}

                {/* DELIVERED: confirmation info */}
                {neg.status === 'delivered' && (
                  <div className="flex items-center gap-1.5 text-xs text-green-600 mt-2">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Entrega confirmada{neg.delivery_confirmed_at && ` em ${new Date(neg.delivery_confirmed_at).toLocaleDateString('pt-BR')}`}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </main>

      {/* Review Dialog */}
      <Dialog open={showReviewForm} onOpenChange={setShowReviewForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Avaliar Fornecedor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Nota geral:</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} onClick={() => setRating(star)}>
                    <Star className={`h-8 w-8 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Comentário (opcional):</p>
              <Textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Como foi sua experiência?"
                rows={3}
              />
            </div>
            <Button onClick={handleSubmitReview} className="w-full">
              Enviar Avaliação
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dispute Dialog */}
      <Dialog open={showDisputeForm} onOpenChange={setShowDisputeForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Abrir Disputa
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Descreva o que aconteceu. O fornecedor terá 48 horas para responder e um administrador irá mediar a situação.
            </p>
            <Textarea
              value={disputeDescription}
              onChange={(e) => setDisputeDescription(e.target.value)}
              placeholder="Descreva o problema..."
              rows={4}
            />
            <Button onClick={handleSubmitDispute} variant="destructive" className="w-full gap-1">
              <AlertTriangle className="h-4 w-4" />
              Confirmar Disputa
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

export default MinhasNegociacoes;
