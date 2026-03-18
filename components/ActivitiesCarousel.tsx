import type { Activity } from "@/types/activity";
import { ActivityCard } from "@/components/ActivityCard";
import { useT } from "@/i18n/useT";
import { memo, useMemo, useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocalizedPath } from "@/utils/localizedPaths";

interface ActivitiesCarouselProps {
  activities: Activity[];
}

const fallbackText = (value: string | undefined, fallback: string) => {
  if (!value) return fallback;
  if (value.startsWith("home.carousel")) return fallback;
  return value;
};

export const ActivitiesCarousel = memo(({ activities }: ActivitiesCarouselProps) => {
  const { t } = useT();
  const buildPath = useLocalizedPath();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const orderedActivities = useMemo(() => {
    return [...activities].sort((a, b) => (b.num_viatges || 0) - (a.num_viatges || 0));
  }, [activities]);
  const hasActivities = orderedActivities.length > 0;

  const curatedLabel = fallbackText(t("home.carousel.curated"), "Curated activities");
  const titleLabel = fallbackText(t("home.carousel.activities"), "Discover all activities");
  const dragLabel = fallbackText(t("home.carousel.dragHint"), "Drag sideways to explore");
  const moreActivitiesLabel = t("loadMore.activities") || "See more activities";

  const handleScrollUpdate = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;
    const { scrollLeft, scrollWidth, clientWidth } = container;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  useEffect(() => {
    if (!hasActivities) return;
    const container = scrollRef.current;
    if (!container) return;
    handleScrollUpdate();

    const onScroll = () => handleScrollUpdate();
    const onResize = () => handleScrollUpdate();

    container.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    return () => {
      container.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [handleScrollUpdate, hasActivities]);

  const scrollBy = (direction: "left" | "right") => {
    const container = scrollRef.current;
    if (!container) return;
    const amount = container.clientWidth * 0.75;
    const offset = direction === "left" ? -amount : amount;
    container.scrollTo({
      left: container.scrollLeft + offset,
      behavior: "smooth",
    });
  };

  if (!hasActivities) return null;

  return (
    <section className="mt-3 pb-6" aria-labelledby="home-activities-carousel">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{curatedLabel}</p>
          <h2 id="home-activities-carousel" className="text-2xl font-semibold tracking-tight text-slate-900 capitalize md:text-3xl">
            <Link
              href={buildPath("/activities")}
              className="transition hover:text-slate-800 hover:underline hover:decoration-slate-300 hover:underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
             title={"View activities"}>
              {titleLabel}
            </Link>
          </h2>
        </div>
      </div>

      <div className="relative">
        <div
          ref={scrollRef}
          className="overflow-x-auto px-2 py-2 snap-x snap-mandatory scrollbar-hide sm:px-0"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <div className="flex gap-4 pr-6">
            {orderedActivities.map(activity => (
              <div
                key={activity.id}
                className="snap-start min-w-[48%] max-w-[48%] sm:min-w-[23%] sm:max-w-[23%] md:min-w-[25%] md:max-w-[25%] lg:min-w-[calc((100%-5rem)/7)] lg:max-w-[calc((100%-5rem)/7)]"
              >
                <ActivityCard activity={activity} />
              </div>
            ))}
          </div>
        </div>

        {canScrollLeft && (
          <div className="pointer-events-none absolute inset-y-0 left-0 w-4 sm:w-10 bg-gradient-to-r from-white/80 to-transparent" aria-hidden="true" />
        )}
        {canScrollRight && (
          <div className="pointer-events-none absolute inset-y-0 right-0 w-4 sm:w-10 bg-gradient-to-l from-white/80 to-transparent" aria-hidden="true" />
        )}

        <div className="pointer-events-none absolute inset-y-0 left-0 right-0 flex items-center justify-between px-2">
          <div className="flex w-full justify-between">
            <button
              type="button"
              onClick={() => scrollBy("left")}
              disabled={!canScrollLeft}
              className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-700 shadow-sm opacity-70 transition hover:bg-white hover:opacity-100 disabled:opacity-30 sm:h-9 sm:w-9 sm:bg-white"
              aria-label="Scroll activities left"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollBy("right")}
              disabled={!canScrollRight}
              className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-700 shadow-sm opacity-70 transition hover:bg-white hover:opacity-100 disabled:opacity-30 sm:h-9 sm:w-9 sm:bg-white"
              aria-label="Scroll activities right"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-center">
        <Link
          href={buildPath("/activities")}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-full bg-blue-600 px-4 text-xs font-semibold tracking-wide text-white transition-colors duration-200 hover:bg-blue-700"
         title={"View activities"}>
          {moreActivitiesLabel}
        </Link>
      </div>
    </section>
  );
});
