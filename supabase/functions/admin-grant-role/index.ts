// Supabase Edge Function: admin-grant-role
// Grants 'admin' role to the currently authenticated user when a valid admin password is provided.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";

type Json = Record<string, unknown>;

function json(status: number, body: Json) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }

  if (req.method !== "POST") return json(405, { ok: false, error: "METHOD_NOT_ALLOWED" });

  const adminPasswordSecret = Deno.env.get("ADMIN_PANEL_PASSWORD") ?? "";
  if (!adminPasswordSecret) {
    return json(500, { ok: false, error: "ADMIN_PASSWORD_NOT_CONFIGURED" });
  }

  let payload: { password?: string } = {};
  try {
    payload = await req.json();
  } catch {
    // ignore
  }

  const inputPassword = (payload.password ?? "").trim();
  const expectedPassword = adminPasswordSecret.trim();
  
  if (!inputPassword || inputPassword !== expectedPassword) {
    console.log("Password mismatch. Input length:", inputPassword.length, "Expected length:", expectedPassword.length);
    return json(401, { ok: false, error: "INVALID_PASSWORD" });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!supabaseUrl || !serviceRoleKey) {
    return json(500, { ok: false, error: "SUPABASE_ENV_NOT_SET" });
  }

  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) return json(401, { ok: false, error: "MISSING_JWT" });

  // User client: validate the incoming JWT and get user id
  const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });

  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) {
    return json(401, { ok: false, error: "INVALID_JWT" });
  }

  const userId = userData.user.id;

  // Admin client: bypass RLS to grant admin role
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { error: upsertErr } = await adminClient
    .from("user_roles")
    .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });

  if (upsertErr) {
    return json(500, { ok: false, error: "UPSERT_FAILED", details: upsertErr.message });
  }

  return json(200, { ok: true });
});
