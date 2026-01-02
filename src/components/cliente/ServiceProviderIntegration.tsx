import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Link2, 
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
  Send
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PendingRequest {
  id: string;
  status: string;
  requested_at: string;
  supplier_id: string;
  supplier?: {
    nome: string;
    foto_perfil_url: string | null;
  };
}

interface ServiceProviderIntegrationProps {
  serviceProviderId: string;
  onIntegrationComplete?: () => void;
}

export const ServiceProviderIntegration = ({ 
  serviceProviderId,
  onIntegrationComplete 
}: ServiceProviderIntegrationProps) => {
  const { user } = useSupabaseAuth();
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);

  useEffect(() => {
    if (user && serviceProviderId) {
      fetchPendingRequests();
    }
  }, [user, serviceProviderId]);

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('service_provider_requests')
        .select('*')
        .eq('service_provider_id', serviceProviderId)
        .in('status', ['pending', 'rejected'])
        .order('requested_at', { ascending: false });
      
      if (error) throw error;
      
      // Fetch supplier details
      const requestsWithDetails = await Promise.all((data || []).map(async (req) => {
        const { data: supplier } = await supabase
          .from('profiles')
          .select('nome, foto_perfil_url')
          .eq('id', req.supplier_id)
          .single();
        
        return { ...req, supplier };
      }));
      
      setPendingRequests(requestsWithDetails);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const requestIntegration = async () => {
    if (!code.trim()) {
      toast.error('Digite o código do fornecedor');
      return;
    }
    
    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc('request_supplier_integration', {
        _code: code.trim().toUpperCase()
      });
      
      if (error) throw error;
      
      const result = data as { ok: boolean; error?: string; message: string };
      
      if (result.ok) {
        toast.success(result.message);
        setCode("");
        fetchPendingRequests();
        onIntegrationComplete?.();
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      console.error('Error requesting integration:', error);
      toast.error('Erro ao solicitar integração');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-4 border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Link2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-medium text-foreground">Solicitar Integração</h3>
            <p className="text-sm text-muted-foreground">
              Digite o código fornecido pelo fornecedor
            </p>
          </div>
        </div>
        
        <div className="space-y-3">
          <div>
            <Label htmlFor="supplier-code">Código do Fornecedor</Label>
            <Input
              id="supplier-code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Ex: FORN-ABC12"
              className="font-mono text-center tracking-widest"
              maxLength={11}
            />
          </div>
          
          <Button 
            onClick={requestIntegration} 
            disabled={submitting || !code.trim()}
            className="w-full"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Solicitar Integração
          </Button>
        </div>
      </Card>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Solicitações Enviadas</h4>
          {pendingRequests.map((request) => (
            <Card key={request.id} className="p-3 border-border">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                  {request.status === 'pending' ? (
                    <Clock className="h-5 w-5 text-amber-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {request.supplier?.nome || 'Fornecedor'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {request.status === 'pending' ? 'Aguardando aprovação' : 'Recusado'} •{' '}
                    {formatDistanceToNow(new Date(request.requested_at), { 
                      addSuffix: true, 
                      locale: ptBR 
                    })}
                  </p>
                </div>
                <Badge variant={request.status === 'pending' ? 'outline' : 'secondary'}>
                  {request.status === 'pending' ? 'Pendente' : 'Recusado'}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
