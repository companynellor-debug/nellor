import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

// Nellor platform fee: 7.5%
const PLATFORM_FEE_PERCENTAGE = 7.5;

// Check if notification was already sent (idempotency)
async function wasEventAlreadySent(
  supabaseAdmin: any,
  eventKey: string
): Promise<boolean> {
  try {
    const { data } = await supabaseAdmin
      .from("notification_sent_events")
      .select("id")
      .eq("event_key", eventKey)
      .maybeSingle();
    
    return !!data;
  } catch (error) {
    console.error("⚠️ Error checking event idempotency:", error);
    return false;
  }
}

// Mark event as sent (idempotency)
async function markEventAsSent(
  supabaseAdmin: any,
  eventKey: string
): Promise<void> {
  try {
    await supabaseAdmin
      .from("notification_sent_events")
      .insert({ event_key: eventKey });
    console.log(`🔒 Event marked as sent: ${eventKey}`);
  } catch (error) {
    // Ignore duplicate key errors (concurrent requests)
    console.log(`⚠️ Could not mark event (may be duplicate): ${eventKey}`);
  }
}

// Create notification in database with idempotency
// The trigger will automatically send push notification
async function createNotificationWithIdempotency(
  supabaseAdmin: any,
  userId: string,
  title: string,
  body: string,
  orderId: string,
  orderNumber: string,
  total: number,
  eventType: string,
  url: string
): Promise<boolean> {
  const eventKey = `${orderId}-${eventType}`;
  
  const alreadySent = await wasEventAlreadySent(supabaseAdmin, eventKey);
  if (alreadySent) {
    console.log(`⏭️ SKIPPING duplicate notification: ${eventKey}`);
    return false;
  }
  
  await markEventAsSent(supabaseAdmin, eventKey);
  
  try {
    await supabaseAdmin.from("notifications").insert({
      user_id: userId,
      title,
      body,
      type: "order_update",
      sound: true,
      data: {
        order_id: orderId,
        order_number: orderNumber,
        total,
        event: eventType,
        url,
      },
    });
    console.log(`✅ Notification created (trigger will send push): ${eventKey}`);
    return true;
  } catch (error) {
    console.error(`⚠️ Error creating notification: ${eventKey}`, error);
    return false;
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
    // ================================================================
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      
      console.log("=================================================");
      console.log("💳 CHECKOUT.SESSION.COMPLETED - SOURCE OF TRUTH");
      console.log("  Session ID:", session.id);
      console.log("  Payment Status:", session.payment_status);
      console.log("=================================================");

      if (session.payment_status !== "paid") {
        console.log(`⏳ Payment not completed: ${session.payment_status}`);
        return new Response(
          JSON.stringify({ received: true, message: "Payment not completed" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let orderId = session.metadata?.order_id;
      const supplierId = session.metadata?.supplier_id;
      const buyerId = session.metadata?.buyer_id;

      let order: any = null;

      if (orderId) {
        const result = await supabaseAdmin
          .from("orders")
          .select("id, payment_status, order_number, supplier_id, buyer_id, total")
          .eq("id", orderId)
          .single();
        order = result.data;
      }

      if (!order && session.id) {
        console.log("🔍 Searching order by stripe_session_id:", session.id);
        const result = await supabaseAdmin
          .from("orders")
          .select("id, payment_status, order_number, supplier_id, buyer_id, total")
          .eq("stripe_session_id", session.id)
          .single();
        
        if (result.data) {
          order = result.data;
          orderId = result.data.id;
          console.log("✅ Found order by stripe_session_id:", order.order_number);
        }
      }

      if (!order) {
        console.error("❌ Order not found!", { orderId, sessionId: session.id });
        return new Response(
          JSON.stringify({ received: true, error: "Order not found" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if already processed (idempotency at order level)
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

      console.log(`💵 Updating order ${order.order_number}: R$ ${totalAmount.toFixed(2)}`);

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
          JSON.stringify({ error: "Failed to update order" }),
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

        console.log("✅ Transactions created");
      }

      // ================================================================
      // AFFILIATE COMMISSION PROCESSING
      // ================================================================
      const actualBuyerId = buyerId || order.buyer_id;
      
      if (actualBuyerId && actualSupplierId) {
        try {
          // Look for active, non-converted attribution for this buyer + supplier
          const { data: attribution } = await supabaseAdmin
            .from("affiliate_attributions")
            .select(`
              id, 
              affiliate_link_id, 
              expires_at, 
              converted,
              affiliate_links!inner (
                id,
                affiliate_id,
                product_id,
                affiliates!inner (
                  id,
                  user_id
                )
              )
            `)
            .eq("supplier_id", actualSupplierId)
            .eq("buyer_id", actualBuyerId)
            .eq("converted", false)
            .gte("expires_at", new Date().toISOString())
            .order("clicked_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (attribution) {
            const affiliateLink = attribution.affiliate_links as any;
            const affiliate = affiliateLink?.affiliates;
            
            if (affiliate) {
              // Get commission percentage from product or supplier default
              const { data: product } = await supabaseAdmin
                .from("products")
                .select("affiliate_commission_percent")
                .eq("id", affiliateLink.product_id)
                .maybeSingle();

              const { data: supplierSettings } = await supabaseAdmin
                .from("supplier_affiliate_settings")
                .select("default_commission_percent")
                .eq("supplier_id", actualSupplierId)
                .maybeSingle();

              const commissionPercent = product?.affiliate_commission_percent 
                ?? supplierSettings?.default_commission_percent 
                ?? 5;

              const commissionAmount = (totalAmount * commissionPercent) / 100;

              // Create commission record
              const { error: commissionError } = await supabaseAdmin
                .from("affiliate_commissions")
                .insert({
                  affiliate_id: affiliate.id,
                  order_id: orderId,
                  attribution_id: attribution.id,
                  amount: commissionAmount,
                  status: "pending",
                });

              if (!commissionError) {
                // Update affiliate pending earnings
                await supabaseAdmin.rpc("update_affiliate_earnings", {
                  _affiliate_id: affiliate.id,
                  _amount: commissionAmount,
                });

                // Update attribution converted status (for single-product attribution)
                // Note: For recurring commissions, we keep converted=false until expiry
                // This is handled by the recurring_duration_months setting
                
                // Update link conversions count
                await supabaseAdmin
                  .from("affiliate_links")
                  .update({ conversions: (affiliateLink.conversions || 0) + 1 })
                  .eq("id", affiliateLink.id);

                console.log(`✅ Affiliate commission created: R$ ${commissionAmount.toFixed(2)} for affiliate ${affiliate.id}`);
              } else {
                console.error("⚠️ Error creating commission:", commissionError);
              }
            }
          } else {
            console.log("ℹ️ No active affiliate attribution for this order");
          }
        } catch (affError) {
          console.error("⚠️ Error processing affiliate commission:", affError);
          // Don't fail the whole webhook for affiliate errors
        }
      }

      // ================================================================
      // NOTIFICATIONS - ONLY SUPPLIER gets payment notification here
      // Client notification handled by trigger when status -> 'preparing'
      // ================================================================
      const orderTotal = Number(order.total || totalAmount).toFixed(2);
      
      // Notify Supplier ONLY: "VENDA APROVADA"
      await createNotificationWithIdempotency(
        supabaseAdmin,
        actualSupplierId,
        "💰 Venda Aprovada!",
        `Pedido #${order.order_number} - R$ ${orderTotal} confirmado! Líquido: R$ ${supplierAmount.toFixed(2)}`,
        orderId,
        order.order_number,
        totalAmount,
        "supplier_payment_confirmed",
        "/fornecedor/pedidos"
      );
      // Cliente receberá notificação via trigger (status -> preparing)

      console.log("🎉 Payment processing complete!");

      return new Response(
        JSON.stringify({ 
          received: true,
          success: true,
          orderId,
          orderNumber: order.order_number,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ================================================================
    // PAYMENT_INTENT.SUCCEEDED - Backup handler
    // ================================================================
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      
      console.log("💳 PAYMENT_INTENT.SUCCEEDED (backup)");

      const orderId = paymentIntent.metadata?.order_id;
      if (!orderId) {
        return new Response(
          JSON.stringify({ received: true, message: "No order_id" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: order } = await supabaseAdmin
        .from("orders")
        .select("id, payment_status, order_number, supplier_id, buyer_id, total")
        .eq("id", orderId)
        .single();

      if (order?.payment_status === "paid") {
        console.log(`✅ Order already paid via checkout.session.completed`);
        return new Response(
          JSON.stringify({ received: true, message: "Already processed" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Fallback update
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

        const orderTotal = Number(order.total || totalAmount).toFixed(2);

        // Notify ONLY Supplier (buyer gets notification via trigger when status changes)
        await createNotificationWithIdempotency(
          supabaseAdmin,
          order.supplier_id,
          "💰 Venda Aprovada!",
          `Pedido #${order.order_number} - R$ ${orderTotal} confirmado!`,
          orderId,
          order.order_number,
          totalAmount,
          "supplier_payment_confirmed",
          "/fornecedor/pedidos"
        );
        // Cliente receberá notificação via trigger (status -> preparing)
      }

      return new Response(
        JSON.stringify({ received: true, orderId }),
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
