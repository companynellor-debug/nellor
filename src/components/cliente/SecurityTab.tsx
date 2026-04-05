import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Monitor, Clock, Loader2, Trash2 } from 'lucide-react';
import { useSecurityLogs } from '@/hooks/useSecurityLogs';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const actionLabels: Record<string, string> = {
  login: '🔑 Login realizado',
  logout: '🚪 Logout',
  password_change: '🔒 Senha alterada',
  email_change: '📧 Email alterado',
  profile_update: '👤 Perfil atualizado',
  order_created: '📦 Pedido criado',
  admin_access: '🛡️ Acesso admin',
};

const parseDevice = (ua: string | null): string => {
  if (!ua) return 'Desconhecido';
  if (ua.includes('Mobile')) return '📱 Celular';
  if (ua.includes('Tablet')) return '📱 Tablet';
  return '💻 Desktop';
};

const SecurityTab = () => {
  const { logs, loading } = useSecurityLogs();
  const { user } = useSupabaseAuth();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-user-actions', {
        body: { action: 'self_delete' },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      await supabase.auth.signOut();
      toast.success('Conta excluída com sucesso.');
      navigate('/');
    } catch (err: any) {
      console.error('Error deleting account:', err);
      toast.error('Erro ao excluir conta: ' + (err.message || 'Tente novamente'));
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <Shield className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-sm">Últimos Acessos</h3>
        </div>

        {logs.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-sm text-muted-foreground">Nenhum registro de atividade encontrado.</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <Card key={log.id} className="p-3 border shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {actionLabels[log.action] || log.action}
                    </p>
                    {log.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{log.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Monitor className="h-3 w-3" />
                        {parseDevice(log.user_agent)}
                      </span>
                      {log.ip_address && (
                        <span>IP: {log.ip_address}</span>
                      )}
                    </div>
                  </div>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                    <Clock className="h-3 w-3" />
                    {format(new Date(log.created_at), "dd/MM HH:mm", { locale: ptBR })}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete Account */}
      <div className="space-y-2 pt-4 border-t">
        <div className="flex items-center gap-2 px-1">
          <Trash2 className="h-5 w-5 text-destructive" />
          <h3 className="font-semibold text-sm text-destructive">Excluir Conta</h3>
        </div>
        <Card className="p-4 border-destructive/30">
          <p className="text-sm text-muted-foreground mb-3">
            Ao excluir sua conta, todos os seus dados serão permanentemente removidos. Esta ação não pode ser desfeita.
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="w-full" disabled={deleting}>
                <Trash2 className="h-4 w-4 mr-2" />
                {deleting ? 'Excluindo...' : 'Excluir minha conta'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação é irreversível. Todos os seus dados, pedidos, endereços e informações serão permanentemente excluídos.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Sim, excluir minha conta
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </Card>
      </div>
    </div>
  );
};

export default SecurityTab;