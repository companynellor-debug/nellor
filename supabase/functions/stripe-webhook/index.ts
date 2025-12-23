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

    let event: Stripe.Event;

    // CRITICAL: Always verify webhook signature in production
    if (signature && Deno.env.get("STRIPE_WEBHOOK_SECRET")) {
      try {
        event = stripe.webhooks.constructEvent(
          body,
          signature,
          Deno.env.get("STRIPE_WEBHOOK_SECRET") || ""
        );
        console.log("Webhook signature verified successfully");
      } catch (err) {
        console.error("Webhook signature verification failed:", err);
        return new Response(
          JSON.stringify({ error: "Invalid signature" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      // Parse event without signature verification (test mode only)
      event = JSON.parse(body);
      console.log("WARNING: Processing webhook without signature verification (test mode)");
    }

    console.log("=== Received Stripe webhook event ===");
    console.log("Event type:", event.type);
    console.log("Event ID:", event.id);

    // Handle account.updated - Update stripe_ready status
    if (event.type === "account.updated") {
      const account = event.data.object as Stripe.Account;
      const supabaseUserId = account.metadata?.supabase_user_id;

      console.log(`Account updated: ${account.id}`);
      console.log(`  charges_enabled: ${account.charges_enabled}`);
      console.log(`  payouts_enabled: ${account.payouts_enabled}`);
      console.log(`  details_submitted: ${account.details_submitted}`);

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
        const { data: profile } = await supabaseAdmin
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

    // CRITICAL: Handle payment_intent.succeeded - This is where the actual payment is confirmed
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      
      console.log("=== Payment Intent Succeeded ===");
      console.log("Payment Intent ID:", paymentIntent.id);
      console.log("Amount:", paymentIntent.amount / 100);
      console.log("Currency:", paymentIntent.currency);
      console.log("Metadata:", JSON.stringify(paymentIntent.metadata));

      const orderId = paymentIntent.metadata?.order_id;
      const supplierId = paymentIntent.metadata?.supplier_id;
      const buyerId = paymentIntent.metadata?.buyer_id;
      const platformFeeAmount = parseInt(paymentIntent.metadata?.platform_fee_amount || "0");
      const supplierAmount = parseInt(paymentIntent.metadata?.supplier_amount || "0");
      const stripeConnectedAccountId = paymentIntent.metadata?.stripe_connected_account_id;

      // Skip if temporary order ID - the order will be created by the success page
      if (!orderId || orderId.startsWith("temp_")) {
        console.log("Temporary order ID - skipping database update, order will be created by frontend");
        return new Response(
          JSON.stringify({ 
            received: true, 
            message: "Temporary order - will be created by frontend",
            paymentIntentId: paymentIntent.id
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const totalAmount = paymentIntent.amount / 100;
      const platformFee = platformFeeAmount / 100;
      const supplierAmountFinal = supplierAmount / 100;

      console.log("=== Payment Split Details ===");
      console.log(`  Total: R$${totalAmount}`);
      console.log(`  Platform fee: R$${platformFee}`);
      console.log(`  Supplier amount: R$${supplierAmountFinal}`);
      console.log(`  Connected account: ${stripeConnectedAccountId}`);

      // Check if order already exists and has been paid (prevent duplicates)
      const { data: existingOrder } = await supabaseAdmin
        .from("orders")
        .select("id, payment_status")
        .eq("id", orderId)
        .single();

      if (existingOrder?.payment_status === "paid") {
        console.log(`Order ${orderId} already marked as paid - skipping duplicate processing`);
        return new Response(
          JSON.stringify({ received: true, message: "Order already processed" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update order with payment info
      const { error: updateError } = await supabaseAdmin
        .from("orders")
        .update({
          payment_status: "paid",
          order_status: "preparing",
          stripe_payment_intent_id: paymentIntent.id,
          stripe_payment_amount: totalAmount,
          platform_fee: platformFee,
          supplier_amount: supplierAmountFinal,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (updateError) {
        console.error("Error updating order:", updateError);
      } else {
        console.log(`Order ${orderId} marked as PAID via payment_intent.succeeded`);
      }

      // Create transaction records
      if (supplierId) {
        // Sale transaction
        await supabaseAdmin
          .from("transactions")
          .insert({
            order_id: orderId,
            supplier_id: supplierId,
            amount: totalAmount,
            type: "sale",
            method: "cartao",
            status: "paid",
          });

        // Platform fee transaction
        await supabaseAdmin
          .from("transactions")
          .insert({
            order_id: orderId,
            supplier_id: supplierId,
            amount: platformFee,
            type: "platform_fee",
            method: "cartao",
            status: "paid",
          });

        console.log("Transaction records created");
      }

      return new Response(
        JSON.stringify({ 
          received: true,
          orderId,
          totalAmount,
          platformFee,
          supplierAmount: supplierAmountFinal,
          stripeConnectedAccountId,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle checkout.session.completed
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      
      console.log("=== Checkout Session Completed ===");
      console.log("Session ID:", session.id);
      console.log("Payment Status:", session.payment_status);
      console.log("Session metadata:", JSON.stringify(session.metadata));

      const orderId = session.metadata?.order_id;
      const supplierId = session.metadata?.supplier_id;

      // Skip if temporary order ID
      if (!orderId || orderId.startsWith("temp_")) {
        console.log("Temporary order ID - checkout completed, order creation handled by frontend");
        return new Response(
          JSON.stringify({ 
            received: true, 
            message: "Order will be created by frontend redirect",
            sessionId: session.id
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
          
          console.log(`Payment Intent retrieved: platformFee=${platformFee}, supplierAmount=${supplierAmount}`);
        } catch (e) {
          console.error("Error fetching payment intent:", e);
          const totalAmount = (session.amount_total || 0) / 100;
          platformFee = totalAmount * (PLATFORM_FEE_PERCENTAGE / 100);
          supplierAmount = totalAmount - platformFee;
        }
      }

      const totalAmount = (session.amount_total || 0) / 100;

      console.log("=== Checkout Payment Details ===");
      console.log(`  Total: R$${totalAmount}`);
      console.log(`  Platform fee: R$${platformFee}`);
      console.log(`  Supplier amount: R$${supplierAmount}`);

      // Check if order already processed
      const { data: existingOrder } = await supabaseAdmin
        .from("orders")
        .select("id, payment_status")
        .eq("id", orderId)
        .single();

      if (existingOrder?.payment_status === "paid") {
        console.log(`Order ${orderId} already paid - skipping`);
        return new Response(
          JSON.stringify({ received: true, message: "Order already processed" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
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
      } else {
        console.log(`Order ${orderId} marked as paid via checkout.session.completed`);
      }

      // Create transaction records if not already created by payment_intent.succeeded
      if (supplierId) {
        // Check if transactions already exist
        const { data: existingTx } = await supabaseAdmin
          .from("transactions")
          .select("id")
          .eq("order_id", orderId)
          .eq("type", "sale")
          .single();

        if (!existingTx) {
          await supabaseAdmin
            .from("transactions")
            .insert({
              order_id: orderId,
              supplier_id: supplierId,
              amount: totalAmount,
              type: "sale",
              method: "cartao",
              status: "paid",
            });

          await supabaseAdmin
            .from("transactions")
            .insert({
              order_id: orderId,
              supplier_id: supplierId,
              amount: platformFee,
              type: "platform_fee",
              method: "cartao",
              status: "paid",
            });
        }
      }

      return new Response(
        JSON.stringify({ 
          received: true,
          orderId,
          totalAmount,
          platformFee,
          supplierAmount,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle payment failure
    if (event.type === "checkout.session.expired" || event.type === "payment_intent.payment_failed") {
      const obj = event.data.object as any;
      const orderId = obj.metadata?.order_id;

      console.log(`Payment failed/expired for order: ${orderId}`);

      if (orderId && !orderId.startsWith("temp_")) {
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
      const { data: order } = await supabaseAdmin
        .from("orders")
        .select("id, supplier_id, total")
        .eq("stripe_payment_intent_id", paymentIntentId)
        .single();

      if (order) {
        await supabaseAdmin
          .from("orders")
          .update({
            payment_status: "refunded",
            updated_at: new Date().toISOString(),
          })
          .eq("id", order.id);

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
    console.log(`Unhandled event type: ${event.type}`);
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
