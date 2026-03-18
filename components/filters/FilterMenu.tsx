// src/components/filters/FilterMenu.tsx
import { SlidersHorizontal, ArrowUp, ArrowDown } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useT } from "@/i18n/useT";
import { cn } from "@/lib/utils"; // opcional si tienes util de classnames

export type SortKey = "relevance" | "price-low" | "price-high";

export interface FilterState {
  sort: SortKey;
  country?: string;
  activity?: string;
}

interface FilterMenuProps {
  value: FilterState;
  onChange: (next: FilterState) => void;
  onClear?: () => void;
  className?: string;
  hasActive?: boolean;
  // si más adelante quieres enseñar país/actividad:
  showCountry?: boolean;
  showActivity?: boolean;
}

export function FilterMenu({
  value,
  onChange,
  onClear,
  className,
  hasActive,
}: FilterMenuProps) {
  const { t } = useT();

  const set = (patch: Partial<FilterState>) => onChange({ ...value, ...patch });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t("filters.open")}
          title={t("filters.open")}
          className={cn(
            "inline-flex items-center gap-2 rounded-2xl border px-3 py-1.5 text-sm font-medium shadow-sm transition-colors duration-200",
            hasActive
              ? "border-blue-500 bg-blue-500/10 text-blue-700 hover:bg-blue-500/20"
              : "border-border bg-card text-foreground hover:bg-muted/70",
            className
          )}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>{t("filters.sortBy")}</span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>{t("filters.title")}</DropdownMenuLabel>

        <DropdownMenuItem
          onClick={() => set({ sort: "price-low" })}
          className={value.sort === "price-low" ? "bg-accent" : ""}
        >
          <span className="flex w-full items-center justify-between">
            <span>{t("filters.sort.priceAsc")}</span>
            <ArrowUp className="w-3 h-3 ml-2" />
          </span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => set({ sort: "price-high" })}
          className={value.sort === "price-high" ? "bg-accent" : ""}
        >
          <span className="flex w-full items-center justify-between">
            <span>{t("filters.sort.priceDesc")}</span>
            <ArrowDown className="w-3 h-3 ml-2" />
          </span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => set({ sort: "relevance" })}
          className={value.sort === "relevance" ? "bg-accent" : ""}
        >
          {t("filters.sort.relevance")}
        </DropdownMenuItem>
        
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
