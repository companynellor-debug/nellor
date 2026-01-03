import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  TrendingUp,
  Users,
  Store,
  Package,
  DollarSign,
  ShoppingCart,
  Activity,
  Clock,
  FileText,
} from "lucide-react";
import { useAdminDrop } from "@/hooks/useAdminDrop";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const NellorDropAdmin = () => {
  const { stats, suppliers, clients, orders, auditLogs, isLoading } = useAdminDrop();
  const [activeTab, setActiveTab] = useState("overview");

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-violet-400 bg-clip-text text-transparent">
            Nellor Drop
          </h1>
          <p className="text-muted-foreground">
            Monitoramento e gestão do programa Drop
          </p>
        </div>
        <Badge variant="outline" className="text-purple-400 border-purple-400">
          Admin View
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-card border">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="suppliers">Fornecedores</TabsTrigger>
          <TabsTrigger value="clients">Clientes</TabsTrigger>
          <TabsTrigger value="orders">Pedidos</TabsTrigger>
          <TabsTrigger value="audit">Auditoria</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  GMV Total
                </CardTitle>
                <DollarSign className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-500">
                  {formatCurrency(stats?.total_gmv || 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Volume total de vendas
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Margem Clientes
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-500">
                  {formatCurrency(stats?.total_client_margin || 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Lucro dos clientes Drop
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500/10 to-violet-500/10 border-purple-500/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Taxa Plataforma
                </CardTitle>
                <Activity className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-purple-500">
                  {formatCurrency(stats?.total_platform_fees || 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Receita da plataforma
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 border-orange-500/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Comissões Pendentes
                </CardTitle>
                <Clock className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-orange-500">
                  {formatCurrency(stats?.pending_commissions || 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  A pagar aos fornecedores
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Second Row Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Clientes Drop Ativos
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {stats?.active_drop_clients || 0}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Fornecedores Drop
                </CardTitle>
                <Store className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {stats?.active_drop_suppliers || 0}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total de Pedidos
                </CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {stats?.total_drop_orders || 0}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pedidos Pagos
                </CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-500">
                  {stats?.paid_drop_orders || 0}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Suppliers Tab */}
        <TabsContent value="suppliers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Fornecedores no Nellor Drop
              </CardTitle>
            </CardHeader>
            <CardContent>
              {suppliers && suppliers.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fornecedor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Produtos no Drop</TableHead>
                      <TableHead className="text-right">Vendas Totais</TableHead>
                      <TableHead className="text-center">Pedidos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {suppliers.map((supplier) => (
                      <TableRow key={supplier.supplier_id}>
                        <TableCell className="font-medium">
                          {supplier.supplier_name || "Sem nome"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={supplier.drop_enabled ? "default" : "secondary"}
                            className={supplier.drop_enabled ? "bg-green-500" : ""}
                          >
                            {supplier.drop_enabled ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {supplier.products_in_drop}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(supplier.total_sales)}
                        </TableCell>
                        <TableCell className="text-center">
                          {supplier.total_orders}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Store className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum fornecedor participando do Nellor Drop ainda</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Clients Tab */}
        <TabsContent value="clients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Clientes no Nellor Drop
              </CardTitle>
            </CardHeader>
            <CardContent>
              {clients && clients.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Produtos</TableHead>
                      <TableHead className="text-right">Faturamento</TableHead>
                      <TableHead className="text-right">Margem</TableHead>
                      <TableHead className="text-center">Pedidos</TableHead>
                      <TableHead>Desde</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clients.map((client) => (
                      <TableRow key={client.client_id}>
                        <TableCell className="font-medium">
                          {client.client_name || "Sem nome"}
                        </TableCell>
                        <TableCell>
                          {client.business_name || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={client.drop_enabled ? "default" : "secondary"}
                            className={client.drop_enabled ? "bg-green-500" : ""}
                          >
                            {client.drop_enabled ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {client.products_count}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(client.total_revenue)}
                        </TableCell>
                        <TableCell className="text-right text-green-500">
                          {formatCurrency(client.total_margin)}
                        </TableCell>
                        <TableCell className="text-center">
                          {client.total_orders}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(client.created_at), "dd/MM/yy", { locale: ptBR })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum cliente ativou o Nellor Drop ainda</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Pedidos Drop Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {orders && orders.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pedido</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead>Pagamento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Margem</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order: any) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-sm">
                          {order.order_number}
                        </TableCell>
                        <TableCell>
                          {order.product?.nome || "Produto"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={order.payment_status === "paid" ? "default" : "outline"}
                            className={order.payment_status === "paid" ? "bg-green-500" : ""}
                          >
                            {order.payment_status === "paid" ? "Pago" : "Pendente"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {order.order_status === "pending" && "Pendente"}
                            {order.order_status === "preparing" && "Preparando"}
                            {order.order_status === "shipped" && "Enviado"}
                            {order.order_status === "delivered" && "Entregue"}
                            {order.order_status === "cancelled" && "Cancelado"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(order.total)}
                        </TableCell>
                        <TableCell className="text-right text-green-500">
                          {formatCurrency(order.client_margin)}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(order.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum pedido Drop registrado ainda</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Tab */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Log de Auditoria
              </CardTitle>
            </CardHeader>
            <CardContent>
              {auditLogs && auditLogs.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Ação</TableHead>
                      <TableHead>Entidade</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Detalhes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(log.created_at), "dd/MM/yy HH:mm:ss", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              log.action === "INSERT"
                                ? "default"
                                : log.action === "UPDATE"
                                ? "outline"
                                : "destructive"
                            }
                            className={log.action === "INSERT" ? "bg-green-500" : ""}
                          >
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {log.entity_type}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {log.user_id.slice(0, 8)}...
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-xs text-muted-foreground">
                          {log.new_value ? JSON.stringify(log.new_value).slice(0, 50) + "..." : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum registro de auditoria ainda</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NellorDropAdmin;
