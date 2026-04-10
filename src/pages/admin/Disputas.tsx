import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, CheckCircle, XCircle, Eye, ShieldAlert, Ban, ArrowRight, Image, FileText, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatCurrency } from "@/utils/formatCurrency";

interface AdminDispute {
  id: string;
  negotiation_id: string;
  buyer_id: string;
  supplier_id: string;
  reason: string;
  description: string | null;
  status: string;
  admin_notes: string | null;
  supplier_response: string | null;
  supplier_responded_at: string | null;
  resolved_at: string | null;
  created_at: string;
  buyer_name: string;
  supplier_name: string;
  product_name: string;
  agreed_price: number;
  // Negotiation data
  payment_state: string | null;
  payment_proof_url: string | null;
  payment_reference: string | null;
  payment_contested_reason: string | null;
  payment_method: string | null;
  quantity: number | null;
  buyer_data: Record<string, any> | null;
  invoice_url: string | null;
  negotiation_status: string | null;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  open: { label: "Aberta", color: "bg-orange-100 text-orange-700 border-orange-200" },
  resolved: { label: "Resolvida", color: "bg-green-100 text-green-700 border-green-200" },
  scam_confirmed: { label: "Golpe Confirmado", color: "bg-destructive/10 text-destructive border-destructive/20" },
  buyer_issue: { label: "Problema do Comprador", color: "bg-blue-100 text-blue-700 border-blue-200" },
};

const paymentStateLabels: Record<string, string> = {
  not_reported: "Não informado",
  reported_by_buyer: "Informado pelo comprador",
  confirmed_by_supplier: "Confirmado pelo fornecedor",
  contested_by_supplier: "Contestado pelo fornecedor",
};

const Disputas = () => {
  const [disputes, setDisputes] = useState<AdminDispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState<AdminDispute | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [resolving, setResolving] = useState(false);

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_admin_disputes');
      if (error) throw error;
      setDisputes((data || []) as any as AdminDispute[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const handleAdminAction = async (id: string, action: string) => {
    setResolving(true);
    try {
      const { error } = await supabase.rpc('admin_resolve_negotiation_dispute', {
        p_dispute_id: id,
        p_action: action,
        p_admin_notes: adminNotes || null,
      });
      if (error) throw error;
      toast.success(
        action === 'force_cancel' ? 'Negociação cancelada pelo admin' :
        action === 'force_continue' ? 'Pagamento confirmado e disputa resolvida' :
        'Fornecedor suspenso'
      );
      setSelectedDispute(null);
      setAdminNotes("");
      fetchDisputes();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setResolving(false);
    }
  };

  const openCount = disputes.filter(d => d.status === 'open').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Disputas</h1>
          <p className="text-sm text-muted-foreground">{openCount} disputas abertas</p>
        </div>
        <Badge variant="outline" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          {disputes.length} total
        </Badge>
      </div>

      {disputes.length === 0 ? (
        <Card className="p-8 text-center">
          <CheckCircle className="h-10 w-10 mx-auto text-green-500 mb-2" />
          <p className="text-muted-foreground">Nenhuma disputa registrada</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {disputes.map((dispute) => {
            const config = statusConfig[dispute.status] || statusConfig.open;
            const isFakePayment = dispute.reason === 'fake_payment';
            return (
              <Card key={dispute.id} className={`p-4 ${isFakePayment && dispute.status === 'open' ? 'border-red-300' : ''}`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{dispute.product_name}</p>
                      {isFakePayment && <Badge variant="destructive" className="text-[10px]">🚨 Comprovante Falso</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {dispute.buyer_name} vs {dispute.supplier_name}
                    </p>
                  </div>
                  <Badge className={config.color}>{config.label}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <p>Valor: {formatCurrency(dispute.agreed_price)}</p>
                    <p>{new Date(dispute.created_at).toLocaleDateString('pt-BR')}</p>
                    {dispute.payment_proof_url && <p className="text-blue-600">📎 Comprovante anexado</p>}
                    {dispute.supplier_response && <p className="text-primary">Fornecedor respondeu ✓</p>}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedDispute(dispute);
                      setAdminNotes(dispute.admin_notes || "");
                    }}
                    className="gap-1"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Detalhes
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!selectedDispute} onOpenChange={(open) => !open && setSelectedDispute(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Disputa</DialogTitle>
          </DialogHeader>
          {selectedDispute && (
            <div className="space-y-4">
              {/* People & Product */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Comprador</p>
                  <p className="font-medium">{selectedDispute.buyer_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Fornecedor</p>
                  <p className="font-medium">{selectedDispute.supplier_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Produto</p>
                  <p className="font-medium">{selectedDispute.product_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Valor</p>
                  <p className="font-medium">{formatCurrency(selectedDispute.agreed_price)}</p>
                </div>
                {selectedDispute.quantity && (
                  <div>
                    <p className="text-muted-foreground text-xs">Quantidade</p>
                    <p className="font-medium">{selectedDispute.quantity}</p>
                  </div>
                )}
                {selectedDispute.payment_method && (
                  <div>
                    <p className="text-muted-foreground text-xs">Método de pagamento</p>
                    <p className="font-medium">{selectedDispute.payment_method}</p>
                  </div>
                )}
              </div>

              {/* Payment State */}
              <div className="bg-muted/50 rounded-lg p-3 space-y-1.5">
                <p className="text-xs font-medium flex items-center gap-1">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  Estado do pagamento
                </p>
                <p className="text-sm font-medium">
                  {paymentStateLabels[selectedDispute.payment_state || 'not_reported'] || selectedDispute.payment_state}
                </p>
                {selectedDispute.payment_reference && (
                  <p className="text-xs text-muted-foreground">Referência: {selectedDispute.payment_reference}</p>
                )}
              </div>

              {/* Payment Proof */}
              {selectedDispute.payment_proof_url && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <Image className="h-3 w-3" /> Comprovante do comprador:
                  </p>
                  <a href={selectedDispute.payment_proof_url} target="_blank" rel="noopener noreferrer" className="block">
                    {selectedDispute.payment_proof_url.match(/\.(jpg|jpeg|png|gif|webp)/i) ? (
                      <img src={selectedDispute.payment_proof_url} alt="Comprovante" className="max-w-full max-h-48 rounded border object-contain" />
                    ) : (
                      <Button variant="outline" size="sm" className="gap-1">
                        <FileText className="h-3.5 w-3.5" />
                        Ver comprovante (PDF)
                      </Button>
                    )}
                  </a>
                </div>
              )}

              {/* Invoice */}
              {selectedDispute.invoice_url && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">NF do fornecedor:</p>
                  <a href={selectedDispute.invoice_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="gap-1">
                      <FileText className="h-3.5 w-3.5" />
                      Ver nota fiscal
                    </Button>
                  </a>
                </div>
              )}

              {/* Buyer Data */}
              {selectedDispute.buyer_data && Object.keys(selectedDispute.buyer_data).length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <User className="h-3 w-3" /> Dados do comprador (NF):
                  </p>
                  <div className="bg-muted/50 rounded p-2 text-xs space-y-0.5">
                    {selectedDispute.buyer_data.nome && <p><span className="text-muted-foreground">Nome:</span> {selectedDispute.buyer_data.nome}</p>}
                    {selectedDispute.buyer_data.documento && <p><span className="text-muted-foreground">CPF/CNPJ:</span> {selectedDispute.buyer_data.documento}</p>}
                    {selectedDispute.buyer_data.telefone && <p><span className="text-muted-foreground">Tel:</span> {selectedDispute.buyer_data.telefone}</p>}
                    {selectedDispute.buyer_data.endereco && <p><span className="text-muted-foreground">End:</span> {selectedDispute.buyer_data.endereco}</p>}
                  </div>
                </div>
              )}

              {/* Contest reason */}
              {selectedDispute.payment_contested_reason && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Motivo da contestação:</p>
                  <p className="text-sm bg-red-50 dark:bg-red-950/30 p-2 rounded text-red-700">{selectedDispute.payment_contested_reason}</p>
                </div>
              )}

              {/* Description */}
              {selectedDispute.description && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Descrição da disputa:</p>
                  <p className="text-sm bg-muted p-2 rounded">{selectedDispute.description}</p>
                </div>
              )}

              {/* Supplier Response */}
              {selectedDispute.supplier_response && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Resposta do fornecedor:</p>
                  <p className="text-sm bg-blue-50 dark:bg-blue-950/30 p-2 rounded">{selectedDispute.supplier_response}</p>
                </div>
              )}

              {/* Admin Notes */}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Notas do admin:</p>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Adicione notas sobre a resolução..."
                  rows={3}
                />
              </div>

              {/* Admin Actions */}
              {selectedDispute.status === 'open' && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Ações do administrador:</p>
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={() => handleAdminAction(selectedDispute.id, 'force_continue')}
                      className="bg-green-600 hover:bg-green-700 gap-1"
                      size="sm"
                      disabled={resolving}
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                      Confirmar pagamento e dar continuidade
                    </Button>
                    <Button
                      onClick={() => handleAdminAction(selectedDispute.id, 'force_cancel')}
                      variant="destructive"
                      className="gap-1"
                      size="sm"
                      disabled={resolving}
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Forçar cancelamento (golpe confirmado)
                    </Button>
                    <Button
                      onClick={() => handleAdminAction(selectedDispute.id, 'suspend_supplier')}
                      variant="outline"
                      className="gap-1 text-red-600 border-red-200"
                      size="sm"
                      disabled={resolving}
                    >
                      <Ban className="h-3.5 w-3.5" />
                      Suspender fornecedor
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Disputas;
