import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    // Fetch active coupons with expiration or usage limits
    const { data: coupons, error: couponsError } = await supabase
      .from("coupons")
      .select("id, codigo, supplier_id, expira_em, uso_maximo, uso_atual")
      .eq("ativo", true);

    if (couponsError) {
      throw couponsError;
    }

    const notifications: Array<{
      user_id: string;
      title: string;
      body: string;
      type: string;
      data: object;
    }> = [];

    for (const coupon of coupons || []) {
      // Check expiration (within 3 days)
      if (coupon.expira_em) {
        const expirationDate = new Date(coupon.expira_em);
        if (expirationDate > now && expirationDate <= threeDaysFromNow) {
          const daysLeft = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          notifications.push({
            user_id: coupon.supplier_id,
            title: "Cupom Expirando!",
            body: `O cupom ${coupon.codigo} expira em ${daysLeft} dia${daysLeft > 1 ? 's' : ''}.`,
            type: "alert",
            data: { coupon_id: coupon.id, alert_type: "expiring" }
          });
        }
      }

      // Check usage limit (80% or more used)
      if (coupon.uso_maximo && coupon.uso_atual) {
        const usagePercentage = (coupon.uso_atual / coupon.uso_maximo) * 100;
        if (usagePercentage >= 80 && usagePercentage < 100) {
          const remaining = coupon.uso_maximo - coupon.uso_atual;
          notifications.push({
            user_id: coupon.supplier_id,
            title: "Cupom Quase Esgotado!",
            body: `O cupom ${coupon.codigo} tem apenas ${remaining} uso${remaining > 1 ? 's' : ''} restante${remaining > 1 ? 's' : ''}.`,
            type: "alert",
            data: { coupon_id: coupon.id, alert_type: "usage_limit" }
          });
        }
      }
    }

    // Insert notifications (avoid duplicates by checking recent notifications)
    let inserted = 0;
    for (const notification of notifications) {
      // Check if similar notification was sent in the last 24 hours
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      
      const { data: existing } = await supabase
        .from("notifications")
        .select("id")
        .eq("user_id", notification.user_id)
        .eq("title", notification.title)
        .gte("created_at", oneDayAgo)
        .limit(1);

      if (!existing || existing.length === 0) {
        const { error: insertError } = await supabase
          .from("notifications")
          .insert({
            user_id: notification.user_id,
            title: notification.title,
            body: notification.body,
            type: notification.type,
            data: notification.data,
            sound: true
          });

        if (!insertError) {
          inserted++;
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        checked: coupons?.length || 0,
        notifications_sent: inserted 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error checking coupon alerts:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
