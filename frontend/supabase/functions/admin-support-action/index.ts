import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type Json = Record<string, unknown>;

type SupportPayload = {
  adminToken?: string;
  type?: "ticket" | "report";
  ticketId?: string;
  reportId?: string;
  status?: string;
  response?: string;
};

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

function fromBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (normalized.length % 4 || 4)) % 4);
  return atob(`${normalized}${padding}`);
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

async function verifyAdminToken(token: string, secret: string) {
  const [payloadPart, signaturePart] = token.split(".");
  if (!payloadPart || !signaturePart) return false;

  const expectedSignature = await signValue(payloadPart, secret);
  if (expectedSignature !== signaturePart) return false;

  try {
    const payload = JSON.parse(fromBase64Url(payloadPart)) as { exp?: number };
    return Boolean(payload.exp && payload.exp > Date.now());
  } catch {
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json(405, { ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const adminPasswordSecret = Deno.env.get("ADMIN_PANEL_PASSWORD") ?? "";

  if (!supabaseUrl || !serviceRoleKey || !adminPasswordSecret) {
    return json(500, { ok: false, error: "SERVER_CONFIG_MISSING" });
  }

  let payload: SupportPayload = {};
  try {
    payload = await req.json();
  } catch {
    return json(400, { ok: false, error: "INVALID_BODY" });
  }

  if (!payload.adminToken || !(await verifyAdminToken(payload.adminToken, adminPasswordSecret.trim()))) {
    return json(401, { ok: false, error: "INVALID_ADMIN_TOKEN" });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  try {
    if (payload.type === "ticket") {
      if (!payload.ticketId) {
        return json(400, { ok: false, error: "MISSING_TICKET_ID" });
      }

      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (typeof payload.response === "string") updates.resposta_admin = payload.response;
      if (payload.status) updates.status = payload.status;

      const { error } = await adminClient
        .from("support_tickets")
        .update(updates)
        .eq("id", payload.ticketId);

      if (error) throw error;
      return json(200, { ok: true });
    }

    if (payload.type === "report") {
      if (!payload.reportId || !payload.status) {
        return json(400, { ok: false, error: "MISSING_REPORT_DATA" });
      }

      const { error } = await adminClient
        .from("reports")
        .update({ status: payload.status })
        .eq("id", payload.reportId);

      if (error) throw error;
      return json(200, { ok: true });
    }

    return json(400, { ok: false, error: "INVALID_ACTION_TYPE" });
  } catch (error) {
    console.error("admin-support-action error:", error);
    const message = error instanceof Error ? error.message : "INTERNAL_ERROR";
    return json(500, { ok: false, error: message });
  }
});