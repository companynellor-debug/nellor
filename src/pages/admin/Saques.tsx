import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DollarSign, Clock, Check, AlertTriangle, Eye, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

const Saques = () => {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

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
          profiles!payouts_supplier_id_fkey(nome, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching payouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      requested: { label: 'Solicitado', className: 'bg-yellow-100 text-yellow-800' },
      approved: { label: 'Aprovado', className: 'bg-green-100 text-green-800' },
      paid: { label: 'Pago', className: 'bg-blue-100 text-blue-800' },
      rejected: { label: 'Recusado', className: 'bg-red-100 text-red-800' },
    };
    return badges[status] || { label: status, className: '' };
  };

  const totalPending = requests
    .filter(r => r.status === 'requested')
    .reduce((sum, r) => sum + Number(r.amount), 0);

  const totalApproved = requests
    .filter(r => r.status === 'approved' || r.status === 'paid')
    .reduce((sum, r) => sum + Number(r.amount), 0);


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Histórico de Saques</h1>
        <p className="text-muted-foreground">
          Registro histórico de solicitações de saque (sistema legado)
        </p>
      </div>

      {/* Aviso sobre novo sistema */}
      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/20">
        <CardContent className="p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-blue-800 dark:text-blue-200 mb-1">
              Sistema de saques desativado
            </p>
            <p className="text-blue-700 dark:text-blue-300">
              Com a integração do Stripe Connect, os pagamentos aos fornecedores são 
              realizados automaticamente. Esta página exibe apenas o histórico de 
              solicitações anteriores. Novos saques não podem ser aprovados ou 
              processados manualmente.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Solicitações Pendentes (Legado)</p>
            <Clock className="h-5 w-5 text-yellow-600" />
          </div>
          <p className="text-3xl font-bold">{requests.filter(r => r.status === 'requested').length}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Não serão mais processadas
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Total Pendente (Legado)</p>
            <DollarSign className="h-5 w-5 text-yellow-600" />
          </div>
          <p className="text-3xl font-bold">R$ {totalPending.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Será migrado para Stripe
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Total Aprovado (Histórico)</p>
            <Check className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold">R$ {totalApproved.toFixed(2)}</p>
        </Card>
      </div>

      {/* Lista de Solicitações (Somente Leitura) */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            Histórico de Solicitações
            <Badge variant="outline" className="ml-2">Somente leitura</Badge>
          </CardTitle>
        </CardHeader>
        <div className="divide-y">
          {requests.length > 0 ? requests.map((request) => {
            const badge = getStatusBadge(request.status);
            return (
              <div key={request.id} className="p-6 hover:bg-muted/20 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <DollarSign className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{request.profiles?.nome || 'Fornecedor'}</p>
                        <p className="text-xs text-muted-foreground">{request.profiles?.email}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm mt-3">
                      <div>
                        <p className="text-muted-foreground">Valor</p>
                        <p className="font-bold text-lg text-primary">R$ {Number(request.amount).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Data Solicitação</p>
                        <p>{format(new Date(request.created_at), 'dd/MM/yyyy HH:mm')}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Método</p>
                        <p>Stripe Transfer</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge className={badge.className}>{badge.label}</Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedRequest(request)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Detalhes
                    </Button>
                  </div>
                </div>
              </div>
            );
          }) : (
            <div className="p-12 text-center text-muted-foreground">
              <p>Nenhuma solicitação de saque no histórico</p>
            </div>
          )}
        </div>
      </Card>

      {/* Dialog de Detalhes (Somente Leitura) */}
      <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do Saque</DialogTitle>
            <DialogDescription>
              Registro histórico - Solicitação #{selectedRequest?.id?.slice(0, 8)}
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Fornecedor</p>
                  <p className="font-semibold">{selectedRequest.profiles?.nome}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-semibold">{selectedRequest.profiles?.email}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Valor Solicitado</p>
                <p className="text-2xl font-bold text-primary">
                  R$ {Number(selectedRequest.amount).toFixed(2)}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Chave PIX</p>
                <p className="font-mono text-sm bg-muted p-2 rounded">{selectedRequest.pix_key}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge className={getStatusBadge(selectedRequest.status).className}>
                  {getStatusBadge(selectedRequest.status).label}
                </Badge>
              </div>

              {selectedRequest.admin_note && (
                <div>
                  <p className="text-sm text-muted-foreground">Observação do Admin</p>
                  <p className="text-sm bg-muted p-3 rounded">{selectedRequest.admin_note}</p>
                </div>
              )}

              <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
                <p className="text-xs text-amber-800 dark:text-amber-200">
                  <AlertTriangle className="h-4 w-4 inline mr-1" />
                  Este é um registro histórico. O sistema de saques manuais foi desativado 
                  em favor dos pagamentos automáticos via Stripe Connect.
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Saques;
