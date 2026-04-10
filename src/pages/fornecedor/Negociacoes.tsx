import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Handshake, Search, Truck, CheckCircle, Clock, XCircle, Loader2, FileText, ShieldAlert, DollarSign, AlertTriangle, Upload, Eye, Download, User } from "lucide-react";
import { generateNegotiationPDF } from "@/components/cliente/NegotiationContractPDF";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useToast } from "@/hooks/use-toast";
import { getTimeUntilAllowed, formatCountdown } from "@/hooks/useNegotiations";
import type { Negotiation as NegType } from "@/hooks/useNegotiations";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency } from "@/utils/formatCurrency";

interface Negotiation {
  id: string;
  buyer_id: string;
  supplier_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  agreed_price: number;
  payment_method: string;
  expected_delivery: string | null;
  status: string;
  buyer_confirmed_delivery: boolean;
  supplier_confirmed_shipping: boolean;
  shipping_confirmed_at: string | null;
  delivery_confirmed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  buyerName?: string;
  // Payment security
  payment_state: string;
  payment_reported_at: string | null;
  payment_proof_url: string | null;
  payment_reference: string | null;
  payment_confirmed_at: string | null;
  payment_contested_reason: string | null;
  // NF
  buyer_data: Record<string, any> | null;
  invoice_url: string | null;
  sale_unit: string | null;
  unit_price: number | null;
}

const Negociacoes = () => {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");

  // Dialogs
  const [contestDialog, setContestDialog] = useState(false);
  const [contestReason, setContestReason] = useState("");
  const [contestNegId, setContestNegId] = useState<string | null>(null);
  const [buyerDataDialog, setBuyerDataDialog] = useState(false);
  const [selectedBuyerData, setSelectedBuyerData] = useState<Record<string, any> | null>(null);
  const invoiceInputRef = useRef<HTMLInputElement>(null);
  const [invoiceNegId, setInvoiceNegId] = useState<string | null>(null);

  const fetchNegotiations = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('negotiations' as any)
        .select('*')
        .eq('supplier_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const negs = (data || []) as any as Negotiation[];

      const buyerIds = [...new Set(negs.map(n => n.buyer_id))];
      if (buyerIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles' as any)
          .select('id, nome')
          .in('id', buyerIds);
        
        const profileMap = new Map((profiles || []).map((p: any) => [p.id, p.nome]));
        negs.forEach(n => { n.buyerName = profileMap.get(n.buyer_id) || 'Comprador'; });
      }

      setNegotiations(negs);
    } catch (err) {
      console.error('Error fetching negotiations:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchNegotiations(); }, [fetchNegotiations]);

  const updateStatus = async (id: string, status: string, extra: Record<string, any> = {}) => {
    try {
      const { error } = await supabase
        .from('negotiations' as any)
        .update({ status, updated_at: new Date().toISOString(), ...extra } as any)
        .eq('id', id);
      if (error) {
        if (error.message?.includes('pagamento informado') || error.message?.includes('Não é possível cancelar')) {
          toast({ title: 'Ação bloqueada', description: error.message, variant: 'destructive' });
          return;
        }
        throw error;
      }
      toast({ title: 'Status atualizado!', description: `Negociação marcada como "${status}".` });
      fetchNegotiations();
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  const handleAccept = (id: string) => updateStatus(id, 'accepted');
  const handleShip = (id: string) => updateStatus(id, 'shipped', {
    supplier_confirmed_shipping: true,
    shipping_confirmed_at: new Date().toISOString(),
  });
  const handleCancel = (id: string) => updateStatus(id, 'cancelled');

  const handleConfirmPayment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('negotiations' as any)
        .update({
          payment_state: 'confirmed_by_supplier',
          payment_confirmed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', id);
      if (error) throw error;
      toast({ title: 'Pagamento confirmado!', description: 'Pagamento do comprador foi localizado.' });
      fetchNegotiations();
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  const handleContestPayment = async (isFakePayment = false) => {
    if (!contestNegId || !contestReason.trim()) return;
    try {
      const reason = isFakePayment ? `[COMPROVANTE FALSO] ${contestReason}` : contestReason;
      const { error } = await supabase
        .from('negotiations' as any)
        .update({
          payment_state: 'contested_by_supplier',
          payment_contested_reason: reason,
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', contestNegId);
      if (error) throw error;

      // If fake payment, auto-create dispute for admin
      if (isFakePayment) {
        const neg = negotiations.find(n => n.id === contestNegId);
        if (neg && user) {
          await supabase
            .from('disputes' as any)
            .insert([{
              negotiation_id: contestNegId,
              buyer_id: neg.buyer_id,
              supplier_id: user.id,
              reason: 'fake_payment',
              description: reason,
            }] as any);
        }
      }

      toast({ 
        title: isFakePayment ? 'Comprovante falso reportado' : 'Pagamento contestado', 
        description: isFakePayment ? 'A disputa foi escalada para o administrador.' : 'A contestação foi registrada.' 
      });
      setContestDialog(false);
      setContestReason('');
      setContestNegId(null);
      fetchNegotiations();
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  const handleInvoiceUpload = async (file: File) => {
    if (!invoiceNegId || !user) return;
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/${invoiceNegId}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('invoices')
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('invoices')
        .getPublicUrl(path);

      const { error } = await supabase
        .from('negotiations' as any)
        .update({ invoice_url: urlData.publicUrl, updated_at: new Date().toISOString() } as any)
        .eq('id', invoiceNegId);
      if (error) throw error;
      toast({ title: 'NF anexada!', description: 'Nota fiscal enviada ao comprador.' });
      setInvoiceNegId(null);
      fetchNegotiations();
    } catch (err: any) {
      toast({ title: 'Erro ao enviar NF', description: err.message, variant: 'destructive' });
    }
  };

  const filtered = negotiations.filter(n => {
    const matchesSearch = !search || n.product_name.toLowerCase().includes(search.toLowerCase()) || n.buyerName?.toLowerCase().includes(search.toLowerCase());
    const matchesTab = tab === 'all' || n.status === tab;
    return matchesSearch && matchesTab;
  });

  const statusCounts = {
    all: negotiations.length,
    pending: negotiations.filter(n => n.status === 'pending').length,
    accepted: negotiations.filter(n => n.status === 'accepted').length,
    shipped: negotiations.filter(n => n.status === 'shipped').length,
    delivered: negotiations.filter(n => n.status === 'delivered').length,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />Pendente</Badge>;
      case 'accepted': return <Badge className="bg-blue-100 text-blue-800 gap-1"><CheckCircle className="h-3 w-3" />Aceita</Badge>;
      case 'shipped': return <Badge className="bg-orange-100 text-orange-800 gap-1"><Truck className="h-3 w-3" />Enviada</Badge>;
      case 'delivered': return <Badge className="bg-green-100 text-green-800 gap-1"><CheckCircle className="h-3 w-3" />Entregue</Badge>;
      case 'cancelled': return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Cancelada</Badge>;
      case 'disputed': return <Badge className="bg-red-100 text-red-800 gap-1">Disputada</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentStateBadge = (state: string) => {
    switch (state) {
      case 'reported_by_buyer': return <Badge className="bg-blue-100 text-blue-700 text-[10px]">💰 Pagamento informado</Badge>;
      case 'confirmed_by_supplier': return <Badge className="bg-green-100 text-green-700 text-[10px]">✅ Pagamento confirmado</Badge>;
      case 'contested_by_supplier': return <Badge className="bg-red-100 text-red-700 text-[10px]">⚠️ Pagamento contestado</Badge>;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Negociações</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie suas negociações com compradores</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por produto ou comprador..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <div className="w-full overflow-x-auto -mx-1 px-1">
          <TabsList className="inline-flex w-auto min-w-full h-auto">
            <TabsTrigger value="all" className="text-[10px] sm:text-xs py-2 px-2 sm:px-3 whitespace-nowrap">Todas ({statusCounts.all})</TabsTrigger>
            <TabsTrigger value="pending" className="text-[10px] sm:text-xs py-2 px-2 sm:px-3 whitespace-nowrap">Pendentes ({statusCounts.pending})</TabsTrigger>
            <TabsTrigger value="accepted" className="text-[10px] sm:text-xs py-2 px-2 sm:px-3 whitespace-nowrap">Aceitas ({statusCounts.accepted})</TabsTrigger>
            <TabsTrigger value="shipped" className="text-[10px] sm:text-xs py-2 px-2 sm:px-3 whitespace-nowrap">Enviadas ({statusCounts.shipped})</TabsTrigger>
            <TabsTrigger value="delivered" className="text-[10px] sm:text-xs py-2 px-2 sm:px-3 whitespace-nowrap">Entregues ({statusCounts.delivered})</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value={tab} className="mt-4">
          {filtered.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Handshake className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhuma negociação encontrada</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filtered.map(neg => {
                const canCancel = (neg.status === 'pending' || neg.status === 'accepted') && neg.payment_state === 'not_reported';
                const hasPaymentReported = neg.payment_state !== 'not_reported';
                const needsPaymentAction = neg.payment_state === 'reported_by_buyer';

                return (
                  <Card key={neg.id} className={`overflow-hidden hover:shadow-lg transition-shadow ${needsPaymentAction ? 'border-blue-300' : ''}`}>
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col gap-4">
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <h3 className="font-semibold text-sm sm:text-base truncate">{neg.product_name}</h3>
                            <div className="flex flex-col items-end gap-1">
                              {getStatusBadge(neg.status)}
                              {getPaymentStateBadge(neg.payment_state)}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 text-xs sm:text-sm">
                            <div>
                              <span className="text-muted-foreground">Comprador:</span>
                              <span className="ml-1 font-medium">{neg.buyerName}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Quantidade:</span>
                              <span className="ml-1 font-medium">{neg.quantity}{neg.sale_unit ? ` (${neg.sale_unit})` : ''}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Valor acordado:</span>
                              <span className="ml-1 font-bold text-primary">{formatCurrency(neg.agreed_price)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Pagamento:</span>
                              <span className="ml-1 font-medium">{neg.payment_method}</span>
                            </div>
                            {neg.expected_delivery && (
                              <div>
                                <span className="text-muted-foreground">Entrega prevista:</span>
                                <span className="ml-1 font-medium">{format(new Date(neg.expected_delivery), 'dd/MM/yyyy')}</span>
                              </div>
                            )}
                            <div>
                              <span className="text-muted-foreground">Registrada em:</span>
                              <span className="ml-1">{format(new Date(neg.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                            </div>
                          </div>

                          {neg.notes && (
                            <p className="text-xs text-muted-foreground bg-muted/50 rounded p-2 mt-2">📝 {neg.notes}</p>
                          )}

                          {/* Payment reported banner */}
                          {needsPaymentAction && (
                            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 space-y-2">
                              <div className="flex items-center gap-1.5 text-xs text-blue-700 font-medium">
                                <DollarSign className="h-3.5 w-3.5" />
                                Comprador informou que pagou
                              </div>
                              {neg.payment_reference && (
                                <p className="text-xs text-blue-600">Referência: {neg.payment_reference}</p>
                              )}
                              {neg.payment_proof_url && (
                                <a href={neg.payment_proof_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline flex items-center gap-1">
                                  <Eye className="h-3 w-3" /> Ver comprovante
                                </a>
                              )}
                              <div className="flex gap-2">
                                <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700 gap-1" onClick={() => handleConfirmPayment(neg.id)}>
                                  <CheckCircle className="h-3.5 w-3.5" />
                                  Confirmar recebimento
                                </Button>
                                <Button size="sm" variant="outline" className="flex-1 text-red-600 border-red-200 gap-1" onClick={() => {
                                  setContestNegId(neg.id);
                                  setContestReason('');
                                  setContestDialog(true);
                                }}>
                                  <AlertTriangle className="h-3.5 w-3.5" />
                                  Não localizei
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* Buyer data for NF */}
                          {neg.buyer_data && Object.keys(neg.buyer_data).length > 0 && (
                            <Button size="sm" variant="ghost" className="gap-1 text-xs" onClick={() => {
                              setSelectedBuyerData(neg.buyer_data);
                              setBuyerDataDialog(true);
                            }}>
                              <User className="h-3.5 w-3.5" />
                              Ver dados do comprador (NF)
                            </Button>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-row sm:flex-col gap-2 flex-shrink-0 flex-wrap">
                          <NegotiationActions
                            neg={neg}
                            userEmail={user?.email || 'Fornecedor'}
                            onAccept={handleAccept}
                            onShip={handleShip}
                            onCancel={canCancel ? handleCancel : undefined}
                            onUploadInvoice={(id) => {
                              setInvoiceNegId(id);
                              invoiceInputRef.current?.click();
                            }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Hidden file input for invoice upload */}
      <input
        ref={invoiceInputRef}
        type="file"
        accept="application/pdf,image/*"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) handleInvoiceUpload(file);
          e.target.value = '';
        }}
      />

      {/* Contest Payment Dialog */}
      <Dialog open={contestDialog} onOpenChange={setContestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Contestar Pagamento
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Informe o motivo pelo qual não localizou o pagamento. O comprador será notificado.
            </p>
            <Textarea
              value={contestReason}
              onChange={e => setContestReason(e.target.value)}
              placeholder="Ex: Não localizei o PIX na conta informada..."
              rows={3}
            />
            <div className="flex flex-col gap-2">
              <Button onClick={() => handleContestPayment(false)} variant="outline" className="w-full gap-1 border-orange-300 text-orange-700" disabled={!contestReason.trim()}>
                <AlertTriangle className="h-4 w-4" />
                Não localizei o pagamento
              </Button>
              <Button onClick={() => handleContestPayment(true)} variant="destructive" className="w-full gap-1" disabled={!contestReason.trim()}>
                <ShieldAlert className="h-4 w-4" />
                Alegar comprovante falso (escalar para admin)
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Buyer Data Dialog */}
      <Dialog open={buyerDataDialog} onOpenChange={setBuyerDataDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Dados do Comprador para NF
            </DialogTitle>
          </DialogHeader>
          {selectedBuyerData && (
            <div className="space-y-2 text-sm">
              {selectedBuyerData.nome && <div><span className="text-muted-foreground">Nome:</span> <span className="font-medium">{selectedBuyerData.nome}</span></div>}
              {selectedBuyerData.documento && <div><span className="text-muted-foreground">CPF/CNPJ:</span> <span className="font-medium">{selectedBuyerData.documento}</span></div>}
              {selectedBuyerData.ie && <div><span className="text-muted-foreground">IE:</span> <span className="font-medium">{selectedBuyerData.ie}</span></div>}
              {selectedBuyerData.telefone && <div><span className="text-muted-foreground">Telefone:</span> <span className="font-medium">{selectedBuyerData.telefone}</span></div>}
              {selectedBuyerData.endereco && <div><span className="text-muted-foreground">Endereço:</span> <span className="font-medium">{selectedBuyerData.endereco}</span></div>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Sub-component with countdown timer for anti-fraud
const NegotiationActions = ({ neg, userEmail, onAccept, onShip, onCancel, onUploadInvoice }: {
  neg: Negotiation;
  userEmail: string;
  onAccept: (id: string) => void;
  onShip: (id: string) => void;
  onCancel?: (id: string) => void;
  onUploadInvoice: (id: string) => void;
}) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const asNegType = neg as unknown as NegType;
  const timing = getTimeUntilAllowed(asNegType);

  return (
    <div className="flex flex-row sm:flex-col gap-2 flex-shrink-0 flex-wrap">
      {neg.status === 'pending' && (
        <>
          <Button size="sm" onClick={() => onAccept(neg.id)} className="flex-1 sm:flex-none" disabled={!timing.allowed}>
            <CheckCircle className="h-4 w-4 mr-1" />
            {timing.allowed ? 'Aceitar' : formatCountdown(timing.remainingMs)}
          </Button>
          {onCancel && (
            <Button size="sm" variant="outline" onClick={() => onCancel(neg.id)} className="flex-1 sm:flex-none text-destructive">
              <XCircle className="h-4 w-4 mr-1" />
              Recusar
            </Button>
          )}
          {!timing.allowed && (
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <ShieldAlert className="h-3 w-3" /> Segurança anti-fraude
            </p>
          )}
        </>
      )}
      {neg.status === 'accepted' && (
        <>
          <Button size="sm" onClick={() => onShip(neg.id)} className="bg-orange-600 hover:bg-orange-700" disabled={!timing.allowed}>
            <Truck className="h-4 w-4 mr-1" />
            {timing.allowed ? 'Confirmar Envio' : formatCountdown(timing.remainingMs)}
          </Button>
          {onCancel && (
            <Button size="sm" variant="outline" onClick={() => onCancel(neg.id)} className="text-destructive">
              <XCircle className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
          )}
          {!timing.allowed && (
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <ShieldAlert className="h-3 w-3" /> Segurança anti-fraude
            </p>
          )}
        </>
      )}
      {/* PDF & Invoice for accepted/shipped/delivered */}
      {['accepted', 'shipped', 'delivered'].includes(neg.status) && (
        <>
          <Button
            size="sm"
            variant="outline"
            className="gap-1"
            onClick={() => generateNegotiationPDF({
              ...neg,
              buyerName: neg.buyerName,
              supplierName: userEmail,
            })}
          >
            <FileText className="h-4 w-4 mr-1" />
            PDF
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1"
            onClick={() => onUploadInvoice(neg.id)}
          >
            <Upload className="h-4 w-4 mr-1" />
            {neg.invoice_url ? 'Atualizar NF' : 'Anexar NF'}
          </Button>
          {neg.invoice_url && (
            <a href={neg.invoice_url} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="ghost" className="gap-1 text-xs">
                <Download className="h-3.5 w-3.5" />
                Ver NF
              </Button>
            </a>
          )}
        </>
      )}
      {neg.status === 'shipped' && (
        <div className="text-xs text-orange-600 text-center bg-orange-50 dark:bg-orange-900/20 rounded p-2">
          <Truck className="h-4 w-4 mx-auto mb-1" />
          Aguardando confirmação do comprador
        </div>
      )}
      {neg.status === 'delivered' && (
        <div className="text-xs text-green-600 text-center bg-green-50 dark:bg-green-900/20 rounded p-2">
          <CheckCircle className="h-4 w-4 mx-auto mb-1" />
          Entrega confirmada
          {neg.delivery_confirmed_at && (
            <p className="mt-0.5">{format(new Date(neg.delivery_confirmed_at), "dd/MM/yyyy", { locale: ptBR })}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Negociacoes;
