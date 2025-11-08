import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DollarSign, Check, X, Clock, User, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

const Saques = () => {
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [adminNote, setAdminNote] = useState("");

  useEffect(() => {
    fetchPayouts();
  }, []);

  const fetchPayouts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('payouts')
        .select(`
          *,
          profiles!payouts_supplier_id_fkey(nome)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching payouts:', error);
      toast.error('Erro ao carregar saques');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const { error } = await supabase
        .from('payouts')
        .update({ status: 'approved', admin_note: adminNote })
        .eq('id', id);

      if (error) throw error;
      toast.success("Saque aprovado!");
      setAdminNote("");
      setSelectedRequest(null);
      fetchPayouts();
    } catch (error) {
      console.error('Error approving payout:', error);
      toast.error('Erro ao aprovar saque');
    }
  };

  const handleReject = async (id: string) => {
    try {
      if (!adminNote.trim()) {
        toast.error("Adicione um motivo para recusar o saque");
        return;
      }

      const { error } = await supabase
        .from('payouts')
        .update({ status: 'rejected', admin_note: adminNote })
        .eq('id', id);

      if (error) throw error;
      toast.error("Saque recusado!");
      setAdminNote("");
      setSelectedRequest(null);
      fetchPayouts();
    } catch (error) {
      console.error('Error rejecting payout:', error);
      toast.error('Erro ao recusar saque');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { label: 'Pendente', class: 'bg-yellow-100 text-yellow-800' },
      approved: { label: 'Aprovado', class: 'bg-green-100 text-green-800' },
      rejected: { label: 'Recusado', class: 'bg-red-100 text-red-800' },
    };
    return badges[status as keyof typeof badges];
  };

  const pendingTotal = requests
    .filter(r => r.status === 'requested')
    .reduce((sum, r) => sum + Number(r.amount), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2 dark:text-white dark:bg-none">Controle de Saques</h1>
        <p className="text-muted-foreground">Gerencie pedidos de saque dos fornecedores</p>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Saques Pendentes</p>
            <Clock className="h-5 w-5 text-yellow-600" />
          </div>
          <p className="text-3xl font-bold">{requests.filter(r => r.status === 'requested').length}</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Total Pendente</p>
            <DollarSign className="h-5 w-5 text-yellow-600" />
          </div>
          <p className="text-3xl font-bold">R$ {pendingTotal.toFixed(2)}</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Aprovados (mês)</p>
            <Check className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold">{requests.filter(r => r.status === 'approved').length}</p>
        </Card>
      </div>

      {/* Lista de Solicitações */}
      <Card>
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">Solicitações de Saque</h2>
        </div>
        <div className="divide-y">
          {requests.length > 0 ? requests.map((request) => {
            const badge = getStatusBadge(request.status);
            return (
              <div key={request.id} className="p-6 hover:bg-muted/20 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{request.profiles?.nome || 'Fornecedor'}</p>
                        <p className="text-xs text-muted-foreground">PIX: {request.pix_key}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Valor</p>
                        <p className="font-bold text-lg text-primary">R$ {Number(request.amount).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Data</p>
                        <p>{format(new Date(request.created_at), 'dd/MM/yyyy')}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge className={badge.class}>{badge.label}</Badge>
                    {request.status === 'requested' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { setSelectedRequest(request); setAdminNote(""); }}
                      >
                        Ver Detalhes
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          }) : (
            <div className="p-12 text-center text-muted-foreground">
              Nenhuma solicitação de saque
            </div>
          )}
        </div>
      </Card>

      {/* Dialog de Detalhes */}
      <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do Saque</DialogTitle>
            <DialogDescription>Solicitação #{selectedRequest?.id}</DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Fornecedor</p>
                <p className="font-semibold">{selectedRequest.profiles?.nome || 'Fornecedor'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Valor Solicitado</p>
                <p className="text-2xl font-bold text-primary">R$ {Number(selectedRequest.amount).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Chave PIX</p>
                <p className="font-mono text-sm">{selectedRequest.pix_key}</p>
              </div>
              <div>
                <Label htmlFor="admin-note">Observações (opcional para aprovar, obrigatório para recusar)</Label>
                <Textarea
                  id="admin-note"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Adicione uma observação..."
                  rows={3}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => handleApprove(selectedRequest.id)}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Aprovar
                </Button>
                <Button
                  className="flex-1"
                  variant="destructive"
                  onClick={() => handleReject(selectedRequest.id)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Recusar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Saques;
