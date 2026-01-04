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
          <h1 className="text-2xl lg:text-3xl font-bold text-drop-text">Financeiro</h1>
          <p className="text-drop-text-muted mt-1">Acompanhe seus ganhos e movimentações</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            className="border-drop-border text-drop-text hover:bg-drop-surface-hover"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Período
          </Button>
          <Button 
            variant="outline"
            className="border-drop-border text-drop-text hover:bg-drop-surface-hover"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {financialStats.map((stat, index) => (
          <div
            key={index}
            className="bg-drop-card border border-drop-border rounded-2xl p-4 lg:p-6"
          >
            <div className={cn(
              "inline-flex p-2 lg:p-3 rounded-xl mb-4",
              stat.color === "drop-accent" && "bg-drop-accent/10",
              stat.color === "drop-success" && "bg-drop-success/10",
              stat.color === "drop-warning" && "bg-drop-warning/10"
            )}>
              <stat.icon className={cn(
                "h-5 w-5 lg:h-6 lg:w-6",
                stat.color === "drop-accent" && "text-drop-accent",
                stat.color === "drop-success" && "text-drop-success",
                stat.color === "drop-warning" && "text-drop-warning"
              )} />
            </div>
            <p className="text-drop-text-muted text-xs lg:text-sm">{stat.title}</p>
            <p className={cn(
              "text-xl lg:text-2xl font-bold mt-1",
              stat.color === "drop-success" ? "text-drop-success" : "text-drop-text"
            )}>
              {stat.isPercent 
                ? `${stat.value.toFixed(1)}%`
                : `R$ ${stat.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
              }
            </p>
            <p className="text-drop-text-muted text-xs mt-1">{stat.description}</p>
          </div>
        ))}
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-br from-drop-accent/20 to-drop-accent/5 border border-drop-accent/30 rounded-2xl p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Wallet className="h-6 w-6 text-drop-accent" />
              <h2 className="text-drop-text font-semibold text-lg">Saldo Disponível</h2>
            </div>
            <p className="text-4xl lg:text-5xl font-bold text-drop-text">
              R$ {(dropStats?.total_profit || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-drop-text-muted text-sm mt-2">
              Lucro acumulado das suas vendas
            </p>
          </div>
          <Button 
            size="lg"
            className="bg-drop-accent hover:bg-drop-accent/90 text-white"
          >
            <ArrowUpRight className="h-5 w-5 mr-2" />
            Solicitar Saque
          </Button>
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-drop-card border border-drop-border rounded-2xl overflow-hidden">
        <div className="p-4 lg:p-6 border-b border-drop-border">
          <h2 className="text-lg font-semibold text-drop-text">Movimentações</h2>
          <p className="text-drop-text-muted text-sm">Histórico de vendas e ganhos</p>
        </div>
        
        {transactions.length === 0 ? (
          <div className="p-8 text-center">
            <DollarSign className="h-12 w-12 text-drop-text-muted mx-auto mb-4" />
            <p className="text-drop-text-muted">Nenhuma movimentação ainda</p>
          </div>
        ) : (
          <div className="divide-y divide-drop-border">
            {transactions.map((tx: any) => (
              <div key={tx.id} className="p-4 lg:p-5 hover:bg-drop-surface-hover transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "p-2 rounded-lg",
                      tx.type === 'sale' ? "bg-drop-success/10" : "bg-drop-warning/10"
                    )}>
                      {tx.type === 'sale' ? (
                        <TrendingUp className="h-4 w-4 text-drop-success" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-drop-warning" />
                      )}
                    </div>
                    <div>
                      <p className="text-drop-text font-medium">{tx.description}</p>
                      <p className="text-drop-text-muted text-sm">
                        {new Date(tx.date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-drop-text font-semibold">
                      R$ {tx.amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-drop-success text-sm">
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
