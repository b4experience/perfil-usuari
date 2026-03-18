"use client";

import { useMemo, useState, useRef, useEffect, useId } from "react";
import { useT } from "@/i18n/useT";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Info } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  type AdvancedFilters,
  type FilterMetadata,
  type ContinentId,
  type BudgetId,
  type DurationId,
  type DifficultyId,
  DURATION_OPTIONS,
  BUDGET_OPTIONS,
  DIFFICULTY_OPTIONS,
  CONTINENT_IDS,
  GROUP_TYPE_OPTIONS,
  hasActiveAdvancedFilters,
  type MonthId,
  MONTH_IDS,
} from "@/lib/searchFilters";
import type { Activity } from "@/types/activity";
import { cn } from "@/lib/utils";
import { MonthFilterDropdown } from "@/components/filters/MonthFilterDropdown";
import { monthNames } from "@/utils/monthMapper";

interface SearchFiltersSidebarProps {
  filters: AdvancedFilters;
  metadata: FilterMetadata;
  onChange: (next: AdvancedFilters) => void;
  onReset: () => void;
  activities: Activity[];
  hasSearchQuery?: boolean;
  className?: string;
}

type ArrayFilterKey =
  | "continents"
  | "countries"
  | "difficulties"
  | "durations"
  | "budgets"
  | "activities"
  | "groupTypes"
  | "months";

const countActiveFilters = (filters: AdvancedFilters) =>
  (filters.onlyBooked ? 1 : 0) +
  filters.continents.length +
  filters.countries.length +
  filters.difficulties.length +
  filters.durations.length +
  filters.budgets.length +
  filters.activities.length +
  filters.groupTypes.length +
  filters.months.length;

const GroupTypeHelp = () => {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const contentId = useId();

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div
      ref={wrapperRef}
      className="inline-flex items-center"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="ml-1 inline-flex h-4 w-4 cursor-pointer items-center justify-center rounded-full text-slate-500 transition hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        aria-label={t("filters.sidebar.groupType.helpAria")}
        aria-describedby={contentId}
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setOpen(prev => !prev)}
      >
        <Info className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div
          id={contentId}
          role="tooltip"
          className="absolute left-0 top-full z-20 mt-2 w-72 max-w-[calc(100vw-3rem)] rounded-xl border border-slate-200 bg-white p-3 text-xs leading-relaxed text-slate-600 shadow-lg"
        >
          <div className="space-y-2">
            <p>
              <span className="font-semibold text-slate-900">
                {t("filters.sidebar.groupType.open")}
              </span>
              {": "}
              {t("filters.sidebar.groupType.helpOpen")}
            </p>
            <p>
              <span className="font-semibold text-slate-900">
                {t("filters.sidebar.groupType.private")}
              </span>
              {": "}
              {t("filters.sidebar.groupType.helpPrivate")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export const SearchFiltersSidebar = ({
  filters,
  metadata,
  onChange,
  onReset,
  activities,
  hasSearchQuery = false,
  className,
}: SearchFiltersSidebarProps) => {
  const { t } = useT();
  const { language } = useLanguage();
  const activeCount = useMemo(
    () => countActiveFilters(filters) + (hasSearchQuery ? 1 : 0),
    [filters, hasSearchQuery],
  );
  const showClearHint = hasActiveAdvancedFilters(filters) || hasSearchQuery;
  const isTrailRunning = (name: string) => {
    const normalized = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return normalized === "trail running" || normalized === "trailrunning";
  };
  const isPhotography = (name: string) => {
    const normalized = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return normalized === "fotografia" || normalized === "photography";
  };
  const sortedActivities = useMemo(() => {
    return [...activities].sort((a, b) => {
      if (isTrailRunning(a.name) && isPhotography(b.name)) return -1;
      if (isPhotography(a.name) && isTrailRunning(b.name)) return 1;
      const diff = (b.num_viatges ?? 0) - (a.num_viatges ?? 0);
      if (diff !== 0) return diff;
      return a.name.localeCompare(b.name);
    });
  }, [activities]);
  const orderedActivities = useMemo(() => {
    const counts = metadata.activities || {};
    const list: Array<{ id: string; name: string; count: number }> = [];

    sortedActivities.forEach(activity => {
      const id = String(activity.id);
      const meta = counts[id];
      list.push({
        id,
        name: activity.name,
        count: meta?.count ?? 0,
      });
    });

    filters.activities.forEach(id => {
      if (list.some(activity => activity.id === id)) return;
      const meta = counts[id];
      list.push({
        id,
        name: meta?.label ?? `#${id}`,
        count: meta?.count ?? 0,
      });
    });

    return list;
  }, [sortedActivities, metadata.activities, filters.activities]);

  const mobileMonthOptions = useMemo(
    () =>
      MONTH_IDS.map((id, index) => ({
        id,
        label: monthNames[language][index],
        count: metadata.months[id],
      })),
    [language, metadata.months],
  );
  const toggleArrayValue = <K extends ArrayFilterKey>(
    key: K,
    value: AdvancedFilters[K][number],
  ) => {
    const current = filters[key] as (typeof value)[];
    const exists = current.includes(value);
    const next = exists ? current.filter(item => item !== value) : [...current, value];
    onChange({ ...filters, [key]: next as AdvancedFilters[K] });
  };

  const renderCheckbox = (
    id: string,
    label: string,
    count: number,
    checked: boolean,
    onToggle: () => void,
  ) => (
    <label
      key={id}
      className="flex items-center justify-between rounded-lg border border-transparent px-2 py-1.5 text-xs transition hover:border-border"
    >
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          className="h-3.5 w-3.5 rounded border-muted-foreground text-primary focus-visible:ring-primary"
        />
        <span className="text-foreground text-[0.85rem]">{label}</span>
      </div>
      <span className="text-[0.7rem] text-muted-foreground">{count}</span>
    </label>
  );

  return (
    <aside
      className={cn(
        "group/filter flex h-full flex-col rounded-3xl border border-border bg-card/70 px-4 py-5 shadow-sm",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            {t("filters.sidebar.title")}
          </p>
          {showClearHint && (
            <p className="text-[0.7rem] text-muted-foreground">{t("filters.sidebar.clear")}</p>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          disabled={!showClearHint}
          className="text-[0.7rem] h-6 px-2"
        >
          {t("filters.clear")} {activeCount > 0 && `(${activeCount})`}
        </Button>
      </div>

      <div className="mt-4 flex-1 space-y-5 pr-1 lg:pr-0 lg:overflow-y-auto">

        {orderedActivities.length > 0 && (
          <>
            <section>
              <p className="text-xs font-semibold text-foreground">
                {t("filters.sidebar.activity")}
              </p>
              <div className="mt-2 space-y-1 max-h-52 overflow-y-auto pr-1">
                {orderedActivities.map(activity =>
                  renderCheckbox(
                    `activity-${activity.id}`,
                    activity.name,
                    activity.count,
                    filters.activities.includes(activity.id),
                    () => toggleArrayValue("activities", activity.id),
                  ),
                )}
              </div>
            </section>

            <Separator />
          </>
        )}

        <section>
          <p className="text-xs font-semibold text-foreground">
            {t("filters.sidebar.country")}
          </p>
          <Accordion type="multiple" className="mt-2 space-y-1">
            {metadata.continents
              .filter(continent => CONTINENT_IDS.includes(continent.id as ContinentId))
              .map(continent => (
                <AccordionItem key={continent.id} value={continent.id}>
                  <AccordionTrigger className="rounded-lg bg-muted/30 px-2 py-1.5 text-xs font-medium">
                    <div className="flex-1 text-left">
                      {t(`filters.sidebar.continent.${continent.id}`)}
                    </div>
                    <span className="text-[0.65rem] text-muted-foreground">{continent.count}</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-2 pb-2">
                    {continent.countries.length === 0 ? (
                      <p className="text-[0.7rem] text-muted-foreground">
                        {t("filters.sidebar.empty")}
                      </p>
                    ) : (
                      <div className="space-y-1">
                        {continent.countries.map(country =>
                          renderCheckbox(
                            `${continent.id}-${country.id}`,
                            country.label,
                            country.count,
                            filters.countries.includes(country.id),
                            () => toggleArrayValue("countries", country.id),
                          ),
                        )}
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
          </Accordion>
        </section>

        <section>
          <p className="text-xs font-semibold text-foreground">
            {t("filters.sidebar.duration")}
          </p>
          <div className="mt-1.5 space-y-1">
            {DURATION_OPTIONS.map(option =>
              renderCheckbox(
                option.id,
                t(option.labelKey),
                metadata.durations[option.id as DurationId] ?? 0,
                filters.durations.includes(option.id as DurationId),
                () => toggleArrayValue("durations", option.id as DurationId),
              ),
            )}
          </div>
        </section>

        <Separator />

        <section>
          <div className="relative flex items-center gap-1">
            <p className="text-xs font-semibold text-foreground">
              {t("filters.sidebar.groupType")}
            </p>
            <GroupTypeHelp />
          </div>
          <div className="mt-2 space-y-1">
            {GROUP_TYPE_OPTIONS.map(option =>
              renderCheckbox(
                option.id,
                t(option.labelKey),
                metadata.groupTypes?.[option.id] ?? 0,
                filters.groupTypes.includes(option.id),
                () => toggleArrayValue("groupTypes", option.id),
              ),
            )}
          </div>
        </section>

        <Separator />

        <section>
          <p className="text-xs font-semibold text-foreground">
            {t("filters.sidebar.budget")}
          </p>
          <div className="mt-1.5 space-y-1">
            {BUDGET_OPTIONS.map(option =>
              renderCheckbox(
                option.id,
                t(option.labelKey),
                metadata.budgets[option.id as BudgetId] ?? 0,
                filters.budgets.includes(option.id as BudgetId),
                () => toggleArrayValue("budgets", option.id as BudgetId),
              ),
            )}
          </div>
        </section>
        <section>
          <p className="text-xs font-semibold text-foreground">
            {t("filters.sidebar.month")}
          </p>
          <div className="hidden lg:block">
            <MonthFilterDropdown
              value={filters.months}
              counts={metadata.months}
              onChange={months => onChange({ ...filters, months })}
              className="mt-2"
            />
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2 lg:hidden">
            {mobileMonthOptions.map(option => {
              const isSelected = filters.months.includes(option.id as MonthId);
              return (
                <button
                  key={option.id}
                  type="button"
                  className={cn(
                    "flex flex-col items-center rounded-xl border px-3 py-2 text-xs font-semibold uppercase tracking-wide transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-border bg-card text-muted-foreground hover:border-primary/60 hover:text-foreground",
                  )}
                  onClick={() => toggleArrayValue("months", option.id as MonthId)}
                >
                  <span>{option.label.slice(0, 3)}</span>
                  <span
                    className={cn(
                      "text-[0.6rem] font-medium",
                      isSelected ? "text-primary-foreground/80" : "text-muted-foreground",
                    )}
                  >
                    {option.count}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <Separator />

        <section>
          <p className="text-xs font-semibold text-foreground">
            {t("filters.sidebar.difficulty")}
          </p>
          <div className="mt-1.5 space-y-1">
            {DIFFICULTY_OPTIONS.map(option =>
              renderCheckbox(
                option.id,
                t(option.labelKey),
                metadata.difficulties[option.id as DifficultyId] ?? 0,
                filters.difficulties.includes(option.id as DifficultyId),
                () => toggleArrayValue("difficulties", option.id as DifficultyId),
              ),
            )}
          </div>
        </section>
      </div>
    </aside>
  );
};
