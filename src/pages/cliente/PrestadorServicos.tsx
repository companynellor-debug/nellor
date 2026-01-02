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
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Edit,
  Trash2,
  Package,
  Image,
  FileText,
  Eye,
  CheckCircle,
  XCircle,
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
import { ServiceProviderIntegration } from "@/components/cliente/ServiceProviderIntegration";
import { ServiceProviderProducts } from "@/components/cliente/ServiceProviderProducts";

interface ServiceProviderData {
  id: string;
  business_name: string;
  service_type: string;
  description: string;
  status: string;
}

interface SupplierPermissions {
  can_edit_price: boolean;
  can_edit_stock: boolean;
  can_edit_photos: boolean;
  can_edit_description: boolean;
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
  permissions: SupplierPermissions | null;
  productCount?: number;
  lowStockCount?: number;
}

interface CRMEntry {
  id: string;
  supplier_id: string;
  supplier_name: string;
  supplier_email: string;
  supplier_photo: string | null;
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
  monthlyContracts: number;
  lowStockAlerts: number;
}

const PrestadorServicos = () => {
  const navigate = useNavigate();
  const { user } = useSupabaseAuth();
  const [loading, setLoading] = useState(true);
  const [serviceProvider, setServiceProvider] = useState<ServiceProviderData | null>(null);
  const [suppliers, setSuppliers] = useState<ManagedSupplier[]>([]);
  const [crmEntries, setCrmEntries] = useState<CRMEntry[]>([]);
  const [activating, setActivating] = useState(false);
  
  // Form states
  const [businessName, setBusinessName] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [description, setDescription] = useState("");
  
  // CRM Dialog
  const [crmDialogOpen, setCrmDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<CRMEntry | null>(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [contractType, setContractType] = useState<'single' | 'monthly'>('single');
  const [monthlyValue, setMonthlyValue] = useState("");
  const [clientNotes, setClientNotes] = useState("");
  const [savingEntry, setSavingEntry] = useState(false);

  // Dashboard stats
  const stats = useMemo<DashboardStats>(() => {
    const totalMonthlyRevenue = crmEntries
      .filter(c => c.contract_type === 'monthly' && c.monthly_value)
      .reduce((acc, c) => acc + (c.monthly_value || 0), 0);
    
    const lowStockAlerts = suppliers.reduce((acc, s) => acc + (s.lowStockCount || 0), 0);
    
    return {
      totalSuppliers: suppliers.length,
      activeSuppliers: suppliers.filter(s => s.supplier?.ativo !== false).length,
      totalMonthlyRevenue,
      monthlyContracts: crmEntries.filter(c => c.contract_type === 'monthly').length,
      lowStockAlerts,
    };
  }, [suppliers, crmEntries]);

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
        .maybeSingle();
      
      if (spData) {
        setServiceProvider(spData);
        
        // Fetch managed suppliers with permissions
        const { data: suppliersData } = await supabase
          .from('service_provider_suppliers')
          .select('*')
          .eq('service_provider_id', spData.id);
        
        // Fetch supplier details, permissions, and product counts
        const suppliersWithDetails = await Promise.all((suppliersData || []).map(async (sp) => {
          const [
            { data: supplier }, 
            { data: permissions },
            { count: productCount }, 
            { count: lowStockCount }
          ] = await Promise.all([
            supabase
              .from('profiles')
              .select('nome, email, foto_perfil_url, ativo')
              .eq('id', sp.supplier_id)
              .maybeSingle(),
            supabase
              .from('supplier_service_provider_settings')
              .select('can_edit_price, can_edit_stock, can_edit_photos, can_edit_description')
              .eq('supplier_id', sp.supplier_id)
              .maybeSingle(),
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
          return { 
            ...sp, 
            supplier, 
            permissions: permissions || null,
            productCount: productCount || 0, 
            lowStockCount: lowStockCount || 0 
          } as ManagedSupplier;
        }));
        
        setSuppliers(suppliersWithDetails);
        
        // Fetch CRM entries for integrated suppliers
        const { data: crmData } = await supabase
          .from('service_provider_crm')
          .select('*')
          .eq('service_provider_id', spData.id)
          .order('created_at', { ascending: false });
        
        // Map CRM entries with supplier info
        const crmWithSuppliers: CRMEntry[] = [];
        for (const entry of crmData || []) {
          // Find matching supplier
          const matchingSupplier = suppliersWithDetails.find(s => 
            s.supplier?.nome === entry.client_name || 
            s.supplier_id === entry.client_name // Check if stored as ID
          );
          
          if (matchingSupplier) {
            crmWithSuppliers.push({
              id: entry.id,
              supplier_id: matchingSupplier.supplier_id,
              supplier_name: matchingSupplier.supplier?.nome || '',
              supplier_email: matchingSupplier.supplier?.email || '',
              supplier_photo: matchingSupplier.supplier?.foto_perfil_url || null,
              contract_type: entry.contract_type,
              monthly_value: entry.monthly_value,
              next_billing_date: entry.next_billing_date,
              notes: entry.notes || '',
              created_at: entry.created_at,
            });
          }
        }
        
        setCrmEntries(crmWithSuppliers);
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

  const openCrmDialog = (supplier: ManagedSupplier, existingEntry?: CRMEntry) => {
    if (existingEntry) {
      setEditingEntry(existingEntry);
      setContractType(existingEntry.contract_type);
      setMonthlyValue(existingEntry.monthly_value?.toString() || '');
      setClientNotes(existingEntry.notes || '');
    } else {
      setEditingEntry(null);
      setContractType('single');
      setMonthlyValue('');
      setClientNotes('');
    }
    setSelectedSupplierId(supplier.supplier_id);
    setCrmDialogOpen(true);
  };

  const saveCrmEntry = async () => {
    if (!serviceProvider || !selectedSupplierId) {
      toast.error('Selecione um fornecedor');
      return;
    }
    
    const supplier = suppliers.find(s => s.supplier_id === selectedSupplierId);
    if (!supplier) return;
    
    setSavingEntry(true);
    try {
      const entryData = {
        service_provider_id: serviceProvider.id,
        client_name: supplier.supplier?.nome || selectedSupplierId,
        client_email: supplier.supplier?.email || null,
        client_phone: null,
        contract_type: contractType,
        monthly_value: contractType === 'monthly' ? parseFloat(monthlyValue) || null : null,
        next_billing_date: contractType === 'monthly' ? getNextBillingDate() : null,
        notes: clientNotes || null
      };
      
      if (editingEntry) {
        const { error } = await supabase
          .from('service_provider_crm')
          .update(entryData)
          .eq('id', editingEntry.id);
        
        if (error) throw error;
        toast.success('Contrato atualizado!');
      } else {
        const { error } = await supabase
          .from('service_provider_crm')
          .insert(entryData);
        
        if (error) throw error;
        toast.success('Contrato adicionado!');
      }
      
      setCrmDialogOpen(false);
      fetchServiceProviderData();
    } catch (error: any) {
      console.error('Error saving CRM entry:', error);
      toast.error('Erro ao salvar contrato');
    } finally {
      setSavingEntry(false);
    }
  };

  const deleteCrmEntry = async (entryId: string) => {
    if (!confirm('Tem certeza que deseja excluir este contrato?')) return;
    
    try {
      const { error } = await supabase
        .from('service_provider_crm')
        .delete()
        .eq('id', entryId);
      
      if (error) throw error;
      toast.success('Contrato excluído!');
      fetchServiceProviderData();
    } catch (error: any) {
      console.error('Error deleting CRM entry:', error);
      toast.error('Erro ao excluir contrato');
    }
  };

  const getNextBillingDate = () => {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    return date.toISOString().split('T')[0];
  };

  const getPermissionBadges = (permissions: SupplierPermissions | null) => {
    if (!permissions) {
      return <Badge variant="secondary" className="text-xs">Apenas visualização</Badge>;
    }
    
    const activePermissions = [];
    if (permissions.can_edit_price) activePermissions.push({ icon: DollarSign, label: 'Preço' });
    if (permissions.can_edit_stock) activePermissions.push({ icon: Package, label: 'Estoque' });
    if (permissions.can_edit_photos) activePermissions.push({ icon: Image, label: 'Fotos' });
    if (permissions.can_edit_description) activePermissions.push({ icon: FileText, label: 'Descrição' });
    
    if (activePermissions.length === 0) {
      return <Badge variant="secondary" className="text-xs">Apenas visualização</Badge>;
    }
    
    return (
      <div className="flex flex-wrap gap-1">
        {activePermissions.map((perm, idx) => (
          <Badge key={idx} variant="outline" className="text-xs gap-1">
            <perm.icon className="h-3 w-3" />
            {perm.label}
          </Badge>
        ))}
      </div>
    );
  };

  // Find CRM entry for a supplier
  const getCrmEntryForSupplier = (supplierId: string) => {
    return crmEntries.find(e => e.supplier_id === supplierId);
  };

  // Get suppliers without CRM entries
  const suppliersWithoutCrm = suppliers.filter(s => !getCrmEntryForSupplier(s.supplier_id));

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
            <p className="text-sm text-muted-foreground">Gerencie fornecedores e contratos</p>
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
              Gerencie fornecedores na plataforma e organize seus contratos em um CRM integrado.
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
            {/* Integration Request */}
            <ServiceProviderIntegration 
              serviceProviderId={serviceProvider.id}
              onIntegrationComplete={fetchServiceProviderData}
            />

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4 border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Store className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Fornecedores</p>
                    <p className="text-xl font-bold text-foreground">{stats.totalSuppliers}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4 border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Receita Mensal</p>
                    <p className="text-xl font-bold text-foreground">
                      R$ {stats.totalMonthlyRevenue.toFixed(2)}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="suppliers" className="w-full">
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="suppliers">
                  <Store className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Fornecedores</span>
                  <span className="sm:hidden">({suppliers.length})</span>
                </TabsTrigger>
                <TabsTrigger value="products">
                  <Package className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Produtos</span>
                </TabsTrigger>
                <TabsTrigger value="crm">
                  <Users className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">CRM</span>
                </TabsTrigger>
              </TabsList>

              {/* Suppliers Tab */}
              <TabsContent value="suppliers" className="mt-4">
                {suppliers.length === 0 ? (
                  <Card className="p-8 text-center border-border">
                    <Store className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-2">
                      Nenhum fornecedor integrado ainda
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Use o campo acima para solicitar integração com um código de fornecedor
                    </p>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {suppliers.map(supplier => {
                      const crmEntry = getCrmEntryForSupplier(supplier.supplier_id);
                      
                      return (
                        <Card key={supplier.id} className="p-4 border-border">
                          <div className="flex items-start gap-4">
                            {supplier.supplier?.foto_perfil_url ? (
                              <img 
                                src={supplier.supplier.foto_perfil_url} 
                                alt={supplier.supplier.nome}
                                className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Store className="h-6 w-6 text-primary" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-medium text-foreground truncate">
                                  {supplier.supplier?.nome}
                                </h3>
                                {supplier.supplier?.ativo === false && (
                                  <Badge variant="secondary" className="text-xs">Inativo</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {supplier.productCount} produtos • {supplier.lowStockCount} com estoque baixo
                              </p>
                              
                              {/* Permissions */}
                              <div className="mb-3">
                                <p className="text-xs text-muted-foreground mb-1">Permissões:</p>
                                {getPermissionBadges(supplier.permissions)}
                              </div>
                              
                              {/* CRM Status */}
                              {crmEntry ? (
                                <div className="flex items-center gap-2">
                                  <Badge variant={crmEntry.contract_type === 'monthly' ? 'default' : 'secondary'}>
                                    {crmEntry.contract_type === 'monthly' ? (
                                      <>
                                        <Calendar className="h-3 w-3 mr-1" />
                                        Mensal - R$ {crmEntry.monthly_value?.toFixed(2)}
                                      </>
                                    ) : (
                                      'Contrato Único'
                                    )}
                                  </Badge>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => openCrmDialog(supplier, crmEntry)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => openCrmDialog(supplier)}
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  Adicionar Contrato
                                </Button>
                              )}
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              {/* Products Tab */}
              <TabsContent value="products" className="mt-4">
                <ServiceProviderProducts 
                  suppliers={suppliers}
                  onRefresh={fetchServiceProviderData}
                />
              </TabsContent>

              {/* CRM Tab */}
              <TabsContent value="crm" className="mt-4">
                {crmEntries.length === 0 ? (
                  <Card className="p-8 text-center border-border">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-2">
                      Nenhum contrato cadastrado
                    </p>
                    {suppliers.length > 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Adicione contratos aos seus fornecedores integrados na aba Fornecedores
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Integre-se a fornecedores primeiro
                      </p>
                    )}
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {/* Monthly contracts */}
                    {crmEntries.filter(e => e.contract_type === 'monthly').length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Contratos Mensais ({crmEntries.filter(e => e.contract_type === 'monthly').length})
                        </h3>
                        <div className="space-y-3">
                          {crmEntries
                            .filter(e => e.contract_type === 'monthly')
                            .map(entry => (
                              <Card key={entry.id} className="p-4 border-border bg-primary/5">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center gap-3">
                                    {entry.supplier_photo ? (
                                      <img 
                                        src={entry.supplier_photo} 
                                        alt={entry.supplier_name}
                                        className="w-10 h-10 rounded-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                        <Store className="h-5 w-5 text-primary" />
                                      </div>
                                    )}
                                    <div>
                                      <h4 className="font-medium">{entry.supplier_name}</h4>
                                      <div className="flex items-center gap-2 text-sm">
                                        <Badge variant="default">
                                          R$ {entry.monthly_value?.toFixed(2)}/mês
                                        </Badge>
                                        {entry.next_billing_date && (
                                          <span className="text-muted-foreground text-xs">
                                            Próx: {new Date(entry.next_billing_date).toLocaleDateString('pt-BR')}
                                          </span>
                                        )}
                                      </div>
                                      {entry.notes && (
                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                          {entry.notes}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex gap-1">
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => {
                                        const supplier = suppliers.find(s => s.supplier_id === entry.supplier_id);
                                        if (supplier) openCrmDialog(supplier, entry);
                                      }}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => deleteCrmEntry(entry.id)}
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </div>
                                </div>
                              </Card>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Single contracts */}
                    {crmEntries.filter(e => e.contract_type === 'single').length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-3">
                          Contratos Únicos ({crmEntries.filter(e => e.contract_type === 'single').length})
                        </h3>
                        <div className="space-y-3">
                          {crmEntries
                            .filter(e => e.contract_type === 'single')
                            .map(entry => (
                              <Card key={entry.id} className="p-4 border-border">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center gap-3">
                                    {entry.supplier_photo ? (
                                      <img 
                                        src={entry.supplier_photo} 
                                        alt={entry.supplier_name}
                                        className="w-10 h-10 rounded-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                        <Store className="h-5 w-5 text-muted-foreground" />
                                      </div>
                                    )}
                                    <div>
                                      <h4 className="font-medium">{entry.supplier_name}</h4>
                                      <Badge variant="secondary">Contrato Único</Badge>
                                      {entry.notes && (
                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                          {entry.notes}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex gap-1">
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => {
                                        const supplier = suppliers.find(s => s.supplier_id === entry.supplier_id);
                                        if (supplier) openCrmDialog(supplier, entry);
                                      }}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => deleteCrmEntry(entry.id)}
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </div>
                                </div>
                              </Card>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Suppliers without CRM */}
                    {suppliersWithoutCrm.length > 0 && (
                      <div className="pt-4 border-t">
                        <h3 className="text-sm font-medium text-muted-foreground mb-3">
                          Sem contrato ({suppliersWithoutCrm.length})
                        </h3>
                        <div className="space-y-2">
                          {suppliersWithoutCrm.map(supplier => (
                            <div 
                              key={supplier.id} 
                              className="flex items-center justify-between p-3 border rounded-lg"
                            >
                              <div className="flex items-center gap-2">
                                <XCircle className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{supplier.supplier?.nome}</span>
                              </div>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => openCrmDialog(supplier)}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Adicionar
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>

      {/* CRM Dialog */}
      <Dialog open={crmDialogOpen} onOpenChange={setCrmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingEntry ? 'Editar Contrato' : 'Novo Contrato'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Fornecedor</Label>
              <Input
                value={suppliers.find(s => s.supplier_id === selectedSupplierId)?.supplier?.nome || ''}
                disabled
                className="bg-muted"
              />
            </div>
            <div>
              <Label>Tipo de Contrato</Label>
              <Select value={contractType} onValueChange={(v) => setContractType(v as 'single' | 'monthly')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Único</SelectItem>
                  <SelectItem value="monthly">Mensal (Recorrente)</SelectItem>
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
                placeholder="Detalhes do contrato..."
                rows={3}
              />
            </div>
            <Button 
              onClick={saveCrmEntry} 
              disabled={savingEntry}
              className="w-full"
            >
              {savingEntry ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {editingEntry ? 'Atualizar' : 'Adicionar'} Contrato
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

export default PrestadorServicos;
