import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  FileText,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Calendar,
  RefreshCw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface ContractRequest {
  id: string;
  service_provider_id: string;
  supplier_id: string;
  contract_type: string;
  monthly_value: number | null;
  notes: string | null;
  status: string;
  rejected_reason: string | null;
  requested_at: string;
  responded_at: string | null;
  sp_name?: string;
  sp_email?: string;
}

export const ContractApprovalPanel = () => {
  const { user } = useSupabaseAuth();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<ContractRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ContractRequest | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [user]);

  const fetchRequests = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data } = await supabase
        .from("service_provider_contract_requests")
        .select("*")
        .eq("supplier_id", user.id)
        .order("requested_at", { ascending: false });

      // Enrich with SP data
      const enriched = await Promise.all(
        (data || []).map(async (req) => {
          const { data: sp } = await supabase
            .from("service_providers")
            .select("business_name, user_id")
            .eq("id", req.service_provider_id)
            .maybeSingle();

          let email = "";
          if (sp?.user_id) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("email")
              .eq("id", sp.user_id)
              .maybeSingle();
            email = profile?.email || "";
          }

          return {
            ...req,
            sp_name: sp?.business_name || "Prestador",
            sp_email: email,
          };
        })
      );

      setRequests(enriched);
    } catch (error) {
      console.error("Error fetching contract requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request: ContractRequest) => {
    setProcessing(true);
    try {
      // Update request status
      const { error: updateError } = await supabase
        .from("service_provider_contract_requests")
        .update({
          status: "approved",
          responded_at: new Date().toISOString(),
        })
        .eq("id", request.id);

      if (updateError) throw updateError;

      // Get SP user info for CRM entry
      const { data: sp } = await supabase
        .from("service_providers")
        .select("business_name, user_id")
        .eq("id", request.service_provider_id)
        .maybeSingle();

      // Create CRM entry
      const getNextBillingDate = () => {
        const date = new Date();
        date.setMonth(date.getMonth() + 1);
        return date.toISOString().split("T")[0];
      };

      const crmData: {
        service_provider_id: string;
        client_name: string;
        client_email: string | null;
        client_phone: string | null;
        contract_type: "single" | "monthly";
        monthly_value: number | null;
        next_billing_date: string | null;
        notes: string | null;
      } = {
        service_provider_id: request.service_provider_id,
        client_name: user?.id || "",
        client_email: null,
        client_phone: null,
        contract_type: request.contract_type as "single" | "monthly",
        monthly_value: request.monthly_value,
        next_billing_date: request.contract_type === "monthly" ? getNextBillingDate() : null,
        notes: request.notes,
      };

      const { error: crmError } = await supabase.from("service_provider_crm").insert(crmData);

      if (crmError) throw crmError;

      toast.success("Contrato aprovado!");
      fetchRequests();
    } catch (error: any) {
      console.error("Error approving contract:", error);
      toast.error("Erro ao aprovar contrato");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;

    setProcessing(true);
    try {
      const { error } = await supabase
        .from("service_provider_contract_requests")
        .update({
          status: "rejected",
          rejected_reason: rejectReason || null,
          responded_at: new Date().toISOString(),
        })
        .eq("id", selectedRequest.id);

      if (error) throw error;

      toast.success("Contrato rejeitado");
      setSelectedRequest(null);
      setRejectReason("");
      fetchRequests();
    } catch (error: any) {
      console.error("Error rejecting contract:", error);
      toast.error("Erro ao rejeitar contrato");
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
            <Clock className="h-3 w-3 mr-1" /> Pendente
          </Badge>
        );
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle className="h-3 w-3 mr-1" /> Aprovado
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
            <XCircle className="h-3 w-3 mr-1" /> Rejeitado
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const historyRequests = requests.filter((r) => r.status !== "pending");

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Solicitações de Contrato
              {pendingRequests.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {pendingRequests.length}
                </Badge>
              )}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={fetchRequests}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {pendingRequests.length === 0 && historyRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma solicitação de contrato</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Pending Requests */}
              {pendingRequests.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Aguardando sua aprovação</h4>
                  {pendingRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-4 rounded-lg border border-amber-500/30 bg-amber-500/5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">{req.sp_name}</p>
                            {getStatusBadge(req.status)}
                          </div>
                          {req.sp_email && (
                            <p className="text-sm text-muted-foreground">{req.sp_email}</p>
                          )}
                          <div className="flex items-center gap-3 mt-2 text-sm">
                            <Badge variant="outline">
                              {req.contract_type === "monthly" ? (
                                <><Calendar className="h-3 w-3 mr-1" /> Mensal</>
                              ) : (
                                "Único"
                              )}
                            </Badge>
                            {req.monthly_value && (
                              <span className="flex items-center gap-1 text-green-600 font-medium">
                                <DollarSign className="h-3.5 w-3.5" />
                                R$ {Number(req.monthly_value).toFixed(2)}/mês
                              </span>
                            )}
                          </div>
                          {req.notes && (
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                              {req.notes}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            Solicitado em{" "}
                            {format(new Date(req.requested_at), "dd/MM/yyyy 'às' HH:mm", {
                              locale: ptBR,
                            })}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApprove(req)}
                            disabled={processing}
                          >
                            {processing ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Aprovar
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedRequest(req)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Rejeitar
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* History */}
              {historyRequests.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Histórico</h4>
                  {historyRequests.slice(0, 5).map((req) => (
                    <div
                      key={req.id}
                      className="p-3 rounded-lg border border-border bg-muted/30"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{req.sp_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(req.requested_at), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        </div>
                        {getStatusBadge(req.status)}
                      </div>
                      {req.rejected_reason && (
                        <p className="text-xs text-red-500 mt-1">
                          Motivo: {req.rejected_reason}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Solicitação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Tem certeza que deseja rejeitar a solicitação de contrato de{" "}
              <strong>{selectedRequest?.sp_name}</strong>?
            </p>
            <div>
              <Label>Motivo da rejeição (opcional)</Label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explique o motivo da rejeição..."
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedRequest(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={processing}>
              {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar Rejeição"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
