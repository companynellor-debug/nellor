import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { CheckCircle, XCircle, Eye, Clock, Search, FileText, User, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type Application = {
  id: string;
  user_id: string;
  status: string;
  business_type: string;
  full_name: string;
  cpf: string | null;
  cnpj: string | null;
  company_name: string | null;
  phone: string;
  product_category: string | null;
  business_description: string | null;
  address_cep: string;
  address_street: string;
  address_number: string;
  address_complement: string | null;
  address_neighborhood: string;
  address_city: string;
  address_state: string;
  document_front_url: string | null;
  document_back_url: string | null;
  selfie_url: string | null;
  extra_document_url: string | null;
  rejection_reason: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  created_at: string;
  user_email: string | null;
  user_name: string | null;
};

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pendente", variant: "outline" },
  under_review: { label: "Em Análise", variant: "secondary" },
  approved: { label: "Aprovado", variant: "default" },
  rejected: { label: "Rejeitado", variant: "destructive" },
};

const SolicitacoesFornecedor = () => {
  const queryClient = useQueryClient();
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["admin-supplier-applications"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_admin_supplier_applications");
      if (error) throw error;
      return (data ?? []) as Application[];
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (appId: string) => {
      const { error } = await supabase.rpc("admin_approve_supplier_application", {
        _application_id: appId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-supplier-applications"] });
      toast.success("Fornecedor aprovado com sucesso!");
      setSelectedApp(null);
    },
    onError: (err: any) => toast.error("Erro: " + err.message),
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ appId, reason }: { appId: string; reason: string }) => {
      const { error } = await supabase.rpc("admin_reject_supplier_application", {
        _application_id: appId,
        _reason: reason,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-supplier-applications"] });
      toast.success("Solicitação rejeitada.");
      setShowRejectDialog(false);
      setSelectedApp(null);
      setRejectionReason("");
    },
    onError: (err: any) => toast.error("Erro: " + err.message),
  });

  const filtered = applications.filter((a) => {
    const matchesSearch =
      !searchTerm ||
      a.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.user_email ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.cnpj ?? "").includes(searchTerm) ||
      (a.cpf ?? "").includes(searchTerm);
    const matchesStatus = filterStatus === "all" || a.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = applications.filter((a) => a.status === "under_review" || a.status === "pending").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Solicitações de Fornecedor</h1>
          <p className="text-muted-foreground text-sm">
            {pendingCount > 0 ? `${pendingCount} solicitação(ões) pendente(s)` : "Nenhuma pendência"}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email, CPF ou CNPJ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {["all", "pending", "under_review", "approved", "rejected"].map((s) => (
            <Button
              key={s}
              size="sm"
              variant={filterStatus === s ? "default" : "outline"}
              onClick={() => setFilterStatus(s)}
            >
              {s === "all" ? "Todos" : statusConfig[s]?.label ?? s}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Carregando...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">Nenhuma solicitação encontrada.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Solicitante</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{app.full_name}</p>
                        <p className="text-xs text-muted-foreground">{app.user_email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {app.business_type === "company" ? <Building2 className="w-4 h-4" /> : <User className="w-4 h-4" />}
                        <span className="text-sm">{app.business_type === "company" ? "PJ" : "PF"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{app.cnpj || app.cpf || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={statusConfig[app.status]?.variant ?? "outline"}>
                        {statusConfig[app.status]?.label ?? app.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(app.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => setSelectedApp(app)}>
                        <Eye className="w-4 h-4 mr-1" /> Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedApp} onOpenChange={(open) => !open && setSelectedApp(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedApp && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Detalhes da Solicitação
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Status */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Status:</span>
                  <Badge variant={statusConfig[selectedApp.status]?.variant ?? "outline"}>
                    {statusConfig[selectedApp.status]?.label ?? selectedApp.status}
                  </Badge>
                </div>

                {/* Personal info */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Dados Pessoais</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-muted-foreground">Nome:</span> <p className="font-medium">{selectedApp.full_name}</p></div>
                    <div><span className="text-muted-foreground">Email:</span> <p className="font-medium">{selectedApp.user_email}</p></div>
                    <div><span className="text-muted-foreground">Telefone:</span> <p className="font-medium">{selectedApp.phone}</p></div>
                    <div><span className="text-muted-foreground">Tipo:</span> <p className="font-medium">{selectedApp.business_type === "company" ? "Pessoa Jurídica" : "Pessoa Física"}</p></div>
                    {selectedApp.cpf && <div><span className="text-muted-foreground">CPF:</span> <p className="font-medium">{selectedApp.cpf}</p></div>}
                    {selectedApp.cnpj && <div><span className="text-muted-foreground">CNPJ:</span> <p className="font-medium">{selectedApp.cnpj}</p></div>}
                    {selectedApp.company_name && <div className="col-span-2"><span className="text-muted-foreground">Razão Social:</span> <p className="font-medium">{selectedApp.company_name}</p></div>}
                  </CardContent>
                </Card>

                {/* Address */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Endereço</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <p>{selectedApp.address_street}, {selectedApp.address_number}{selectedApp.address_complement ? ` - ${selectedApp.address_complement}` : ""}</p>
                    <p>{selectedApp.address_neighborhood} - {selectedApp.address_city}/{selectedApp.address_state}</p>
                    <p>CEP: {selectedApp.address_cep}</p>
                  </CardContent>
                </Card>

                {/* Business info */}
                {(selectedApp.product_category || selectedApp.business_description) && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Negócio</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-1">
                      {selectedApp.product_category && <p><span className="text-muted-foreground">Categoria:</span> {selectedApp.product_category}</p>}
                      {selectedApp.business_description && <p><span className="text-muted-foreground">Descrição:</span> {selectedApp.business_description}</p>}
                    </CardContent>
                  </Card>
                )}

                {/* Documents */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Documentos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {selectedApp.document_front_url && (
                        <a href={selectedApp.document_front_url} target="_blank" rel="noopener noreferrer" className="block">
                          <img src={selectedApp.document_front_url} alt="Frente doc" className="w-full h-32 object-cover rounded-lg border" />
                          <p className="text-xs text-center mt-1 text-muted-foreground">Frente</p>
                        </a>
                      )}
                      {selectedApp.document_back_url && (
                        <a href={selectedApp.document_back_url} target="_blank" rel="noopener noreferrer" className="block">
                          <img src={selectedApp.document_back_url} alt="Verso doc" className="w-full h-32 object-cover rounded-lg border" />
                          <p className="text-xs text-center mt-1 text-muted-foreground">Verso</p>
                        </a>
                      )}
                      {selectedApp.selfie_url && (
                        <a href={selectedApp.selfie_url} target="_blank" rel="noopener noreferrer" className="block">
                          <img src={selectedApp.selfie_url} alt="Selfie" className="w-full h-32 object-cover rounded-lg border" />
                          <p className="text-xs text-center mt-1 text-muted-foreground">Selfie</p>
                        </a>
                      )}
                      {selectedApp.extra_document_url && (
                        <a href={selectedApp.extra_document_url} target="_blank" rel="noopener noreferrer" className="block">
                          <img src={selectedApp.extra_document_url} alt="Doc Extra" className="w-full h-32 object-cover rounded-lg border" />
                          <p className="text-xs text-center mt-1 text-muted-foreground">Extra</p>
                        </a>
                      )}
                      {!selectedApp.document_front_url && !selectedApp.selfie_url && (
                        <p className="col-span-full text-sm text-muted-foreground">Documentos ainda não enviados.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Rejection reason if rejected */}
                {selectedApp.status === "rejected" && selectedApp.rejection_reason && (
                  <Card className="border-destructive/50">
                    <CardContent className="pt-4">
                      <p className="text-sm text-destructive"><strong>Motivo da rejeição:</strong> {selectedApp.rejection_reason}</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Actions */}
              {(selectedApp.status === "pending" || selectedApp.status === "under_review") && (
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button
                    variant="destructive"
                    onClick={() => setShowRejectDialog(true)}
                    disabled={rejectMutation.isPending}
                  >
                    <XCircle className="w-4 h-4 mr-1" /> Rejeitar
                  </Button>
                  <Button
                    onClick={() => approveMutation.mutate(selectedApp.id)}
                    disabled={approveMutation.isPending}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" /> Aprovar
                  </Button>
                </DialogFooter>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject reason dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Motivo da Rejeição</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Informe o motivo da rejeição (obrigatório)..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>Cancelar</Button>
            <Button
              variant="destructive"
              disabled={!rejectionReason.trim() || rejectMutation.isPending}
              onClick={() => {
                if (selectedApp) {
                  rejectMutation.mutate({ appId: selectedApp.id, reason: rejectionReason });
                }
              }}
            >
              Confirmar Rejeição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SolicitacoesFornecedor;
