import Link from "next/link";
import { Cookie, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PreferenceToggle } from "./PreferenceToggle";

type ModalCopy = {
  closeAria: string;
  title: string;
  description: string;
  learnMore: string;
  necessaryTitle: string;
  necessaryBody: string;
  alwaysOn: string;
  analyticsTitle: string;
  analyticsBody: string;
  marketingTitle: string;
  marketingBody: string;
  cancel: string;
  save: string;
};

type CookieSettingsModalProps = {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  analyticsEnabled: boolean;
  marketingEnabled: boolean;
  onToggleAnalytics: () => void;
  onToggleMarketing: () => void;
  policyHref: string;
  copy: ModalCopy;
};

export const CookieSettingsModal = ({
  open,
  onClose,
  onSave,
  analyticsEnabled,
  marketingEnabled,
  onToggleAnalytics,
  onToggleMarketing,
  policyHref,
  copy,
}: CookieSettingsModalProps) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" />
      <div className="relative w-full max-w-2xl rounded-2xl border border-primary/20 bg-slate-950 p-6 text-primary-foreground shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full bg-white/10 p-1 text-primary-foreground/80 transition hover:bg-white/20 hover:text-primary-foreground"
          aria-label={copy.closeAria}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>

        <div className="flex flex-col gap-4 pb-5 pr-8 md:flex-row md:items-start md:gap-6">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Cookie className="h-6 w-6" aria-hidden="true" />
          </span>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold tracking-tight">
              {copy.title}
            </h3>
            <p className="text-sm leading-relaxed text-primary-foreground/80">
              {copy.description}{" "}
              <Link
                href={policyHref}
                className="font-medium text-primary underline-offset-4 hover:text-primary/80 hover:underline"
               title={"View policy details"}>
                {copy.learnMore}
              </Link>
              .
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <PreferenceToggle
            id="cookie-necessary"
            title={copy.necessaryTitle}
            description={copy.necessaryBody}
            checked
            disabled
            alwaysOnLabel={copy.alwaysOn}
          />

          <PreferenceToggle
            id="cookie-analytics"
            title={copy.analyticsTitle}
            description={copy.analyticsBody}
            checked={analyticsEnabled}
            onToggle={onToggleAnalytics}
          />

          <PreferenceToggle
            id="cookie-marketing"
            title={copy.marketingTitle}
            description={copy.marketingBody}
            checked={marketingEnabled}
            onToggle={onToggleMarketing}
          />
        </div>

        <div className="mt-6 flex flex-col gap-3 md:flex-row md:justify-end">
          <Button
            type="button"
            variant="ghost"
            className="text-primary-foreground/80 hover:text-primary-foreground"
            onClick={onClose}
          >
            {copy.cancel}
          </Button>
          <Button type="button" onClick={onSave}>
            {copy.save}
          </Button>
        </div>
      </div>
    </div>
  );
};
