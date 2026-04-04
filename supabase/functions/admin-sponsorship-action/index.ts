import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!supabaseUrl || !serviceRoleKey) {
    return json(500, { error: "SUPABASE_ENV_NOT_SET" });
  }

  let payload: {
    request_id: string;
    action: "approve" | "reject" | "schedule";
    admin_response?: string;
    scheduled_date?: string;
  };

  try {
    payload = await req.json();
  } catch {
    return json(400, { error: "INVALID_BODY" });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  try {
    // 1. Fetch the sponsorship request
    const { data: request, error: fetchErr } = await adminClient
      .from("sponsorship_requests")
      .select("*")
      .eq("id", payload.request_id)
      .single();

    if (fetchErr || !request) {
      return json(404, { error: "REQUEST_NOT_FOUND" });
    }

    const newStatus =
      payload.action === "approve" ? "approved"
      : payload.action === "reject" ? "rejected"
      : "scheduled";

    // 2. Update the sponsorship request status
    const updateData: Record<string, unknown> = {
      status: newStatus,
      admin_response: payload.admin_response || null,
    };
    if (payload.action === "schedule" && payload.scheduled_date) {
      updateData.scheduled_date = payload.scheduled_date;
    }

    const { error: updateErr } = await adminClient
      .from("sponsorship_requests")
      .update(updateData)
      .eq("id", payload.request_id);

    if (updateErr) throw updateErr;

    // 3. Side effects on approval
    if (newStatus === "approved" || newStatus === "scheduled") {
      if (request.type === "banner_homepage" && request.banner_image_url) {
        // Insert into banners table
        const { error: bannerErr } = await adminClient
          .from("banners")
          .insert({
            title: `Patrocínio - ${request.supplier_id.substring(0, 8)}`,
            image_url: request.banner_image_url,
            link_url: null,
            order_index: 99,
            ativo: newStatus === "approved", // scheduled = inactive until date
          });
        if (bannerErr) console.error("Error inserting banner:", bannerErr);
      }

      if (request.type === "produto_destaque" && request.product_id) {
        // Insert into sponsored_products table
        const { error: spErr } = await adminClient
          .from("sponsored_products")
          .insert({
            product_id: request.product_id,
            supplier_id: request.supplier_id,
            status: "active",
            approved_at: new Date().toISOString(),
          });
        if (spErr) console.error("Error inserting sponsored product:", spErr);
      }
    }

    // 4. Send notification to supplier
    const statusLabel = newStatus === "approved" ? "Aprovado ✅" : newStatus === "rejected" ? "Não Aprovado" : "Agendado 📅";
    const body =
      newStatus === "approved"
        ? `Seu patrocínio foi aprovado e está ativo!${payload.admin_response ? ` Resposta: ${payload.admin_response}` : ""}`
        : newStatus === "rejected"
        ? `Seu patrocínio não foi aprovado. Motivo: ${payload.admin_response || "Sem justificativa"}`
        : `Seu patrocínio foi agendado para ${payload.scheduled_date ? new Date(payload.scheduled_date).toLocaleDateString("pt-BR") : "em breve"}.`;

    await adminClient.from("notifications").insert({
      user_id: request.supplier_id,
      title: `Patrocínio ${statusLabel}`,
      body,
      type: "order_update",
    });

    return json(200, { ok: true, status: newStatus });
  } catch (error: unknown) {
    console.error("Error in admin-sponsorship-action:", error);
    const message = error instanceof Error ? error.message : "INTERNAL_ERROR";
    return json(500, { error: message });
  }
});
