import { useMemo, useState } from "react";
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n/useT";
import { useLanguage } from "@/context/LanguageContext";
import { monthNames } from "@/utils/monthMapper";
import { MONTH_IDS, type MonthId } from "@/lib/searchFilters";

interface MonthFilterDropdownProps {
  value: MonthId[];
  counts: Record<MonthId, number>;
  onChange: (months: MonthId[]) => void;
  className?: string;
}

const sortMonthIds = (months: MonthId[]) =>
  [...months].sort((a, b) => Number(a) - Number(b));

export const MonthFilterDropdown = ({
  value,
  counts,
  onChange,
  className,
}: MonthFilterDropdownProps) => {
  const { t } = useT();
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<MonthId[]>(value);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setDraft(value);
    }
    setOpen(nextOpen);
  };

  const monthOptions = useMemo(
    () =>
      MONTH_IDS.map((id, index) => ({
        id,
        label: monthNames[language][index],
        shortLabel: monthNames[language][index]?.slice(0, 3) ?? id,
        count: counts[id] ?? 0,
      })),
    [counts, language],
  );

  const toggleDraft = (monthId: MonthId) => {
    setDraft(current => {
      const exists = current.includes(monthId);
      if (exists) {
        return current.filter(id => id !== monthId);
      }
      return [...current, monthId];
    });
  };

  const sortedValue = useMemo(() => sortMonthIds(value), [value]);
  const sortedDraft = useMemo(() => sortMonthIds(draft), [draft]);
  const hasChanges =
    sortedValue.length !== sortedDraft.length ||
    sortedValue.some((month, index) => month !== sortedDraft[index]);

  const summaryLabel = useMemo(() => {
    if (sortedValue.length === 0) {
      return t("filters.sidebar.month.anytime");
    }
    if (sortedValue.length <= 2) {
      return sortedValue
        .map(id => monthNames[language][Number(id) - 1]?.slice(0, 3) ?? id)
        .join(", ");
    }
    return t("filters.sidebar.month.multi", {
      count: sortedValue.length,
    });
  }, [language, sortedValue, t]);

  const handleApply = () => {
    onChange(sortedDraft);
    setOpen(false);
  };

  const handleClear = () => {
    setDraft([]);
  };

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "mt-2 flex w-full items-center justify-between rounded-2xl border border-border bg-card px-3 py-2 text-left text-sm font-medium text-foreground shadow-sm transition hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
            className,
          )}
        >
          <div className="flex items-center gap-2 text-sm">
            <CalendarIcon className="h-4 w-4 text-primary" />
            <span>{summaryLabel}</span>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[280px] rounded-2xl border border-border bg-card/95 !p-4 shadow-xl">
        <div className="mb-3 text-sm font-semibold text-foreground">
          {t("filters.sidebar.month")}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {monthOptions.map(option => {
            const isSelected = draft.includes(option.id);
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
                onClick={() => toggleDraft(option.id)}
              >
                <span>{option.shortLabel}</span>
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
        <div className="mt-4 flex items-center justify-between gap-2">
          <Button variant="outline" size="sm" onClick={handleClear} className="flex-1">
            {t("filters.sidebar.month.anytime")}
          </Button>
          <Button size="sm" className="flex-1" onClick={handleApply} disabled={!hasChanges}>
            {t("filters.sidebar.month.apply")}
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
