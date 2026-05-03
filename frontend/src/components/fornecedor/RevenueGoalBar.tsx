import { useState, useEffect } from "react";
import { Target } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { formatCurrency } from "@/utils/formatCurrency";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const GOALS = [500_000, 1_000_000, 2_000_000, 5_000_000, 10_000_000, 20_000_000];
const STORAGE_KEY = "nellor_revenue_goal";

export const RevenueGoalBar = () => {
  const { user } = useSupabaseAuth();
  const [revenue, setRevenue] = useState(0);
  const [goal, setGoal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    const saved = localStorage.getItem(STORAGE_KEY);
    const fetchRevenue = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("negotiations")
        .select("agreed_price, quantity")
        .eq("supplier_id", user.id)
        .eq("status", "delivered");
      const total = (data || []).reduce((sum: number, n: any) => sum + ((n.agreed_price || 0)), 0);
      setRevenue(total);
      if (saved) {
        setGoal(Number(saved));
      } else {
        const autoGoal = GOALS.find(g => g > total) || GOALS[GOALS.length - 1];
        setGoal(autoGoal);
      }
      setLoading(false);
    };
    fetchRevenue();
  }, [user?.id]);

  const selectGoal = (g: number) => {
    setGoal(g);
    localStorage.setItem(STORAGE_KEY, String(g));
  };

  if (loading || !goal) return null;

  const pct = Math.min(100, (revenue / goal) * 100);

  const formatShort = (v: number) => {
    if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(0)}M`;
    if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(0)}k`;
    return formatCurrency(v);
  };

  return (
    <div className="border-b border-border bg-card/50 px-3 py-2 sm:px-6">
      <div className="flex items-center gap-2 sm:gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0">
              <Target className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Meta</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {GOALS.map(g => (
              <DropdownMenuItem key={g} onClick={() => selectGoal(g)} className={goal === g ? "font-bold text-primary" : ""}>
                {formatShort(g)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex-1 min-w-0">
          <Progress value={pct} className="h-2.5 rounded-full" />
        </div>

        <div className="flex items-center gap-1 shrink-0 text-xs">
          <span className="font-bold text-foreground">{formatCurrency(revenue)}</span>
          <span className="text-muted-foreground">/ {formatShort(goal)}</span>
          <span className="text-muted-foreground hidden sm:inline">({pct.toFixed(1)}%)</span>
        </div>
      </div>
    </div>
  );
};
