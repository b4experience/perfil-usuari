import { useMemo, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { useTrustIndexEmbed } from "@/hooks/useTrustIndexEmbed";

type TrustIndexWidgetProps = {
  title?: ReactNode;
  sectionClassName?: string;
  containerClassName?: string;
  cardClassName?: string;
  titleClassName?: string;
};

const TRUSTINDEX_IDS: Record<"EN" | "ES", string> = {
  EN: "d7dfc29576c9668c161654b67b1",
  ES: "77aa2d35789d661e0e663f1de9f",
};

export const TrustIndexWidget = ({
  title,
  sectionClassName,
  containerClassName,
  cardClassName,
  titleClassName,
}: TrustIndexWidgetProps) => {
  const { language } = useLanguage();
  const scriptId = useMemo(() => {
    const lang = language === "ES" ? "ES" : "EN";
    return TRUSTINDEX_IDS[lang];
  }, [language]);

  const { containerRef } = useTrustIndexEmbed(scriptId);

  return (
    <section className={cn("bg-white", sectionClassName)}>
      <div
        className={cn(
          "container mx-auto px-4 md:px-6 lg:px-8 py-10",
          containerClassName,
        )}
      >
        {title && (
          <h2
            className={cn(
              "mb-6 text-center text-2xl font-semibold tracking-tight text-slate-900 capitalize md:text-3xl",
              titleClassName,
            )}
          >
            {title}
          </h2>
        )}
        <div
          ref={containerRef}
          className={cn("ReviewCarousel rounded-3xl bg-white p-8", cardClassName)}
        />
      </div>
    </section>
  );
};
