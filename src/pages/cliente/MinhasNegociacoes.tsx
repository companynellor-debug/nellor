import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Star, Package, AlertTriangle, CheckCircle, Clock, MessageCircle, FileText } from "lucide-react";
import { generateNegotiationPDF } from "@/components/cliente/NegotiationContractPDF";
import { useNegotiations } from "@/hooks/useNegotiations";
import { useDisputes } from "@/hooks/useDisputes";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useSupabaseReviews } from "@/hooks/useSupabaseReviews";
import { formatCurrency } from "@/utils/formatCurrency";
import { BottomNav } from "@/components/cliente/BottomNav";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const MinhasNegociacoes = () => {
  const navigate = useNavigate();
  const { user } = useSupabaseAuth();
  const { negotiations, updateNegotiationStatus } = useNegotiations();
  const { createDispute } = useDisputes();
  const { createReview } = useSupabaseReviews();

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [selectedNegotiation, setSelectedNegotiation] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [disputeDescription, setDisputeDescription] = useState("");

  const myNegotiations = negotiations.filter(n => n.buyer_id === user?.id);

  const handleConfirmDelivery = async (neg: any) => {
    setSelectedNegotiation(neg);
    await updateNegotiationStatus(neg.id, 'delivered');
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
    delivered: { label: "Entregue", color: "bg-green-100 text-green-700" },
    disputed: { label: "Em Disputa", color: "bg-destructive/10 text-destructive" },
    cancelled: { label: "Cancelada", color: "bg-muted text-muted-foreground" },
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-primary">Minhas Negociações</h1>
          <p className="text-sm text-muted-foreground">{myNegotiations.length} negociações</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-3">
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

            return (
              <Card key={neg.id} className="p-4">
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

                {neg.status === 'pending' && isDeliveryDue && (
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
                )}

                {neg.status === 'pending' && !isDeliveryDue && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    Aguardando data de entrega
                  </div>
                )}

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
