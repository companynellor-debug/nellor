import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type Json = Record<string, unknown>;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const encoder = new TextEncoder();

function json(status: number, body: Json) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

function toBase64Url(input: Uint8Array | string) {
  const bytes = typeof input === "string" ? encoder.encode(input) : input;
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function signValue(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return toBase64Url(new Uint8Array(signature));
}

async function createAdminToken(secret: string) {
  const payload = toBase64Url(JSON.stringify({ exp: Date.now() + 12 * 60 * 60 * 1000, v: 1 }));
  const signature = await signValue(payload, secret);
  return `${payload}.${signature}`;
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

  const adminToken = await createAdminToken(expectedPassword);

  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

  if (!token || token === anonKey || !supabaseUrl || !serviceRoleKey) {
    return json(200, { ok: true, adminToken });
  }

  try {
    const userClient = createClient(supabaseUrl, anonKey || serviceRoleKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false },
    });

    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) {
      return json(200, { ok: true, adminToken });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    await adminClient
      .from("user_roles")
      .upsert({ user_id: userData.user.id, role: "admin" }, { onConflict: "user_id,role" });

    return json(200, { ok: true, adminToken, roleGranted: true });
  } catch (error) {
    console.error("admin-grant-role warning:", error);
    return json(200, { ok: true, adminToken });
  }
});