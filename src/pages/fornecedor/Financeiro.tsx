import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Handshake, TrendingUp, Clock, CheckCircle, Package, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const Financeiro = () => {
  const { user } = useSupabaseAuth();
  const [negotiations, setNegotiations] = useState<any[]>([]);

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

  const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Financeiro</h1>
        <p className="text-sm text-muted-foreground mt-1">Visão geral dos valores negociados</p>
      </div>

      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-medium">Pagamentos são feitos diretamente entre as partes</p>
            <p className="text-xs mt-1 opacity-80">Os valores abaixo são referência das negociações registradas na plataforma. O pagamento e a entrega são combinados diretamente entre você e o comprador.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card className="border-green-200 dark:border-green-800 bg-green-50/30 dark:bg-green-900/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-xs text-muted-foreground">Entregues</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-green-600">{fmt(totalDelivered)}</p>
            <p className="text-xs text-muted-foreground mt-1">{delivered.length} negociação(ões)</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 dark:border-orange-800 bg-orange-50/30 dark:bg-orange-900/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-4 w-4 text-orange-600" />
              <span className="text-xs text-muted-foreground">Em Trânsito</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-orange-600">{fmt(totalShipped)}</p>
            <p className="text-xs text-muted-foreground mt-1">{shipped.length} negociação(ões)</p>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50/30 dark:bg-yellow-900/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <span className="text-xs text-muted-foreground">Pendentes/Aceitas</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-yellow-600">{fmt(totalPending)}</p>
            <p className="text-xs text-muted-foreground mt-1">{pending.length} negociação(ões)</p>
          </CardContent>
        </Card>
      </div>

      {/* Negotiation History */}
      <Card>
        <CardHeader className="p-4 sm:p-6 border-b">
          <CardTitle className="text-base sm:text-xl font-bold">Histórico de Negociações</CardTitle>
        </CardHeader>
        <div className="divide-y">
          {negotiations.length > 0 ? negotiations.slice(0, 20).map(neg => (
            <div key={neg.id} className="p-4 sm:p-6 hover:bg-muted/20 transition-colors">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm sm:text-base truncate">{neg.product_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(neg.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })} • Qtd: {neg.quantity}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant={neg.status === 'delivered' ? 'default' : neg.status === 'cancelled' ? 'destructive' : 'secondary'} className="text-xs">
                    {neg.status === 'pending' ? 'Pendente' : neg.status === 'accepted' ? 'Aceita' : neg.status === 'shipped' ? 'Enviada' : neg.status === 'delivered' ? 'Entregue' : neg.status === 'cancelled' ? 'Cancelada' : neg.status}
                  </Badge>
                  <span className="font-bold text-primary text-sm">{fmt(Number(neg.agreed_price) * neg.quantity)}</span>
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
