import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, User, Clock, ArrowLeft, Send, Loader2, CheckCircle, XCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SupportTicket {
  id: string;
  user_id: string;
  assunto: string;
  mensagem: string;
  resposta_admin: string | null;
  status: 'open' | 'pending' | 'closed';
  created_at: string | null;
  updated_at: string | null;
  profiles?: {
    nome: string;
    tipo: string;
  };
}

const SuporteAdmin = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [response, setResponse] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchTickets();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('support-tickets-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_tickets'
        },
        () => {
          fetchTickets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      console.log('Fetching admin support tickets via RPC...');
      // Use the admin RPC function that bypasses RLS for profiles
      const { data, error } = await supabase.rpc('get_admin_support_tickets');

      if (error) throw error;
      
      // Map the RPC result to match our interface
      const mappedTickets = (data || []).map((ticket: any) => ({
        id: ticket.id,
        user_id: ticket.user_id,
        assunto: ticket.assunto,
        mensagem: ticket.mensagem,
        resposta_admin: ticket.resposta_admin,
        status: ticket.status as 'open' | 'pending' | 'closed',
        created_at: ticket.created_at,
        updated_at: ticket.updated_at,
        profiles: {
          nome: ticket.user_name || 'Usuário',
          tipo: 'cliente' // Default, we can get this from email pattern or add to RPC
        }
      }));
      
      setTickets(mappedTickets);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast.error('Erro ao carregar tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async () => {
    if (!selectedTicket || !response.trim()) return;

    try {
      setSending(true);
      const { error } = await supabase
        .from('support_tickets')
        .update({
          resposta_admin: response,
          status: 'pending'
        })
        .eq('id', selectedTicket.id);

      if (error) throw error;
      
      toast.success('Resposta enviada!');
      setResponse("");
      fetchTickets();
      setSelectedTicket(prev => prev ? { ...prev, resposta_admin: response, status: 'pending' } : null);
    } catch (error) {
      console.error('Error responding:', error);
      toast.error('Erro ao enviar resposta');
    } finally {
      setSending(false);
    }
  };

  const handleCloseTicket = async (ticketId: string) => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ status: 'closed' })
        .eq('id', ticketId);

      if (error) throw error;
      toast.success('Ticket fechado!');
      fetchTickets();
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(prev => prev ? { ...prev, status: 'closed' } : null);
      }
    } catch (error) {
      console.error('Error closing ticket:', error);
      toast.error('Erro ao fechar ticket');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="destructive">Aberto</Badge>;
      case 'pending':
        return <Badge variant="secondary">Aguardando</Badge>;
      case 'closed':
        return <Badge variant="default">Fechado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingCount = tickets.filter(t => t.status === 'open').length;
  const totalCount = tickets.length;
  const closedCount = tickets.filter(t => t.status === 'closed').length;


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
              {selectedTicket.profiles?.nome || 'Usuário'} • 
              {selectedTicket.profiles?.tipo === 'cliente' ? ' Cliente' : ' Fornecedor'} •
              {selectedTicket.created_at && format(new Date(selectedTicket.created_at), " dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
          {getStatusBadge(selectedTicket.status)}
        </div>

        <Card className="p-6">
          <div className="space-y-4">
            {/* Mensagem do usuário - alinhada à esquerda */}
            <div className="flex justify-start">
              <div className="max-w-[75%] bg-white border shadow-sm rounded-2xl px-4 py-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">{selectedTicket.profiles?.nome || 'Usuário'}</p>
                <p className="text-sm break-words whitespace-pre-wrap">{selectedTicket.mensagem}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedTicket.created_at && format(new Date(selectedTicket.created_at), "HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>

            {/* Resposta do admin - alinhada à direita */}
            {selectedTicket.resposta_admin && (
              <div className="flex justify-end">
                <div className="max-w-[75%] bg-primary text-white rounded-2xl px-4 py-3">
                  <p className="text-xs font-medium opacity-80 mb-1">Suporte Nellor</p>
                  <p className="text-sm break-words whitespace-pre-wrap">{selectedTicket.resposta_admin}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {selectedTicket.updated_at && format(new Date(selectedTicket.updated_at), "HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>
            )}

            {/* Campo de resposta */}
            {selectedTicket.status !== 'closed' && (
              <div className="pt-4 border-t">
                <Textarea
                  placeholder="Digite sua resposta..."
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  rows={4}
                  className="mb-3"
                />
                <div className="flex gap-2">
                  <Button onClick={handleRespond} disabled={sending || !response.trim()}>
                    {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                    Enviar Resposta
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleCloseTicket(selectedTicket.id)}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Fechar Ticket
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2 dark:text-white">Suporte</h1>
        <p className="text-muted-foreground">Tickets de suporte de clientes e fornecedores</p>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Tickets Abertos</p>
            <Clock className="h-5 w-5 text-yellow-600" />
          </div>
          <p className="text-3xl font-bold">{pendingCount}</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Total de Tickets</p>
            <MessageCircle className="h-5 w-5 text-primary" />
          </div>
          <p className="text-3xl font-bold">{totalCount}</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Tickets Fechados</p>
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold">{closedCount}</p>
        </Card>
      </div>

      {/* Lista de Tickets */}
      <Card>
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">Tickets Recentes</h2>
        </div>
        <div className="divide-y">
          {tickets.length === 0 ? (
            <div className="p-8 text-center">
              <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Nenhum ticket de suporte</p>
            </div>
          ) : (
            tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="p-6 hover:bg-muted/20 transition-colors cursor-pointer"
                onClick={() => setSelectedTicket(ticket)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{ticket.profiles?.nome || 'Usuário'}</p>
                          {getStatusBadge(ticket.status)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {ticket.profiles?.tipo === 'cliente' ? 'Cliente' : 'Fornecedor'} • 
                          {ticket.created_at && format(new Date(ticket.created_at), " dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <div className="mb-2">
                      <p className="font-medium text-sm">{ticket.assunto}</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">{ticket.mensagem}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};

export default SuporteAdmin;