"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { SlidersHorizontal } from "lucide-react";

import type { FilterState } from "@/components/filters/FilterMenu";
import { FilterMenu } from "@/components/filters/FilterMenu";
import { SearchFiltersSidebar } from "@/components/filters/SearchFiltersSidebar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { AdvancedFilters, FilterMetadata } from "@/lib/searchFilters";
import type { Activity } from "@/types/activity";

import { SearchFiltersLeftBar } from "./SearchFiltersLeftBar";

type SearchSectionProps = {
  searchBar?: ReactNode;
  children: ReactNode;
  filters: FilterState;
  onFiltersChange: (next: FilterState) => void;
  advancedFilters: AdvancedFilters;
  metadata: FilterMetadata;
  activities: Activity[];
  onAdvancedFiltersChange: (next: AdvancedFilters) => void;
  onResetAdvancedFilters: () => void;
  filtersTitle: string;
  clearLabel: string;
  applyFiltersLabel?: string;
  hasSidebarFilters: boolean;
  hasSearchQuery?: boolean;
  hasActiveSort?: boolean;
  showFilterMenu?: boolean;
  enableFloatingMobileBar?: boolean;
  layoutClassName?: string;
  contentClassName?: string;
  sidebarClassName?: string;
  mobileBarClassName?: string;
};

const defaultLayoutClasses = "flex flex-col gap-8 lg:flex-row";

export const SearchSection = ({
  searchBar,
  children,
  filters,
  onFiltersChange,
  advancedFilters,
  metadata,
  activities,
  onAdvancedFiltersChange,
  onResetAdvancedFilters,
  filtersTitle,
  clearLabel,
  applyFiltersLabel = "Apply filters",
  hasSidebarFilters,
  hasSearchQuery = false,
  hasActiveSort,
  showFilterMenu = true,
  enableFloatingMobileBar = false,
  layoutClassName,
  contentClassName,
  sidebarClassName,
  mobileBarClassName,
}: SearchSectionProps) => {
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [isMobileBarFloating, setIsMobileBarFloating] = useState(false);
  const mobileBarSentinelRef = useRef<HTMLDivElement | null>(null);
  const mobileBarBottomRef = useRef<HTMLDivElement | null>(null);
  const activeSort = hasActiveSort ?? filters.sort !== "relevance";

  useEffect(() => {
    if (!enableFloatingMobileBar) return;
    const sentinel = mobileBarSentinelRef.current;
    const bottomSentinel = mobileBarBottomRef.current;
    if (!sentinel || !bottomSentinel) return;

    const getHeaderOffset = () => {
      const value = getComputedStyle(document.documentElement)
        .getPropertyValue("--header-height")
        .trim();
      const parsed = Number.parseFloat(value);
      return Number.isFinite(parsed) ? parsed : 72;
    };

    let rafId: number | null = null;

    const updateFloatingState = () => {
      const headerOffset = getHeaderOffset();
      const top = sentinel.getBoundingClientRect().top;
      const bottom = bottomSentinel.getBoundingClientRect().top;
      setIsMobileBarFloating(top < headerOffset && bottom > headerOffset);
      rafId = null;
    };

    const requestUpdate = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(updateFloatingState);
    };

    requestUpdate();
    window.addEventListener("resize", requestUpdate);
    window.addEventListener("scroll", requestUpdate, { passive: true });

    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", requestUpdate);
      window.removeEventListener("scroll", requestUpdate);
    };
  }, [enableFloatingMobileBar]);

  return (
    <>
      {searchBar ? <div className="mb-6 sm:mb-8">{searchBar}</div> : null}
      {enableFloatingMobileBar ? (
        <div ref={mobileBarSentinelRef} className="h-px lg:hidden" />
      ) : null}

      <div
        className={cn(
          enableFloatingMobileBar && isMobileBarFloating
            ? "fixed inset-x-0 top-[var(--header-visible-height,72px)] z-[1300] flex flex-col gap-2 bg-background/95 px-4 py-3 shadow-sm backdrop-blur lg:hidden"
            : "mb-6 flex flex-col gap-2 lg:hidden",
          mobileBarClassName,
        )}
      >
        <div className="flex flex-nowrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <Sheet open={isMobileFiltersOpen} onOpenChange={setIsMobileFiltersOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 rounded-full px-4 py-2 whitespace-nowrap"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  <span className="text-sm font-medium">{filtersTitle}</span>
                  {hasSidebarFilters && <span className="ml-1 h-2 w-2 rounded-full bg-primary" />}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex w-full max-w-sm flex-col">
                <SheetHeader>
                  <SheetTitle>{filtersTitle}</SheetTitle>
                </SheetHeader>
                <div className="mt-4 min-h-0 flex-1 overflow-y-auto pb-2">
                  <SearchFiltersSidebar
                    filters={advancedFilters}
                    metadata={metadata}
                    activities={activities}
                    onChange={onAdvancedFiltersChange}
                    onReset={onResetAdvancedFilters}
                    hasSearchQuery={hasSearchQuery}
                    className="border-none bg-transparent px-0 shadow-none"
                  />
                </div>
                <div className="pt-3">
                  <Button className="w-full" onClick={() => setIsMobileFiltersOpen(false)}>
                    {applyFiltersLabel}
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
            {hasSidebarFilters && (
              <Button variant="ghost" size="sm" className="text-xs px-2" onClick={onResetAdvancedFilters}>
                {clearLabel}
              </Button>
            )}
          </div>
          {showFilterMenu ? (
            <FilterMenu
              value={filters}
              onChange={onFiltersChange}
              hasActive={activeSort}
              className="justify-center shrink-0"
            />
          ) : null}
        </div>
      </div>
      {enableFloatingMobileBar && isMobileBarFloating ? <div className="h-[60px] lg:hidden" /> : null}

      <div className={cn(defaultLayoutClasses, layoutClassName)}>
        <SearchFiltersLeftBar className={sidebarClassName}>
          <SearchFiltersSidebar
            filters={advancedFilters}
            metadata={metadata}
            activities={activities}
            onChange={onAdvancedFiltersChange}
            onReset={onResetAdvancedFilters}
            hasSearchQuery={hasSearchQuery}
          />
        </SearchFiltersLeftBar>
        <div className={cn("flex-1", contentClassName)}>{children}</div>
      </div>
      {enableFloatingMobileBar ? (
        <div ref={mobileBarBottomRef} className="h-px lg:hidden" />
      ) : null}
    </>
  );
};
