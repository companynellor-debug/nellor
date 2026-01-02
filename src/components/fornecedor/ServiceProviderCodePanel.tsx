import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Briefcase, 
  Copy, 
  RefreshCw, 
  Check,
  Loader2,
  AlertCircle,
  Info
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { toast } from "sonner";
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";

export const ServiceProviderCodePanel = () => {
  const { user } = useSupabaseAuth();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [allowsProviders, setAllowsProviders] = useState(false);

  useEffect(() => {
    if (user) {
      fetchCode();
      fetchSettings();
    }
  }, [user]);

  const fetchCode = async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from('profiles')
        .select('service_provider_code')
        .eq('id', user.id)
        .single();
      
      setCode(data?.service_provider_code || null);
    } catch (error) {
      console.error('Error fetching code:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('supplier_service_provider_settings')
      .select('allow_service_providers')
      .eq('supplier_id', user.id)
      .single();
    
    setAllowsProviders(data?.allow_service_providers || false);
  };

  const generateCode = async () => {
    if (!user) return;
    
    setGenerating(true);
    try {
      const { data, error } = await supabase.rpc('generate_or_get_supplier_code', {
        _supplier_id: user.id
      });
      
      if (error) throw error;
      
      setCode(data);
      toast.success('Código gerado com sucesso!');
    } catch (error: any) {
      console.error('Error generating code:', error);
      toast.error('Erro ao gerar código');
    } finally {
      setGenerating(false);
    }
  };

  const regenerateCode = async () => {
    if (!user) return;
    
    setGenerating(true);
    try {
      const { data, error } = await supabase.rpc('regenerate_supplier_code', {
        _supplier_id: user.id
      });
      
      if (error) throw error;
      
      setCode(data);
      toast.success('Novo código gerado!');
    } catch (error: any) {
      console.error('Error regenerating code:', error);
      toast.error('Erro ao regenerar código');
    } finally {
      setGenerating(false);
    }
  };

  const copyCode = () => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('Código copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

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
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Briefcase className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Código para Prestadores</h2>
          <p className="text-sm text-muted-foreground">
            Compartilhe este código com prestadores de serviço
          </p>
        </div>
      </div>

      {!allowsProviders && (
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Para usar prestadores de serviço, ative a opção "Permitir Prestadores" na aba de Permissões.
          </AlertDescription>
        </Alert>
      )}

      {code ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 p-4 bg-muted rounded-lg border-2 border-dashed border-primary/30">
              <p className="text-2xl font-mono font-bold text-center tracking-widest text-primary">
                {code}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Button variant="outline" size="icon" onClick={copyCode}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={regenerateCode}
                disabled={generating}
              >
                <RefreshCw className={`h-4 w-4 ${generating ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Compartilhe este código apenas com prestadores de serviço de confiança. 
              Eles poderão gerenciar seus produtos conforme as permissões que você definir.
            </AlertDescription>
          </Alert>
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-muted-foreground mb-4">
            Gere um código para permitir que prestadores solicitem integração
          </p>
          <Button onClick={generateCode} disabled={generating}>
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Briefcase className="h-4 w-4 mr-2" />
            )}
            Gerar Código de Prestador
          </Button>
        </div>
      )}
    </Card>
  );
};
