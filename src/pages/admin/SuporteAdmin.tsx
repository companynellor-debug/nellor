import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MessageCircle, User, Clock, ArrowLeft, Send, Loader2,
  CheckCircle, Flag
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { clearAdminAccess, getAdminToken, storeAdminAccess } from "@/lib/adminAccess";

interface SupportTicket {
  id: string;
  user_id: string;
  assunto: string;
  mensagem: string;
  resposta_admin: string | null;
  status: 'open' | 'pending' | 'closed';
  created_at: string | null;
  updated_at: string | null;
  profiles?: { nome: string; tipo: string };
}

const SuporteAdmin = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [response, setResponse] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchAll();
    const channel = supabase
      .channel('support-tickets-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, () => fetchAll())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchAll = async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase.rpc('get_admin_support_tickets');
      if (error) throw error;
      setTickets((data || []).map((t: any) => ({
        id: t.id,
        user_id: t.user_id,
        assunto: t.assunto,
        mensagem: t.mensagem,
        resposta_admin: t.resposta_admin,
        status: t.status as SupportTicket['status'],
        created_at: t.created_at,
        updated_at: t.updated_at,
        profiles: { nome: t.user_name || 'Usuário', tipo: 'cliente' }
      })));
    } catch (e) {
      console.error('Tickets fetch failed:', e);
    }

    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (!error) setReports(data || []);
    } catch (e) {
      console.error(e);
    }

    setLoading(false);
  };

  const ensureAdminToken = async () => {
    const existingToken = getAdminToken();
    if (existingToken) return existingToken;

    const password = window.prompt('Digite a senha admin para confirmar esta ação:');
    if (!password?.trim()) return null;

    const { data, error } = await supabase.functions.invoke('admin-grant-role', {
      body: { password: password.trim() }
    });

    if (error || !data?.adminToken) {
      throw new Error('ADMIN_LOGIN_FAILED');
    }

    storeAdminAccess(data.adminToken);
    return data.adminToken as string;
  };

  const runAdminSupportAction = async (payload: Record<string, unknown>) => {
    const adminToken = await ensureAdminToken();
    if (!adminToken) return { cancelled: true };

    const { data, error } = await supabase.functions.invoke('admin-support-action', {
      body: { ...payload, adminToken }
    });

    if (error || !data?.ok) {
      if (data?.error === 'INVALID_ADMIN_TOKEN') {
        clearAdminAccess();
      }
      throw new Error(data?.error || error?.message || 'ADMIN_SUPPORT_ACTION_FAILED');
    }

    return data;
  };

  const handleRespond = async () => {
    if (!selectedTicket || !response.trim()) return;

    try {
      setSending(true);
      const result = await runAdminSupportAction({
        type: 'ticket',
        ticketId: selectedTicket.id,
        response,
        status: 'pending'
      });

      if ('cancelled' in result) return;

      toast.success('Resposta enviada!');
      setResponse("");
      void fetchAll();
      setSelectedTicket(prev => prev ? { ...prev, resposta_admin: response, status: 'pending' } : null);
    } catch (e) {
      console.error('Respond ticket error:', e);
      toast.error('Erro ao enviar resposta');
    } finally {
      setSending(false);
    }
  };

  const handleCloseTicket = async (ticketId: string) => {
    try {
      const result = await runAdminSupportAction({
        type: 'ticket',
        ticketId,
        status: 'closed'
      });

      if ('cancelled' in result) return;

      toast.success('Ticket fechado!');
      void fetchAll();
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(prev => prev ? { ...prev, status: 'closed' } : null);
      }
    } catch (e) {
      console.error('Close ticket error:', e);
      toast.error('Erro ao fechar ticket');
    }
  };

  const handleReportAction = async (id: string, action: 'reviewed' | 'resolved') => {
    try {
      const result = await runAdminSupportAction({
        type: 'report',
        reportId: id,
        status: action
      });

      if ('cancelled' in result) return;

      toast.success('Denúncia atualizada!');
      setReports(prev => prev.filter(r => r.id !== id));
    } catch (e) {
      console.error('Report action error:', e);
      toast.error('Erro ao atualizar denúncia');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open': return <Badge variant="destructive">Aberto</Badge>;
      case 'pending': return <Badge variant="secondary">Aguardando</Badge>;
      case 'closed': return <Badge variant="default">Fechado</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const openTickets = tickets.filter(t => t.status === 'open').length;
  const pendingReports = reports.filter(r => r.status === 'pending').length;

  if (selectedTicket) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setSelectedTicket(null)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{selectedTicket.assunto}</h2>
            <p className="text-sm text-muted-foreground">
              {selectedTicket.profiles?.nome} •
              {selectedTicket.created_at && format(new Date(selectedTicket.created_at), " dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
          {getStatusBadge(selectedTicket.status)}
        </div>
        <Card className="p-6 space-y-4">
          <div className="flex justify-start">
            <div className="max-w-[75%] bg-muted border border-border rounded-2xl px-4 py-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">{selectedTicket.profiles?.nome}</p>
              <p className="text-sm break-words whitespace-pre-wrap">{selectedTicket.mensagem}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {selectedTicket.created_at && format(new Date(selectedTicket.created_at), "HH:mm", { locale: ptBR })}
              </p>
            </div>
          </div>
          {selectedTicket.resposta_admin && (
            <div className="flex justify-end">
              <div className="max-w-[75%] bg-primary text-primary-foreground rounded-2xl px-4 py-3">
                <p className="text-xs font-medium opacity-80 mb-1">Suporte Nellor</p>
                <p className="text-sm break-words whitespace-pre-wrap">{selectedTicket.resposta_admin}</p>
                <p className="text-xs opacity-70 mt-1">
                  {selectedTicket.updated_at && format(new Date(selectedTicket.updated_at), "HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>
          )}
          {selectedTicket.status !== 'closed' && (
            <div className="pt-4 border-t">
              <Textarea placeholder="Digite sua resposta..." value={response} onChange={(e) => setResponse(e.target.value)} rows={4} className="mb-3" />
              <div className="flex gap-2">
                <Button onClick={handleRespond} disabled={sending || !response.trim()}>
                  {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                  Enviar Resposta
                </Button>
                <Button variant="outline" onClick={() => handleCloseTicket(selectedTicket.id)}>
                  <CheckCircle className="h-4 w-4 mr-2" />Fechar Ticket
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    );
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2 text-foreground">Suporte & Denúncias</h1>
        <p className="text-muted-foreground">Tickets de suporte e denúncias de usuários</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Tickets Abertos</p>
            <Clock className="h-5 w-5 text-yellow-600" />
          </div>
          <p className="text-3xl font-bold">{openTickets}</p>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Denúncias Pendentes</p>
            <Flag className="h-5 w-5 text-red-500" />
          </div>
          <p className="text-3xl font-bold">{pendingReports}</p>
        </Card>
      </div>

      <Tabs defaultValue="tickets" className="w-full">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="tickets" className="gap-1">
            <MessageCircle className="h-4 w-4" /> Tickets {openTickets > 0 && <Badge variant="destructive" className="ml-1 text-xs px-1.5 py-0">{openTickets}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-1">
            <Flag className="h-4 w-4" /> Denúncias {pendingReports > 0 && <Badge variant="destructive" className="ml-1 text-xs px-1.5 py-0">{pendingReports}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tickets">
          <Card>
            <div className="divide-y">
              {tickets.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">Nenhum ticket de suporte</p>
                </div>
              ) : tickets.map((ticket) => (
                <div key={ticket.id} className="p-4 hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => setSelectedTicket(ticket)}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold truncate">{ticket.profiles?.nome}</p>
                          {getStatusBadge(ticket.status)}
                        </div>
                        <p className="font-medium text-sm">{ticket.assunto}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1">{ticket.mensagem}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {ticket.created_at && format(new Date(ticket.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reports.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="p-8 text-center">
                  <Flag className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">Nenhuma denúncia</p>
                </CardContent>
              </Card>
            ) : reports.map((rep) => (
              <Card key={rep.id} className="border-l-4 border-l-red-500">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base capitalize">
                      {rep.target_type === 'product' ? '📦 Produto' : '🏪 Fornecedor'}: {rep.reason}
                    </CardTitle>
                    <Badge variant={rep.status === 'pending' ? 'destructive' : 'default'}>
                      {rep.status === 'pending' ? 'Pendente' : rep.status === 'reviewed' ? 'Analisado' : 'Resolvido'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {rep.description && <p className="text-sm text-muted-foreground">{rep.description}</p>}
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(rep.created_at), { addSuffix: true, locale: ptBR })}
                  </p>
                  {rep.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => handleReportAction(rep.id, 'reviewed')}>
                        Analisar
                      </Button>
                      <Button size="sm" className="flex-1" onClick={() => handleReportAction(rep.id, 'resolved')}>
                        <CheckCircle className="h-3 w-3 mr-1" />Resolver
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SuporteAdmin;