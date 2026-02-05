import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type Json = Record<string, unknown>;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(status: number, body: Json) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json(405, { ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const adminPasswordSecret = Deno.env.get("ADMIN_PANEL_PASSWORD") ?? "";
  
  if (!adminPasswordSecret) {
    console.error("ADMIN_PANEL_PASSWORD not configured");
    return json(500, { ok: false, error: "ADMIN_PASSWORD_NOT_CONFIGURED" });
  }

  let payload: { password?: string } = {};
  try {
    payload = await req.json();
  } catch {
    return json(400, { ok: false, error: "INVALID_BODY" });
  }

  const inputPassword = (payload.password ?? "").trim();
  const expectedPassword = adminPasswordSecret.trim();

  if (!inputPassword || inputPassword !== expectedPassword) {
    return json(401, { ok: false, error: "INVALID_PASSWORD" });
  }

  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  
  if (!token || token === anonKey) {
    return json(200, { ok: true, message: "Password verified, access granted" });
  }

  if (!supabaseUrl || !serviceRoleKey) {
    return json(200, { ok: true, message: "Password verified" });
  }

  try {
    const userClient = createClient(supabaseUrl, anonKey || serviceRoleKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false },
    });

    const { data: userData, error: userErr } = await userClient.auth.getUser();
    
    if (userErr || !userData?.user) {
      return json(200, { ok: true, message: "Password verified" });
    }

    const userId = userData.user.id;

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const { error: upsertErr } = await adminClient
      .from("user_roles")
      .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });

    if (upsertErr) {
      console.error("Failed to upsert role:", upsertErr);
      return json(200, { ok: true, message: "Password verified, role upsert failed" });
    }

    return json(200, { ok: true, roleGranted: true });
    
  } catch (e) {
    console.error("Error during role grant:", e);
    return json(200, { ok: true, message: "Password verified" });
  }
});
