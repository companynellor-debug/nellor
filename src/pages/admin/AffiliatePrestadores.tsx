import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Users,
  Briefcase,
  DollarSign,
  TrendingUp,
  Loader2,
  RefreshCw,
  Link as LinkIcon,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  FileText,
  AlertCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Affiliate {
  id: string;
  user_id: string;
  status: string;
  full_name: string | null;
  email: string | null;
  document_type: string | null;
  document_number: string | null;
  registration_step: number;
  total_earnings: number;
  pending_earnings: number;
  stripe_ready: boolean;
  created_at: string;
  user_name?: string;
  user_email?: string;
  links_count?: number;
  clicks_count?: number;
  conversions_count?: number;
}

interface ServiceProvider {
  id: string;
  user_id: string;
  business_name: string;
  service_type: string;
  status: string;
  description: string | null;
  created_at: string;
  user_name?: string;
  user_email?: string;
  user_photo?: string | null;
  suppliers_count?: number;
  crm_clients_count?: number;
  pending_contracts?: number;
}

interface Commission {
  id: string;
  affiliate_id: string;
  order_id: string;
  amount: number;
  commission_percent: number | null;
  order_total: number | null;
  status: string;
  created_at: string;
  paid_at: string | null;
  affiliate_name?: string;
  order_number?: string;
}

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
  supplier_name?: string;
}

const AffiliatePrestadores = () => {
  const [loading, setLoading] = useState(true);
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [serviceProviders, setServiceProviders] = useState<ServiceProvider[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [contractRequests, setContractRequests] = useState<ContractRequest[]>([]);
  const [selectedAffiliate, setSelectedAffiliate] = useState<Affiliate | null>(null);
  const [selectedSP, setSelectedSP] = useState<ServiceProvider | null>(null);
  const [stats, setStats] = useState({
    totalAffiliates: 0,
    activeAffiliates: 0,
    pendingAffiliates: 0,
    totalServiceProviders: 0,
    pendingContracts: 0,
    totalCommissionsValue: 0,
    pendingCommissionsValue: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch affiliates using RPC function
      const { data: affiliatesData, error: affError } = await supabase.rpc("get_admin_affiliates");
      if (affError) {
        console.error("Error fetching affiliates:", affError);
      }
      const affiliatesWithDetails = (affiliatesData || []).map((aff: any) => ({
        ...aff,
        links_count: Number(aff.links_count) || 0,
        clicks_count: Number(aff.clicks_count) || 0,
        conversions_count: Number(aff.conversions_count) || 0,
      }));
      setAffiliates(affiliatesWithDetails);

      // Fetch service providers using RPC function
      const { data: spData, error: spError } = await supabase.rpc("get_admin_service_providers");
      if (spError) {
        console.error("Error fetching service providers:", spError);
      }
      const spWithDetails = (spData || []).map((sp: any) => ({
        ...sp,
        suppliers_count: Number(sp.suppliers_count) || 0,
        crm_clients_count: Number(sp.crm_clients_count) || 0,
        pending_contracts: Number(sp.pending_contracts) || 0,
      }));
      setServiceProviders(spWithDetails);

      // Fetch commissions using RPC function
      const { data: commissionsData, error: commError } = await supabase.rpc("get_admin_commissions");
      if (commError) {
        console.error("Error fetching commissions:", commError);
      }
      setCommissions(commissionsData || []);

      // Fetch contract requests using RPC function
      const { data: contractsData, error: contractError } = await supabase.rpc("get_admin_contract_requests");
      if (contractError) {
        console.error("Error fetching contract requests:", contractError);
      }
      setContractRequests(contractsData || []);

      // Calculate stats
      const totalAffiliates = affiliatesWithDetails.length;
      const activeAffiliates = affiliatesWithDetails.filter(
        (a: any) => a.status === "active" && a.stripe_ready
      ).length;
      const pendingAffiliates = affiliatesWithDetails.filter(
        (a: any) => a.status === "pending" || !a.stripe_ready
      ).length;
      const totalServiceProviders = spWithDetails.length;
      const pendingContracts = (contractsData || []).filter((c: any) => c.status === "pending").length;
      const totalCommissionsValue = (commissionsData || []).reduce(
        (sum: number, c: any) => sum + Number(c.amount),
        0
      );
      const pendingCommissionsValue = (commissionsData || [])
        .filter((c: any) => c.status === "pending")
        .reduce((sum: number, c: any) => sum + Number(c.amount), 0);

      setStats({
        totalAffiliates,
        activeAffiliates,
        pendingAffiliates,
        totalServiceProviders,
        pendingContracts,
        totalCommissionsValue,
        pendingCommissionsValue,
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string, stripeReady?: boolean) => {
    if (status === "active" && stripeReady === false) {
      return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">Stripe Pendente</Badge>;
    }
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Ativo</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Pendente</Badge>;
      case "paid":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">Pago</Badge>;
      case "confirmed":
        return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">Confirmado</Badge>;
      case "suspended":
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Suspenso</Badge>;
      case "cancelled":
      case "rejected":
        return <Badge variant="secondary">Cancelado</Badge>;
      case "approved":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Aprovado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getRegistrationStepLabel = (step: number) => {
    switch (step) {
      case 1:
        return "Informações básicas";
      case 2:
        return "Documento";
      case 3:
        return "Conectar Stripe";
      case 4:
        return "Completo";
      default:
        return `Etapa ${step}`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Afiliados & Prestadores</h1>
          <p className="text-muted-foreground">
            Gerencie afiliados, prestadores de serviço e comissões
          </p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.activeAffiliates}</p>
                <p className="text-xs text-muted-foreground">Afiliados Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pendingAffiliates}</p>
                <p className="text-xs text-muted-foreground">Afiliados Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalServiceProviders}</p>
                <p className="text-xs text-muted-foreground">Prestadores</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pendingContracts}</p>
                <p className="text-xs text-muted-foreground">Contratos Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">R$ {stats.totalCommissionsValue.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">Total Comissões</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">R$ {stats.pendingCommissionsValue.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">Comissões Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="affiliates" className="w-full">
        <TabsList className="grid w-full grid-cols-4 max-w-lg">
          <TabsTrigger value="affiliates" className="gap-1">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Afiliados</span>
          </TabsTrigger>
          <TabsTrigger value="providers" className="gap-1">
            <Briefcase className="h-4 w-4" />
            <span className="hidden sm:inline">Prestadores</span>
          </TabsTrigger>
          <TabsTrigger value="contracts" className="gap-1 relative">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Contratos</span>
            {stats.pendingContracts > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {stats.pendingContracts}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="commissions" className="gap-1">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Comissões</span>
          </TabsTrigger>
        </TabsList>

        {/* Affiliates Tab */}
        <TabsContent value="affiliates" className="mt-6">
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Lista de Afiliados</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <div className="divide-y divide-border">
                  {affiliates.length > 0 ? (
                    affiliates.map((aff) => (
                      <div
                        key={aff.id}
                        className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => setSelectedAffiliate(aff)}
                      >
                        <div className="flex items-center gap-4">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {aff.user_name?.charAt(0)?.toUpperCase() || "A"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium truncate">{aff.user_name}</p>
                              {getStatusBadge(aff.status, aff.stripe_ready)}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {aff.user_email}
                            </p>
                          </div>
                          <div className="text-right hidden sm:block">
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <LinkIcon className="h-3.5 w-3.5" />
                                {aff.links_count}
                              </span>
                              <span className="flex items-center gap-1">
                                <Eye className="h-3.5 w-3.5" />
                                {aff.clicks_count}
                              </span>
                              <span className="text-green-600 font-medium">
                                R$ {Number(aff.total_earnings || 0).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum afiliado encontrado</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Service Providers Tab */}
        <TabsContent value="providers" className="mt-6">
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Lista de Prestadores de Serviço</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <div className="divide-y divide-border">
                  {serviceProviders.length > 0 ? (
                    serviceProviders.map((sp) => (
                      <div
                        key={sp.id}
                        className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => setSelectedSP(sp)}
                      >
                        <div className="flex items-center gap-4">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={sp.user_photo || undefined} />
                            <AvatarFallback className="bg-blue-500/10 text-blue-500">
                              {sp.business_name?.charAt(0)?.toUpperCase() || "P"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium truncate">{sp.business_name}</p>
                              {getStatusBadge(sp.status)}
                              {sp.pending_contracts && sp.pending_contracts > 0 && (
                                <Badge variant="destructive" className="text-xs">
                                  {sp.pending_contracts} pendente{sp.pending_contracts > 1 ? "s" : ""}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{sp.service_type}</p>
                          </div>
                          <div className="text-right hidden sm:block">
                            <p className="text-sm font-medium">{sp.suppliers_count} fornecedores</p>
                            <p className="text-xs text-muted-foreground">
                              {sp.crm_clients_count} contratos
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">
                      <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum prestador encontrado</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contract Requests Tab */}
        <TabsContent value="contracts" className="mt-6">
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Solicitações de Contrato</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <div className="divide-y divide-border">
                  {contractRequests.length > 0 ? (
                    contractRequests.map((contract) => (
                      <div key={contract.id} className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium">{contract.sp_name}</p>
                              <span className="text-muted-foreground">→</span>
                              <p className="font-medium">{contract.supplier_name}</p>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                              <Badge variant="outline">
                                {contract.contract_type === "monthly" ? "Mensal" : "Único"}
                              </Badge>
                              {contract.monthly_value && (
                                <span className="text-green-600 font-medium">
                                  R$ {Number(contract.monthly_value).toFixed(2)}/mês
                                </span>
                              )}
                              {getStatusBadge(contract.status)}
                            </div>
                            {contract.notes && (
                              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                {contract.notes}
                              </p>
                            )}
                          </div>
                          <div className="text-right text-xs text-muted-foreground">
                            {format(new Date(contract.requested_at), "dd/MM/yyyy HH:mm", {
                              locale: ptBR,
                            })}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhuma solicitação de contrato</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Commissions Tab */}
        <TabsContent value="commissions" className="mt-6">
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Histórico de Comissões</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <div className="divide-y divide-border">
                  {commissions.length > 0 ? (
                    commissions.map((comm) => (
                      <div key={comm.id} className="p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium">{comm.affiliate_name}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>Pedido #{comm.order_number}</span>
                              {comm.commission_percent && (
                                <Badge variant="outline" className="text-xs">
                                  {comm.commission_percent}%
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">
                              + R$ {Number(comm.amount).toFixed(2)}
                            </p>
                            {getStatusBadge(comm.status)}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">
                      <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhuma comissão registrada</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Affiliate Details Dialog */}
      <Dialog open={!!selectedAffiliate} onOpenChange={() => setSelectedAffiliate(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detalhes do Afiliado</DialogTitle>
          </DialogHeader>
          {selectedAffiliate && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-primary/10 text-primary text-xl">
                    {selectedAffiliate.user_name?.charAt(0)?.toUpperCase() || "A"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{selectedAffiliate.user_name}</h3>
                  <p className="text-muted-foreground">{selectedAffiliate.user_email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card className="p-3">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedAffiliate.status, selectedAffiliate.stripe_ready)}</div>
                </Card>
                <Card className="p-3">
                  <p className="text-xs text-muted-foreground">Etapa Cadastro</p>
                  <p className="font-medium mt-1">
                    {getRegistrationStepLabel(selectedAffiliate.registration_step)}
                  </p>
                </Card>
                <Card className="p-3">
                  <p className="text-xs text-muted-foreground">Documento</p>
                  <p className="font-medium mt-1">
                    {selectedAffiliate.document_type?.toUpperCase() || "—"}:{" "}
                    {selectedAffiliate.document_number || "—"}
                  </p>
                </Card>
                <Card className="p-3">
                  <p className="text-xs text-muted-foreground">Stripe</p>
                  <p className="font-medium mt-1">
                    {selectedAffiliate.stripe_ready ? (
                      <span className="text-green-600 flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" /> Conectado
                      </span>
                    ) : (
                      <span className="text-amber-600 flex items-center gap-1">
                        <Clock className="h-4 w-4" /> Pendente
                      </span>
                    )}
                  </p>
                </Card>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Card className="p-3 text-center">
                  <p className="text-2xl font-bold">{selectedAffiliate.links_count}</p>
                  <p className="text-xs text-muted-foreground">Links</p>
                </Card>
                <Card className="p-3 text-center">
                  <p className="text-2xl font-bold">{selectedAffiliate.clicks_count}</p>
                  <p className="text-xs text-muted-foreground">Cliques</p>
                </Card>
                <Card className="p-3 text-center">
                  <p className="text-2xl font-bold">{selectedAffiliate.conversions_count}</p>
                  <p className="text-xs text-muted-foreground">Vendas</p>
                </Card>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card className="p-3">
                  <p className="text-xs text-muted-foreground">Ganhos Totais</p>
                  <p className="text-xl font-bold text-green-600">
                    R$ {Number(selectedAffiliate.total_earnings || 0).toFixed(2)}
                  </p>
                </Card>
                <Card className="p-3">
                  <p className="text-xs text-muted-foreground">Pendente</p>
                  <p className="text-xl font-bold text-amber-600">
                    R$ {Number(selectedAffiliate.pending_earnings || 0).toFixed(2)}
                  </p>
                </Card>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Membro desde{" "}
                {format(new Date(selectedAffiliate.created_at), "dd 'de' MMMM 'de' yyyy", {
                  locale: ptBR,
                })}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Service Provider Details Dialog */}
      <Dialog open={!!selectedSP} onOpenChange={() => setSelectedSP(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detalhes do Prestador</DialogTitle>
          </DialogHeader>
          {selectedSP && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedSP.user_photo || undefined} />
                  <AvatarFallback className="bg-blue-500/10 text-blue-500 text-xl">
                    {selectedSP.business_name?.charAt(0)?.toUpperCase() || "P"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{selectedSP.business_name}</h3>
                  <p className="text-muted-foreground">{selectedSP.user_email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card className="p-3">
                  <p className="text-xs text-muted-foreground">Tipo de Serviço</p>
                  <p className="font-medium mt-1">{selectedSP.service_type}</p>
                </Card>
                <Card className="p-3">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedSP.status)}</div>
                </Card>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Card className="p-3 text-center">
                  <p className="text-2xl font-bold">{selectedSP.suppliers_count}</p>
                  <p className="text-xs text-muted-foreground">Fornecedores</p>
                </Card>
                <Card className="p-3 text-center">
                  <p className="text-2xl font-bold">{selectedSP.crm_clients_count}</p>
                  <p className="text-xs text-muted-foreground">Contratos</p>
                </Card>
                <Card className="p-3 text-center">
                  <p className="text-2xl font-bold text-amber-600">{selectedSP.pending_contracts}</p>
                  <p className="text-xs text-muted-foreground">Pendentes</p>
                </Card>
              </div>

              {selectedSP.description && (
                <Card className="p-3">
                  <p className="text-xs text-muted-foreground mb-1">Descrição</p>
                  <p className="text-sm">{selectedSP.description}</p>
                </Card>
              )}

              <p className="text-xs text-muted-foreground text-center">
                Cadastrado em{" "}
                {format(new Date(selectedSP.created_at), "dd 'de' MMMM 'de' yyyy", {
                  locale: ptBR,
                })}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AffiliatePrestadores;
