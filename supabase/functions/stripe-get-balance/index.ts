import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") ?? "";

    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with user's token
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "User not authenticated" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user's profile to find Stripe account ID
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("stripe_account_id, stripe_ready")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: "Profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!profile.stripe_account_id) {
      return new Response(
        JSON.stringify({ 
          error: "Stripe not connected",
          connected: false,
          available: 0,
          pending: 0,
          currency: "brl"
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    console.log(`Fetching balance for connected account: ${profile.stripe_account_id}`);

    // Fetch balance from connected account
    const balance = await stripe.balance.retrieve({
      stripeAccount: profile.stripe_account_id,
    });

    console.log("Balance response:", JSON.stringify(balance));

    // Extract BRL balance (or default currency)
    const availableBalance = balance.available.find((b: Stripe.Balance.Available) => b.currency === "brl") || balance.available[0];
    const pendingBalance = balance.pending.find((b: Stripe.Balance.Pending) => b.currency === "brl") || balance.pending[0];

    const available = availableBalance ? availableBalance.amount / 100 : 0;
    const pending = pendingBalance ? pendingBalance.amount / 100 : 0;
    const currency = availableBalance?.currency || pendingBalance?.currency || "brl";

    // Also fetch recent payouts
    let recentPayouts: Array<{
      id: string;
      amount: number;
      currency: string;
      status: string;
      arrival_date: number;
      created: number;
    }> = [];
    
    try {
      const payouts = await stripe.payouts.list({
        limit: 5,
        stripeAccount: profile.stripe_account_id,
      });
      recentPayouts = payouts.data.map((p: Stripe.Payout) => ({
        id: p.id,
        amount: p.amount / 100,
        currency: p.currency,
        status: p.status,
        arrival_date: p.arrival_date,
        created: p.created,
      }));
    } catch (e) {
      console.log("Could not fetch payouts:", e);
    }

    // Fetch pending balance transactions (in_transit)
    let inTransit = 0;
    try {
      const balanceTransactions = await stripe.balanceTransactions.list({
        limit: 100,
        stripeAccount: profile.stripe_account_id,
      });
      // Sum up pending transactions
      inTransit = balanceTransactions.data
        .filter((t: Stripe.BalanceTransaction) => t.status === "pending")
        .reduce((sum: number, t: Stripe.BalanceTransaction) => sum + t.net, 0) / 100;
    } catch (e) {
      console.log("Could not fetch balance transactions:", e);
    }

    return new Response(
      JSON.stringify({
        connected: true,
        stripe_ready: profile.stripe_ready,
        available,
        pending,
        inTransit,
        currency,
        recentPayouts,
        lastUpdated: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error fetching Stripe balance:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
