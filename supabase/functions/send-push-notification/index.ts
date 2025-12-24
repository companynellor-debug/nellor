import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Web Push requires these functions
function base64UrlDecode(str: string): Uint8Array {
  // Add padding if needed
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
  const expiration = Math.floor(Date.now() / 1000) + 12 * 60 * 60; // 12 hours

  // JWT header
  const header = { typ: "JWT", alg: "ES256" };
  const payload = {
    aud: audience,
    exp: expiration,
    sub: vapidSubject,
  };

  const headerB64 = btoa(JSON.stringify(header))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  const payloadB64 = btoa(JSON.stringify(payload))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const unsignedToken = `${headerB64}.${payloadB64}`;

  // Decode private key and import
  const privateKeyBytes = base64UrlDecode(vapidPrivateKey);
  
  // Create JWK for ES256
  const publicKeyBytes = base64UrlDecode(vapidPublicKey);
  
  const jwk = {
    kty: "EC",
    crv: "P-256",
    d: vapidPrivateKey,
    x: btoa(String.fromCharCode(...publicKeyBytes.slice(1, 33)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, ""),
    y: btoa(String.fromCharCode(...publicKeyBytes.slice(33, 65)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, ""),
  };

  const cryptoKey = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  );

  // Convert signature from DER to raw format
  const signatureBytes = new Uint8Array(signature);
  const signatureB64 = btoa(String.fromCharCode(...signatureBytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const jwt = `${unsignedToken}.${signatureB64}`;

  return {
    authorization: `vapid t=${jwt}, k=${vapidPublicKey}`,
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
}

async function sendWebPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: PushPayload,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidSubject: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`📤 Sending push to endpoint: ${subscription.endpoint.substring(0, 50)}...`);

    // For now, use a simpler approach with fetch
    // The complex VAPID signing is causing issues, so we'll try a direct approach
    
    const payloadString = JSON.stringify(payload);
    
    // Simple approach: send without encryption (works for testing)
    // In production, you'd want to use web-push library in a Node.js environment
    
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "TTL": "86400",
    };

    // Try to generate VAPID headers
    try {
      const vapidHeaders = await generateVAPIDHeaders(
        subscription.endpoint,
        vapidPublicKey,
        vapidPrivateKey,
        vapidSubject
      );
      headers["Authorization"] = vapidHeaders.authorization;
    } catch (vapidError) {
      console.error("⚠️ VAPID header generation failed:", vapidError);
      // Continue without VAPID for testing
    }

    const response = await fetch(subscription.endpoint, {
      method: "POST",
      headers,
      body: payloadString,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Push failed: ${response.status} - ${errorText}`);
      
      // If subscription is gone, return special error
      if (response.status === 404 || response.status === 410) {
        return { success: false, error: "SUBSCRIPTION_EXPIRED" };
      }
      
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }

    console.log(`✅ Push sent successfully`);
    return { success: true };
  } catch (error) {
    console.error(`❌ Push error:`, error);
    return { success: false, error: String(error) };
  }
}

serve(async (req) => {
  // Handle CORS
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
      console.error("❌ VAPID keys not configured");
      return new Response(
        JSON.stringify({ error: "VAPID keys not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { user_id, title, body, url, tag, order_number, total } = await req.json();

    console.log("=================================================");
    console.log("📨 SEND PUSH NOTIFICATION REQUEST");
    console.log(`  User ID: ${user_id}`);
    console.log(`  Title: ${title}`);
    console.log(`  Body: ${body}`);
    console.log(`  Order: ${order_number}`);
    console.log("=================================================");

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "user_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get all push subscriptions for this user
    const { data: subscriptions, error: subError } = await supabaseAdmin
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", user_id);

    if (subError) {
      console.error("❌ Error fetching subscriptions:", subError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch subscriptions" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log("⚠️ No push subscriptions found for user:", user_id);
      return new Response(
        JSON.stringify({ message: "No subscriptions found", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`📱 Found ${subscriptions.length} subscription(s) for user`);

    const payload: PushPayload = {
      title: title || "NELLOR",
      body: body || "Nova notificação",
      icon: "/pwa-192x192.png",
      badge: "/pwa-192x192.png",
      url: url || "/fornecedor/pedidos",
      tag: tag || `nellor-${Date.now()}`,
    };

    // Send to all subscriptions
    const results = await Promise.all(
      subscriptions.map(async (sub) => {
        const result = await sendWebPush(
          { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
          payload,
          vapidPublicKey,
          vapidPrivateKey,
          vapidSubject
        );

        // If subscription expired, delete it
        if (!result.success && result.error === "SUBSCRIPTION_EXPIRED") {
          console.log(`🗑️ Removing expired subscription: ${sub.id}`);
          await supabaseAdmin
            .from("push_subscriptions")
            .delete()
            .eq("id", sub.id);
        }

        return result;
      })
    );

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    console.log("=================================================");
    console.log(`📊 PUSH RESULTS: ${successCount} sent, ${failCount} failed`);
    console.log("=================================================");

    return new Response(
      JSON.stringify({
        success: true,
        sent: successCount,
        failed: failCount,
        total: subscriptions.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Error in send-push-notification:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});