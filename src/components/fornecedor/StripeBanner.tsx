import React from "react";

type StripeBannerProps = {
  isStripeConnected?: boolean;
};

/**
 * Temporary no-op component kept only to avoid broken imports after Stripe UI removal.
 * It renders nothing.
 */
export const StripeBanner: React.FC<StripeBannerProps> = () => {
  return null;
};
