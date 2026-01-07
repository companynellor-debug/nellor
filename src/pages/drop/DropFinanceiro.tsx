import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  ArrowUpRight,
  Calendar,
  Download,
  CreditCard,
  Wallet,
  PiggyBank
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useClientDrop } from "@/hooks/useClientDrop";
import { cn } from "@/lib/utils";

const DropFinanceiro = () => {
  const { dropStats, dropOrders } = useClientDrop();

  const financialStats = [
    {
      title: "Receita Bruta",
      value: dropStats?.total_sales || 0,
      icon: DollarSign,
      color: "drop-accent",
      description: "Total vendido"
    },
    {
      title: "Custo de Produtos",
      value: (dropStats?.total_sales || 0) - (dropStats?.total_profit || 0),
      icon: CreditCard,
      color: "drop-warning",
      description: "Repasse aos fornecedores"
    },
    {
      title: "Lucro Líquido",
      value: dropStats?.total_profit || 0,
      icon: TrendingUp,
      color: "drop-success",
      description: "Sua margem"
    },
    {
      title: "Margem Média",
      value: dropStats?.avg_commission || 0,
      icon: PiggyBank,
      color: "drop-accent",
      description: "Por produto vendido",
      isPercent: true
    },
  ];

  // Simulated transactions based on orders
  const transactions = (dropOrders || []).slice(0, 10).map((order: any) => ({
    id: order.id,
    type: 'sale',
    description: `Venda #${order.order_number}`,
    amount: order.total,
    profit: order.client_margin,
    date: order.created_at,
    status: order.payment_status
  }));

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Financeiro</h1>
          <p className="text-muted-foreground mt-1">Acompanhe seus ganhos e movimentações</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Período
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {financialStats.map((stat, index) => (
          <div key={index} className="bg-card border border-border rounded-2xl p-4 lg:p-6">
            <div className={cn(
              "inline-flex p-2 lg:p-3 rounded-xl mb-4",
              stat.color === "drop-accent" && "bg-primary/10",
              stat.color === "drop-success" && "bg-green-500/10",
              stat.color === "drop-warning" && "bg-amber-500/10"
            )}>
              <stat.icon className={cn(
                "h-5 w-5 lg:h-6 lg:w-6",
                stat.color === "drop-accent" && "text-primary",
                stat.color === "drop-success" && "text-green-600",
                stat.color === "drop-warning" && "text-amber-500"
              )} />
            </div>
            <p className="text-muted-foreground text-xs lg:text-sm">{stat.title}</p>
            <p className={cn(
              "text-xl lg:text-2xl font-bold mt-1",
              stat.color === "drop-success" ? "text-green-600" : "text-foreground"
            )}>
              {stat.isPercent 
                ? `${stat.value.toFixed(1)}%`
                : `R$ ${stat.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
              }
            </p>
            <p className="text-muted-foreground text-xs mt-1">{stat.description}</p>
          </div>
        ))}
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 rounded-2xl p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Wallet className="h-6 w-6 text-primary" />
              <h2 className="text-foreground font-semibold text-lg">Saldo Disponível</h2>
            </div>
            <p className="text-4xl lg:text-5xl font-bold text-foreground">
              R$ {(dropStats?.total_profit || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-muted-foreground text-sm mt-2">
              Lucro acumulado das suas vendas
            </p>
          </div>
          <Button size="lg">
            <ArrowUpRight className="h-5 w-5 mr-2" />
            Solicitar Saque
          </Button>
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="p-4 lg:p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Movimentações</h2>
          <p className="text-muted-foreground text-sm">Histórico de vendas e ganhos</p>
        </div>
        
        {transactions.length === 0 ? (
          <div className="p-8 text-center">
            <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhuma movimentação ainda</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {transactions.map((tx: any) => (
              <div key={tx.id} className="p-4 lg:p-5 hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "p-2 rounded-lg",
                      tx.type === 'sale' ? "bg-green-500/10" : "bg-amber-500/10"
                    )}>
                      {tx.type === 'sale' ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-amber-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-foreground font-medium">{tx.description}</p>
                      <p className="text-muted-foreground text-sm">
                        {new Date(tx.date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-foreground font-semibold">
                      R$ {tx.amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-green-600 text-sm">
                      +R$ {tx.profit?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DropFinanceiro;
