import { useMemo, useRef, useState, useEffect, useCallback, memo } from "react";
import Link from "next/link";
import type { Travel } from "@/types/travel";
import { CarouselTravelCard } from "@/components/CarouselTravelCard";
import { useT } from "@/i18n/useT";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocalizedPath } from "@/utils/localizedPaths";

interface HottestTripsCarouselProps {
  travels: Travel[];
}

const fallbackText = (value: string | undefined, fallback: string) => {
  if (!value) return fallback;
  if (value.startsWith("home.carousel")) return fallback;
  return value;
};

export const HottestTripsCarousel = memo(({ travels }: HottestTripsCarouselProps) => {
  const { t } = useT();
  const buildPath = useLocalizedPath();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const visibleTravels = useMemo(() => travels.slice(0, 12), [travels]);
  const hasTravels = visibleTravels.length > 0;

  const title = fallbackText(t("home.carousel.hottestTitle"), "Hottest trips right now");
  const subtitle = fallbackText(t("home.carousel.hottestSubtitle"), "Trending adventures travelers love");
  const dragLabel = fallbackText(t("home.carousel.dragHint"), "Drag sideways to explore");
  const moreTripsLabel = t("loadMore.trips") || "See more trips";

  const updateScrollState = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;
    const { scrollLeft, scrollWidth, clientWidth } = container;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    updateScrollState();

    const onScroll = () => updateScrollState();
    const onResize = () => updateScrollState();

    container.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    return () => {
      container.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [updateScrollState, visibleTravels.length]);

  const scrollBy = (direction: "left" | "right") => {
    const container = scrollRef.current;
    if (!container) return;
    const track = container.firstElementChild as HTMLElement | null;
    const card = container.querySelector<HTMLElement>("[data-carousel-card]");
    const gapValue = track ? window.getComputedStyle(track).columnGap : "0";
    const gap = Number.parseFloat(gapValue) || 0;
    const cardWidth = card?.getBoundingClientRect().width ?? container.clientWidth * 0.45;
    const offset = (cardWidth + gap) * (direction === "left" ? -1 : 1);
    container.scrollTo({
      left: container.scrollLeft + offset,
      behavior: "smooth",
    });
  };

  if (!hasTravels) return null;

  return (
    <section className="mt-10" aria-labelledby="home-hottest-carousel">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{title}</p>
          <h2 id="home-hottest-carousel" className="text-2xl font-semibold tracking-tight text-slate-900 capitalize md:text-3xl">
            {subtitle}
          </h2>
        </div>
      </div>

      <div className="relative">
        <div
          ref={scrollRef}
          className="overflow-x-auto py-2 snap-x snap-mandatory scrollbar-hide scroll-px-[27.5%] sm:scroll-px-0"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <div className="flex gap-4 pr-6">
            {visibleTravels.map(travel => (
              <div
                key={travel.id}
                data-carousel-card
                className="snap-center sm:snap-start min-w-[52%] max-w-[52%] sm:min-w-[50%] sm:max-w-[50%] md:min-w-[36%] md:max-w-[36%] lg:min-w-[calc((100%-5rem)/4.8)] lg:max-w-[calc((100%-5rem)/4.8)]"
              >
                <CarouselTravelCard travel={travel} />
              </div>
            ))}
          </div>
        </div>

        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-6 sm:w-12 bg-gradient-to-r from-white to-transparent transition-opacity"
          style={{ opacity: canScrollLeft ? 1 : 0 }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-6 sm:w-12 bg-gradient-to-l from-white to-transparent transition-opacity"
          style={{ opacity: canScrollRight ? 1 : 0 }}
          aria-hidden="true"
        />

        <div className="pointer-events-none absolute inset-y-0 left-0 right-0 flex items-center justify-between px-2">
          <div className="flex w-full justify-between">
            <button
              type="button"
              onClick={() => scrollBy("left")}
              disabled={!canScrollLeft}
              className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:opacity-40"
              aria-label="Scroll hottest trips left"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => scrollBy("right")}
              disabled={!canScrollRight}
              className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:opacity-40"
              aria-label="Scroll hottest trips right"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-center">
        <Link
          href={buildPath("/search")}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-full bg-blue-600 px-4 text-xs font-semibold tracking-wide text-white transition-colors duration-200 hover:bg-blue-700"
          title={"View more trips"}>
          {moreTripsLabel}
        </Link>
      </div>
    </section>
  );
});
