import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });

    // Parse request body for optional order_id filter
    let orderId: string | null = null;
    try {
      const body = await req.json();
      orderId = body?.order_id || null;
    } catch {
      // No body or invalid JSON, reconcile all pending
    }

    // Fetch pending orders with stripe_session_id
    let query = supabase
      .from("orders")
      .select("id, order_number, stripe_session_id, total, supplier_id, buyer_id, created_at")
      .eq("payment_status", "pending")
      .not("stripe_session_id", "is", null);

    if (orderId) {
      query = query.eq("id", orderId);
    }

    const { data: pendingOrders, error: fetchError } = await query;

    if (fetchError) {
      console.error("Error fetching pending orders:", fetchError);
      throw new Error("Failed to fetch pending orders");
    }

    console.log(`Found ${pendingOrders?.length || 0} pending orders to reconcile`);

    const results = {
      total: pendingOrders?.length || 0,
      reconciled: 0,
      stillPending: 0,
      errors: [] as string[],
      details: [] as any[],
    };

    for (const order of pendingOrders || []) {
      try {
        console.log(`Checking order ${order.order_number} with session ${order.stripe_session_id}`);

        // Retrieve session from Stripe
        const session = await stripe.checkout.sessions.retrieve(order.stripe_session_id);
        
        console.log(`Session ${order.stripe_session_id} status: ${session.payment_status}`);

        if (session.payment_status === "paid") {
          // Payment was successful - update order
          const platformFee = Math.round(order.total * 0.075 * 100) / 100;
          const supplierAmount = order.total - platformFee;

          const { error: updateError } = await supabase
            .from("orders")
            .update({
              payment_status: "paid",
              order_status: "preparing",
              stripe_payment_intent_id: session.payment_intent as string,
              stripe_payment_amount: order.total,
              platform_fee: platformFee,
              supplier_amount: supplierAmount,
              updated_at: new Date().toISOString(),
            })
            .eq("id", order.id);

          if (updateError) {
            console.error(`Error updating order ${order.order_number}:`, updateError);
            results.errors.push(`Order ${order.order_number}: ${updateError.message}`);
            continue;
          }

          // Create transaction records
          await supabase.from("transactions").insert([
            {
              order_id: order.id,
              supplier_id: order.supplier_id,
              type: "sale",
              amount: supplierAmount,
              method: "cartao",
              status: "paid",
            },
            {
              order_id: order.id,
              supplier_id: order.supplier_id,
              type: "platform_fee",
              amount: platformFee,
              method: "cartao",
              status: "paid",
            },
          ]);

          results.reconciled++;
          results.details.push({
            order_number: order.order_number,
            status: "reconciled",
            stripe_status: session.payment_status,
            total: order.total,
          });

          console.log(`✅ Order ${order.order_number} reconciled successfully`);
        } else {
          results.stillPending++;
          results.details.push({
            order_number: order.order_number,
            status: "still_pending",
            stripe_status: session.payment_status,
            total: order.total,
            created_at: order.created_at,
          });

          console.log(`⏳ Order ${order.order_number} still pending (Stripe status: ${session.payment_status})`);
        }
      } catch (stripeError: any) {
        console.error(`Error checking order ${order.order_number}:`, stripeError);
        results.errors.push(`Order ${order.order_number}: ${stripeError.message}`);
        results.details.push({
          order_number: order.order_number,
          status: "error",
          error: stripeError.message,
        });
      }
    }

    console.log(`Reconciliation complete: ${results.reconciled} reconciled, ${results.stillPending} still pending, ${results.errors.length} errors`);

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Reconciliation error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
