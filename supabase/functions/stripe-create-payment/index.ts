import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

    // Parse request body
    const { 
      orderId, 
      supplierId, 
      amount, // Amount in BRL (e.g., 100.50)
      description,
      successUrl,
      cancelUrl 
    } = await req.json();

    if (!orderId || !supplierId || !amount) {
      return new Response(
        JSON.stringify({ error: "Dados incompletos: orderId, supplierId e amount são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get supplier's Stripe account
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: supplier, error: supplierError } = await supabaseAdmin
      .from("profiles")
      .select("stripe_account_id, nome")
      .eq("id", supplierId)
      .single();

    if (supplierError || !supplier) {
      console.error("Supplier not found:", supplierError);
      return new Response(
        JSON.stringify({ error: "Fornecedor não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!supplier.stripe_account_id) {
      return new Response(
        JSON.stringify({ error: "Fornecedor não conectou conta Stripe" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify supplier's Stripe account has required capabilities
    try {
      const account = await stripe.accounts.retrieve(supplier.stripe_account_id);
      
      console.log(`Supplier Stripe account status: charges_enabled=${account.charges_enabled}, payouts_enabled=${account.payouts_enabled}, details_submitted=${account.details_submitted}`);
      
      if (!account.charges_enabled) {
        return new Response(
          JSON.stringify({ 
            error: "Fornecedor ainda não completou a configuração do Stripe. Entre em contato com o fornecedor.",
            details: "A conta Stripe do fornecedor não está habilitada para receber pagamentos."
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } catch (accountError) {
      console.error("Error checking supplier account:", accountError);
      return new Response(
        JSON.stringify({ error: "Erro ao verificar conta do fornecedor no Stripe" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Convert amount to cents (Stripe uses smallest currency unit)
    const amountInCents = Math.round(amount * 100);
    
    // Calculate platform fee (7.5%)
    const platformFeeInCents = Math.round(amountInCents * (PLATFORM_FEE_PERCENTAGE / 100));

    console.log(`Creating payment: Total R$${amount}, Platform fee: R$${platformFeeInCents / 100} (${PLATFORM_FEE_PERCENTAGE}%)`);

    // Create Stripe Checkout Session with automatic split
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: {
              name: description || `Pedido #${orderId}`,
              description: `Pedido no marketplace Nellor - ${supplier.nome}`,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: successUrl || `https://nellor.lovable.app/cliente/pedido-confirmado?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `https://nellor.lovable.app/cliente/carrinho`,
      payment_intent_data: {
        // Automatic split: payment goes to connected account minus platform fee
        application_fee_amount: platformFeeInCents,
        transfer_data: {
          destination: supplier.stripe_account_id,
        },
        metadata: {
          order_id: orderId,
          supplier_id: supplierId,
          buyer_id: user.id,
          platform_fee_percentage: PLATFORM_FEE_PERCENTAGE.toString(),
        },
      },
      metadata: {
        order_id: orderId,
        supplier_id: supplierId,
        buyer_id: user.id,
      },
    });

    console.log("Created Stripe checkout session:", session.id);

    return new Response(
      JSON.stringify({ 
        sessionId: session.id,
        url: session.url,
        platformFee: platformFeeInCents / 100,
        supplierAmount: (amountInCents - platformFeeInCents) / 100,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Stripe payment error:", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
