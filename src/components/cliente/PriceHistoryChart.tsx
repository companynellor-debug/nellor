import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PriceHistoryChartProps {
  productId: string;
  currentPrice: number;
}

interface PricePoint {
  date: string;
  price: number;
  rawDate: Date;
}

const PriceHistoryChart = ({ productId, currentPrice }: PriceHistoryChartProps) => {
  const [data, setData] = useState<PricePoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      const since = subDays(new Date(), 30).toISOString();
      const { data: rows } = await supabase
        .from("price_history")
        .select("price, recorded_at")
        .eq("product_id", productId)
        .is("variation_id", null)
        .gte("recorded_at", since)
        .order("recorded_at", { ascending: true });

      if (rows && rows.length > 0) {
        const pts: PricePoint[] = rows.map((r) => ({
          date: format(new Date(r.recorded_at!), "dd/MM", { locale: ptBR }),
          price: Number(r.price),
          rawDate: new Date(r.recorded_at!),
        }));
        // Always append current price as "today"
        pts.push({
          date: format(new Date(), "dd/MM", { locale: ptBR }),
          price: currentPrice,
          rawDate: new Date(),
        });
        setData(pts);
      } else {
        setData([]);
      }
      setLoading(false);
    };

    if (productId) fetchHistory();
  }, [productId, currentPrice]);

  if (loading) return null;

  if (data.length < 2) {
    return (
      <div className="bg-muted/30 rounded-lg p-4 border">
        <p className="text-xs font-semibold mb-1">📊 Histórico de Preços</p>
        <p className="text-xs text-muted-foreground">Histórico disponível em breve</p>
      </div>
    );
  }

  const firstPrice = data[0].price;
  const lastPrice = data[data.length - 1].price;
  const pctChange = ((lastPrice - firstPrice) / firstPrice) * 100;
  const priceWentDown = pctChange < -0.01;
  const priceWentUp = pctChange > 0.01;

  const minP = Math.min(...data.map((d) => d.price));
  const maxP = Math.max(...data.map((d) => d.price));
  const paddedMin = minP * 0.97;
  const paddedMax = maxP * 1.03;

  const formatBRL = (val: number) =>
    val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="bg-muted/30 rounded-lg p-4 border space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold">📊 Histórico de Preços — 30 dias</p>
        {priceWentDown && (
          <Badge className="bg-green-100 text-green-700 border-green-200 gap-1 text-xs">
            <TrendingDown className="h-3 w-3" />
            Preço baixou {Math.abs(pctChange).toFixed(1)}%
          </Badge>
        )}
        {priceWentUp && (
          <Badge className="bg-red-100 text-red-700 border-red-200 gap-1 text-xs">
            <TrendingUp className="h-3 w-3" />
            Preço subiu {pctChange.toFixed(1)}%
          </Badge>
        )}
        {!priceWentDown && !priceWentUp && (
          <Badge variant="outline" className="text-xs">
            Estável
          </Badge>
        )}
      </div>
      <ResponsiveContainer width="100%" height={140}>
        <LineChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[paddedMin, paddedMax]}
            tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `R$${Number(v).toFixed(0)}`}
            width={48}
          />
          <Tooltip
            formatter={(val: number) => [formatBRL(val), "Preço"]}
            contentStyle={{
              fontSize: 11,
              borderRadius: 8,
              border: "1px solid hsl(var(--border))",
              background: "hsl(var(--background))",
            }}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "hsl(var(--primary))" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PriceHistoryChart;
