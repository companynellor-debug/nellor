import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

// Nellor platform fee: 7.5%
const PLATFORM_FEE_PERCENTAGE = 7.5;

// Helper to send push notification
async function sendPushNotification(
  supabaseUrl: string,
  serviceRoleKey: string,
  userId: string,
  title: string,
  body: string,
  orderNumber: string,
  url: string,
  type: string
): Promise<void> {
  try {
    console.log(`📱 Sending push notification to ${userId}: ${title}`);
    
    const response = await fetch(
      `${supabaseUrl}/functions/v1/send-push-notification`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({
          user_id: userId,
          title,
          body,
          url,
          order_number: orderNumber,
          type,
        }),
      }
    );
    
    const result = await response.json();
    console.log(`📱 Push result for ${userId}:`, result);
  } catch (error) {
    console.error(`⚠️ Push notification error for ${userId}:`, error);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    let event: Stripe.Event;

    // Verify webhook signature
    if (signature && Deno.env.get("STRIPE_WEBHOOK_SECRET")) {
      try {
        event = stripe.webhooks.constructEvent(
          body,
          signature,
          Deno.env.get("STRIPE_WEBHOOK_SECRET") || ""
        );
        console.log("✅ Webhook signature verified");
      } catch (err) {
        console.error("❌ Webhook signature verification failed:", err);
        return new Response(
          JSON.stringify({ error: "Invalid signature" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      event = JSON.parse(body);
      console.log("⚠️ Processing without signature verification (test mode)");
    }

    console.log("=================================================");
    console.log("📥 STRIPE WEBHOOK EVENT");
    console.log("  Type:", event.type);
    console.log("  ID:", event.id);
    console.log("  Time:", new Date().toISOString());
    console.log("=================================================");

    // ================================================================
    // ACCOUNT.UPDATED - Update stripe_ready status
    // ================================================================
    if (event.type === "account.updated") {
      const account = event.data.object as Stripe.Account;
      const supabaseUserId = account.metadata?.supabase_user_id;

      console.log(`📋 Account updated: ${account.id}`);
      console.log(`  charges_enabled: ${account.charges_enabled}`);
      console.log(`  payouts_enabled: ${account.payouts_enabled}`);

      if (supabaseUserId) {
        const isReady = account.charges_enabled && account.payouts_enabled && account.details_submitted;
        
        await supabaseAdmin
          .from("profiles")
          .update({ stripe_ready: isReady, stripe_account_id: account.id })
          .eq("id", supabaseUserId);

        console.log(`✅ Updated stripe_ready=${isReady} for ${supabaseUserId}`);
      } else {
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("stripe_account_id", account.id)
          .single();

        if (profile) {
          const isReady = account.charges_enabled && account.payouts_enabled && account.details_submitted;
          await supabaseAdmin.from("profiles").update({ stripe_ready: isReady }).eq("id", profile.id);
          console.log(`✅ Updated stripe_ready=${isReady} for ${profile.id}`);
        }
      }

      return new Response(
        JSON.stringify({ received: true, type: event.type }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ================================================================
    // CHECKOUT.SESSION.COMPLETED - PRIMARY PAYMENT CONFIRMATION
    // This is the SINGLE SOURCE OF TRUTH for payment confirmation
    // ================================================================
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      
      console.log("=================================================");
      console.log("💳 CHECKOUT.SESSION.COMPLETED - SOURCE OF TRUTH");
      console.log("  Session ID:", session.id);
      console.log("  Payment Status:", session.payment_status);
      console.log("  Metadata:", JSON.stringify(session.metadata));
      console.log("=================================================");

      // Only process if payment is completed
      if (session.payment_status !== "paid") {
        console.log(`⏳ Payment not completed: ${session.payment_status}`);
        return new Response(
          JSON.stringify({ received: true, message: "Payment not completed" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const orderId = session.metadata?.order_id;
      const supplierId = session.metadata?.supplier_id;
      const buyerId = session.metadata?.buyer_id;

      if (!orderId) {
        console.error("❌ No order_id in metadata!");
        return new Response(
          JSON.stringify({ received: true, error: "No order_id in metadata" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Fetch order
      const { data: order, error: fetchError } = await supabaseAdmin
        .from("orders")
        .select("id, payment_status, order_number, supplier_id, buyer_id, total")
        .eq("id", orderId)
        .single();

      if (fetchError || !order) {
        console.error("❌ Order not found:", orderId, fetchError);
        return new Response(
          JSON.stringify({ error: "Order not found", orderId }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if already processed (idempotency)
      if (order.payment_status === "paid") {
        console.log(`✅ Order ${orderId} already paid - skipping duplicate`);
        return new Response(
          JSON.stringify({ received: true, message: "Already processed" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Calculate fees
      const totalAmount = (session.amount_total || 0) / 100;
      let platformFee = totalAmount * (PLATFORM_FEE_PERCENTAGE / 100);
      let supplierAmount = totalAmount - platformFee;

      // Try to get exact values from payment intent
      if (session.payment_intent) {
        try {
          const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent as string);
          if (paymentIntent.metadata?.platform_fee_amount) {
            platformFee = parseInt(paymentIntent.metadata.platform_fee_amount) / 100;
            supplierAmount = parseInt(paymentIntent.metadata.supplier_amount || "0") / 100;
          }
        } catch (e) {
          console.log("⚠️ Could not fetch payment intent, using calculated fees");
        }
      }

      console.log("=================================================");
      console.log("💵 UPDATING ORDER TO PAID");
      console.log(`  Order: ${order.order_number}`);
      console.log(`  Total: R$ ${totalAmount.toFixed(2)}`);
      console.log(`  Platform Fee (7.5%): R$ ${platformFee.toFixed(2)}`);
      console.log(`  Supplier Amount: R$ ${supplierAmount.toFixed(2)}`);
      console.log("=================================================");

      // CRITICAL UPDATE: Mark order as PAID
      const { error: updateError } = await supabaseAdmin
        .from("orders")
        .update({
          payment_status: "paid",
          order_status: "preparing",
          status_label: "CONFIRMADO",
          payment_status_label: "PAGO",
          paid_at: new Date().toISOString(),
          stripe_session_id: session.id,
          stripe_payment_intent_id: session.payment_intent as string,
          stripe_payment_amount: totalAmount,
          platform_fee: platformFee,
          supplier_amount: supplierAmount,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (updateError) {
        console.error("❌ Failed to update order:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to update order", details: updateError }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`✅ Order ${order.order_number} marked as PAID!`);

      // Create transaction records
      const actualSupplierId = supplierId || order.supplier_id;
      
      const { data: existingTx } = await supabaseAdmin
        .from("transactions")
        .select("id")
        .eq("order_id", orderId)
        .eq("type", "sale")
        .maybeSingle();

      if (!existingTx) {
        // Sale transaction
        await supabaseAdmin.from("transactions").insert({
          order_id: orderId,
          supplier_id: actualSupplierId,
          amount: totalAmount,
          type: "sale",
          method: "cartao",
          status: "paid",
        });

        // Platform fee transaction
        await supabaseAdmin.from("transactions").insert({
          order_id: orderId,
          supplier_id: actualSupplierId,
          amount: platformFee,
          type: "platform_fee",
          method: "cartao",
          status: "paid",
        });

        console.log("✅ Transactions created");
      }

      // ================================================================
      // PUSH NOTIFICATIONS - Supplier & Buyer
      // ================================================================
      
      // Notify Supplier: "VENDA APROVADA"
      await sendPushNotification(
        supabaseUrl,
        serviceRoleKey,
        actualSupplierId,
        "✅ Venda Aprovada!",
        `Pagamento confirmado! Pedido #${order.order_number} - R$ ${supplierAmount.toFixed(2)} líquido.`,
        order.order_number,
        "/fornecedor/pedidos",
        "payment_confirmed"
      );

      // Notify Buyer: "PAGAMENTO CONFIRMADO"
      const actualBuyerId = buyerId || order.buyer_id;
      if (actualBuyerId) {
        await sendPushNotification(
          supabaseUrl,
          serviceRoleKey,
          actualBuyerId,
          "✅ Pagamento Confirmado!",
          `Seu pedido #${order.order_number} foi confirmado e está sendo preparado!`,
          order.order_number,
          "/cliente/meus-pedidos",
          "payment_confirmed"
        );
      }

      console.log("=================================================");
      console.log("🎉 PAYMENT PROCESSING COMPLETE");
      console.log(`  Order: ${order.order_number}`);
      console.log(`  Status: PAID / PREPARING`);
      console.log("=================================================");

      return new Response(
        JSON.stringify({ 
          received: true,
          success: true,
          orderId,
          orderNumber: order.order_number,
          totalAmount,
          platformFee,
          supplierAmount,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ================================================================
    // PAYMENT_INTENT.SUCCEEDED - Backup handler
    // ================================================================
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      
      console.log("=================================================");
      console.log("💳 PAYMENT_INTENT.SUCCEEDED (backup)");
      console.log("  PI ID:", paymentIntent.id);
      console.log("  Amount:", paymentIntent.amount / 100);
      console.log("  Metadata:", JSON.stringify(paymentIntent.metadata));
      console.log("=================================================");

      const orderId = paymentIntent.metadata?.order_id;
      if (!orderId) {
        console.log("⚠️ No order_id in metadata");
        return new Response(
          JSON.stringify({ received: true, message: "No order_id" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if already processed
      const { data: order } = await supabaseAdmin
        .from("orders")
        .select("id, payment_status, order_number, supplier_id, buyer_id")
        .eq("id", orderId)
        .single();

      if (order?.payment_status === "paid") {
        console.log(`✅ Order already paid via checkout.session.completed`);
        return new Response(
          JSON.stringify({ received: true, message: "Already processed" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Fallback update if checkout.session.completed didn't fire
      const totalAmount = paymentIntent.amount / 100;
      const platformFee = parseInt(paymentIntent.metadata?.platform_fee_amount || "0") / 100 || 
                          totalAmount * (PLATFORM_FEE_PERCENTAGE / 100);
      const supplierAmount = parseInt(paymentIntent.metadata?.supplier_amount || "0") / 100 ||
                             totalAmount - platformFee;

      const { error: updateError } = await supabaseAdmin
        .from("orders")
        .update({
          payment_status: "paid",
          order_status: "preparing",
          status_label: "CONFIRMADO",
          payment_status_label: "PAGO",
          paid_at: new Date().toISOString(),
          stripe_payment_intent_id: paymentIntent.id,
          stripe_payment_amount: totalAmount,
          platform_fee: platformFee,
          supplier_amount: supplierAmount,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (!updateError && order) {
        console.log(`✅ Order ${order.order_number} marked as PAID (fallback)`);

        // Create transactions
        const { data: existingTx } = await supabaseAdmin
          .from("transactions")
          .select("id")
          .eq("order_id", orderId)
          .eq("type", "sale")
          .maybeSingle();

        if (!existingTx) {
          await supabaseAdmin.from("transactions").insert({
            order_id: orderId,
            supplier_id: order.supplier_id,
            amount: totalAmount,
            type: "sale",
            method: "cartao",
            status: "paid",
          });

          await supabaseAdmin.from("transactions").insert({
            order_id: orderId,
            supplier_id: order.supplier_id,
            amount: platformFee,
            type: "platform_fee",
            method: "cartao",
            status: "paid",
          });
        }

        // Send push notifications
        await sendPushNotification(
          supabaseUrl,
          serviceRoleKey,
          order.supplier_id,
          "✅ Venda Aprovada!",
          `Pagamento confirmado! Pedido #${order.order_number} - R$ ${supplierAmount.toFixed(2)} líquido.`,
          order.order_number,
          "/fornecedor/pedidos",
          "payment_confirmed"
        );

        if (order.buyer_id) {
          await sendPushNotification(
            supabaseUrl,
            serviceRoleKey,
            order.buyer_id,
            "✅ Pagamento Confirmado!",
            `Seu pedido #${order.order_number} foi confirmado!`,
            order.order_number,
            "/cliente/meus-pedidos",
            "payment_confirmed"
          );
        }
      }

      return new Response(
        JSON.stringify({ received: true, orderId, totalAmount }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ================================================================
    // PAYMENT FAILED / SESSION EXPIRED
    // ================================================================
    if (event.type === "checkout.session.expired" || event.type === "payment_intent.payment_failed") {
      const obj = event.data.object as any;
      const orderId = obj.metadata?.order_id;

      console.log(`❌ Payment failed/expired: ${orderId}`);

      if (orderId) {
        await supabaseAdmin
          .from("orders")
          .update({
            payment_status: "cancelled",
            order_status: "cancelled",
            status_label: "CANCELADO",
            payment_status_label: "CANCELADO",
            updated_at: new Date().toISOString(),
          })
          .eq("id", orderId)
          .eq("payment_status", "pending");

        console.log(`✅ Order ${orderId} cancelled`);
      }

      return new Response(
        JSON.stringify({ received: true, status: "cancelled" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ================================================================
    // REFUNDS
    // ================================================================
    if (event.type === "charge.refunded") {
      const charge = event.data.object as Stripe.Charge;
      const paymentIntentId = charge.payment_intent as string;

      console.log(`💸 Refund for PI: ${paymentIntentId}`);

      const { data: order } = await supabaseAdmin
        .from("orders")
        .select("id, supplier_id, order_number")
        .eq("stripe_payment_intent_id", paymentIntentId)
        .single();

      if (order) {
        await supabaseAdmin
          .from("orders")
          .update({ payment_status: "refunded", updated_at: new Date().toISOString() })
          .eq("id", order.id);

        await supabaseAdmin.from("transactions").insert({
          order_id: order.id,
          supplier_id: order.supplier_id,
          amount: (charge.amount_refunded || 0) / 100,
          type: "refund",
          method: "cartao",
          status: "paid",
        });

        console.log(`✅ Order ${order.order_number} refunded`);
      }

      return new Response(
        JSON.stringify({ received: true, status: "refunded" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Unhandled events
    console.log(`ℹ️ Unhandled: ${event.type}`);
    return new Response(
      JSON.stringify({ received: true, type: event.type }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("❌ Webhook error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
