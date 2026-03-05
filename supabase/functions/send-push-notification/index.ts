import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function base64UrlDecode(str: string): Uint8Array {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function generateVAPIDHeaders(
  endpoint: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidSubject: string
): Promise<{ authorization: string; cryptoKey: string }> {
  const audience = new URL(endpoint).origin;
  const expiration = Math.floor(Date.now() / 1000) + 12 * 60 * 60;

  const header = { typ: "JWT", alg: "ES256" };
  const payload = { aud: audience, exp: expiration, sub: vapidSubject };

  const headerB64 = btoa(JSON.stringify(header))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const payloadB64 = btoa(JSON.stringify(payload))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  const unsignedToken = `${headerB64}.${payloadB64}`;
  const publicKeyBytes = base64UrlDecode(vapidPublicKey);
  
  const jwk = {
    kty: "EC",
    crv: "P-256",
    d: vapidPrivateKey,
    x: btoa(String.fromCharCode(...publicKeyBytes.slice(1, 33)))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""),
    y: btoa(String.fromCharCode(...publicKeyBytes.slice(33, 65)))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""),
  };

  const cryptoKey = await crypto.subtle.importKey(
    "jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]
  );

  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  );

  const signatureBytes = new Uint8Array(signature);
  const signatureB64 = btoa(String.fromCharCode(...signatureBytes))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  return {
    authorization: `vapid t=${unsignedToken}.${signatureB64}, k=${vapidPublicKey}`,
    cryptoKey: vapidPublicKey,
  };
}

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
  order_number?: string;
  type?: string;
}

interface PushResult {
  success: boolean;
  status?: number;
  error?: string;
  expired?: boolean;
}

async function sendWebPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: PushPayload,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidSubject: string
): Promise<PushResult> {
  try {
    const payloadString = JSON.stringify(payload);
    
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "TTL": "86400",
      "Urgency": "high",
    };

    try {
      const vapidHeaders = await generateVAPIDHeaders(
        subscription.endpoint,
        vapidPublicKey,
        vapidPrivateKey,
        vapidSubject
      );
      headers["Authorization"] = vapidHeaders.authorization;
    } catch (vapidError) {
      console.error("VAPID header generation failed:", vapidError);
    }

    const response = await fetch(subscription.endpoint, {
      method: "POST",
      headers,
      body: payloadString,
    });

    if (response.status === 404 || response.status === 410) {
      return { success: false, status: response.status, expired: true, error: "Subscription expired" };
    }

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, status: response.status, error: errorText };
    }

    return { success: true, status: response.status };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY") ?? "";
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";
    const vapidSubject = Deno.env.get("VAPID_SUBJECT") ?? "mailto:suporte@nellor.com.br";

    if (!vapidPublicKey || !vapidPrivateKey) {
      return new Response(
        JSON.stringify({ error: "VAPID keys not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { user_id, title, body, url, order_number, type, data } = await req.json();

    if (!user_id || !title || !body) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: user_id, title, body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: subscriptions, error: subError } = await supabaseAdmin
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("user_id", user_id);

    if (subError) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch subscriptions", details: subError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0, failed: 0, message: "No subscriptions found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload: PushPayload = {
      title: title || "NELLOR",
      body: body || "Nova notificação",
      icon: "/pwa-192x192.png",
      badge: "/pwa-192x192.png",
      url: url || "/fornecedor/pedidos",
      tag: order_number && type ? `${order_number}-${type}` : `notification-${Date.now()}`,
      order_number: order_number || "",
      type: type || "general",
    };

    const results = await Promise.all(
      subscriptions.map(async (sub) => {
        const result = await sendWebPush(
          { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
          payload,
          vapidPublicKey,
          vapidPrivateKey,
          vapidSubject
        );

        const logEntry = {
          user_id,
          endpoint: sub.endpoint.substring(0, 200),
          title,
          body,
          status: result.success ? "sent" : (result.expired ? "expired" : "failed"),
          error_message: result.error || null,
          http_status: result.status || null,
        };

        await supabaseAdmin.from("push_notification_logs").insert(logEntry);

        if (result.expired) {
          await supabaseAdmin.from("push_subscriptions").delete().eq("id", sub.id);
        }

        return result;
      })
    );

    const sent = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;
    const expired = results.filter((r) => r.expired).length;

    // Inserir notificação no banco usando service role (ignora RLS)
    // Dedup: verificar se já existe notificação igual nos últimos 5 minutos
    try {
      const notifType = (type === "order_update" || type === "order_status_changed" || type === "payment_confirmed" || type === "new_message" || type === "promotion" || type === "general")
        ? type
        : "order_update";

      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data: existing } = await supabaseAdmin
        .from("notifications")
        .select("id")
        .eq("user_id", user_id)
        .eq("title", title)
        .eq("type", notifType)
        .gte("created_at", fiveMinutesAgo)
        .limit(1);

      if (existing && existing.length > 0) {
        console.log("⏭️ Duplicate notification skipped for user:", user_id, title);
      } else {
        await supabaseAdmin.from("notifications").insert({
          user_id,
          title,
          body,
          type: notifType,
          data: data || null,
          sound: true,
          read: false,
        });
        console.log("✅ Notification inserted in DB for user:", user_id);
      }
    } catch (dbErr) {
      console.error("❌ Failed to insert notification in DB:", dbErr);
    }

    return new Response(
      JSON.stringify({ sent, failed, expired, total: subscriptions.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
