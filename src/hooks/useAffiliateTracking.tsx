import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const AFFILIATE_STORAGE_KEY = "nellor_affiliate_ref";
const VISITOR_ID_KEY = "nellor_visitor_id";

interface AffiliateAttribution {
  code: string;
  clickedAt: string;
  expiresAt: string;
  linkId: string;
  supplierId: string;
  affiliateId: string;
}

function getOrCreateVisitorId(): string {
  const existing = localStorage.getItem(VISITOR_ID_KEY);
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem(VISITOR_ID_KEY, id);
  return id;
}

export function useAffiliateTracking() {
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const refCode = searchParams.get("ref");
    if (!refCode) return;

    void trackAffiliateClick(refCode);

    // Remove ref from URL without reload
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("ref");
    setSearchParams(newParams, { replace: true });
  }, [searchParams, setSearchParams]);

  return { getActiveAttribution };
}

async function trackAffiliateClick(code: string) {
  try {
    const visitorId = getOrCreateVisitorId();
    const { data: auth } = await supabase.auth.getUser();

    const { data, error } = await supabase.rpc("track_affiliate_click", {
      _code: code,
      _buyer_id: auth.user?.id ?? null,
      _visitor_id: visitorId,
      _user_agent: navigator.userAgent,
    });

    // Cast to expected shape
    const result = data as {
      ok?: boolean;
      error?: string;
      clicked_at?: string;
      expires_at?: string;
      link_id?: string;
      supplier_id?: string;
      affiliate_id?: string;
    } | null;

    if (error || !result?.ok) {
      console.log("Affiliate click not tracked:", code, error?.message ?? result?.error);
      return;
    }

    const attribution: AffiliateAttribution = {
      code,
      clickedAt: result.clicked_at ?? new Date().toISOString(),
      expiresAt: result.expires_at ?? new Date().toISOString(),
      linkId: result.link_id ?? "",
      supplierId: result.supplier_id ?? "",
      affiliateId: result.affiliate_id ?? "",
    };

    // Keep only one active attribution per supplier (latest wins)
    const existingRefs = getStoredAttributions();
    const filteredRefs = existingRefs.filter((ref) => ref.supplierId !== attribution.supplierId);
    filteredRefs.push(attribution);
    localStorage.setItem(AFFILIATE_STORAGE_KEY, JSON.stringify(filteredRefs));
  } catch (error) {
    console.error("Error tracking affiliate click:", error);
  }
}

function getStoredAttributions(): AffiliateAttribution[] {
  try {
    const stored = localStorage.getItem(AFFILIATE_STORAGE_KEY);
    if (!stored) return [];

    const attributions: AffiliateAttribution[] = JSON.parse(stored);
    const now = new Date();

    return attributions.filter((attr) => new Date(attr.expiresAt) > now);
  } catch {
    return [];
  }
}

export function getActiveAttribution(supplierId: string): AffiliateAttribution | null {
  const attributions = getStoredAttributions();
  return attributions.find((attr) => attr.supplierId === supplierId) || null;
}

// Kept for API compatibility; server-side attribution is already created via track_affiliate_click.
export async function syncAttributionsOnLogin(_userId: string) {
  return;
}

