import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Megaphone,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  Image,
  Package,
  User,
  Eye,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SponsorshipRequest {
  id: string;
  supplier_id: string;
  type: "produto_destaque" | "banner_homepage";
  product_id: string | null;
  banner_image_url: string | null;
  message: string | null;
  status: "pending" | "approved" | "rejected" | "scheduled";
  admin_response: string | null;
  scheduled_date: string | null;
  created_at: string;
  supplier_name?: string;
  product_name?: string;
}

const Patrocinios = () => {
  const [requests, setRequests] = useState<SponsorshipRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionModal, setActionModal] = useState<{
    open: boolean;
    request: SponsorshipRequest | null;
    action: "approve" | "reject" | "schedule" | null;
  }>({ open: false, request: null, action: null });
  const [adminResponse, setAdminResponse] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      // Try new table first, fallback to sponsored_products
      let data: any[] = [];
      
      const { data: newData, error: newError } = await supabase
        .from("sponsorship_requests" as any)
        .select("*")
        .order("created_at", { ascending: false });
      
      if (!newError && newData) {
        data = newData;
      } else {
        // Fallback to old table
        const { data: oldData } = await supabase
          .from("sponsored_products")
          .select("*")
          .order("created_at", { ascending: false });
        
        data = (oldData || []).map((item: any) => ({
          ...item,
          type: "produto_destaque" as const,
          message: item.description,
          banner_image_url: item.banner_url,
        }));
      }

      // Enrich with supplier and product names
      const supplierIds = [...new Set(data.map((r: any) => r.supplier_id))];
      const productIds = [...new Set(data.filter((r: any) => r.product_id).map((r: any) => r.product_id))];

      const { data: suppliers } = await supabase
        .from("profiles")
        .select("id, nome")
        .in("id", supplierIds);

      const { data: products } = productIds.length > 0
        ? await supabase.from("products").select("id, nome").in("id", productIds)
        : { data: [] };

      const supplierMap = new Map(suppliers?.map((s) => [s.id, s.nome]) || []);
      const productMap = new Map(products?.map((p) => [p.id, p.nome]) || []);

      const enriched = data.map((r: any) => ({
        ...r,
        supplier_name: supplierMap.get(r.supplier_id) || "Fornecedor",
        product_name: r.product_id ? productMap.get(r.product_id) || "Produto" : null,
      }));

      setRequests(enriched);
    } catch (error) {
      console.error("Error fetching sponsorship requests:", error);
      toast.error("Erro ao carregar solicitações");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!actionModal.request || !actionModal.action) return;

    if (actionModal.action === "reject" && !adminResponse.trim()) {
      toast.error("Informe o motivo da rejeição");
      return;
    }

    if (actionModal.action === "schedule" && !scheduledDate) {
      toast.error("Selecione uma data para agendamento");
      return;
    }

    setSubmitting(true);
    try {
      const newStatus =
        actionModal.action === "approve"
          ? "approved"
          : actionModal.action === "reject"
          ? "rejected"
          : "scheduled";

      const updateData: any = {
        status: newStatus,
        admin_response: adminResponse || null,
      };

      if (actionModal.action === "schedule") {
        updateData.scheduled_date = scheduledDate;
      }

      // Try new table first
      const { error: newError } = await supabase
        .from("sponsorship_requests" as any)
        .update(updateData)
        .eq("id", actionModal.request.id);

      if (newError) {
        // Fallback to old table
        await supabase
          .from("sponsored_products")
          .update({
            status: newStatus,
            approved_at: newStatus === "approved" ? new Date().toISOString() : null,
          } as any)
          .eq("id", actionModal.request.id);
      }

      // Send notification to supplier
      await supabase.from("notifications").insert({
        user_id: actionModal.request.supplier_id,
        title:
          newStatus === "approved"
            ? "Patrocínio Aprovado! ✅"
            : newStatus === "rejected"
            ? "Patrocínio Não Aprovado"
            : "Patrocínio Agendado 📅",
        message:
          newStatus === "approved"
            ? `Seu patrocínio foi aprovado e está ativo.${adminResponse ? ` Resposta: ${adminResponse}` : ""}`
            : newStatus === "rejected"
            ? `Seu patrocínio não foi aprovado. Motivo: ${adminResponse}`
            : `Seu patrocínio foi agendado para ${new Date(scheduledDate).toLocaleDateString("pt-BR")}.${adminResponse ? ` Observação: ${adminResponse}` : ""}`,
        type: "patrocinio",
      });

      toast.success(
        newStatus === "approved"
          ? "Patrocínio aprovado!"
          : newStatus === "rejected"
          ? "Patrocínio rejeitado"
          : "Patrocínio agendado!"
      );

      setActionModal({ open: false, request: null, action: null });
      setAdminResponse("");
      setScheduledDate("");
      fetchRequests();
    } catch (error) {
      console.error("Error updating sponsorship:", error);
      toast.error("Erro ao atualizar patrocínio");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            Pendente
          </Badge>
        );
      case "approved":
        return (
          <Badge className="bg-green-500 gap-1">
            <CheckCircle className="h-3 w-3" />
            Aprovado
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Rejeitado
          </Badge>
        );
      case "scheduled":
        return (
          <Badge className="bg-blue-500 gap-1">
            <Calendar className="h-3 w-3" />
            Agendado
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    return type === "banner_homepage" ? (
      <Badge variant="outline" className="gap-1">
        <Image className="h-3 w-3" />
        Banner
      </Badge>
    ) : (
      <Badge variant="outline" className="gap-1">
        <Package className="h-3 w-3" />
        Produto
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const otherRequests = requests.filter((r) => r.status !== "pending");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Patrocínios</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gerencie solicitações de destaque e banners dos fornecedores
        </p>
      </div>

      {/* Pending Requests */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Clock className="h-5 w-5 text-yellow-500" />
          Pendentes ({pendingRequests.length})
        </h2>

        {pendingRequests.length === 0 ? (
          <Card className="p-8 text-center border-dashed">
            <Megaphone className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Nenhuma solicitação pendente</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {pendingRequests.map((req) => (
              <Card key={req.id} className="p-5">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Banner preview if exists */}
                  {req.banner_image_url && (
                    <div
                      className="w-full md:w-48 h-32 rounded-lg overflow-hidden bg-muted cursor-pointer flex-shrink-0"
                      onClick={() => setPreviewImage(req.banner_image_url)}
                    >
                      <img
                        src={req.banner_image_url}
                        alt="Banner"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1.5 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{req.supplier_name}</span>
                      </div>
                      {getTypeBadge(req.type)}
                      {getStatusBadge(req.status)}
                    </div>

                    {req.product_name && (
                      <p className="text-sm">
                        <span className="text-muted-foreground">Produto:</span>{" "}
                        <span className="font-medium">{req.product_name}</span>
                      </p>
                    )}

                    {req.message && (
                      <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                        "{req.message}"
                      </p>
                    )}

                    <p className="text-xs text-muted-foreground">
                      Enviado em {new Date(req.created_at).toLocaleDateString("pt-BR")} às{" "}
                      {new Date(req.created_at).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex md:flex-col gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 gap-1"
                      onClick={() =>
                        setActionModal({ open: true, request: req, action: "approve" })
                      }
                    >
                      <CheckCircle className="h-4 w-4" />
                      Aprovar
                    </Button>
                    {req.type === "banner_homepage" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1"
                        onClick={() =>
                          setActionModal({ open: true, request: req, action: "schedule" })
                        }
                      >
                        <Calendar className="h-4 w-4" />
                        Agendar
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      className="gap-1"
                      onClick={() =>
                        setActionModal({ open: true, request: req, action: "reject" })
                      }
                    >
                      <XCircle className="h-4 w-4" />
                      Rejeitar
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Other Requests */}
      {otherRequests.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Histórico</h2>
          <div className="grid gap-3">
            {otherRequests.map((req) => (
              <Card key={req.id} className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium truncate">{req.supplier_name}</span>
                    </div>
                    {getTypeBadge(req.type)}
                    {req.product_name && (
                      <span className="text-sm text-muted-foreground truncate hidden sm:inline">
                        {req.product_name}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {req.scheduled_date && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(req.scheduled_date).toLocaleDateString("pt-BR")}
                      </span>
                    )}
                    {getStatusBadge(req.status)}
                  </div>
                </div>
                {req.admin_response && (
                  <p className="text-xs text-muted-foreground mt-2 pl-7">
                    Resposta: {req.admin_response}
                  </p>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Action Modal */}
      <Dialog open={actionModal.open} onOpenChange={(open) => !open && setActionModal({ open: false, request: null, action: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionModal.action === "approve"
                ? "Aprovar Patrocínio"
                : actionModal.action === "reject"
                ? "Rejeitar Patrocínio"
                : "Agendar Patrocínio"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {actionModal.action === "schedule" && (
              <div>
                <Label>Data de Exibição *</Label>
                <Input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
            )}
            <div>
              <Label>
                {actionModal.action === "reject" ? "Motivo da Rejeição *" : "Mensagem para o Fornecedor (opcional)"}
              </Label>
              <Textarea
                value={adminResponse}
                onChange={(e) => setAdminResponse(e.target.value)}
                placeholder={
                  actionModal.action === "reject"
                    ? "Explique o motivo da rejeição..."
                    : "Adicione uma observação se necessário..."
                }
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionModal({ open: false, request: null, action: null })}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAction}
              disabled={submitting}
              className={
                actionModal.action === "approve"
                  ? "bg-green-600 hover:bg-green-700"
                  : actionModal.action === "reject"
                  ? ""
                  : ""
              }
              variant={actionModal.action === "reject" ? "destructive" : "default"}
            >
              {submitting ? "Processando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Preview Modal */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Preview do Banner</DialogTitle>
          </DialogHeader>
          {previewImage && (
            <img
              src={previewImage}
              alt="Banner preview"
              className="w-full rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Patrocinios;
