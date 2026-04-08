import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Handshake, TrendingUp, Clock, CheckCircle, Package, Info, DollarSign } from "lucide-react";
import { DarkGlassIcon } from "@/components/ui/dark-glass-icon";
import { Icon3D } from "@/components/ui/icon-3d";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const Financeiro = () => {
  const { user } = useSupabaseAuth();
  const [negotiations, setNegotiations] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'delivered' | 'shipped' | 'pending'>('all');

  useEffect(() => {
    const fetch = async () => {
      if (!user?.id) return;
      const { data } = await supabase
        .from('negotiations' as any)
        .select('*')
        .eq('supplier_id', user.id)
        .order('created_at', { ascending: false });
      setNegotiations((data || []) as any[]);
    };
    fetch();
  }, [user?.id]);

  const delivered = negotiations.filter(n => n.status === 'delivered');
  const pending = negotiations.filter(n => n.status === 'pending' || n.status === 'accepted');
  const shipped = negotiations.filter(n => n.status === 'shipped');

  const totalDelivered = delivered.reduce((s, n) => s + Number(n.agreed_price) * n.quantity, 0);
  const totalPending = pending.reduce((s, n) => s + Number(n.agreed_price) * n.quantity, 0);
  const totalShipped = shipped.reduce((s, n) => s + Number(n.agreed_price) * n.quantity, 0);
  const totalAll = totalDelivered + totalShipped + totalPending;

  const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  const filteredNegotiations = activeFilter === 'all' ? negotiations
    : activeFilter === 'delivered' ? delivered
    : activeFilter === 'shipped' ? shipped
    : pending;

  const filters = [
    { key: 'all' as const, label: 'Todas', count: negotiations.length },
    { key: 'delivered' as const, label: 'Entregues', count: delivered.length },
    { key: 'shipped' as const, label: 'Em Trânsito', count: shipped.length },
    { key: 'pending' as const, label: 'Pendentes', count: pending.length },
  ];

  return (
    <div className="space-y-5 w-full max-w-full overflow-x-hidden">
      {/* Hero Card */}
      <div className="rounded-3xl p-6 text-primary-foreground relative overflow-hidden" style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))' }}>
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-primary-foreground/10 -translate-y-8 translate-x-8" />
        <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-primary-foreground/5 translate-y-6 -translate-x-6" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <Icon3D name="dollar" size="sm" />
            <span className="text-sm opacity-80 font-medium">Total Negociado</span>
          </div>
          <p className="text-4xl font-bold tracking-tight">{fmt(totalAll)}</p>
          <p className="text-sm opacity-70 mt-2">{negotiations.length} negociações registradas</p>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
        <div className="flex items-start gap-2">
          <Info className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            Pagamentos são combinados diretamente entre as partes. Os valores são referência das negociações na plataforma.
          </p>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {filters.map(f => (
          <button key={f.key} onClick={() => setActiveFilter(f.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${activeFilter === f.key ? 'bg-primary text-primary-foreground shadow-md' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
            {f.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeFilter === f.key ? 'bg-primary-foreground/20' : 'bg-background'}`}>{f.count}</span>
          </button>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="rounded-2xl border-0 shadow-md overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <DarkGlassIcon icon={CheckCircle} size="sm" />
              <span className="text-sm text-muted-foreground font-medium">Entregues</span>
            </div>
            <p className="text-2xl font-bold text-foreground break-words">{fmt(totalDelivered)}</p>
            <p className="text-xs text-muted-foreground mt-1">{delivered.length} negociação(ões)</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-md overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <DarkGlassIcon icon={Package} size="sm" />
              <span className="text-sm text-muted-foreground font-medium">Em Trânsito</span>
            </div>
            <p className="text-2xl font-bold text-foreground break-words">{fmt(totalShipped)}</p>
            <p className="text-xs text-muted-foreground mt-1">{shipped.length} negociação(ões)</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-md overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <DarkGlassIcon icon={Clock} size="sm" />
              <span className="text-sm text-muted-foreground font-medium">Pendentes</span>
            </div>
            <p className="text-2xl font-bold text-foreground break-words">{fmt(totalPending)}</p>
            <p className="text-xs text-muted-foreground mt-1">{pending.length} negociação(ões)</p>
          </CardContent>
        </Card>
      </div>

      {/* Negotiation History */}
      <Card className="rounded-2xl border-0 shadow-md overflow-hidden">
        <CardHeader className="p-4 sm:p-5 border-b">
          <CardTitle className="text-base font-bold">Histórico de Negociações</CardTitle>
        </CardHeader>
        <div className="divide-y">
          {filteredNegotiations.length > 0 ? filteredNegotiations.slice(0, 20).map(neg => (
            <div key={neg.id} className="p-4 sm:p-5 hover:bg-muted/30 transition-colors">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <DarkGlassIcon icon={Handshake} size="sm" />
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{neg.product_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(neg.created_at), "dd MMM yyyy", { locale: ptBR })} • Qtd: {neg.quantity}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="font-bold text-primary text-sm">{fmt(Number(neg.agreed_price) * neg.quantity)}</span>
                  <Badge variant={neg.status === 'delivered' ? 'default' : neg.status === 'cancelled' ? 'destructive' : 'secondary'} className="text-[10px] rounded-full">
                    {neg.status === 'pending' ? 'Pendente' : neg.status === 'accepted' ? 'Aceita' : neg.status === 'shipped' ? 'Enviada' : neg.status === 'delivered' ? 'Entregue' : neg.status === 'cancelled' ? 'Cancelada' : neg.status}
                  </Badge>
                </div>
              </div>
            </div>
          )) : (
            <div className="p-12 text-center text-muted-foreground">
              <Handshake className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>Nenhuma negociação registrada ainda</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Financeiro;
