import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const today = new Date().toISOString().split("T")[0];

    // Find negotiations where delivery date has passed and check not yet sent
    const { data: negotiations, error } = await supabase
      .from("negotiations")
      .select("id, buyer_id, product_name, expected_delivery, status")
      .in("status", ["accepted", "shipped"])
      .lte("expected_delivery", today)
      .eq("delivery_check_sent", false);

    if (error) throw error;

    let notified = 0;

    for (const neg of negotiations || []) {
      // Create notification for buyer
      await supabase.from("notifications").insert({
        user_id: neg.buyer_id,
        title: "📦 Entrega prevista para hoje!",
        body: `A entrega de "${neg.product_name}" era prevista para hoje. Você recebeu o produto?`,
        type: "order_update",
        sound: true,
        data: {
          event: "delivery_date_reached",
          negotiation_id: neg.id,
          url: "/cliente/minhas-negociacoes?filtro=envio",
        },
      });

      // Mark as sent
      await supabase
        .from("negotiations")
        .update({ delivery_check_sent: true })
        .eq("id", neg.id);

      notified++;
    }

    return new Response(
      JSON.stringify({ ok: true, notified }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("check-delivery-dates error:", err);
    return new Response(
      JSON.stringify({ ok: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
