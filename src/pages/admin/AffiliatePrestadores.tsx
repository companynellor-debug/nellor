import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  XCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Affiliate {
  id: string;
  user_id: string;
  status: string;
  total_earnings: number;
  pending_earnings: number;
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
  created_at: string;
  user_name?: string;
  user_email?: string;
  suppliers_count?: number;
  crm_clients_count?: number;
}

interface Commission {
  id: string;
  affiliate_id: string;
  order_id: string;
  amount: number;
  status: string;
  created_at: string;
  paid_at: string | null;
  affiliate_name?: string;
  order_number?: string;
}

const AffiliatePrestadores = () => {
  const [loading, setLoading] = useState(true);
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [serviceProviders, setServiceProviders] = useState<ServiceProvider[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [stats, setStats] = useState({
    totalAffiliates: 0,
    activeAffiliates: 0,
    totalServiceProviders: 0,
    pendingCommissions: 0,
    paidCommissions: 0,
    totalCommissionsValue: 0,
    pendingCommissionsValue: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch affiliates with user info
      const { data: affiliatesData } = await supabase
        .from('affiliates')
        .select('*')
        .order('created_at', { ascending: false });

      const affiliatesWithDetails = await Promise.all((affiliatesData || []).map(async (aff) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('nome, email')
          .eq('id', aff.user_id)
          .single();

        const { data: links } = await supabase
          .from('affiliate_links')
          .select('id, clicks, conversions')
          .eq('affiliate_id', aff.id);

        const linksCount = links?.length || 0;
        const clicksCount = links?.reduce((sum, l) => sum + (l.clicks || 0), 0) || 0;
        const conversionsCount = links?.reduce((sum, l) => sum + (l.conversions || 0), 0) || 0;

        return {
          ...aff,
          user_name: profile?.nome || 'N/A',
          user_email: profile?.email || 'N/A',
          links_count: linksCount,
          clicks_count: clicksCount,
          conversions_count: conversionsCount
        };
      }));

      setAffiliates(affiliatesWithDetails);

      // Fetch service providers
      const { data: spData } = await supabase
        .from('service_providers')
        .select('*')
        .order('created_at', { ascending: false });

      const spWithDetails = await Promise.all((spData || []).map(async (sp) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('nome, email')
          .eq('id', sp.user_id)
          .single();

        const { count: suppliersCount } = await supabase
          .from('service_provider_suppliers')
          .select('*', { count: 'exact', head: true })
          .eq('service_provider_id', sp.id);

        const { count: crmCount } = await supabase
          .from('service_provider_crm')
          .select('*', { count: 'exact', head: true })
          .eq('service_provider_id', sp.id);

        return {
          ...sp,
          user_name: profile?.nome || 'N/A',
          user_email: profile?.email || 'N/A',
          suppliers_count: suppliersCount || 0,
          crm_clients_count: crmCount || 0
        };
      }));

      setServiceProviders(spWithDetails);

      // Fetch commissions
      const { data: commissionsData } = await supabase
        .from('affiliate_commissions')
        .select('*')
        .order('created_at', { ascending: false });

      const commissionsWithDetails = await Promise.all((commissionsData || []).map(async (comm) => {
        const aff = affiliatesWithDetails.find(a => a.id === comm.affiliate_id);
        
        const { data: order } = await supabase
          .from('orders')
          .select('order_number')
          .eq('id', comm.order_id)
          .single();

        return {
          ...comm,
          affiliate_name: aff?.user_name || 'N/A',
          order_number: order?.order_number || 'N/A'
        };
      }));

      setCommissions(commissionsWithDetails);

      // Calculate stats
      const totalAffiliates = affiliatesWithDetails.length;
      const activeAffiliates = affiliatesWithDetails.filter(a => a.status === 'active').length;
      const totalServiceProviders = spWithDetails.length;
      const pendingCommissions = commissionsWithDetails.filter(c => c.status === 'pending').length;
      const paidCommissions = commissionsWithDetails.filter(c => c.status === 'paid').length;
      const totalCommissionsValue = commissionsWithDetails.reduce((sum, c) => sum + Number(c.amount), 0);
      const pendingCommissionsValue = commissionsWithDetails
        .filter(c => c.status === 'pending')
        .reduce((sum, c) => sum + Number(c.amount), 0);

      setStats({
        totalAffiliates,
        activeAffiliates,
        totalServiceProviders,
        pendingCommissions,
        paidCommissions,
        totalCommissionsValue,
        pendingCommissionsValue
      });

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Ativo</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      case 'paid':
        return <Badge className="bg-blue-100 text-blue-800">Pago</Badge>;
      case 'confirmed':
        return <Badge className="bg-purple-100 text-purple-800">Confirmado</Badge>;
      case 'suspended':
        return <Badge className="bg-red-100 text-red-800">Suspenso</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-100 text-gray-800">Cancelado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
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
          <p className="text-muted-foreground">Monitore afiliados, prestadores de serviço e comissões</p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Afiliados Ativos</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeAffiliates}</div>
            <p className="text-xs text-muted-foreground">de {stats.totalAffiliates} total</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Prestadores de Serviço</CardTitle>
            <Briefcase className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalServiceProviders}</div>
            <p className="text-xs text-muted-foreground">cadastrados</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Comissões Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {stats.pendingCommissionsValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{stats.pendingCommissions} comissões</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Comissões Pagas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {stats.totalCommissionsValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{stats.paidCommissions} pagas</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="affiliates" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="affiliates">
            <Users className="h-4 w-4 mr-2" />
            Afiliados
          </TabsTrigger>
          <TabsTrigger value="providers">
            <Briefcase className="h-4 w-4 mr-2" />
            Prestadores
          </TabsTrigger>
          <TabsTrigger value="commissions">
            <DollarSign className="h-4 w-4 mr-2" />
            Comissões
          </TabsTrigger>
        </TabsList>

        <TabsContent value="affiliates" className="mt-6">
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Lista de Afiliados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">Nome</th>
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">Email</th>
                      <th className="text-center py-3 px-2 font-medium text-muted-foreground">Status</th>
                      <th className="text-center py-3 px-2 font-medium text-muted-foreground">Links</th>
                      <th className="text-center py-3 px-2 font-medium text-muted-foreground">Cliques</th>
                      <th className="text-center py-3 px-2 font-medium text-muted-foreground">Conversões</th>
                      <th className="text-right py-3 px-2 font-medium text-muted-foreground">Ganhos</th>
                      <th className="text-right py-3 px-2 font-medium text-muted-foreground">Pendente</th>
                    </tr>
                  </thead>
                  <tbody>
                    {affiliates.length > 0 ? (
                      affiliates.map((aff) => (
                        <tr key={aff.id} className="border-b border-border hover:bg-muted/50">
                          <td className="py-3 px-2 font-medium">{aff.user_name}</td>
                          <td className="py-3 px-2 text-muted-foreground">{aff.user_email}</td>
                          <td className="py-3 px-2 text-center">{getStatusBadge(aff.status)}</td>
                          <td className="py-3 px-2 text-center">{aff.links_count}</td>
                          <td className="py-3 px-2 text-center">{aff.clicks_count}</td>
                          <td className="py-3 px-2 text-center">{aff.conversions_count}</td>
                          <td className="py-3 px-2 text-right text-green-600">
                            R$ {Number(aff.total_earnings || 0).toFixed(2)}
                          </td>
                          <td className="py-3 px-2 text-right text-yellow-600">
                            R$ {Number(aff.pending_earnings || 0).toFixed(2)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-muted-foreground">
                          Nenhum afiliado encontrado
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="providers" className="mt-6">
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Lista de Prestadores de Serviço</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">Negócio</th>
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">Tipo</th>
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">Responsável</th>
                      <th className="text-center py-3 px-2 font-medium text-muted-foreground">Status</th>
                      <th className="text-center py-3 px-2 font-medium text-muted-foreground">Fornecedores</th>
                      <th className="text-center py-3 px-2 font-medium text-muted-foreground">Clientes CRM</th>
                      <th className="text-right py-3 px-2 font-medium text-muted-foreground">Desde</th>
                    </tr>
                  </thead>
                  <tbody>
                    {serviceProviders.length > 0 ? (
                      serviceProviders.map((sp) => (
                        <tr key={sp.id} className="border-b border-border hover:bg-muted/50">
                          <td className="py-3 px-2 font-medium">{sp.business_name}</td>
                          <td className="py-3 px-2 text-muted-foreground">{sp.service_type}</td>
                          <td className="py-3 px-2">
                            <div>{sp.user_name}</div>
                            <div className="text-xs text-muted-foreground">{sp.user_email}</div>
                          </td>
                          <td className="py-3 px-2 text-center">{getStatusBadge(sp.status)}</td>
                          <td className="py-3 px-2 text-center">{sp.suppliers_count}</td>
                          <td className="py-3 px-2 text-center">{sp.crm_clients_count}</td>
                          <td className="py-3 px-2 text-right text-muted-foreground">
                            {format(new Date(sp.created_at), 'dd/MM/yyyy')}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-muted-foreground">
                          Nenhum prestador de serviço encontrado
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commissions" className="mt-6">
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Comissões de Afiliados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">Afiliado</th>
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">Pedido</th>
                      <th className="text-right py-3 px-2 font-medium text-muted-foreground">Valor</th>
                      <th className="text-center py-3 px-2 font-medium text-muted-foreground">Status</th>
                      <th className="text-right py-3 px-2 font-medium text-muted-foreground">Data</th>
                      <th className="text-right py-3 px-2 font-medium text-muted-foreground">Pago em</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commissions.length > 0 ? (
                      commissions.map((comm) => (
                        <tr key={comm.id} className="border-b border-border hover:bg-muted/50">
                          <td className="py-3 px-2 font-medium">{comm.affiliate_name}</td>
                          <td className="py-3 px-2 text-muted-foreground">{comm.order_number}</td>
                          <td className="py-3 px-2 text-right font-medium">
                            R$ {Number(comm.amount).toFixed(2)}
                          </td>
                          <td className="py-3 px-2 text-center">{getStatusBadge(comm.status)}</td>
                          <td className="py-3 px-2 text-right text-muted-foreground">
                            {format(new Date(comm.created_at), 'dd/MM/yyyy')}
                          </td>
                          <td className="py-3 px-2 text-right text-muted-foreground">
                            {comm.paid_at ? format(new Date(comm.paid_at), 'dd/MM/yyyy') : '-'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-muted-foreground">
                          Nenhuma comissão encontrada
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AffiliatePrestadores;
