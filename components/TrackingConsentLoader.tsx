'use client';

import { useTrackingConsent } from "@/hooks/useTrackingConsent";

export const TrackingConsentLoader = () => {
  useTrackingConsent();
  return null;
};
