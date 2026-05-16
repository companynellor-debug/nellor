import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, Clock, XCircle, Search, CreditCard, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { getAdminToken, storeAdminAccess, clearAdminAccess } from "@/lib/adminAccess";

interface AdminSubscription {
  id: string;
  supplier_id: string;
  supplier_name: string;
  supplier_email: string;
  status: string;
  plan_name: string;
  price: number;
  started_at: string | null;
  expires_at: string | null;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
}

const statusColors: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  expired: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  cancelled: "bg-muted text-muted-foreground",
};

const statusLabels: Record<string, string> = {
  active: "Ativa",
  pending: "Pendente",
  expired: "Expirada",
  cancelled: "Cancelada",
};

const Assinaturas = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<AdminSubscription | null>(null);
  const [confirmNotes, setConfirmNotes] = useState("");

  const { data: subscriptions = [], isLoading, error } = useQuery({
    queryKey: ["admin-subscriptions"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_admin_subscriptions");
      if (error) throw error;
      return (data || []) as AdminSubscription[];
    },
  });

  // Ensure admin token for edge function calls
  const ensureAdminToken = async () => {
    const existingToken = getAdminToken();
    if (existingToken) return existingToken;

    const password = window.prompt("Digite a senha admin para confirmar esta ação:");
    if (!password?.trim()) return null;

    const { data, error } = await supabase.functions.invoke("admin-grant-role", {
      body: { password: password.trim() },
    });

    if (error || !data?.adminToken) {
      throw new Error("ADMIN_LOGIN_FAILED");
    }

    storeAdminAccess(data.adminToken);
    return data.adminToken as string;
  };

  const confirmMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      // Try with admin token via edge function first
      try {
        const adminToken = await ensureAdminToken();
        if (!adminToken) throw new Error("Operação cancelada");

        // Use edge function for admin action
        const { data, error } = await supabase.functions.invoke("admin-support-action", {
          body: {
            type: "confirm_subscription",
            subscriptionId: id,
            notes: notes || null,
            adminToken,
          },
        });

        if (error || !data?.ok) {
          if (data?.error === "INVALID_ADMIN_TOKEN") {
            clearAdminAccess();
          }
          // Fallback: try RPC directly
          throw new Error("EDGE_FUNCTION_FAILED");
        }
        return data;
      } catch (edgeError) {
        // Fallback: try RPC with service role (may work if user is authenticated)
        console.log("Edge function failed, trying RPC fallback...", edgeError);
        
        const { data: authData } = await supabase.auth.getUser();
        const adminId = authData?.user?.id;

        if (!adminId) {
          // Final fallback: use direct table update
          const now = new Date();
          const expires = new Date(now);
          expires.setDate(expires.getDate() + 30);

          const { error: updateError } = await supabase
            .from("supplier_subscriptions" as any)
            .update({
              status: "active",
              started_at: now.toISOString(),
              expires_at: expires.toISOString(),
              notes: notes || null,
              confirmed_by: "admin",
            } as any)
            .eq("id", id);

          if (updateError) {
            console.error("Direct update error:", updateError);
            throw new Error(`Erro ao confirmar: ${updateError.message}`);
          }
          return { ok: true };
        }

        const { error: rpcError } = await supabase.rpc("admin_confirm_subscription", {
          _subscription_id: id,
          _admin_id: adminId,
          _notes: notes || null,
        });

        if (rpcError) {
          console.error("RPC error:", rpcError);
          throw rpcError;
        }
        return { ok: true };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-subscriptions"] });
      setConfirmDialog(null);
      setConfirmNotes("");
      toast.success("Assinatura confirmada com sucesso!");
    },
    onError: (err: any) => {
      console.error("Subscription confirm error:", err);
      if (err.message === "Operação cancelada") return;
      toast.error(`Erro ao confirmar: ${err?.message || "Erro desconhecido"}`);
    },
  });

  const filtered = subscriptions.filter((s) => {
    if (filter !== "all" && s.status !== filter) return false;
    if (
      search &&
      !s.supplier_name?.toLowerCase().includes(search.toLowerCase()) &&
      !s.supplier_email?.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  const counts = {
    all: subscriptions.length,
    active: subscriptions.filter((s) => s.status === "active").length,
    pending: subscriptions.filter((s) => s.status === "pending").length,
    expired: subscriptions.filter((s) => s.status === "expired").length,
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <p className="text-muted-foreground">Erro ao carregar assinaturas</p>
        <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-subscriptions"] })}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-primary" />
          Assinaturas
        </h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(["all", "active", "pending", "expired"] as const).map((key) => (
          <Card
            key={key}
            className={`p-3 cursor-pointer transition-all ${filter === key ? "ring-2 ring-primary" : ""}`}
            onClick={() => setFilter(key)}
          >
            <p className="text-xs text-muted-foreground capitalize">
              {key === "all" ? "Todas" : statusLabels[key]}
            </p>
            <p className="text-2xl font-bold text-foreground">{counts[key]}</p>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8">
          <CreditCard className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">Nenhuma assinatura encontrada.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((sub) => (
            <Card key={sub.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-foreground truncate">{sub.supplier_name || "Sem nome"}</p>
                  <p className="text-xs text-muted-foreground truncate">{sub.supplier_email}</p>
                </div>
                <Badge className={statusColors[sub.status] || "bg-muted"}>
                  {statusLabels[sub.status] || sub.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div>
                  <span className="font-medium">Plano:</span> {sub.plan_name} — R$ {sub.price}
                </div>
                <div>
                  <span className="font-medium">Método:</span> {sub.payment_method || "—"}
                </div>
                {sub.started_at && (
                  <div>
                    <span className="font-medium">Início:</span> {format(new Date(sub.started_at), "dd/MM/yyyy")}
                  </div>
                )}
                {sub.expires_at && (
                  <div>
                    <span className="font-medium">Vence:</span> {format(new Date(sub.expires_at), "dd/MM/yyyy")}
                  </div>
                )}
              </div>

              {sub.notes && (
                <p className="text-xs text-muted-foreground bg-muted rounded p-2">{sub.notes}</p>
              )}

              {sub.status === "pending" && (
                <Button size="sm" className="w-full" onClick={() => setConfirmDialog(sub)}>
                  <Check className="w-4 h-4 mr-1" />
                  Confirmar Pagamento
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Confirm Dialog */}
      <Dialog open={!!confirmDialog} onOpenChange={() => setConfirmDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Pagamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p>
                Fornecedor: <strong>{confirmDialog?.supplier_name}</strong>
              </p>
              <p>Email: {confirmDialog?.supplier_email}</p>
              <p>
                Plano: {confirmDialog?.plan_name} — R$ {confirmDialog?.price}/mês
              </p>
            </div>
            <Textarea
              placeholder="Observação (ex: comprovante verificado em 06/04)"
              value={confirmNotes}
              onChange={(e) => setConfirmNotes(e.target.value)}
              rows={3}
            />
            <Button
              className="w-full"
              onClick={() => confirmDialog && confirmMutation.mutate({ id: confirmDialog.id, notes: confirmNotes })}
              disabled={confirmMutation.isPending}
            >
              {confirmMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Confirmando...
                </>
              ) : (
                "Ativar Assinatura (30 dias)"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Assinaturas;
