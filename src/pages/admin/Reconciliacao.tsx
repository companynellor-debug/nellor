import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RefreshCw, CheckCircle, Clock, AlertCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PendingOrder {
  id: string;
  order_number: string;
  stripe_session_id: string;
  total: number;
  created_at: string;
  buyer_name?: string;
  supplier_name?: string;
}

interface ReconciliationResult {
  total: number;
  reconciled: number;
  stillPending: number;
  errors: string[];
  details: any[];
}

const Reconciliacao = () => {
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [reconciling, setReconciling] = useState(false);
  const [reconcilingOrderId, setReconcilingOrderId] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<ReconciliationResult | null>(null);

  const fetchPendingOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_admin_orders");
      
      if (error) throw error;

      const pending = (data || []).filter(
        (order: any) => order.payment_status === "pending" && order.stripe_session_id
      );

      setPendingOrders(pending.map((order: any) => ({
        id: order.id,
        order_number: order.order_number,
        stripe_session_id: order.stripe_session_id,
        total: order.total,
        created_at: order.created_at,
        buyer_name: order.buyer_name,
        supplier_name: order.supplier_name,
      })));
    } catch (error: any) {
      console.error("Error fetching pending orders:", error);
      toast.error("Erro ao carregar pedidos pendentes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingOrders();
  }, []);

  const reconcileAll = async () => {
    setReconciling(true);
    setLastResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("stripe-reconcile-orders");

      if (error) throw error;

      setLastResult(data);
      
      if (data.reconciled > 0) {
        toast.success(`${data.reconciled} pedido(s) reconciliado(s) com sucesso!`);
      } else if (data.stillPending > 0) {
        toast.info(`${data.stillPending} pedido(s) ainda pendente(s) na Stripe`);
      }

      if (data.errors.length > 0) {
        toast.error(`${data.errors.length} erro(s) durante reconciliação`);
      }

      await fetchPendingOrders();
    } catch (error: any) {
      console.error("Reconciliation error:", error);
      toast.error("Erro ao reconciliar pedidos");
    } finally {
      setReconciling(false);
    }
  };

  const reconcileOrder = async (orderId: string) => {
    setReconcilingOrderId(orderId);
    try {
      const { data, error } = await supabase.functions.invoke("stripe-reconcile-orders", {
        body: { order_id: orderId },
      });

      if (error) throw error;

      if (data.reconciled > 0) {
        toast.success("Pedido reconciliado com sucesso!");
      } else if (data.stillPending > 0) {
        toast.info("Pagamento ainda pendente na Stripe");
      }

      await fetchPendingOrders();
    } catch (error: any) {
      console.error("Reconciliation error:", error);
      toast.error("Erro ao reconciliar pedido");
    } finally {
      setReconcilingOrderId(null);
    }
  };

  const getTimeSinceCreation = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reconciliação Stripe</h1>
          <p className="text-muted-foreground">
            Verifique e reconcilie pedidos com pagamento pendente
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchPendingOrders} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          <Button onClick={reconcileAll} disabled={reconciling || pendingOrders.length === 0}>
            {reconciling ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Reconciliar Todos
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pedidos Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingOrders.length}</div>
            <p className="text-xs text-muted-foreground">com stripe_session_id</p>
          </CardContent>
        </Card>

        {lastResult && (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Última Reconciliação
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{lastResult.reconciled}</div>
                <p className="text-xs text-muted-foreground">pedidos reconciliados</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Ainda Pendentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{lastResult.stillPending}</div>
                <p className="text-xs text-muted-foreground">aguardando pagamento</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Last Result Details */}
      {lastResult && lastResult.errors.length > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Erros na Reconciliação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-1">
              {lastResult.errors.map((error, idx) => (
                <li key={idx} className="text-sm text-destructive">{error}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Pending Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pedidos com Pagamento Pendente</CardTitle>
          <CardDescription>
            Pedidos que foram para o checkout Stripe mas ainda não tiveram pagamento confirmado
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : pendingOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p>Nenhum pedido pendente encontrado!</p>
              <p className="text-sm">Todos os pagamentos estão sincronizados.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Comprador</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Tempo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-sm">
                      {order.order_number}
                    </TableCell>
                    <TableCell>{order.buyer_name || "-"}</TableCell>
                    <TableCell>{order.supplier_name || "-"}</TableCell>
                    <TableCell>
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(order.total)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        <Clock className="h-3 w-3" />
                        {getTimeSinceCreation(order.created_at)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        Pendente
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => reconcileOrder(order.id)}
                        disabled={reconcilingOrderId === order.id}
                      >
                        {reconcilingOrderId === order.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Reconciliacao;
