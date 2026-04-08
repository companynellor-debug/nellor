import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Handshake, Search, Truck, CheckCircle, Clock, XCircle, Loader2, Package, FileText } from "lucide-react";
import { generateNegotiationPDF } from "@/components/cliente/NegotiationContractPDF";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Negotiation {
  id: string;
  buyer_id: string;
  supplier_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  agreed_price: number;
  payment_method: string;
  expected_delivery: string | null;
  status: string;
  buyer_confirmed_delivery: boolean;
  supplier_confirmed_shipping: boolean;
  shipping_confirmed_at: string | null;
  delivery_confirmed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  buyerName?: string;
}

const Negociacoes = () => {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");

  const fetchNegotiations = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('negotiations' as any)
        .select('*')
        .eq('supplier_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const negs = (data || []) as any as Negotiation[];

      // Fetch buyer names
      const buyerIds = [...new Set(negs.map(n => n.buyer_id))];
      if (buyerIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles' as any)
          .select('id, nome')
          .in('id', buyerIds);
        
        const profileMap = new Map((profiles || []).map((p: any) => [p.id, p.nome]));
        negs.forEach(n => { n.buyerName = profileMap.get(n.buyer_id) || 'Comprador'; });
      }

      setNegotiations(negs);
    } catch (err) {
      console.error('Error fetching negotiations:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchNegotiations(); }, [fetchNegotiations]);

  const updateStatus = async (id: string, status: string, extra: Record<string, any> = {}) => {
    try {
      const { error } = await supabase
        .from('negotiations' as any)
        .update({ status, updated_at: new Date().toISOString(), ...extra } as any)
        .eq('id', id);
      if (error) throw error;
      toast({ title: 'Status atualizado!', description: `Negociação marcada como "${status}".` });
      fetchNegotiations();
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  const handleAccept = (id: string) => updateStatus(id, 'accepted');
  const handleShip = (id: string) => updateStatus(id, 'shipped', {
    supplier_confirmed_shipping: true,
    shipping_confirmed_at: new Date().toISOString(),
  });
  const handleCancel = (id: string) => updateStatus(id, 'cancelled');

  const filtered = negotiations.filter(n => {
    const matchesSearch = !search || n.product_name.toLowerCase().includes(search.toLowerCase()) || n.buyerName?.toLowerCase().includes(search.toLowerCase());
    const matchesTab = tab === 'all' || n.status === tab;
    return matchesSearch && matchesTab;
  });

  const statusCounts = {
    all: negotiations.length,
    pending: negotiations.filter(n => n.status === 'pending').length,
    accepted: negotiations.filter(n => n.status === 'accepted').length,
    shipped: negotiations.filter(n => n.status === 'shipped').length,
    delivered: negotiations.filter(n => n.status === 'delivered').length,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />Pendente</Badge>;
      case 'accepted': return <Badge className="bg-blue-100 text-blue-800 gap-1"><CheckCircle className="h-3 w-3" />Aceita</Badge>;
      case 'shipped': return <Badge className="bg-orange-100 text-orange-800 gap-1"><Truck className="h-3 w-3" />Enviada</Badge>;
      case 'delivered': return <Badge className="bg-green-100 text-green-800 gap-1"><CheckCircle className="h-3 w-3" />Entregue</Badge>;
      case 'cancelled': return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Cancelada</Badge>;
      case 'disputed': return <Badge className="bg-red-100 text-red-800 gap-1">Disputada</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Negociações</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie suas negociações com compradores</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por produto ou comprador..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <div className="w-full overflow-x-auto -mx-1 px-1">
          <TabsList className="inline-flex w-auto min-w-full h-auto">
            <TabsTrigger value="all" className="text-[10px] sm:text-xs py-2 px-2 sm:px-3 whitespace-nowrap">Todas ({statusCounts.all})</TabsTrigger>
            <TabsTrigger value="pending" className="text-[10px] sm:text-xs py-2 px-2 sm:px-3 whitespace-nowrap">Pendentes ({statusCounts.pending})</TabsTrigger>
            <TabsTrigger value="accepted" className="text-[10px] sm:text-xs py-2 px-2 sm:px-3 whitespace-nowrap">Aceitas ({statusCounts.accepted})</TabsTrigger>
            <TabsTrigger value="shipped" className="text-[10px] sm:text-xs py-2 px-2 sm:px-3 whitespace-nowrap">Enviadas ({statusCounts.shipped})</TabsTrigger>
            <TabsTrigger value="delivered" className="text-[10px] sm:text-xs py-2 px-2 sm:px-3 whitespace-nowrap">Entregues ({statusCounts.delivered})</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value={tab} className="mt-4">
          {filtered.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Handshake className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhuma negociação encontrada</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filtered.map(neg => (
                <Card key={neg.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-sm sm:text-base truncate">{neg.product_name}</h3>
                          {getStatusBadge(neg.status)}
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 text-xs sm:text-sm">
                          <div>
                            <span className="text-muted-foreground">Comprador:</span>
                            <span className="ml-1 font-medium">{neg.buyerName}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Quantidade:</span>
                            <span className="ml-1 font-medium">{neg.quantity}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Valor acordado:</span>
                            <span className="ml-1 font-bold text-primary">R$ {Number(neg.agreed_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Pagamento:</span>
                            <span className="ml-1 font-medium">{neg.payment_method}</span>
                          </div>
                          {neg.expected_delivery && (
                            <div>
                              <span className="text-muted-foreground">Entrega prevista:</span>
                              <span className="ml-1 font-medium">{format(new Date(neg.expected_delivery), 'dd/MM/yyyy')}</span>
                            </div>
                          )}
                          <div>
                            <span className="text-muted-foreground">Registrada em:</span>
                            <span className="ml-1">{format(new Date(neg.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                          </div>
                        </div>

                        {neg.notes && (
                          <p className="text-xs text-muted-foreground bg-muted/50 rounded p-2 mt-2">📝 {neg.notes}</p>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-row sm:flex-col gap-2 flex-shrink-0">
                        {neg.status === 'pending' && (
                          <>
                            <Button size="sm" onClick={() => handleAccept(neg.id)} className="flex-1 sm:flex-none">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Aceitar
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleCancel(neg.id)} className="flex-1 sm:flex-none text-destructive">
                              <XCircle className="h-4 w-4 mr-1" />
                              Recusar
                            </Button>
                          </>
                        )}
                        {neg.status === 'accepted' && (
                          <>
                            <Button size="sm" onClick={() => handleShip(neg.id)} className="bg-orange-600 hover:bg-orange-700">
                              <Truck className="h-4 w-4 mr-1" />
                              Confirmar Envio
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1"
                              onClick={() => generateNegotiationPDF({
                                ...neg,
                                buyerName: neg.buyerName,
                                supplierName: user?.email || 'Fornecedor',
                              })}
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              PDF do Acordo
                            </Button>
                          </>
                        )}
                        {neg.status === 'shipped' && (
                          <div className="text-xs text-muted-foreground text-center bg-muted/50 rounded p-2">
                            <Truck className="h-4 w-4 mx-auto mb-1" />
                            Aguardando confirmação do comprador
                          </div>
                        )}
                        {neg.status === 'delivered' && (
                          <div className="text-xs text-green-600 text-center bg-green-50 dark:bg-green-900/20 rounded p-2">
                            <CheckCircle className="h-4 w-4 mx-auto mb-1" />
                            Entrega confirmada
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Negociacoes;
