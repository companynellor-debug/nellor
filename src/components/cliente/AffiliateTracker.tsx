import { useAffiliateTracking } from '@/hooks/useAffiliateTracking';

export function AffiliateTracker() {
  // This component just runs the tracking hook
  useAffiliateTracking();
  return null;
}
