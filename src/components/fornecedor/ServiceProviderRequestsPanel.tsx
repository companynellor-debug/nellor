import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Briefcase, 
  Check,
  X,
  Loader2,
  User,
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ServiceProviderRequest {
  id: string;
  service_provider_id: string;
  status: string;
  requested_at: string;
  responded_at: string | null;
  service_provider?: {
    business_name: string;
    service_type: string;
    description: string | null;
  };
  user?: {
    nome: string;
    email: string;
    foto_perfil_url: string | null;
  };
}

export const ServiceProviderRequestsPanel = () => {
  const { user } = useSupabaseAuth();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<ServiceProviderRequest[]>([]);
  const [responding, setResponding] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [user]);

  const fetchRequests = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Fetch requests
      const { data: requestsData, error } = await supabase
        .from('service_provider_requests')
        .select('*')
        .eq('supplier_id', user.id)
        .order('requested_at', { ascending: false });
      
      if (error) throw error;
      
      // Fetch service provider and user details for each request
      const requestsWithDetails = await Promise.all((requestsData || []).map(async (req) => {
        const { data: spData } = await supabase
          .from('service_providers')
          .select('business_name, service_type, description, user_id')
          .eq('id', req.service_provider_id)
          .single();
        
        let userData = null;
        if (spData?.user_id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('nome, email, foto_perfil_url')
            .eq('id', spData.user_id)
            .single();
          userData = profile;
        }
        
        return {
          ...req,
          service_provider: spData,
          user: userData
        };
      }));
      
      setRequests(requestsWithDetails);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const respondToRequest = async (requestId: string, approve: boolean) => {
    setResponding(requestId);
    try {
      const { data, error } = await supabase.rpc('respond_to_sp_request', {
        _request_id: requestId,
        _approve: approve
      });
      
      if (error) throw error;
      
      const result = data as { ok: boolean; message: string };
      
      if (result.ok) {
        toast.success(result.message);
        fetchRequests();
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      console.error('Error responding to request:', error);
      toast.error('Erro ao responder solicitação');
    } finally {
      setResponding(null);
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const historyRequests = requests.filter(r => r.status !== 'pending');

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Briefcase className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Solicitações de Prestadores</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie quem pode gerenciar sua loja
          </p>
        </div>
        {pendingRequests.length > 0 && (
          <Badge variant="destructive" className="ml-auto">
            {pendingRequests.length} pendente{pendingRequests.length > 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="space-y-4 mb-6">
          <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
            Aguardando Aprovação
          </h3>
          {pendingRequests.map((request) => (
            <div 
              key={request.id} 
              className="p-4 border rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  {request.user?.foto_perfil_url ? (
                    <img 
                      src={request.user.foto_perfil_url} 
                      alt={request.user.nome}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-6 w-6 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold">
                    {request.service_provider?.business_name || 'Prestador'}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {request.user?.nome} • {request.service_provider?.service_type}
                  </p>
                  {request.service_provider?.description && (
                    <p className="text-sm mt-1 line-clamp-2">
                      {request.service_provider.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Solicitado {formatDistanceToNow(new Date(request.requested_at), { 
                      addSuffix: true, 
                      locale: ptBR 
                    })}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => respondToRequest(request.id, false)}
                    disabled={responding === request.id}
                    className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  >
                    {responding === request.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => respondToRequest(request.id, true)}
                    disabled={responding === request.id}
                  >
                    {responding === request.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Aceitar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* History */}
      {historyRequests.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
            Histórico
          </h3>
          {historyRequests.map((request) => (
            <div 
              key={request.id} 
              className="p-3 border rounded-lg flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                {request.status === 'approved' ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-destructive" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {request.service_provider?.business_name || 'Prestador'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {request.status === 'approved' ? 'Aprovado' : 'Recusado'} •{' '}
                  {request.responded_at && formatDistanceToNow(new Date(request.responded_at), { 
                    addSuffix: true, 
                    locale: ptBR 
                  })}
                </p>
              </div>
              <Badge variant={request.status === 'approved' ? 'default' : 'secondary'}>
                {request.status === 'approved' ? 'Aprovado' : 'Recusado'}
              </Badge>
            </div>
          ))}
        </div>
      )}

      {requests.length === 0 && (
        <div className="text-center py-8">
          <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Nenhuma solicitação de prestadores ainda
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Compartilhe seu código para receber solicitações
          </p>
        </div>
      )}
    </Card>
  );
};
