import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, CheckCircle, XCircle, Eye } from "lucide-react";
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
}

const statusConfig: Record<string, { label: string; color: string }> = {
  open: { label: "Aberta", color: "bg-orange-100 text-orange-700 border-orange-200" },
  resolved: { label: "Resolvida", color: "bg-green-100 text-green-700 border-green-200" },
  scam_confirmed: { label: "Golpe Confirmado", color: "bg-destructive/10 text-destructive border-destructive/20" },
  buyer_issue: { label: "Problema do Comprador", color: "bg-blue-100 text-blue-700 border-blue-200" },
};

const Disputas = () => {
  const [disputes, setDisputes] = useState<AdminDispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState<AdminDispute | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

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

  const handleResolve = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('disputes' as any)
        .update({
          status,
          admin_notes: adminNotes || null,
          resolved_at: new Date().toISOString(),
        } as any)
        .eq('id', id);
      if (error) throw error;

      // If scam confirmed, suspend supplier
      if (status === 'scam_confirmed') {
        const dispute = disputes.find(d => d.id === id);
        if (dispute) {
          await supabase
            .from('profiles')
            .update({ ativo: false } as any)
            .eq('id', dispute.supplier_id);
        }
      }

      toast.success("Disputa atualizada!");
      setSelectedDispute(null);
      setAdminNotes("");
      fetchDisputes();
    } catch (err: any) {
      toast.error(err.message);
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
            return (
              <Card key={dispute.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-sm">{dispute.product_name}</p>
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
                    {dispute.supplier_response && (
                      <p className="text-primary">Fornecedor respondeu ✓</p>
                    )}
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes da Disputa</DialogTitle>
          </DialogHeader>
          {selectedDispute && (
            <div className="space-y-4">
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
              </div>

              {selectedDispute.description && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Descrição do comprador:</p>
                  <p className="text-sm bg-muted p-2 rounded">{selectedDispute.description}</p>
                </div>
              )}

              {selectedDispute.supplier_response && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Resposta do fornecedor:</p>
                  <p className="text-sm bg-blue-50 p-2 rounded">{selectedDispute.supplier_response}</p>
                </div>
              )}

              <div>
                <p className="text-xs text-muted-foreground mb-1">Notas do admin:</p>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Adicione notas sobre a resolução..."
                  rows={3}
                />
              </div>

              {selectedDispute.status === 'open' && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleResolve(selectedDispute.id, 'resolved')}
                    className="flex-1 bg-green-600 hover:bg-green-700 gap-1"
                    size="sm"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    Resolvida
                  </Button>
                  <Button
                    onClick={() => handleResolve(selectedDispute.id, 'scam_confirmed')}
                    variant="destructive"
                    className="flex-1 gap-1"
                    size="sm"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Golpe Confirmado
                  </Button>
                  <Button
                    onClick={() => handleResolve(selectedDispute.id, 'buyer_issue')}
                    variant="outline"
                    className="flex-1 gap-1"
                    size="sm"
                  >
                    Problema Comprador
                  </Button>
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
