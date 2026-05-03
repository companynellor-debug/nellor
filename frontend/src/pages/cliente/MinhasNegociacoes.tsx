import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Star, Package, AlertTriangle, CheckCircle, Clock, Truck, FileText, ArrowLeft, ShieldAlert, Upload, DollarSign, XCircle, Download, Eye } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";

const MinhasNegociacoes = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeFilter = searchParams.get("filtro") || "todas";
  const { user } = useSupabaseAuth();
  const { negotiations, confirmDelivery, updateNegotiationStatus, reportPayment, buyerCancel, buyerConfirmRefund } = useNegotiations();
  const { createDispute } = useDisputes();
  const { createReview } = useSupabaseReviews();

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedNegotiation, setSelectedNegotiation] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [disputeDescription, setDisputeDescription] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);

  const allMyNegotiations = negotiations.filter(n => n.buyer_id === user?.id);

  const myNegotiations = allMyNegotiations.filter(n => {
    if (activeFilter === "pendentes") return n.status === "pending" || n.status === "accepted";
    if (activeFilter === "envio") return n.status === "shipped";
    if (activeFilter === "concluidas") return n.status === "delivered";
    return true;
  });

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

  const handleReportPayment = (neg: any) => {
    setSelectedNegotiation(neg);
    setPaymentReference('');
    setPaymentProofFile(null);
    setShowPaymentForm(true);
  };

  const handleSubmitPayment = async () => {
    if (!selectedNegotiation) return;
    setUploadingProof(true);
    try {
      let proofUrl: string | undefined;

      if (paymentProofFile) {
        const ext = paymentProofFile.name.split('.').pop();
        const path = `${user!.id}/${selectedNegotiation.id}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('payment-proofs')
          .upload(path, paymentProofFile, { upsert: true });
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('payment-proofs')
          .getPublicUrl(path);
        proofUrl = urlData.publicUrl;
      }

      await reportPayment(selectedNegotiation.id, proofUrl, paymentReference);
      setShowPaymentForm(false);
      setSelectedNegotiation(null);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploadingProof(false);
    }
  };

  const handleCancelNeg = async (negId: string) => {
    await buyerCancel(negId);
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

  const paymentStateLabels: Record<string, { label: string; color: string }> = {
    not_reported: { label: '', color: '' },
    reported_by_buyer: { label: 'Pagamento informado', color: 'bg-blue-100 text-blue-700' },
    confirmed_by_supplier: { label: 'Pagamento confirmado', color: 'bg-green-100 text-green-700' },
    contested_by_supplier: { label: 'Pagamento contestado', color: 'bg-red-100 text-red-700' },
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
            const paymentInfo = paymentStateLabels[neg.payment_state] || paymentStateLabels.not_reported;
            const canCancel = neg.status === 'pending' && neg.payment_state === 'not_reported';
            const canReportPayment = neg.status === 'accepted' && neg.payment_state === 'not_reported';

            return (
              <Card key={neg.id} className={`p-4 ${isShipped ? 'border-orange-300 shadow-md' : ''}`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-sm">{neg.product_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {neg.quantity}x • {formatCurrency(neg.agreed_price)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge className={config.color}>{config.label}</Badge>
                    {paymentInfo.label && (
                      <Badge className={paymentInfo.color + ' text-[10px]'}>{paymentInfo.label}</Badge>
                    )}
                  </div>
                </div>

                <div className="text-xs text-muted-foreground space-y-0.5 mb-3">
                  <p>Pagamento: {neg.payment_method}</p>
                  {neg.expected_delivery && (
                    <p>Entrega prevista: {new Date(neg.expected_delivery).toLocaleDateString('pt-BR')}</p>
                  )}
                  <p>Criada: {new Date(neg.created_at).toLocaleDateString('pt-BR')}</p>
                </div>

                {/* Payment contested warning */}
                {neg.payment_state === 'contested_by_supplier' && neg.payment_contested_reason && (
                  <div className="flex items-start gap-1.5 text-xs text-destructive bg-destructive/10 rounded p-2 mb-2">
                    <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium">Pagamento contestado pelo fornecedor: </span>
                      <span>{neg.payment_contested_reason}</span>
                    </div>
                  </div>
                )}

                {/* Refund confirmation banner */}
                {neg.refund_state === 'supplier_confirmed' && (
                  <div className="bg-orange-50 dark:bg-orange-950/30 rounded-lg p-3 space-y-2 mb-2">
                    <p className="text-xs font-medium text-orange-700">
                      💰 O fornecedor informou que reembolsou. Você recebeu o valor?
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700 gap-1" onClick={() => buyerConfirmRefund(neg.id, true)}>
                        <CheckCircle className="h-3.5 w-3.5" />
                        Sim, recebi
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1 text-destructive border-destructive/30 gap-1" onClick={() => buyerConfirmRefund(neg.id, false)}>
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Não recebi
                      </Button>
                    </div>
                  </div>
                )}

                {/* Refund denied - escalated */}
                {neg.refund_state === 'buyer_denied' && (
                  <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2 mb-2">
                    ⚠️ Disputa aberta — aguardando resolução do administrador
                  </div>
                )}

                {/* Refund pending from supplier */}
                {neg.refund_state === 'pending' && neg.status === 'cancelled' && (
                  <div className="text-xs text-orange-600 bg-orange-50 dark:bg-orange-950/30 rounded p-2 mb-2">
                    ⏳ Aguardando fornecedor realizar o reembolso
                  </div>
                )}

                {/* ACCEPTED: Show "Já paguei" button */}
                {canReportPayment && (
                  <Button
                    size="sm"
                    className="w-full gap-1 mb-2 bg-green-600 hover:bg-green-700"
                    onClick={() => handleReportPayment(neg)}
                  >
                    <DollarSign className="h-3.5 w-3.5" />
                    Já paguei — Informar pagamento
                  </Button>
                )}

                {/* Invoice download */}
                {neg.invoice_url && (
                  <a href={neg.invoice_url} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline" className="w-full gap-1 mb-2">
                      <Download className="h-3.5 w-3.5" />
                      Baixar Nota Fiscal
                    </Button>
                  </a>
                )}

                {/* PENDING: cancel button */}
                {canCancel && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-1">
                      <Clock className="h-3.5 w-3.5" />
                      Aguardando resposta do fornecedor
                    </div>
                    <Button size="sm" variant="outline" className="text-destructive border-destructive/30 gap-1" onClick={() => handleCancelNeg(neg.id)}>
                      <XCircle className="h-3.5 w-3.5" />
                      Cancelar
                    </Button>
                  </div>
                )}

                {/* PENDING without cancel (payment reported) */}
                {neg.status === 'pending' && !canCancel && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    Aguardando resposta do fornecedor
                  </div>
                )}

                {/* SHIPPED: Show confirmation buttons */}
                {isShipped && (() => {
                  const timing = getTimeUntilAllowed(neg as any);
                  return (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-xs text-orange-600 bg-orange-50 dark:bg-orange-950/30 rounded p-2 mb-2">
                        <Truck className="h-3.5 w-3.5" />
                        <span className="font-medium">Fornecedor confirmou o envio. Confirme quando receber.</span>
                      </div>
                      {!timing.allowed && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 rounded p-2">
                          <ShieldAlert className="h-3.5 w-3.5" />
                          <span>Confirmação disponível em {formatCountdown(timing.remainingMs)} (segurança anti-fraude)</span>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1 gap-1 bg-green-600 hover:bg-green-700"
                          onClick={() => handleConfirmDelivery(neg)}
                          disabled={!timing.allowed}
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          {timing.allowed ? 'Sim, recebi' : formatCountdown(timing.remainingMs)}
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
                  );
                })()}

                {/* ACCEPTED + not due and no payment report button shown */}
                {neg.status === 'accepted' && !isDeliveryDue && neg.payment_state !== 'not_reported' && (
                  <div className="flex items-center gap-1.5 text-xs text-blue-600">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Negociação aceita, aguardando envio
                  </div>
                )}

                {isAcceptedAndDue && (
                  <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 rounded p-2">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>Data de entrega prevista já passou. Aguardando envio do fornecedor.</span>
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

      {/* Payment Report Dialog */}
      <Dialog open={showPaymentForm} onOpenChange={setShowPaymentForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Informar Pagamento
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Informe que o pagamento foi feito. Isso protege você: o fornecedor não poderá cancelar após esta confirmação.
            </p>
            <div>
              <label className="text-sm font-medium">Referência / código da transação</label>
              <Input
                value={paymentReference}
                onChange={e => setPaymentReference(e.target.value)}
                placeholder="Ex: código PIX, nº do boleto..."
              />
            </div>
            <div>
              <label className="text-sm font-medium">Comprovante (opcional)</label>
              <Input
                type="file"
                accept="image/*,application/pdf"
                onChange={e => setPaymentProofFile(e.target.files?.[0] || null)}
              />
              <p className="text-[10px] text-muted-foreground mt-1">PDF ou imagem do comprovante</p>
            </div>
            <Button
              onClick={handleSubmitPayment}
              className="w-full gap-1 bg-green-600 hover:bg-green-700"
              disabled={uploadingProof || (!paymentReference.trim() && !paymentProofFile)}
            >
              {uploadingProof ? <Upload className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              Confirmar Pagamento
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
              Descreva o que aconteceu. O fornecedor terá 5 minutos para responder e um administrador irá mediar a situação.
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
