import { useState, useEffect, useMemo } from "react";
import { ParticlesBackground } from "@/components/cliente/ParticlesBackground";
import { BottomNav } from "@/components/cliente/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Briefcase, 
  Users, 
  Store,
  Plus,
  ChevronLeft,
  Loader2,
  Check,
  Copy,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Edit,
  Trash2,
  AlertTriangle,
  TrendingUp,
  Package,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ServiceProviderData {
  id: string;
  business_name: string;
  service_type: string;
  description: string;
  status: string;
}

interface ManagedSupplier {
  id: string;
  supplier_id: string;
  supplier: { 
    nome: string; 
    email: string; 
    foto_perfil_url: string | null;
    ativo?: boolean;
  } | null;
  productCount?: number;
  lowStockCount?: number;
}

interface CRMClient {
  id: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  contract_type: 'single' | 'monthly';
  monthly_value: number | null;
  next_billing_date: string | null;
  notes: string;
  created_at: string;
}

interface DashboardStats {
  totalSuppliers: number;
  activeSuppliers: number;
  totalMonthlyRevenue: number;
  totalClients: number;
  monthlyClients: number;
  lowStockAlerts: number;
}

const PrestadorServicos = () => {
  const navigate = useNavigate();
  const { user } = useSupabaseAuth();
  const [loading, setLoading] = useState(true);
  const [serviceProvider, setServiceProvider] = useState<ServiceProviderData | null>(null);
  const [suppliers, setSuppliers] = useState<ManagedSupplier[]>([]);
  const [crmClients, setCrmClients] = useState<CRMClient[]>([]);
  const [activating, setActivating] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  
  // Form states
  const [businessName, setBusinessName] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [description, setDescription] = useState("");
  
  // CRM Dialog
  const [crmDialogOpen, setCrmDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<CRMClient | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [contractType, setContractType] = useState<'single' | 'monthly'>('single');
  const [monthlyValue, setMonthlyValue] = useState("");
  const [clientNotes, setClientNotes] = useState("");
  const [savingClient, setSavingClient] = useState(false);

  // Dashboard stats
  const stats = useMemo<DashboardStats>(() => {
    const totalMonthlyRevenue = crmClients
      .filter(c => c.contract_type === 'monthly' && c.monthly_value)
      .reduce((acc, c) => acc + (c.monthly_value || 0), 0);
    
    const lowStockAlerts = suppliers.reduce((acc, s) => acc + (s.lowStockCount || 0), 0);
    
    return {
      totalSuppliers: suppliers.length,
      activeSuppliers: suppliers.filter(s => s.supplier?.ativo !== false).length,
      totalMonthlyRevenue,
      totalClients: crmClients.length,
      monthlyClients: crmClients.filter(c => c.contract_type === 'monthly').length,
      lowStockAlerts,
    };
  }, [suppliers, crmClients]);

  useEffect(() => {
    if (user) {
      fetchServiceProviderData();
    }
  }, [user]);

  const fetchServiceProviderData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Check if user is already a service provider
      const { data: spData } = await supabase
        .from('service_providers')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (spData) {
        setServiceProvider(spData);
        
        // Fetch managed suppliers
        const { data: suppliersData } = await supabase
          .from('service_provider_suppliers')
          .select('*')
          .eq('service_provider_id', spData.id);
        
        // Fetch supplier details separately with product counts
        const suppliersWithDetails = await Promise.all((suppliersData || []).map(async (sp) => {
          const [{ data: supplier }, { count: productCount }, { count: lowStockCount }] = await Promise.all([
            supabase
              .from('profiles')
              .select('nome, email, foto_perfil_url, ativo')
              .eq('id', sp.supplier_id)
              .single(),
            supabase
              .from('products')
              .select('id', { count: 'exact', head: true })
              .eq('supplier_id', sp.supplier_id),
            supabase
              .from('products')
              .select('id', { count: 'exact', head: true })
              .eq('supplier_id', sp.supplier_id)
              .lt('estoque', 5),
          ]);
          return { ...sp, supplier, productCount: productCount || 0, lowStockCount: lowStockCount || 0 } as ManagedSupplier;
        }));
        
        setSuppliers(suppliersWithDetails);
        
        // Fetch CRM clients
        const { data: crmData } = await supabase
          .from('service_provider_crm')
          .select('*')
          .eq('service_provider_id', spData.id)
          .order('created_at', { ascending: false });
        
        setCrmClients(crmData || []);
      }
    } catch (error) {
      console.error('Error fetching service provider data:', error);
    } finally {
      setLoading(false);
    }
  };

  const activateServiceProvider = async () => {
    if (!user || !businessName || !serviceType) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    
    setActivating(true);
    try {
      const { data, error } = await supabase
        .from('service_providers')
        .insert({
          user_id: user.id,
          business_name: businessName,
          service_type: serviceType,
          description: description,
          status: 'active'
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setServiceProvider(data);
      toast.success('Prestador de serviços ativado!');
    } catch (error: any) {
      console.error('Error activating service provider:', error);
      toast.error('Erro ao ativar');
    } finally {
      setActivating(false);
    }
  };

  const copyReferralLink = () => {
    if (!serviceProvider) return;
    // Rota dedicada de cadastro de fornecedor com provider
    const link = `${window.location.origin}/cadastro-fornecedor?provider=${serviceProvider.id}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    toast.success('Link copiado!');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const openCrmDialog = (client?: CRMClient) => {
    if (client) {
      setEditingClient(client);
      setClientName(client.client_name);
      setClientEmail(client.client_email || '');
      setClientPhone(client.client_phone || '');
      setContractType(client.contract_type);
      setMonthlyValue(client.monthly_value?.toString() || '');
      setClientNotes(client.notes || '');
    } else {
      setEditingClient(null);
      setClientName('');
      setClientEmail('');
      setClientPhone('');
      setContractType('single');
      setMonthlyValue('');
      setClientNotes('');
    }
    setCrmDialogOpen(true);
  };

  const saveCrmClient = async () => {
    if (!serviceProvider || !clientName) {
      toast.error('Nome do cliente é obrigatório');
      return;
    }
    
    setSavingClient(true);
    try {
      const clientData = {
        service_provider_id: serviceProvider.id,
        client_name: clientName,
        client_email: clientEmail || null,
        client_phone: clientPhone || null,
        contract_type: contractType,
        monthly_value: contractType === 'monthly' ? parseFloat(monthlyValue) || null : null,
        next_billing_date: contractType === 'monthly' ? getNextBillingDate() : null,
        notes: clientNotes || null
      };
      
      if (editingClient) {
        const { error } = await supabase
          .from('service_provider_crm')
          .update(clientData)
          .eq('id', editingClient.id);
        
        if (error) throw error;
        toast.success('Cliente atualizado!');
      } else {
        const { error } = await supabase
          .from('service_provider_crm')
          .insert(clientData);
        
        if (error) throw error;
        toast.success('Cliente adicionado!');
      }
      
      setCrmDialogOpen(false);
      fetchServiceProviderData();
    } catch (error: any) {
      console.error('Error saving CRM client:', error);
      toast.error('Erro ao salvar cliente');
    } finally {
      setSavingClient(false);
    }
  };

  const deleteCrmClient = async (clientId: string) => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return;
    
    try {
      const { error } = await supabase
        .from('service_provider_crm')
        .delete()
        .eq('id', clientId);
      
      if (error) throw error;
      toast.success('Cliente excluído!');
      fetchServiceProviderData();
    } catch (error: any) {
      console.error('Error deleting CRM client:', error);
      toast.error('Erro ao excluir cliente');
    }
  };

  const getNextBillingDate = () => {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    return date.toISOString().split('T')[0];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <ParticlesBackground />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/cliente/perfil")}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Prestador de Serviços</h1>
            <p className="text-sm text-muted-foreground">Gerencie fornecedores e clientes</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 relative z-10">
        {!serviceProvider ? (
          // Ativação
          <Card className="p-6 border-border">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <Briefcase className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-center mb-2 text-foreground">Seja um Prestador de Serviços</h2>
            <p className="text-muted-foreground text-center mb-6">
              Cadastre fornecedores na plataforma, gerencie seus produtos e organize seus clientes em um CRM integrado.
            </p>
            
            <div className="space-y-4">
              <div>
                <Label>Nome do Negócio *</Label>
                <Input
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Ex: Marketing Digital Silva"
                />
              </div>
              <div>
                <Label>Tipo de Serviço *</Label>
                <Input
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  placeholder="Ex: Gestão de E-commerce"
                />
              </div>
              <div>
                <Label>Descrição (opcional)</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva seus serviços..."
                  rows={3}
                />
              </div>
              
              <Button 
                onClick={activateServiceProvider} 
                disabled={activating || !businessName || !serviceType}
                className="w-full"
                size="lg"
              >
                {activating ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                ) : (
                  <Briefcase className="h-5 w-5 mr-2" />
                )}
                Ativar Prestador de Serviços
              </Button>
            </div>
          </Card>
        ) : (
          // Painel do prestador
          <div className="space-y-6">
            {/* Link de indicação */}
            <Card className="p-4 border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-foreground">Link de Cadastro de Fornecedores</h3>
                  <p className="text-sm text-muted-foreground">
                    Compartilhe para cadastrar novos fornecedores
                  </p>
                </div>
                <Button variant="outline" onClick={copyReferralLink}>
                  {copiedLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4 border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Store className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Fornecedores</p>
                    <p className="text-xl font-bold text-foreground">{suppliers.length}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4 border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Clientes CRM</p>
                    <p className="text-xl font-bold text-foreground">{crmClients.length}</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="suppliers" className="w-full">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="suppliers">
                  <Store className="h-4 w-4 mr-2" />
                  Fornecedores
                </TabsTrigger>
                <TabsTrigger value="crm">
                  <Users className="h-4 w-4 mr-2" />
                  CRM
                </TabsTrigger>
              </TabsList>

              <TabsContent value="suppliers" className="mt-4">
                {suppliers.length === 0 ? (
                  <Card className="p-8 text-center border-border">
                    <Store className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">
                      Nenhum fornecedor cadastrado ainda
                    </p>
                    <Button variant="outline" onClick={copyReferralLink}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar Link de Cadastro
                    </Button>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {suppliers.map(supplier => (
                      <Card key={supplier.id} className="p-4 border-border">
                        <div className="flex items-center gap-4">
                          {supplier.supplier?.foto_perfil_url ? (
                            <img 
                              src={supplier.supplier.foto_perfil_url} 
                              alt={supplier.supplier.nome}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                              <Store className="h-6 w-6 text-primary" />
                            </div>
                          )}
                          <div className="flex-1">
                            <h3 className="font-medium text-foreground">{supplier.supplier?.nome}</h3>
                            <p className="text-sm text-muted-foreground">
                              {supplier.supplier?.email}
                            </p>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="crm" className="mt-4">
                <div className="flex justify-end mb-4">
                  <Dialog open={crmDialogOpen} onOpenChange={setCrmDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={() => openCrmDialog()}>
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Cliente
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Nome *</Label>
                          <Input
                            value={clientName}
                            onChange={(e) => setClientName(e.target.value)}
                            placeholder="Nome do cliente"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Email</Label>
                            <Input
                              type="email"
                              value={clientEmail}
                              onChange={(e) => setClientEmail(e.target.value)}
                              placeholder="email@exemplo.com"
                            />
                          </div>
                          <div>
                            <Label>Telefone</Label>
                            <Input
                              value={clientPhone}
                              onChange={(e) => setClientPhone(e.target.value)}
                              placeholder="(00) 00000-0000"
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Tipo de Contrato</Label>
                          <Select value={contractType} onValueChange={(v) => setContractType(v as 'single' | 'monthly')}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="single">Único</SelectItem>
                              <SelectItem value="monthly">Mensal</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {contractType === 'monthly' && (
                          <div>
                            <Label>Valor Mensal</Label>
                            <Input
                              type="number"
                              value={monthlyValue}
                              onChange={(e) => setMonthlyValue(e.target.value)}
                              placeholder="0.00"
                            />
                          </div>
                        )}
                        <div>
                          <Label>Observações</Label>
                          <Textarea
                            value={clientNotes}
                            onChange={(e) => setClientNotes(e.target.value)}
                            placeholder="Notas sobre o cliente..."
                            rows={3}
                          />
                        </div>
                        <Button 
                          onClick={saveCrmClient} 
                          disabled={savingClient || !clientName}
                          className="w-full"
                        >
                          {savingClient ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : null}
                          {editingClient ? 'Atualizar' : 'Adicionar'} Cliente
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {crmClients.length === 0 ? (
                  <Card className="p-8 text-center border-border">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Nenhum cliente cadastrado no CRM
                    </p>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {crmClients.map(client => (
                      <Card key={client.id} className="p-4 border-border">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium">{client.client_name}</h3>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                              {client.client_email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {client.client_email}
                                </span>
                              )}
                              {client.client_phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {client.client_phone}
                                </span>
                              )}
                            </div>
                            <div className="flex gap-2 mt-2">
                              <Badge variant={client.contract_type === 'monthly' ? 'default' : 'secondary'}>
                                {client.contract_type === 'monthly' ? 'Mensal' : 'Único'}
                              </Badge>
                              {client.contract_type === 'monthly' && client.monthly_value && (
                                <Badge variant="outline">
                                  R$ {client.monthly_value.toFixed(2)}/mês
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => openCrmDialog(client)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => deleteCrmClient(client.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default PrestadorServicos;