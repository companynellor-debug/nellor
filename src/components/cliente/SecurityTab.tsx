import { Card } from '@/components/ui/card';
import { Shield, Monitor, Clock, Loader2 } from 'lucide-react';
import { useSecurityLogs } from '@/hooks/useSecurityLogs';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
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
  );
};

export default SecurityTab;
