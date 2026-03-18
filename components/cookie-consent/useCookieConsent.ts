import { useEffect, useState } from "react";
import {
  CookiePreferences,
  defaultCookiePreferences,
  hasStoredCookiePreferences,
  readCookiePreferences,
  writeCookiePreferences,
} from "@/lib/cookie-consent";

type PreferenceKey = Exclude<keyof CookiePreferences, "necessary">;

export const useCookieConsent = () => {
  const [bannerVisible, setBannerVisible] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [hasStored, setHasStored] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(
    defaultCookiePreferences,
  );
  const [draft, setDraft] = useState<CookiePreferences>(
    defaultCookiePreferences,
  );

  useEffect(() => {
    const stored = readCookiePreferences();
    if (stored) {
      setPreferences(stored);
      setHasStored(true);
    } else {
      setBannerVisible(true);
    }
  }, []);

  useEffect(() => {
    if (modalOpen) {
      setDraft(preferences);
    }
  }, [modalOpen, preferences]);

  const persist = (prefs: CookiePreferences) => {
    const next: CookiePreferences = {
      ...defaultCookiePreferences,
      ...prefs,
      necessary: true as const,
    };
    writeCookiePreferences(next);
    setPreferences(next);
    setHasStored(true);
    setBannerVisible(false);
    setModalOpen(false);
  };

  const acceptAll = () => {
    const next: CookiePreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
    };
    persist(next);
  };

  const rejectNonEssential = () => {
    persist(defaultCookiePreferences);
  };

  const openSettings = () => {
    setModalOpen(true);
    if (!hasStored) setBannerVisible(false);
  };

  const closeSettings = () => {
    setModalOpen(false);
    if (!hasStored) setBannerVisible(true);
  };

  const togglePreference = (key: PreferenceKey) => {
    setDraft(prev => {
      const nextValue = !prev[key];
      return {
        ...prev,
        [key]: nextValue,
      };
    });
  };

  const savePreferences = () => {
    const next: CookiePreferences = {
      ...draft,
      necessary: true as const,
    };
    persist(next);
  };

  const shouldRenderFloatingButton =
    hasStored ||
    hasStoredCookiePreferences() ||
    preferences.analytics ||
    preferences.marketing;

  return {
    state: {
      bannerVisible,
      modalOpen,
      preferences,
      draft,
      hasStored,
    },
    actions: {
      acceptAll,
      rejectNonEssential,
      openSettings,
      closeSettings,
      togglePreference,
      savePreferences,
    },
    derived: {
      shouldRenderFloatingButton,
    },
  };
};

export type UseCookieConsentReturn = ReturnType<typeof useCookieConsent>;
