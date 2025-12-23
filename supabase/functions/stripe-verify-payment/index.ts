import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Usuário não encontrado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { sessionId } = await req.json();

    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: "Session ID é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Verifying payment for session:", sessionId);

    // Retrieve the checkout session from Stripe with expanded payment_intent
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent']
    });

    console.log("Session status:", session.payment_status);
    console.log("Session metadata:", session.metadata);
    console.log("Session amount_total:", session.amount_total);

    const isPaid = session.payment_status === 'paid';
    
    // Get payment intent details if available
    let paymentDetails = null;
    if (session.payment_intent) {
      let paymentIntent: Stripe.PaymentIntent;
      
      // Handle both expanded and non-expanded payment_intent
      if (typeof session.payment_intent === 'string') {
        // If not expanded, retrieve it directly
        paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);
      } else {
        paymentIntent = session.payment_intent as Stripe.PaymentIntent;
      }
      
      console.log("PaymentIntent ID:", paymentIntent.id);
      console.log("PaymentIntent metadata:", paymentIntent.metadata);
      
      // Calculate from metadata (stored in cents) or from amount
      const platformFeeFromMetadata = parseInt(paymentIntent.metadata?.platform_fee_amount || "0");
      const supplierAmountFromMetadata = parseInt(paymentIntent.metadata?.supplier_amount || "0");
      
      // Fallback calculation if metadata is not available
      const totalAmount = paymentIntent.amount / 100;
      const calculatedPlatformFee = platformFeeFromMetadata > 0 ? platformFeeFromMetadata / 100 : totalAmount * 0.075;
      const calculatedSupplierAmount = supplierAmountFromMetadata > 0 ? supplierAmountFromMetadata / 100 : totalAmount - calculatedPlatformFee;
      
      paymentDetails = {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: totalAmount,
        platformFee: calculatedPlatformFee,
        supplierAmount: calculatedSupplierAmount,
        stripeConnectedAccountId: paymentIntent.metadata?.stripe_connected_account_id || null,
        supplierId: paymentIntent.metadata?.supplier_id || session.metadata?.supplier_id || null,
        buyerId: paymentIntent.metadata?.buyer_id || session.metadata?.buyer_id || null,
      };
      
      console.log("Payment details extracted:", paymentDetails);
    }

    return new Response(
      JSON.stringify({
        verified: isPaid,
        sessionId: session.id,
        paymentStatus: session.payment_status,
        amountTotal: (session.amount_total || 0) / 100,
        metadata: session.metadata,
        paymentDetails,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Payment verification error:", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({ error: message, verified: false }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
