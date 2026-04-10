import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { action, user_id } = await req.json();

    if (!action) {
      return new Response(JSON.stringify({ error: "Missing action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Self-delete: user deletes their own account
    if (action === "self_delete") {
      // Verify JWT to get the requesting user
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(
        authHeader.replace("Bearer ", "")
      );

      if (authError || !requestingUser) {
        return new Response(JSON.stringify({ error: "Invalid token" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const selfUserId = requestingUser.id;

      // Check user is not admin
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("tipo")
        .eq("id", selfUserId)
        .single();

      if (profile?.tipo === "admin") {
        return new Response(JSON.stringify({ error: "Admins cannot self-delete" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Delete all user data (reuse same logic as admin delete)
      const { data: products } = await supabaseAdmin
        .from("products")
        .select("id")
        .eq("supplier_id", selfUserId);

      const productIds = (products || []).map((p: any) => p.id);

      if (productIds.length > 0) {
        await supabaseAdmin.from("product_price_tiers").delete().in("product_id", productIds);
        await supabaseAdmin.from("product_variations").delete().in("product_id", productIds);
        await supabaseAdmin.from("product_drop_settings").delete().in("product_id", productIds);
        await supabaseAdmin.from("client_drop_products").delete().in("product_id", productIds);
        await supabaseAdmin.from("reviews").delete().in("product_id", productIds);
        
        await supabaseAdmin.from("products").delete().eq("supplier_id", selfUserId);
      }

      await supabaseAdmin.from("orders").delete().eq("supplier_id", selfUserId);
      await supabaseAdmin.from("orders").delete().eq("buyer_id", selfUserId);
      await supabaseAdmin.from("drop_orders").delete().eq("supplier_id", selfUserId);
      await supabaseAdmin.from("drop_orders").delete().eq("client_id", selfUserId);


      await supabaseAdmin.from("notifications").delete().eq("user_id", selfUserId);
      await supabaseAdmin.from("messages").delete().or(`from_user.eq.${selfUserId},to_user.eq.${selfUserId}`);
      await supabaseAdmin.from("push_subscriptions").delete().eq("user_id", selfUserId);
      await supabaseAdmin.from("notification_preferences").delete().eq("user_id", selfUserId);
      await supabaseAdmin.from("activity_logs").delete().eq("user_id", selfUserId);
      await supabaseAdmin.from("product_drafts").delete().eq("supplier_id", selfUserId);
      await supabaseAdmin.from("collections").delete().eq("user_id", selfUserId);
      await supabaseAdmin.from("affiliates").delete().eq("user_id", selfUserId);
      await supabaseAdmin.from("profiles").delete().eq("id", selfUserId);

      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(selfUserId);
      if (deleteError) throw deleteError;

      return new Response(JSON.stringify({ success: true, action: "self_deleted" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!user_id) {
      return new Response(JSON.stringify({ error: "Missing user_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "ban") {
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update({ ativo: false })
        .eq("id", user_id);

      if (profileError) throw profileError;

      const { error: banError } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
        ban_duration: "876600h",
      });

      if (banError) throw banError;

      // Also deactivate all supplier products
      await supabaseAdmin
        .from("products")
        .update({ ativo: false })
        .eq("supplier_id", user_id);

      return new Response(JSON.stringify({ success: true, action: "banned" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "unban") {
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update({ ativo: true })
        .eq("id", user_id);

      if (profileError) throw profileError;

      const { error: unbanError } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
        ban_duration: "none",
      });

      if (unbanError) throw unbanError;

      return new Response(JSON.stringify({ success: true, action: "unbanned" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete") {
      // 1. Get all product IDs for this supplier
      const { data: products } = await supabaseAdmin
        .from("products")
        .select("id")
        .eq("supplier_id", user_id);

      const productIds = (products || []).map((p: any) => p.id);

      if (productIds.length > 0) {
        // Delete product_price_tiers
        await supabaseAdmin
          .from("product_price_tiers")
          .delete()
          .in("product_id", productIds);

        // Delete product_variations
        await supabaseAdmin
          .from("product_variations")
          .delete()
          .in("product_id", productIds);

        // Delete product_drop_settings
        await supabaseAdmin
          .from("product_drop_settings")
          .delete()
          .in("product_id", productIds);

        // Delete client_drop_products referencing these products
        await supabaseAdmin
          .from("client_drop_products")
          .delete()
          .in("product_id", productIds);

        // Delete reviews for these products
        await supabaseAdmin
          .from("reviews")
          .delete()
          .in("product_id", productIds);

        // Delete coupons
        await supabaseAdmin
          .from("coupons")
          .delete()
          .eq("supplier_id", user_id);

        // Delete products
        await supabaseAdmin
          .from("products")
          .delete()
          .eq("supplier_id", user_id);
      }

      // 2. Delete orders (supplier's orders)
      await supabaseAdmin
        .from("orders")
        .delete()
        .eq("supplier_id", user_id);

      // 3. Delete drop_orders
      await supabaseAdmin
        .from("drop_orders")
        .delete()
        .eq("supplier_id", user_id);

      // 4. Delete analytics
      await supabaseAdmin
        .from("analytics")
        .delete()
        .eq("supplier_id", user_id);

      // 5. Delete payouts
      await supabaseAdmin
        .from("payouts")
        .delete()
        .eq("supplier_id", user_id);

      // 6. Delete notifications
      await supabaseAdmin
        .from("notifications")
        .delete()
        .eq("user_id", user_id);

      // 7. Delete messages
      await supabaseAdmin
        .from("messages")
        .delete()
        .or(`from_user.eq.${user_id},to_user.eq.${user_id}`);

      // 8. Delete push subscriptions
      await supabaseAdmin
        .from("push_subscriptions")
        .delete()
        .eq("user_id", user_id);

      // 9. Delete addresses
      await supabaseAdmin.from("addresses").delete().eq("user_id", user_id);

      // 11. Delete notification_preferences
      await supabaseAdmin
        .from("notification_preferences")
        .delete()
        .eq("user_id", user_id);

      // 12. Delete profile
      await supabaseAdmin
        .from("profiles")
        .delete()
        .eq("id", user_id);

      // 13. Delete auth user
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user_id);
      if (deleteError) throw deleteError;

      return new Response(JSON.stringify({ success: true, action: "deleted" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("admin-user-actions error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
