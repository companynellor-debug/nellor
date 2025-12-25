import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";
import webpush from "https://esm.sh/web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

function normalizeSubscription(sub: { endpoint: string; p256dh: string; auth: string }) {
  return {
    endpoint: sub.endpoint,
    keys: {
      p256dh: sub.p256dh,
      auth: sub.auth,
    },
  };
}

async function sendWebPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: PushPayload
): Promise<PushResult> {
  try {
    console.log(`📤 Sending push to endpoint: ${subscription.endpoint.substring(0, 50)}...`);

    // IMPORTANT: Web Push payload MUST be encrypted using the subscription keys.
    // web-push handles encryption + proper headers.
    const res = await webpush.sendNotification(
      normalizeSubscription(subscription),
      JSON.stringify(payload),
      {
        TTL: 86400,
        urgency: "high",
      }
    );

    console.log(`✅ Push sent successfully (status ${res.statusCode})`);
    return { success: true, status: res.statusCode };
  } catch (error) {
    const statusCode = (error as any)?.statusCode;
    const body = (error as any)?.body;

    // 404/410 means the subscription is gone/expired
    if (statusCode === 404 || statusCode === 410) {
      return {
        success: false,
        status: statusCode,
        expired: true,
        error: body || "Subscription expired",
      };
    }

    console.error("❌ Push error:", error);
    return {
      success: false,
      status: typeof statusCode === "number" ? statusCode : undefined,
      error: body || String(error),
    };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
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
      return new Response(JSON.stringify({ error: "VAPID keys not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Configure VAPID for web-push
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

    const { user_id, title, body, url, order_number, type } = await req.json();

    console.log("=================================================");
    console.log("📨 SEND PUSH NOTIFICATION REQUEST");
    console.log(`  User ID: ${user_id}`);
    console.log(`  Title: ${title}`);
    console.log(`  Body: ${body}`);
    console.log(`  Order: ${order_number}`);
    console.log(`  Type: ${type}`);
    console.log(`  URL: ${url}`);
    console.log("=================================================");

    if (!user_id || !title || !body) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: user_id, title, body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get all push subscriptions for this user
    const { data: subscriptions, error: subError } = await supabaseAdmin
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("user_id", user_id);

    if (subError) {
      console.error("❌ Error fetching subscriptions:", subError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch subscriptions", details: subError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log("⚠️ No push subscriptions found for user:", user_id);
      return new Response(JSON.stringify({ sent: 0, failed: 0, message: "No subscriptions found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`📱 Found ${subscriptions.length} subscription(s) for user`);

    // Payload consumed by src/sw.ts (service worker) -> showNotification(title, { body, ... })
    const payload: PushPayload = {
      title,
      body,
      icon: "/pwa-192x192.png",
      badge: "/pwa-192x192.png",
      url: url || "/fornecedor/pedidos",
      // Tag used by the SW to build a unique tag; keep consistent to avoid duplicates.
      tag: order_number && type ? `${order_number}-${type}` : `notification-${Date.now()}`,
      order_number: order_number || "",
      type: type || "general",
    };

    const results = await Promise.all(
      subscriptions.map(async (sub) => {
        const result = await sendWebPush(
          { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
          payload
        );

        const logEntry = {
          user_id,
          endpoint: sub.endpoint.substring(0, 200),
          title,
          body,
          status: result.success ? "sent" : result.expired ? "expired" : "failed",
          error_message: result.error || null,
          http_status: result.status || null,
        };

        const { error: logError } = await supabaseAdmin
          .from("push_notification_logs")
          .insert(logEntry);

        if (logError) {
          console.error("⚠️ Failed to log push result:", logError);
        }

        if (result.expired) {
          console.log(`🗑️ Removing expired subscription: ${sub.id}`);
          await supabaseAdmin.from("push_subscriptions").delete().eq("id", sub.id);
        }

        return result;
      })
    );

    const sent = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;
    const expired = results.filter((r) => r.expired).length;

    console.log("=================================================");
    console.log(`📊 PUSH RESULTS: ${sent} sent, ${failed} failed, ${expired} expired`);
    console.log("=================================================");

    return new Response(JSON.stringify({ sent, failed, expired, total: subscriptions.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ Error in send-push-notification:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
