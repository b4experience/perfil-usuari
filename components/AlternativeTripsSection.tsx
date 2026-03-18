"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useT } from "@/i18n/useT";
import { CarouselTravelCard } from "@/components/CarouselTravelCard";
import { useTravelsByIds } from "@/hooks/useTravelsByIds";
import type { Travel } from "@/types/travel";

interface AlternativeTripsSectionProps {
  alternativeIds?: Array<number | string> | null;
  currentTravelId?: number;
  className?: string;
}

const CARD_MIN_WIDTH = 200;
const CARD_GAP = 16;

const normalizeIds = (ids: Array<number | string> | null | undefined, currentId?: number) => {
  if (!ids) return [] as number[];
  const parsed = ids
    .map((value) => (typeof value === "number" ? value : Number(value)))
    .filter((value): value is number => Number.isFinite(value));
  const filtered = currentId ? parsed.filter((value) => value !== currentId) : parsed;
  return Array.from(new Set(filtered));
};

export const AlternativeTripsSection = memo(
  ({ alternativeIds, currentTravelId, className }: AlternativeTripsSectionProps) => {
    const { t } = useT();
    const ids = useMemo(
      () => normalizeIds(alternativeIds ?? undefined, currentTravelId),
      [alternativeIds, currentTravelId],
    );
    const { data: travels = [] } = useTravelsByIds(ids);
    const hasTravels = travels.length > 0;
    const isSingle = travels.length === 1;

    const sectionTitle = t("travel.relatedTrips") || "Related Trips";

    const scrollRef = useRef<HTMLDivElement>(null);
    const [useCarousel, setUseCarousel] = useState(false);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const [isDesktop, setIsDesktop] = useState(false);

    const updateLayout = useCallback(() => {
      const container = scrollRef.current;
      if (!container) return;
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);
      if (desktop) {
        const shouldCarousel = travels.length > 2;
        setUseCarousel(shouldCarousel);
        if (!shouldCarousel) {
          setCanScrollLeft(false);
          setCanScrollRight(false);
          return;
        }
      }
      const containerWidth = container.getBoundingClientRect().width;
      const requiredWidth =
        travels.length * CARD_MIN_WIDTH + Math.max(travels.length - 1, 0) * CARD_GAP;
      const shouldCarousel = requiredWidth > containerWidth + 1;
      setUseCarousel(shouldCarousel);
      if (!shouldCarousel) {
        setCanScrollLeft(false);
        setCanScrollRight(false);
        return;
      }
      const { scrollLeft, scrollWidth, clientWidth } = container;
      setCanScrollLeft(scrollLeft > 4);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
    }, [travels.length]);

    useEffect(() => {
      updateLayout();
      const container = scrollRef.current;
      if (!container) return;
      const handleScroll = () => updateLayout();
      const handleResize = () => updateLayout();
      container.addEventListener("scroll", handleScroll, { passive: true });
      window.addEventListener("resize", handleResize);
      const observer = new ResizeObserver(() => updateLayout());
      observer.observe(container);
      return () => {
        container.removeEventListener("scroll", handleScroll);
        window.removeEventListener("resize", handleResize);
        observer.disconnect();
      };
    }, [updateLayout]);

    const scrollBy = (direction: "left" | "right") => {
      const container = scrollRef.current;
      if (!container) return;
      const card = container.querySelector<HTMLElement>("[data-alt-card]");
      const cardWidth = card?.getBoundingClientRect().width ?? CARD_MIN_WIDTH;
      const offset = (cardWidth + CARD_GAP) * (direction === "left" ? -1 : 1);
      container.scrollTo({
        left: container.scrollLeft + offset,
        behavior: "smooth",
      });
    };

    if (!hasTravels) return null;

    const sectionClassName = ["relative isolate z-0", className].filter(Boolean).join(" ");

    return (
      <section className={sectionClassName} aria-labelledby="alternative-trips-title">
        <div className="mb-3">
          <h3 id="alternative-trips-title" className="text-lg font-semibold text-slate-900">
            {sectionTitle}
          </h3>
        </div>

        <div className="relative">
          <div
            ref={scrollRef}
            className={
              useCarousel
                ? "overflow-x-auto scroll-smooth scrollbar-hide"
                : "overflow-visible"
            }
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            <div
              className={
                useCarousel
                  ? "flex gap-4 pr-2"
                  : isSingle
                    ? "flex justify-center"
                    : isDesktop
                      ? "grid gap-4 grid-cols-2"
                      : "grid gap-4 sm:grid-cols-2"
              }
            >
              {travels.map((travel: Travel) => (
                <div
                  key={travel.id}
                  data-alt-card
                  className={
                    useCarousel
                      ? "min-w-[200px] max-w-[200px]"
                      : isSingle
                        ? "w-full max-w-[200px]"
                        : "w-full"
                  }
                >
                  <CarouselTravelCard travel={travel} variant="compact" />
                </div>
              ))}
            </div>
          </div>

          {useCarousel && (
            <>
              <div
                className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-white to-transparent transition-opacity"
                style={{ opacity: canScrollLeft ? 1 : 0 }}
                aria-hidden="true"
              />
              <div
                className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-white to-transparent transition-opacity"
                style={{ opacity: canScrollRight ? 1 : 0 }}
                aria-hidden="true"
              />

              <div className="pointer-events-none absolute inset-y-0 left-0 right-0 flex items-center justify-between">
                <div className="flex w-full justify-between px-1">
                  <button
                    type="button"
                    onClick={() => scrollBy("left")}
                    disabled={!canScrollLeft}
                    className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:opacity-40"
                    aria-label="Scroll alternative trips left"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollBy("right")}
                    disabled={!canScrollRight}
                    className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:opacity-40"
                    aria-label="Scroll alternative trips right"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    );
  },
);

AlternativeTripsSection.displayName = "AlternativeTripsSection";
