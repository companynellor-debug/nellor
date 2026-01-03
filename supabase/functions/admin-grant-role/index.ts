// Supabase Edge Function: admin-grant-role
// Validates admin password and optionally grants 'admin' role if user is authenticated.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";

type Json = Record<string, unknown>;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(status: number, body: Json) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json(405, { ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const adminPasswordSecret = Deno.env.get("ADMIN_PANEL_PASSWORD") ?? "";
  
  console.log("ADMIN_PANEL_PASSWORD configured:", adminPasswordSecret ? "yes (length: " + adminPasswordSecret.length + ")" : "no");
  
  if (!adminPasswordSecret) {
    console.error("ADMIN_PANEL_PASSWORD not configured");
    return json(500, { ok: false, error: "ADMIN_PASSWORD_NOT_CONFIGURED" });
  }

  let payload: { password?: string } = {};
  try {
    payload = await req.json();
  } catch (e) {
    console.error("Failed to parse JSON body:", e);
    return json(400, { ok: false, error: "INVALID_BODY" });
  }

  const inputPassword = (payload.password ?? "").trim();
  const expectedPassword = adminPasswordSecret.trim();

  console.log("Input password length:", inputPassword.length);
  console.log("Expected password length:", expectedPassword.length);
  console.log("Passwords match:", inputPassword === expectedPassword);

  if (!inputPassword || inputPassword !== expectedPassword) {
    return json(401, { ok: false, error: "INVALID_PASSWORD" });
  }

  // Password is correct! Now try to grant admin role if user is authenticated
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  
  // Check if it's a real user JWT (not just anon key)
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  
  // If the token is the same as anon key, user is not authenticated
  if (!token || token === anonKey) {
    console.log("User not authenticated, but password is correct - granting access");
    return json(200, { ok: true, message: "Password verified, access granted" });
  }

  if (!supabaseUrl || !serviceRoleKey) {
    console.log("Supabase env not set, but password correct - granting access");
    return json(200, { ok: true, message: "Password verified" });
  }

  // Try to validate JWT and grant admin role
  try {
    const userClient = createClient(supabaseUrl, anonKey || serviceRoleKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false },
    });

    const { data: userData, error: userErr } = await userClient.auth.getUser();
    
    if (userErr || !userData?.user) {
      console.log("Could not validate JWT, but password is correct - granting access");
      return json(200, { ok: true, message: "Password verified" });
    }

    const userId = userData.user.id;
    console.log("User authenticated:", userId, "- granting admin role");

    // Grant admin role using service role
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const { error: upsertErr } = await adminClient
      .from("user_roles")
      .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });

    if (upsertErr) {
      console.error("Failed to upsert role:", upsertErr);
      // Still return success since password was correct
      return json(200, { ok: true, message: "Password verified, role upsert failed" });
    }

    console.log("Admin role granted to user:", userId);
    return json(200, { ok: true, roleGranted: true });
    
  } catch (e) {
    console.error("Error during role grant:", e);
    // Password was correct, so still allow access
    return json(200, { ok: true, message: "Password verified" });
  }
});
