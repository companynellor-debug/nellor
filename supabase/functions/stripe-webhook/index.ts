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
        console.log("✅ Webhook signature verified successfully");
      } catch (err) {
        console.error("❌ Webhook signature verification failed:", err);
        return new Response(
          JSON.stringify({ error: "Invalid signature" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      // Parse event without signature verification (test mode only)
      event = JSON.parse(body);
      console.log("⚠️ WARNING: Processing webhook without signature verification (test mode)");
    }

    console.log("=================================================");
    console.log("📥 Received Stripe webhook event");
    console.log("Event type:", event.type);
    console.log("Event ID:", event.id);
    console.log("=================================================");

    // ================================================================
    // Handle account.updated - Update stripe_ready status
    // ================================================================
    if (event.type === "account.updated") {
      const account = event.data.object as Stripe.Account;
      const supabaseUserId = account.metadata?.supabase_user_id;

      console.log(`📋 Account updated: ${account.id}`);
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
          console.error("❌ Error updating profile stripe_ready:", updateError);
        } else {
          console.log(`✅ Updated stripe_ready=${isReady} for user ${supabaseUserId}`);
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

          console.log(`✅ Updated stripe_ready=${isReady} for profile ${profile.id}`);
        }
      }

      return new Response(
        JSON.stringify({ received: true, type: event.type }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ================================================================
    // CRITICAL: Handle checkout.session.completed
    // This is THE PRIMARY event for confirming payment
    // ================================================================
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      
      console.log("=================================================");
      console.log("💳 CHECKOUT SESSION COMPLETED");
      console.log("Session ID:", session.id);
      console.log("Payment Status:", session.payment_status);
      console.log("Session metadata:", JSON.stringify(session.metadata));
      console.log("Payment Intent:", session.payment_intent);
      console.log("=================================================");

      // Only process if payment is actually completed
      if (session.payment_status !== "paid") {
        console.log("⏳ Session payment_status is not 'paid', skipping:", session.payment_status);
        return new Response(
          JSON.stringify({ received: true, message: "Payment not completed yet" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const orderId = session.metadata?.order_id;
      const supplierId = session.metadata?.supplier_id;
      const buyerId = session.metadata?.buyer_id;

      if (!orderId) {
        console.log("⚠️ No order_id in session metadata");
        return new Response(
          JSON.stringify({ received: true, message: "No order_id in metadata" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if order already processed
      const { data: existingOrder, error: fetchError } = await supabaseAdmin
        .from("orders")
        .select("id, payment_status, order_number, supplier_id")
        .eq("id", orderId)
        .single();

      if (fetchError) {
        console.error("❌ Error fetching order:", fetchError);
        return new Response(
          JSON.stringify({ error: "Order not found", orderId }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (existingOrder?.payment_status === "paid") {
        console.log(`✅ Order ${orderId} already marked as paid - skipping duplicate`);
        return new Response(
          JSON.stringify({ received: true, message: "Order already processed" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get payment intent details for split info
      let platformFee = 0;
      let supplierAmount = 0;
      const totalAmount = (session.amount_total || 0) / 100;

      if (session.payment_intent) {
        try {
          const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent as string);
          platformFee = parseInt(paymentIntent.metadata?.platform_fee_amount || "0") / 100;
          supplierAmount = parseInt(paymentIntent.metadata?.supplier_amount || "0") / 100;
          
          console.log("💰 Payment Intent details:");
          console.log(`  Platform fee: R$${platformFee}`);
          console.log(`  Supplier amount: R$${supplierAmount}`);
        } catch (e) {
          console.error("⚠️ Error fetching payment intent, calculating fees:", e);
          platformFee = totalAmount * (PLATFORM_FEE_PERCENTAGE / 100);
          supplierAmount = totalAmount - platformFee;
        }
      } else {
        platformFee = totalAmount * (PLATFORM_FEE_PERCENTAGE / 100);
        supplierAmount = totalAmount - platformFee;
      }

      console.log("=================================================");
      console.log("💵 UPDATING ORDER TO PAID");
      console.log(`  Order ID: ${orderId}`);
      console.log(`  Order Number: ${existingOrder.order_number}`);
      console.log(`  Total: R$${totalAmount}`);
      console.log(`  Platform fee: R$${platformFee}`);
      console.log(`  Supplier amount: R$${supplierAmount}`);
      console.log("=================================================");

      // CRITICAL: Update order status to PAID and PREPARING
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
        console.error("❌ Error updating order:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to update order", details: updateError }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`✅ Order ${orderId} marked as PAID!`);

      // Create transaction records
      const actualSupplierId = supplierId || existingOrder.supplier_id;
      
      if (actualSupplierId) {
        // Check if transactions already exist
        const { data: existingTx } = await supabaseAdmin
          .from("transactions")
          .select("id")
          .eq("order_id", orderId)
          .eq("type", "sale")
          .single();

        if (!existingTx) {
          // Sale transaction
          const { error: saleError } = await supabaseAdmin
            .from("transactions")
            .insert({
              order_id: orderId,
              supplier_id: actualSupplierId,
              amount: totalAmount,
              type: "sale",
              method: "cartao",
              status: "paid",
            });

          if (saleError) {
            console.error("⚠️ Error creating sale transaction:", saleError);
          }

          // Platform fee transaction
          const { error: feeError } = await supabaseAdmin
            .from("transactions")
            .insert({
              order_id: orderId,
              supplier_id: actualSupplierId,
              amount: platformFee,
              type: "platform_fee",
              method: "cartao",
              status: "paid",
            });

          if (feeError) {
            console.error("⚠️ Error creating platform_fee transaction:", feeError);
          }

          console.log("✅ Transaction records created");
        } else {
          console.log("ℹ️ Transactions already exist for this order");
        }
      }

      // ================================================================
      // SEND PUSH NOTIFICATION TO SUPPLIER
      // ================================================================
      console.log("📱 Sending push notification to supplier:", actualSupplierId || existingOrder.supplier_id);
      
      try {
        const pushResponse = await fetch(
          `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-push-notification`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            },
            body: JSON.stringify({
              user_id: actualSupplierId || existingOrder.supplier_id,
              title: "💰 Novo Pedido Pago!",
              body: `Pedido #${existingOrder.order_number} - R$ ${totalAmount.toFixed(2)}`,
              url: "/fornecedor/pedidos",
              tag: `order-paid-${existingOrder.order_number}`,
              order_number: existingOrder.order_number,
              total: totalAmount,
            }),
          }
        );
        
        const pushResult = await pushResponse.json();
        console.log("📱 Push notification result:", pushResult);
      } catch (pushError) {
        console.error("⚠️ Error sending push notification:", pushError);
        // Don't fail the webhook because of push notification error
      }

      console.log("=================================================");
      console.log("🎉 PAYMENT PROCESSING COMPLETE");
      console.log(`  Order: ${existingOrder.order_number}`);
      console.log(`  Status: PAID / PREPARING`);
      console.log("=================================================");

      return new Response(
        JSON.stringify({ 
          received: true,
          success: true,
          orderId,
          orderNumber: existingOrder.order_number,
          totalAmount,
          platformFee,
          supplierAmount,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ================================================================
    // Handle payment_intent.succeeded (backup/alternative)
    // ================================================================
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      
      console.log("=================================================");
      console.log("💳 PAYMENT INTENT SUCCEEDED");
      console.log("Payment Intent ID:", paymentIntent.id);
      console.log("Amount:", paymentIntent.amount / 100);
      console.log("Metadata:", JSON.stringify(paymentIntent.metadata));
      console.log("=================================================");

      const orderId = paymentIntent.metadata?.order_id;
      const supplierId = paymentIntent.metadata?.supplier_id;
      const platformFeeAmount = parseInt(paymentIntent.metadata?.platform_fee_amount || "0");
      const supplierAmountCents = parseInt(paymentIntent.metadata?.supplier_amount || "0");

      if (!orderId) {
        console.log("⚠️ No order_id in payment_intent metadata");
        return new Response(
          JSON.stringify({ received: true, message: "No order_id in metadata" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const totalAmount = paymentIntent.amount / 100;
      const platformFee = platformFeeAmount / 100;
      const supplierAmount = supplierAmountCents / 100;

      // Check if already paid
      const { data: existingOrder } = await supabaseAdmin
        .from("orders")
        .select("id, payment_status, order_number, supplier_id")
        .eq("id", orderId)
        .single();

      if (existingOrder?.payment_status === "paid") {
        console.log(`✅ Order ${orderId} already paid via checkout.session.completed`);
        return new Response(
          JSON.stringify({ received: true, message: "Order already processed" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update order (fallback if checkout.session.completed didn't fire)
      const { error: updateError } = await supabaseAdmin
        .from("orders")
        .update({
          payment_status: "paid",
          order_status: "preparing",
          stripe_payment_intent_id: paymentIntent.id,
          stripe_payment_amount: totalAmount,
          platform_fee: platformFee,
          supplier_amount: supplierAmount,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (updateError) {
        console.error("❌ Error updating order:", updateError);
      } else {
        console.log(`✅ Order ${orderId} marked as PAID via payment_intent.succeeded`);

        // Create transactions if not exists
        const actualSupplierId = supplierId || existingOrder?.supplier_id;
        if (actualSupplierId) {
          const { data: existingTx } = await supabaseAdmin
            .from("transactions")
            .select("id")
            .eq("order_id", orderId)
            .eq("type", "sale")
            .single();

          if (!existingTx) {
            await supabaseAdmin.from("transactions").insert({
              order_id: orderId,
              supplier_id: actualSupplierId,
              amount: totalAmount,
              type: "sale",
              method: "cartao",
              status: "paid",
            });

            await supabaseAdmin.from("transactions").insert({
              order_id: orderId,
              supplier_id: actualSupplierId,
              amount: platformFee,
              type: "platform_fee",
              method: "cartao",
              status: "paid",
            });
          }
        }
      }

      return new Response(
        JSON.stringify({ received: true, orderId, totalAmount, platformFee, supplierAmount }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ================================================================
    // Handle payment failure / session expiration
    // ================================================================
    if (event.type === "checkout.session.expired" || event.type === "payment_intent.payment_failed") {
      const obj = event.data.object as any;
      const orderId = obj.metadata?.order_id;

      console.log(`❌ Payment failed/expired for order: ${orderId}`);

      if (orderId) {
        const { error: updateError } = await supabaseAdmin
          .from("orders")
          .update({
            payment_status: "cancelled",
            order_status: "cancelled",
            updated_at: new Date().toISOString(),
          })
          .eq("id", orderId)
          .eq("payment_status", "pending"); // Only cancel if still pending

        if (!updateError) {
          console.log(`✅ Order ${orderId} marked as cancelled`);
        }
      }

      return new Response(
        JSON.stringify({ received: true, status: "payment_failed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ================================================================
    // Handle refunds
    // ================================================================
    if (event.type === "charge.refunded") {
      const charge = event.data.object as Stripe.Charge;
      const paymentIntentId = charge.payment_intent as string;

      console.log(`💸 Refund received for payment intent: ${paymentIntentId}`);

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

        console.log(`✅ Order ${order.id} marked as refunded`);
      }

      return new Response(
        JSON.stringify({ received: true, status: "refunded" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Default response for unhandled events
    console.log(`ℹ️ Unhandled event type: ${event.type}`);
    return new Response(
      JSON.stringify({ received: true, type: event.type }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("❌ Webhook error:", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});