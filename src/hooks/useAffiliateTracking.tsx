import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const AFFILIATE_STORAGE_KEY = 'nellor_affiliate_ref';
const ATTRIBUTION_WINDOW_MONTHS = 4;

interface AffiliateAttribution {
  code: string;
  clickedAt: string;
  expiresAt: string;
  linkId: string;
  supplierId: string;
  affiliateId: string;
}

export function useAffiliateTracking() {
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (!refCode) return;

    trackAffiliateClick(refCode);
    
    // Remove ref from URL without reload
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('ref');
    setSearchParams(newParams, { replace: true });
  }, [searchParams, setSearchParams]);

  return { getActiveAttribution };
}

async function trackAffiliateClick(code: string) {
  try {
    // Fetch affiliate link data
    const { data: linkData, error: linkError } = await supabase
      .from('affiliate_links')
      .select('id, affiliate_id, supplier_id')
      .eq('code', code)
      .single();

    if (linkError || !linkData) {
      console.log('Affiliate link not found:', code);
      return;
    }

    // Increment clicks
    await supabase
      .from('affiliate_links')
      .update({ clicks: (linkData as any).clicks + 1 })
      .eq('id', linkData.id);

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setMonth(expiresAt.getMonth() + ATTRIBUTION_WINDOW_MONTHS);

    const attribution: AffiliateAttribution = {
      code,
      clickedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      linkId: linkData.id,
      supplierId: linkData.supplier_id,
      affiliateId: linkData.affiliate_id,
    };

    // Store in localStorage for guest users
    const existingRefs = getStoredAttributions();
    
    // Check if we already have an attribution for this supplier (only keep latest)
    const filteredRefs = existingRefs.filter(
      (ref) => ref.supplierId !== linkData.supplier_id
    );
    filteredRefs.push(attribution);
    
    localStorage.setItem(AFFILIATE_STORAGE_KEY, JSON.stringify(filteredRefs));

    // If user is logged in, also store in database
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await saveAttributionToDatabase(attribution, user.id);
    }

    console.log('Affiliate click tracked:', code);
  } catch (error) {
    console.error('Error tracking affiliate click:', error);
  }
}

async function saveAttributionToDatabase(attribution: AffiliateAttribution, userId: string) {
  try {
    // Check for existing attribution for this supplier
    const { data: existing } = await supabase
      .from('affiliate_attributions')
      .select('id')
      .eq('buyer_id', userId)
      .eq('supplier_id', attribution.supplierId)
      .eq('converted', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (existing) {
      // Update existing attribution
      await supabase
        .from('affiliate_attributions')
        .update({
          affiliate_link_id: attribution.linkId,
          clicked_at: attribution.clickedAt,
          expires_at: attribution.expiresAt,
        })
        .eq('id', existing.id);
    } else {
      // Create new attribution
      await supabase
        .from('affiliate_attributions')
        .insert({
          affiliate_link_id: attribution.linkId,
          supplier_id: attribution.supplierId,
          buyer_id: userId,
          clicked_at: attribution.clickedAt,
          expires_at: attribution.expiresAt,
        });
    }
  } catch (error) {
    console.error('Error saving attribution to database:', error);
  }
}

function getStoredAttributions(): AffiliateAttribution[] {
  try {
    const stored = localStorage.getItem(AFFILIATE_STORAGE_KEY);
    if (!stored) return [];
    
    const attributions: AffiliateAttribution[] = JSON.parse(stored);
    const now = new Date();
    
    // Filter out expired attributions
    return attributions.filter(
      (attr) => new Date(attr.expiresAt) > now
    );
  } catch {
    return [];
  }
}

export function getActiveAttribution(supplierId: string): AffiliateAttribution | null {
  const attributions = getStoredAttributions();
  return attributions.find((attr) => attr.supplierId === supplierId) || null;
}

// Sync localStorage attributions to database when user logs in
export async function syncAttributionsOnLogin(userId: string) {
  const attributions = getStoredAttributions();
  
  for (const attribution of attributions) {
    await saveAttributionToDatabase(attribution, userId);
  }
}
