import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { action, user_id } = await req.json();

    if (!user_id || !action) {
      return new Response(JSON.stringify({ error: "Missing user_id or action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "ban") {
      // Ban: set ativo = false on profile + ban on auth.users
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update({ ativo: false })
        .eq("id", user_id);

      if (profileError) throw profileError;

      // Ban via Supabase Auth admin API
      const { error: banError } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
        ban_duration: "876600h", // ~100 years
      });

      if (banError) throw banError;

      return new Response(JSON.stringify({ success: true, action: "banned" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "unban") {
      // Unban: restore ativo = true + unban auth
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
      // Soft-delete profile first (nullify sensitive data)
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update({ ativo: false })
        .eq("id", user_id);

      if (profileError) throw profileError;

      // Permanently delete from auth.users (cascades to profile via FK if set)
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
