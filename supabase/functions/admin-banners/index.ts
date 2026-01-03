// Supabase Edge Function: admin-banners
// CRUD operations for banners - validates admin password from sessionStorage

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";

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

  if (req.method !== "POST") {
    return json(405, { error: "METHOD_NOT_ALLOWED" });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  if (!supabaseUrl || !serviceRoleKey) {
    return json(500, { error: "SUPABASE_ENV_NOT_SET" });
  }

  let payload: {
    action: "list" | "create" | "update" | "delete";
    id?: string;
    data?: {
      title?: string;
      subtitle?: string;
      image_url?: string;
      link_url?: string;
      order_index?: number;
      ativo?: boolean;
    };
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
    switch (payload.action) {
      case "list": {
        const { data, error } = await adminClient
          .from("banners")
          .select("*")
          .order("order_index", { ascending: true });

        if (error) throw error;
        return json(200, { ok: true, data });
      }

      case "create": {
        if (!payload.data?.image_url) {
          return json(400, { error: "IMAGE_URL_REQUIRED" });
        }

        const { data, error } = await adminClient
          .from("banners")
          .insert({
            title: payload.data.title,
            subtitle: payload.data.subtitle,
            image_url: payload.data.image_url,
            link_url: payload.data.link_url,
            order_index: payload.data.order_index ?? 1,
            ativo: payload.data.ativo ?? true,
          })
          .select()
          .single();

        if (error) throw error;
        return json(200, { ok: true, data });
      }

      case "update": {
        if (!payload.id) {
          return json(400, { error: "ID_REQUIRED" });
        }

        const { data, error } = await adminClient
          .from("banners")
          .update({
            title: payload.data?.title,
            subtitle: payload.data?.subtitle,
            image_url: payload.data?.image_url,
            link_url: payload.data?.link_url,
            order_index: payload.data?.order_index,
            ativo: payload.data?.ativo,
          })
          .eq("id", payload.id)
          .select()
          .single();

        if (error) throw error;
        return json(200, { ok: true, data });
      }

      case "delete": {
        if (!payload.id) {
          return json(400, { error: "ID_REQUIRED" });
        }

        const { error } = await adminClient
          .from("banners")
          .delete()
          .eq("id", payload.id);

        if (error) throw error;
        return json(200, { ok: true });
      }

      default:
        return json(400, { error: "INVALID_ACTION" });
    }
  } catch (error: any) {
    console.error("Error in admin-banners:", error);
    return json(500, { error: error.message || "INTERNAL_ERROR" });
  }
});
