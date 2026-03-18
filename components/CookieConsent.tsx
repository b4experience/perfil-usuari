'use client';

import { useEffect, useState } from "react";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import { useT } from "@/i18n/useT";
import { CookieBanner } from "@/components/cookie-consent/CookieBanner";
import { CookieSettingsModal } from "@/components/cookie-consent/CookieSettingsModal";
import { useCookieConsent } from "@/components/cookie-consent/useCookieConsent";
import { useLocalizedPath } from "@/utils/localizedPaths";
import Link from "next/link";

export const CookieConsent = () => {
  const { t } = useT();
  const { language } = useLanguage();
  const buildPath = useLocalizedPath();
  const [hasReachedBottom, setHasReachedBottom] = useState(false);

  const {
    state: { bannerVisible, modalOpen, draft },
    actions: {
      acceptAll,
      rejectNonEssential,
      openSettings,
      closeSettings,
      togglePreference,
      savePreferences,
    },
    derived: { shouldRenderFloatingButton },
  } = useCookieConsent();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateScrollState = () => {
      const scrollHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
      );
      const scrolled = window.scrollY + window.innerHeight;
      setHasReachedBottom(scrolled >= scrollHeight - 32);
    };

    updateScrollState();
    window.addEventListener("scroll", updateScrollState, { passive: true });
    return () => window.removeEventListener("scroll", updateScrollState);
  }, []);

  return (
    <>
      {bannerVisible && (
        <CookieBanner
          title={t("cookies.consentTitle")}
          description={
            <>
              {t("cookies.consentBody")}{" "}
              <Link
                href={buildPath("/cookies-policy")}
                className="font-medium text-primary underline-offset-4 hover:text-primary/80 hover:underline"
               title={"View cookies policy"}>
                {t("cookies.learnMore")}
              </Link>
              .
            </>
          }
          acceptLabel={t("cookies.acceptAll")}
          rejectLabel={t("cookies.reject") ?? t("cookies.accept")}
          manageLabel={t("cookies.manage")}
          onAcceptAll={acceptAll}
          onReject={rejectNonEssential}
          onManage={openSettings}
        />
      )}

      {shouldRenderFloatingButton && !bannerVisible && hasReachedBottom && (
        <Button
          size="sm"
          variant="outline"
          className="group fixed bottom-6 left-4 z-[9998] border-primary/30 bg-slate-950/90 text-primary-foreground/80 shadow-lg backdrop-blur hover:bg-slate-900 hover:text-primary-foreground sm:left-6"
          onClick={openSettings}
          aria-label={t("cookies.openSettings")}
        >
          <Cookie
            className="mr-2 h-4 w-4 transition-all md:mr-0 md:group-hover:mr-2"
            aria-hidden="true"
          />
          <span className="inline-flex transition-all md:hidden md:group-hover:ml-2 md:group-hover:inline-flex">
            {t("cookies.openSettings")}
          </span>
        </Button>
      )}

      <CookieSettingsModal
        open={modalOpen}
        onClose={closeSettings}
        onSave={savePreferences}
        analyticsEnabled={draft.analytics}
        marketingEnabled={draft.marketing}
        onToggleAnalytics={() => togglePreference("analytics")}
        onToggleMarketing={() => togglePreference("marketing")}
        policyHref={buildPath("/cookies-policy")}
        copy={{
          closeAria: t("cookies.closeSettings"),
          title: t("cookies.settingsTitle"),
          description: t("cookies.settingsDescription"),
          learnMore: t("cookies.learnMore"),
          necessaryTitle: t("cookies.categoryNecessary"),
          necessaryBody: t("cookies.categoryNecessaryBody"),
          alwaysOn: t("cookies.categoryAlwaysOn"),
          analyticsTitle: t("cookies.categoryAnalytics"),
          analyticsBody: t("cookies.categoryAnalyticsBody"),
          marketingTitle: t("cookies.categoryMarketing"),
          marketingBody: t("cookies.categoryMarketingBody"),
          cancel: t("cookies.settingsCancel"),
          save: t("cookies.settingsSave"),
        }}
      />
    </>
  );
};
