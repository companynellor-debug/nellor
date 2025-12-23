import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

// Nellor platform fee: 7.5%
const PLATFORM_FEE_PERCENTAGE = 7.5;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get the raw body for signature verification
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    // For now, we'll process without signature verification in test mode
    // In production, you should verify the webhook signature
    let event: Stripe.Event;

    if (signature && Deno.env.get("STRIPE_WEBHOOK_SECRET")) {
      try {
        event = stripe.webhooks.constructEvent(
          body,
          signature,
          Deno.env.get("STRIPE_WEBHOOK_SECRET") || ""
        );
      } catch (err) {
        console.error("Webhook signature verification failed:", err);
        return new Response(
          JSON.stringify({ error: "Invalid signature" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      // Parse event without signature verification (test mode)
      event = JSON.parse(body);
      console.log("Processing webhook without signature verification (test mode)");
    }

    console.log("Received Stripe webhook event:", event.type);

    // Handle account.updated - Update stripe_ready status
    if (event.type === "account.updated") {
      const account = event.data.object as Stripe.Account;
      const supabaseUserId = account.metadata?.supabase_user_id;

      console.log(`Account updated: ${account.id}, charges_enabled: ${account.charges_enabled}, payouts_enabled: ${account.payouts_enabled}`);

      if (supabaseUserId) {
        const isReady = account.charges_enabled && account.payouts_enabled && account.details_submitted;
        
        const { error: updateError } = await supabaseAdmin
          .from("profiles")
          .update({ 
            stripe_ready: isReady,
            stripe_account_id: account.id 
          })
          .eq("id", supabaseUserId);

        if (updateError) {
          console.error("Error updating profile stripe_ready:", updateError);
        } else {
          console.log(`Updated stripe_ready=${isReady} for user ${supabaseUserId}`);
        }
      } else {
        // Try to find profile by stripe_account_id
        const { data: profile, error: findError } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("stripe_account_id", account.id)
          .single();

        if (profile) {
          const isReady = account.charges_enabled && account.payouts_enabled && account.details_submitted;
          
          await supabaseAdmin
            .from("profiles")
            .update({ stripe_ready: isReady })
            .eq("id", profile.id);

          console.log(`Updated stripe_ready=${isReady} for profile ${profile.id} (found by account_id)`);
        }
      }

      return new Response(
        JSON.stringify({ received: true, type: event.type }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle successful payment
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      
      console.log("Checkout session completed:", session.id);
      console.log("Session metadata:", session.metadata);

      const orderId = session.metadata?.order_id;
      const supplierId = session.metadata?.supplier_id;
      const buyerId = session.metadata?.buyer_id;

      if (!orderId || orderId.startsWith("temp_")) {
        // This is a temporary order ID, we need to create the actual order
        console.log("Temporary order ID detected, order will be created by frontend");
        
        return new Response(
          JSON.stringify({ 
            received: true, 
            message: "Order will be created by frontend redirect"
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get payment intent to get the metadata with split info
      let platformFee = 0;
      let supplierAmount = 0;
      let stripeConnectedAccountId = "";

      if (session.payment_intent) {
        try {
          const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent as string);
          platformFee = parseInt(paymentIntent.metadata?.platform_fee_amount || "0") / 100;
          supplierAmount = parseInt(paymentIntent.metadata?.supplier_amount || "0") / 100;
          stripeConnectedAccountId = paymentIntent.metadata?.stripe_connected_account_id || "";
          
          console.log(`Payment Intent metadata: platformFee=${platformFee}, supplierAmount=${supplierAmount}`);
        } catch (e) {
          console.error("Error fetching payment intent:", e);
          // Calculate from total if not available
          const totalAmount = (session.amount_total || 0) / 100;
          platformFee = totalAmount * (PLATFORM_FEE_PERCENTAGE / 100);
          supplierAmount = totalAmount - platformFee;
        }
      } else {
        // Calculate amounts
        const totalAmount = (session.amount_total || 0) / 100;
        platformFee = totalAmount * (PLATFORM_FEE_PERCENTAGE / 100);
        supplierAmount = totalAmount - platformFee;
      }

      const totalAmount = (session.amount_total || 0) / 100;

      console.log(`Payment successful for order ${orderId}:`);
      console.log(`  Total: R$${totalAmount}`);
      console.log(`  Platform fee (${PLATFORM_FEE_PERCENTAGE}%): R$${platformFee}`);
      console.log(`  Supplier amount: R$${supplierAmount}`);

      // Get supplier's stripe_account_id if not in metadata
      if (!stripeConnectedAccountId && supplierId) {
        const { data: supplier } = await supabaseAdmin
          .from("profiles")
          .select("stripe_account_id")
          .eq("id", supplierId)
          .single();
        stripeConnectedAccountId = supplier?.stripe_account_id || "";
      }

      // Update order with payment info
      const { error: updateError } = await supabaseAdmin
        .from("orders")
        .update({
          payment_status: "paid",
          order_status: "preparing",
          stripe_session_id: session.id,
          stripe_payment_intent_id: session.payment_intent as string,
          stripe_payment_amount: totalAmount,
          platform_fee: platformFee,
          supplier_amount: supplierAmount,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (updateError) {
        console.error("Error updating order:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to update order" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Order ${orderId} marked as paid via Stripe`);

      // Create transaction record for the sale
      const { error: transactionError } = await supabaseAdmin
        .from("transactions")
        .insert({
          order_id: orderId,
          supplier_id: supplierId,
          amount: totalAmount,
          type: "sale",
          method: "cartao",
          status: "paid",
        });

      if (transactionError) {
        console.error("Error creating sale transaction:", transactionError);
      }

      // Create platform fee transaction
      const { error: feeTransactionError } = await supabaseAdmin
        .from("transactions")
        .insert({
          order_id: orderId,
          supplier_id: supplierId,
          amount: platformFee,
          type: "platform_fee",
          method: "cartao",
          status: "paid",
        });

      if (feeTransactionError) {
        console.error("Error creating fee transaction:", feeTransactionError);
      }

      return new Response(
        JSON.stringify({ 
          received: true,
          orderId,
          totalAmount,
          platformFee,
          supplierAmount,
          stripeConnectedAccountId,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle payment failure
    if (event.type === "checkout.session.expired" || event.type === "payment_intent.payment_failed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.order_id;

      if (orderId && !orderId.startsWith("temp_")) {
        console.log(`Payment failed/expired for order ${orderId}`);

        const { error: updateError } = await supabaseAdmin
          .from("orders")
          .update({
            payment_status: "cancelled",
            updated_at: new Date().toISOString(),
          })
          .eq("id", orderId);

        if (updateError) {
          console.error("Error updating failed order:", updateError);
        }
      }

      return new Response(
        JSON.stringify({ received: true, status: "payment_failed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle refunds
    if (event.type === "charge.refunded") {
      const charge = event.data.object as Stripe.Charge;
      const paymentIntentId = charge.payment_intent as string;

      console.log(`Refund received for payment intent: ${paymentIntentId}`);

      // Find order by payment intent
      const { data: order, error: findError } = await supabaseAdmin
        .from("orders")
        .select("id, supplier_id, total")
        .eq("stripe_payment_intent_id", paymentIntentId)
        .single();

      if (order) {
        // Update order status
        await supabaseAdmin
          .from("orders")
          .update({
            payment_status: "refunded",
            updated_at: new Date().toISOString(),
          })
          .eq("id", order.id);

        // Create refund transaction
        await supabaseAdmin
          .from("transactions")
          .insert({
            order_id: order.id,
            supplier_id: order.supplier_id,
            amount: (charge.amount_refunded || 0) / 100,
            type: "refund",
            method: "cartao",
            status: "paid",
          });

        console.log(`Order ${order.id} marked as refunded`);
      }

      return new Response(
        JSON.stringify({ received: true, status: "refunded" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Default response for unhandled events
    return new Response(
      JSON.stringify({ received: true, type: event.type }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Webhook error:", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
