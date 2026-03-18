import { ReactNode } from "react";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";

type CookieBannerProps = {
  title: string;
  description: ReactNode;
  acceptLabel: string;
  rejectLabel: string;
  manageLabel: string;
  onAcceptAll: () => void;
  onReject: () => void;
  onManage: () => void;
};

export const CookieBanner = ({
  title,
  description,
  acceptLabel,
  rejectLabel,
  manageLabel,
  onAcceptAll,
  onReject,
  onManage,
}: CookieBannerProps) => (
  <div className="fixed bottom-6 left-1/2 z-[9999] w-[min(95%,760px)] -translate-x-1/2 px-4 md:px-0">
    <div className="rounded-2xl border border-primary/20 bg-slate-950/95 p-6 text-primary-foreground shadow-2xl backdrop-blur-sm">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:gap-8">
        <div className="flex flex-1 items-start gap-4">
          <span className="mt-1 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Cookie className="h-6 w-6" aria-hidden="true" />
          </span>

          <div className="space-y-2">
            <h3 className="text-base font-semibold tracking-tight">{title}</h3>
            <p className="text-sm leading-relaxed text-primary-foreground/80">
              {description}
            </p>
          </div>
        </div>

        <div className="flex w-full flex-col gap-3 md:w-64">
          <Button size="sm" className="w-full" onClick={onAcceptAll}>
            {acceptLabel}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="w-full border-primary/30 bg-white/5 text-primary-foreground/90 hover:bg-white/10 hover:text-primary-foreground"
            onClick={onReject}
          >
            {rejectLabel}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="w-full text-primary"
            onClick={onManage}
          >
            {manageLabel}
          </Button>
        </div>
      </div>
    </div>
  </div>
);
