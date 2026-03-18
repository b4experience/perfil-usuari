import Link from "next/link";
import { memo, useMemo } from "react";
import type { Travel } from "@/types/travel";
import { Card, CardContent } from "@/components/ui/card";
import { LazyImage } from "@/components/LazyImage";
import { optimizeSupabaseImage } from "@/utils/image";
import { useLanguage } from "@/context/LanguageContext";
import { useT } from "@/i18n/useT";
import { useLocalizedPath } from "@/utils/localizedPaths";
import { useEnglishTravelSlugMap } from "@/hooks/useEnglishSlugs";
import { slugify } from "@/utils/slugify";
import { formatPrice } from "@/utils/price";
import { motion } from "framer-motion";
import { getRibbonStyle } from "@/utils/ribbon";
import { sanitizeHtmlContent } from "@/utils/sanitizeHtml";

interface CarouselTravelCardProps {
  travel: Travel;
  variant?: "default" | "compact";
}

export const CarouselTravelCard = memo(({ travel, variant = "default" }: CarouselTravelCardProps) => {
  const { language } = useLanguage();
  const { t } = useT();
  const buildPath = useLocalizedPath();
  const { data: enTravelSlugs = {} } = useEnglishTravelSlugMap(language === "EN");
  const safeTitle = useMemo(() => sanitizeHtmlContent(travel.title) || "Trip", [travel.title]);
  const safeDestination = useMemo(() => {
    const value = sanitizeHtmlContent(travel.destino);
    if (!value) return "";
    return value.length > 80 ? `${value.slice(0, 80)}...` : value;
  }, [travel.destino]);

  const to = useMemo(() => {
    const slug =
      language === "ES"
        ? slugify(safeTitle)
        : enTravelSlugs[travel.id] ?? slugify(safeTitle);
    return buildPath(`/${slug}`);
  }, [buildPath, enTravelSlugs, language, safeTitle, travel.id]);

  const hasDiscount = travel.originalPrice && travel.originalPrice > travel.price;
  const isCompact = variant === "compact";
  const imageClassName = isCompact ? "relative aspect-[3/4] overflow-hidden" : "relative aspect-[4/5] overflow-hidden";
  const titleClassName = isCompact
    ? "line-clamp-2 text-sm font-semibold text-slate-900"
    : "line-clamp-2 text-base font-semibold text-slate-900";
  const priceClassName = isCompact ? "text-base font-bold text-primary" : "text-lg font-bold text-primary";
  const durationClassName = isCompact ? "text-[10px] uppercase tracking-wide text-slate-400" : "text-xs uppercase tracking-wide text-slate-400";
  const contentClassName = isCompact ? "flex flex-1 flex-col p-2" : "flex flex-1 flex-col p-3";
  const ribbon = useMemo(() => getRibbonStyle(travel.ribbon), [travel.ribbon]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="h-full"
    >
      <Card className="flex h-full flex-col overflow-hidden rounded-3xl shadow-sm">
        <Link href={to} className="group flex h-full flex-col" title={safeTitle}>
          <div className={imageClassName}>
            <LazyImage
              src={optimizeSupabaseImage(travel.imgUrl, { width: 600, height: 750 })}
              alt={safeTitle}
              width={600}
              height={750}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            {ribbon ? (
              <span
                className={`absolute right-3 top-3 rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide shadow-md ${ribbon.className}`}
              >
                {ribbon.label}
              </span>
            ) : null}
            {safeDestination ? (
              <div className="absolute bottom-3 left-3 text-xs font-semibold tracking-wider text-white">
                {safeDestination}
              </div>
            ) : null}
          </div>

          <CardContent className={contentClassName}>
            <h3 className={titleClassName}>
              {safeTitle}
            </h3>
            <div className="mt-auto pt-1 text-sm text-muted-foreground">
              {hasDiscount && travel.originalPrice ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="line-through">{formatPrice(travel.originalPrice)}</span>
                  {travel.percentage ? (
                    <span className="rounded-full bg-black/70 px-2 py-0.5 text-xs font-semibold text-white">
                      -{travel.percentage}%
                    </span>
                  ) : null}
                </div>
              ) : null}
              <div className="flex items-center gap-2">
                <span className={priceClassName}>
                  {travel.price === -1
                    ? t("card.consultPrice") || "Contáctanos"
                    : formatPrice(travel.price)}
                </span>
                <span className={durationClassName}>
                  {travel.duration}
                </span>
              </div>
            </div>
          </CardContent>
        </Link>
      </Card>
    </motion.div>
  );
});

CarouselTravelCard.displayName = "CarouselTravelCard";
