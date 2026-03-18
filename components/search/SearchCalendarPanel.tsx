/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Calendar as CalendarIcon, CalendarDays, ChevronDown, MapPin, Users } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { useT } from "@/i18n/useT";
import { useLocalizedPath } from "@/utils/localizedPaths";
import { useEnglishTravelSlugMap } from "@/hooks/useEnglishSlugs";
import { slugify } from "@/utils/slugify";
import { SmartImage } from "@/components/SmartImage";
import type { Travel } from "@/types/travel";
import { formatPrice } from "@/utils/price";
import { formatDurationFromRange } from "@/utils/dateDuration";

type SearchCalendarPanelProps = {
  travels: Travel[];
  className?: string;
  mode?: CalendarMode;
  onModeChange?: (mode: CalendarMode) => void;
};

type OpenDateRow = {
  id: number | string;
  "id prod": number;
  date_start: string | null;
  date_end: string | null;
  price: number | null;
  categoria: string | null;
  places_total: number | null;
  places_taken: number | null;
  sold_out: boolean | null;
  name_event: string | null;
  name_etiqueta: string | null;
};

type OpenDateLangRow = {
  fecha_abierta_id: number;
  lang: string;
  name_event: string | null;
  name_etiqueta: string | null;
};

type PhotoRow = {
  id: number;
  photo_hor1: string | null;
  photo_hor2: string | null;
  photo_hor3: string | null;
  photo_hor4: string | null;
  photo_hor5: string | null;
};

type PrivateDateRow = {
  id: number | string;
  "id prod": number | null;
  date_begin: string | null;
  date_end: string | null;
  price: number | null;
  min_pers: number | null;
  max_pers: number | null;
};

type CalendarDeparture = {
  id: number | string;
  travelId: number;
  date: Date;
  endDate: Date | null;
  price: number;
  availableSpots: number;
  soldOut: boolean;
  nameEtiqueta: string | null;
  title: string;
  destination: string;
  duration: string;
  imageUrls: string[];
  travelHref: string;
  actionHref: string;
};

type PrivateTravelItem = {
  travelId: number;
  title: string;
  destination: string;
  duration: string;
  price: number;
  imageUrls: string[];
  travelHref: string;
  actionHref: string;
};

type MonthGroup<TItem> = {
  key: string;
  label: string;
  items: TItem[];
};

type CalendarData = {
  departures: CalendarDeparture[];
  photosByTravelId: Record<number, string[]>;
  privateDateRows: PrivateDateRow[];
};

type CalendarMode = "scheduled" | "private";

const getLocale = (language: string) => {
  if (language === "ES") return "es-ES";
  if (language === "FR") return "fr-FR";
  return "en-US";
};

const getLanguagePrefix = (language: string) => language.toLowerCase();
const normalizeLang = (value?: string | null) => (value ?? "").toLowerCase().replace(/-/g, "_");

const buildImageUrls = (travel: Travel, photoUrls: string[] = []) =>
  [...photoUrls, travel.imgUrl, ...(travel.additionalImages ?? []), "/placeholder.svg"].filter(
    (url): url is string => Boolean(url && url.trim()),
  );

export const SearchCalendarPanel = ({
  travels,
  className,
  mode: controlledMode,
  onModeChange,
}: SearchCalendarPanelProps) => {
  const { language } = useLanguage();
  const { t } = useT();
  const buildPath = useLocalizedPath();
  const { data: enTravelSlugs = {} } = useEnglishTravelSlugMap(language === "EN");
  const locale = getLocale(language);
  const consultPriceLabel = t("card.consultPrice") || "Contáctanos";

  const [uncontrolledMode, setUncontrolledMode] = useState<CalendarMode>("scheduled");
  const [openScheduledMonths, setOpenScheduledMonths] = useState<string[]>([]);
  const [openPrivateMonths, setOpenPrivateMonths] = useState<string[]>([]);
  const mode = controlledMode ?? uncontrolledMode;
  const setMode = (next: CalendarMode) => {
    setOpenScheduledMonths([]);
    setOpenPrivateMonths([]);
    if (controlledMode === undefined) {
      setUncontrolledMode(next);
    }
    onModeChange?.(next);
  };

  const travelIds = useMemo(() => Array.from(new Set(travels.map((travel) => travel.id))), [travels]);
  const travelById = useMemo(() => {
    const map = new Map<number, Travel>();
    travels.forEach((travel) => map.set(travel.id, travel));
    return map;
  }, [travels]);

  const { data: calendarData, isLoading } = useQuery<CalendarData>({
    queryKey: ["search-open-dates", travelIds, language],
    queryFn: async () => {
      if (!travelIds.length) return { departures: [], photosByTravelId: {}, privateDateRows: [] };

      const [openDatesResult, photosResult, privateDatesResult] = await Promise.all([
        (() => {
          const idsCsv = `(${travelIds.join(",")})`;
          return (supabase as any)
            .from("FechasAbiertas")
            .select(
              'id, "id prod", date_start, date_end, price, categoria, places_total, places_taken, sold_out, name_event, name_etiqueta',
            )
            .filter('"id prod"', "in", idsCsv)
            .not("date_start", "is", null)
            .order("date_start", { ascending: true });
        })(),
        (supabase as any)
          .from("product_photos")
          .select("id, photo_hor1, photo_hor2, photo_hor3, photo_hor4, photo_hor5")
          .in("id", travelIds),
        (() => {
          const idsCsv = `(${travelIds.join(",")})`;
          return (supabase as any)
            .from("FechasPrivadas")
            .select('id, "id prod", date_begin, date_end, price, min_pers, max_pers')
            .filter('"id prod"', "in", idsCsv)
            .not("date_begin", "is", null)
            .order("date_begin", { ascending: true });
        })(),
      ]);

      if (openDatesResult.error) throw openDatesResult.error;
      if (photosResult.error) {
        console.warn("Error fetching travel photos for search calendar:", photosResult.error);
      }
      if (privateDatesResult.error) {
        console.warn("Error fetching private departures for search calendar:", privateDatesResult.error);
      }

      const langPrefix = getLanguagePrefix(language);
      const openDateIds = ((openDatesResult.data as OpenDateRow[] | null) ?? [])
        .map((row) => Number(row.id))
        .filter((id) => Number.isFinite(id));
      const translatedById = new Map<number, OpenDateLangRow>();

      if (openDateIds.length > 0) {
        const openDatesLangResult = await (supabase as any)
          .from("FechasAbiertasLang")
          .select("fecha_abierta_id, lang, name_event, name_etiqueta")
          .in("fecha_abierta_id", openDateIds);

        if (openDatesLangResult.error) {
          console.warn("Error fetching open date translations for search calendar:", openDatesLangResult.error);
        } else {
          ((openDatesLangResult.data as OpenDateLangRow[] | null) ?? []).forEach((row) => {
            const id = Number(row.fecha_abierta_id);
            const normalized = normalizeLang(row.lang);
            const isTargetLanguage =
              normalized === langPrefix || normalized.startsWith(`${langPrefix}_`);
            if (isTargetLanguage && !translatedById.has(id)) {
              translatedById.set(id, row);
            }
          });
        }
      }

      const photosByTravelId: Record<number, string[]> = {};
      ((photosResult.data as PhotoRow[] | null) ?? []).forEach((photo) => {
        photosByTravelId[photo.id] = [
          photo.photo_hor1,
          photo.photo_hor2,
          photo.photo_hor3,
          photo.photo_hor4,
          photo.photo_hor5,
        ].filter((url): url is string => Boolean(url && url.trim()));
      });

      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const departures = ((openDatesResult.data as OpenDateRow[] | null) ?? [])
        .map((row): CalendarDeparture | null => {
          if (!row.date_start) return null;

          const travel = travelById.get(row["id prod"]);
          if (!travel) return null;

          const date = new Date(row.date_start);
          if (Number.isNaN(date.getTime()) || date < startOfToday) return null;

          const endDate = row.date_end ? new Date(row.date_end) : null;
          const slug = language === "ES" ? slugify(travel.title) : enTravelSlugs[travel.id] ?? slugify(travel.title);
          const travelHref = buildPath(`/${slug}`);

          const unitPrice = Number(row.price) || travel.price || 0;
          const remainingSpots = Math.max(0, Number(row.places_total ?? 0) - Number(row.places_taken ?? 0));
          const availableSpots = Math.max(1, remainingSpots);
          const minPeople = 1;
          const translated = translatedById.get(Number(row.id));
          const translatedNameEvent = translated?.name_event || row.name_event;
          const translatedNameEtiqueta = translated?.name_etiqueta || row.name_etiqueta;
          const safeEndDate =
            endDate && !Number.isNaN(endDate.getTime()) ? endDate : null;
          const calculatedDuration = formatDurationFromRange(date, safeEndDate, language);
          const checkoutParams = new URLSearchParams({
            titulo: `Reserva: ${travel.title}`,
            trip_title: travel.title,
            grupo: "Grupo abierto",
            num_personas: "1",
            categoria: row.categoria ?? "estandar",
            fecha: date.toISOString(),
            fecha_fin: (safeEndDate ?? date).toISOString(),
            paga_parcial: "false",
            notas_adicionales: translatedNameEvent ?? "",
            precio_unitario: String(unitPrice),
            total: String(unitPrice),
            travel_id: String(travel.id),
            booking_id: String(row.id),
            max_personas: String(availableSpots),
            min_personas: String(minPeople),
            destino: travel.destino ?? "",
            duracion: calculatedDuration,
            imagen: travel.imgUrl ?? "",
            nivel: travel.level ?? "",
            initial_payment_percentage:
              travel.initialPaymentPercentage != null ? String(travel.initialPaymentPercentage) : "",
          });

          return {
            id: row.id,
            travelId: travel.id,
            date,
            endDate: safeEndDate,
            price: unitPrice,
            availableSpots: remainingSpots,
            soldOut: !!row.sold_out,
            nameEtiqueta: translatedNameEtiqueta,
            title: travel.title,
            destination: travel.destino || "",
            duration: calculatedDuration,
            imageUrls: buildImageUrls(travel, photosByTravelId[travel.id]),
            travelHref,
            actionHref: `${buildPath("/checkout")}?${checkoutParams.toString()}`,
          };
        })
        .filter((item): item is CalendarDeparture => Boolean(item))
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      const privateDateRows = ((privateDatesResult.data as PrivateDateRow[] | null) ?? []).filter(
        (row): row is PrivateDateRow => Number.isFinite(Number(row["id prod"])) && !!row.date_begin,
      );

      return { departures, photosByTravelId, privateDateRows };
    },
    enabled: travelIds.length > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const scheduledMonthGroups = useMemo<MonthGroup<CalendarDeparture>[]>(() => {
    const departures = calendarData?.departures ?? [];
    const groups = new Map<string, MonthGroup<CalendarDeparture>>();

    departures.forEach((item) => {
      const key = `${item.date.getFullYear()}-${item.date.getMonth()}`;
      const label = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(item.date);
      if (!groups.has(key)) groups.set(key, { key, label, items: [] });
      groups.get(key)?.items.push(item);
    });

    return Array.from(groups.values()).sort((a, b) => {
      const aTime = a.items[0]?.date?.getTime?.() ?? 0;
      const bTime = b.items[0]?.date?.getTime?.() ?? 0;
      return aTime - bTime;
    });
  }, [calendarData?.departures, locale]);

  const privateMonthGroups = useMemo<MonthGroup<PrivateTravelItem>[]>(() => {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const currentYear = now.getFullYear();
    const years = [currentYear, currentYear + 1];
    const privateRows = calendarData?.privateDateRows ?? [];

    return years.flatMap((year) =>
      Array.from({ length: 12 }, (_, monthIndex) => {
        const monthStart = new Date(year, monthIndex, 1);
        const monthEnd = new Date(year, monthIndex + 1, 0);
        if (monthEnd < startOfToday) return null;

        const monthNumber = monthIndex + 1;
        const key = `private-${year}-${monthNumber}`;
        const label = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(
          new Date(year, monthIndex, 1),
        );

        const travelIdsForMonth = new Set<number>();
        privateRows.forEach((row) => {
          const travelId = Number(row["id prod"]);
          if (!Number.isFinite(travelId)) return;
          const rangeStart = new Date(row.date_begin!);
          const rangeEnd = row.date_end ? new Date(row.date_end) : rangeStart;
          if (Number.isNaN(rangeStart.getTime()) || Number.isNaN(rangeEnd.getTime())) return;
          if (rangeStart <= monthEnd && rangeEnd >= monthStart) {
            travelIdsForMonth.add(travelId);
          }
        });

        const items = travels
          .filter((travel) => travelIdsForMonth.has(travel.id))
          .map<PrivateTravelItem>((travel) => {
            const slug = language === "ES" ? slugify(travel.title) : enTravelSlugs[travel.id] ?? slugify(travel.title);
            const matchingRows = privateRows.filter((row) => Number(row["id prod"]) === travel.id);
            const rowsForMonth = matchingRows.filter((row) => {
              const rowStart = new Date(row.date_begin ?? "");
              const rowEnd = row.date_end ? new Date(row.date_end) : rowStart;
              if (Number.isNaN(rowStart.getTime()) || Number.isNaN(rowEnd.getTime())) return false;
              return rowStart <= monthEnd && rowEnd >= monthStart;
            });
            const durationRow = rowsForMonth[0] ?? matchingRows[0];
            const durationStart = durationRow?.date_begin ? new Date(durationRow.date_begin) : null;
            const durationEnd = durationRow?.date_end ? new Date(durationRow.date_end) : durationStart;
            const minPrice = matchingRows.reduce<number>(
              (acc, row) => {
                const value = Number(row.price);
                if (!Number.isFinite(value) || value <= 0) return acc;
                return acc === 0 ? value : Math.min(acc, value);
              },
              0,
            );
            const calculatedDuration =
              durationStart && !Number.isNaN(durationStart.getTime())
                ? formatDurationFromRange(
                    durationStart,
                    durationEnd && !Number.isNaN(durationEnd.getTime()) ? durationEnd : durationStart,
                    language,
                  )
                : travel.duration || "";
            return {
              travelId: travel.id,
              title: travel.title,
              destination: travel.destino || "",
              duration: calculatedDuration,
              price: minPrice || Number(travel.price) || 0,
              imageUrls: buildImageUrls(travel, calendarData?.photosByTravelId?.[travel.id]),
              travelHref: buildPath(`/${slug}`),
              actionHref: `${buildPath(`/${slug}/book`)}?mode=private&privateMonth=${year}-${String(
                monthNumber,
              ).padStart(2, "0")}`,
            };
          })
          .sort((a, b) => a.title.localeCompare(b.title));

        return { key, label, items };
      })
        .filter((group): group is MonthGroup<PrivateTravelItem> => Boolean(group))
        .filter((group) => group.items.length > 0),
    );
  }, [buildPath, calendarData?.photosByTravelId, calendarData?.privateDateRows, enTravelSlugs, language, locale, travels]);

  const hasScheduledResults = scheduledMonthGroups.length > 0;
  const hasPrivateResults = privateMonthGroups.length > 0;
  const firstScheduledMonthKey = scheduledMonthGroups[0]?.key ?? null;
  const initialScheduledOpenRef = useRef(false);
  const previousFirstKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (firstScheduledMonthKey !== previousFirstKeyRef.current) {
      previousFirstKeyRef.current = firstScheduledMonthKey;
      initialScheduledOpenRef.current = false;
    }
  }, [firstScheduledMonthKey]);

  useEffect(() => {
    if (mode !== "scheduled") return;
    if (!firstScheduledMonthKey) return;
    if (openScheduledMonths.length > 0) return;
    if (initialScheduledOpenRef.current) return;

    setOpenScheduledMonths([firstScheduledMonthKey]);
    initialScheduledOpenRef.current = true;
  }, [mode, firstScheduledMonthKey, openScheduledMonths.length]);

  const showScheduledSwitchHint = !isLoading && mode === "scheduled" && !hasScheduledResults && hasPrivateResults;
  const showPrivateSwitchHint = !isLoading && mode === "private" && !hasPrivateResults && hasScheduledResults;
  const switchToOtherModeLabel =
    language === "ES"
      ? "Ver resultados disponibles"
      : language === "FR"
        ? "Voir les résultats disponibles"
        : "View available results";
  const scheduledEmptyButPrivateHasResultsText =
    language === "ES"
      ? "No hay salidas programadas para esta búsqueda, pero sí hay salidas privadas."
      : language === "FR"
        ? "Aucun départ programmé pour cette recherche, mais il existe des départs privés."
        : "No scheduled departures for this search, but private departures are available.";
  const privateEmptyButScheduledHasResultsText =
    language === "ES"
      ? "No hay salidas privadas para esta búsqueda, pero sí hay salidas programadas."
      : language === "FR"
        ? "Aucun départ privé pour cette recherche, mais des départs programmés sont disponibles."
        : "No private departures for this search, but scheduled departures are available.";
  const isConsultPrice = (price: number) => price === -1;
  const bookNowLabel = t("booking.bookNow", "Book now");
  const viewTripsLabel = language === "ES" ? "Ver viajes" : language === "FR" ? "Voir voyages" : "View trips";
  const hideTripsLabel = language === "ES" ? "Ocultar viajes" : language === "FR" ? "Masquer voyages" : "Hide trips";
  const normalizeSpots = (spots: number | undefined) => {
    const parsed = Number(spots);
    return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
  };
  const formatSpotsLabel = (spots: number | undefined) => {
    const safeSpots = normalizeSpots(spots);
    return `${safeSpots} ${safeSpots === 1 ? t("booking.spotLeft") : t("booking.spotsLeft")}`;
  };

  return (
    <div className={cn("space-y-2.5", className)}>
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-1 rounded-full border border-border/80 bg-card/95 p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setMode("scheduled")}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold transition",
              mode === "scheduled"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
          >
            {t("search.calendar.mode.scheduled", t("home.travelFormats.scheduled.title"))}
          </button>
          <button
            type="button"
            onClick={() => setMode("private")}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold transition",
              mode === "private"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
          >
            {t("search.calendar.mode.private", t("home.travelFormats.private.title"))}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-border/70 bg-card/50 p-3 md:p-4">
        <div className="grid gap-3 md:grid-cols-2">
          <button
            type="button"
            onClick={() => setMode("scheduled")}
            aria-pressed={mode === "scheduled"}
            className={cn(
              "rounded-lg border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              mode === "scheduled"
                ? "border-primary/25 bg-primary/10"
                : "border-border/70 bg-background/80 hover:bg-muted/40",
            )}
          >
            <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <CalendarDays className="h-4 w-4 text-primary" />
              {t("home.travelFormats.scheduled.title")}
            </p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {t("home.travelFormats.scheduled.description")}
            </p>
          </button>

          <button
            type="button"
            onClick={() => setMode("private")}
            aria-pressed={mode === "private"}
            className={cn(
              "rounded-lg border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              mode === "private"
                ? "border-primary/25 bg-primary/10"
                : "border-border/70 bg-background/80 hover:bg-muted/40",
            )}
          >
            <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <Users className="h-4 w-4 text-primary" />
              {t("home.travelFormats.private.title")}
            </p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {t("home.travelFormats.private.description")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground/90">
              {t("home.travelFormats.private.priceNote")}
            </p>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center rounded-3xl border border-border bg-card/50 p-10">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
        </div>
      ) : null}

      {showScheduledSwitchHint ? (
        <div className="rounded-3xl border border-dashed border-border bg-card/40 p-8 text-center">
          <p className="text-muted-foreground text-lg">{scheduledEmptyButPrivateHasResultsText}</p>
          <button
            type="button"
            onClick={() => setMode("private")}
            className="mt-4 inline-flex items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted"
          >
            {switchToOtherModeLabel}
          </button>
        </div>
      ) : null}

      {showPrivateSwitchHint ? (
        <div className="rounded-3xl border border-dashed border-border bg-card/40 p-8 text-center">
          <p className="text-muted-foreground text-lg">{privateEmptyButScheduledHasResultsText}</p>
          <button
            type="button"
            onClick={() => setMode("scheduled")}
            className="mt-4 inline-flex items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted"
          >
            {switchToOtherModeLabel}
          </button>
        </div>
      ) : null}

      {!isLoading && mode === "scheduled" &&
        scheduledMonthGroups.map((group) => {
          const isOpen = openScheduledMonths.includes(group.key);

          return (
            <div key={group.key} className="overflow-hidden rounded-xl border border-border/70 bg-card/30">
              <button
                type="button"
                onClick={() =>
                  setOpenScheduledMonths((prev) =>
                    prev.includes(group.key)
                      ? prev.filter((value) => value !== group.key)
                      : [...prev, group.key],
                  )
                }
                className={cn(
                  "flex w-full items-center justify-between px-4 py-3 text-left transition",
                  isOpen
                    ? "bg-primary/10 text-primary border-b border-primary/20"
                    : "bg-muted/30 text-foreground hover:bg-primary/10 hover:text-primary",
                )}
              >
                <div>
                  <p className="text-lg font-semibold capitalize">{group.label}</p>
                  <p className={cn("text-sm", isOpen ? "text-primary/80" : "text-muted-foreground/90")}>
                    {t("search.calendar.datesCount", { count: group.items.length })}
                  </p>
                </div>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform md:hidden",
                    isOpen ? "rotate-180 text-primary" : "text-muted-foreground",
                  )}
                />
                <span
                  className={cn(
                    "hidden md:inline-flex rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                    isOpen
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "border border-border bg-background text-muted-foreground hover:border-primary/40 hover:bg-primary/10 hover:text-primary",
                  )}
                >
                  {isOpen ? hideTripsLabel : viewTripsLabel}
                </span>
              </button>

              {isOpen ? (
                <div className="bg-background">
                  {group.items.map((item, index) => {
                    const day = new Intl.DateTimeFormat(locale, { day: "2-digit" }).format(item.date);
                    const monthShort = new Intl.DateTimeFormat(locale, { month: "short" }).format(item.date);
                    const year = new Intl.DateTimeFormat(locale, { year: "numeric" }).format(item.date);
                    const dateRange = item.endDate
                      ? `${item.date.toLocaleDateString(locale)} - ${item.endDate.toLocaleDateString(locale)}`
                      : item.date.toLocaleDateString(locale);
                    const dateLabel = item.nameEtiqueta && item.nameEtiqueta !== "-1" ? item.nameEtiqueta : null;
                    const hasAvailableSpots = !item.soldOut && normalizeSpots(item.availableSpots) > 0;

                    return (
                      <div
                        key={`${item.id}-${item.travelId}-${item.date.toISOString()}`}
                        className={cn("p-3 transition hover:bg-primary/5 md:p-4", index > 0 ? "border-t border-border" : "")}
                      >
                        <div className="space-y-3 md:hidden">
                          <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase text-foreground">
                            <CalendarIcon className="h-3.5 w-3.5" />
                            {`${day}-${monthShort} ${year} | ${item.duration.toUpperCase()}`}
                          </p>

                          <Link href={item.travelHref} className="block space-y-3" title={"View trip details"}>
                            <div className="relative overflow-hidden rounded-xl">
                              <SmartImage
                                imageUrls={item.imageUrls}
                                alt={item.title}
                                width={520}
                                height={300}
                                className="h-[170px] w-full object-cover"
                              />
                              {item.destination ? (
                                <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-primary/95 px-2.5 py-1 text-xs font-semibold text-primary-foreground">
                                  <MapPin className="h-3.5 w-3.5" />
                                  {item.destination}
                                </span>
                              ) : null}
                              {item.soldOut ? (
                                <span className="absolute bottom-2 left-2 inline-flex rounded-full bg-background/95 px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                                  {t("booking.soldOut")}
                                </span>
                              ) : null}
                            </div>
                          </Link>

                          <div className="grid grid-cols-[1fr_auto] items-end gap-3">
                            <Link href={item.travelHref} className="min-w-0 space-y-1" title={"View trip details"}>
                              <h3 className="line-clamp-2 text-[21px] font-semibold uppercase leading-tight tracking-wide text-foreground">
                                {item.title}
                              </h3>
                              <p className="text-sm text-muted-foreground">{dateRange}</p>
                              {dateLabel ? (
                                <p className="text-[14px] text-muted-foreground">{dateLabel}</p>
                              ) : null}
                              <p className="text-[18px] text-foreground">
                                <span className="font-semibold">
                                  {isConsultPrice(item.price) ? consultPriceLabel : formatPrice(item.price)}
                                </span>
                                {!isConsultPrice(item.price) ? ` / ${t("booking.perPerson")}` : ""}
                                {item.duration ? ` • ${item.duration}` : ""}
                              </p>
                            </Link>

                            <div className="justify-self-end self-end text-center space-y-1">
                            {hasAvailableSpots ? (
                                <>
                                  <p className="w-[140px] text-center text-[11px] leading-tight font-medium text-muted-foreground">
                                    {formatSpotsLabel(item.availableSpots)}
                                  </p>
                                  <Link
                                    href={item.actionHref}
                                    className="inline-flex w-[140px] justify-center rounded-xl bg-primary px-3 py-1.5 text-base font-semibold text-primary-foreground"
                                   title={"Open booking action"}>
                                    {bookNowLabel}
                                  </Link>
                                </>
                              ) : (
                                <span className="inline-flex rounded-xl bg-muted px-3 py-1.5 text-base font-semibold text-muted-foreground">
                                  {t("booking.soldOut")}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="hidden grid-cols-[1fr_auto] items-center gap-5 md:grid">
                          <Link href={item.travelHref} className="grid gap-5 md:grid-cols-[72px_220px_1fr] md:items-center" title={"View trip details"}>
                            <div className="min-w-[72px] flex-col items-center justify-center text-center leading-tight md:flex">
                              <span className="text-lg font-semibold capitalize">{monthShort}</span>
                              <span className="text-2xl font-black">{day}</span>
                            </div>

                            <div className="relative overflow-hidden rounded-xl">
                              <SmartImage
                                imageUrls={item.imageUrls}
                                alt={item.title}
                                width={520}
                                height={300}
                                className="h-[130px] w-full object-cover"
                              />
                            </div>

                            <div className="min-w-0 space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                {item.destination ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-primary-foreground">
                                    <MapPin className="h-3.5 w-3.5" />
                                    {item.destination}
                                  </span>
                                ) : null}
                                {item.soldOut ? (
                                  <span className="rounded-full border border-muted-foreground px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                                    {t("booking.soldOut")}
                                  </span>
                                ) : null}
                              </div>
                              <h3 className="text-xl font-semibold uppercase tracking-wide text-foreground">{item.title}</h3>
                              <p className="text-sm text-muted-foreground">{dateRange}</p>
                              {dateLabel ? (
                                <p className="text-[14px] text-muted-foreground">{dateLabel}</p>
                              ) : null}
                              <p className="text-xl text-foreground">
                                <span className="font-semibold">
                                  {isConsultPrice(item.price) ? consultPriceLabel : formatPrice(item.price)}
                                </span>
                                {!isConsultPrice(item.price) ? ` / ${t("booking.perPerson")}` : ""}
                                {item.duration ? ` • ${item.duration}` : ""}
                              </p>
                            </div>
                          </Link>

                          <div className="justify-self-end self-end">
                            {hasAvailableSpots ? (
                              <div className="text-center space-y-1">
                                <p className="w-[140px] text-center text-[11px] leading-tight font-medium text-muted-foreground">
                                  {formatSpotsLabel(item.availableSpots)}
                                </p>
                                <Link
                                  href={item.actionHref}
                                  className="inline-flex w-[140px] justify-center rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground"
                                 title={"Open booking action"}>
                                  {bookNowLabel}
                                </Link>
                              </div>
                            ) : (
                              <span className="inline-flex rounded-lg bg-muted px-3 py-1.5 text-sm font-semibold text-muted-foreground">
                                {t("booking.soldOut")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}

      {!isLoading && mode === "private" &&
        privateMonthGroups.map((group) => {
          const isOpen = openPrivateMonths.includes(group.key);

          return (
            <div key={group.key} className="overflow-hidden rounded-xl border border-border/70 bg-card/30">
              <button
                type="button"
                onClick={() =>
                  setOpenPrivateMonths((prev) =>
                    prev.includes(group.key)
                      ? prev.filter((value) => value !== group.key)
                      : [...prev, group.key],
                  )
                }
                className={cn(
                  "flex w-full items-center justify-between px-4 py-3 text-left transition",
                  isOpen
                    ? "bg-primary/10 text-primary border-b border-primary/20"
                    : "bg-muted/30 text-foreground hover:bg-primary/10 hover:text-primary",
                )}
              >
                <div>
                  <p className="text-lg font-semibold capitalize">{group.label}</p>
                  <p className={cn("text-sm", isOpen ? "text-primary/80" : "text-muted-foreground/90")}>
                    {t("search.calendar.tripsCount", { count: group.items.length })}
                  </p>
                </div>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform md:hidden",
                    isOpen ? "rotate-180 text-primary" : "text-muted-foreground",
                  )}
                />
                <span
                  className={cn(
                    "hidden md:inline-flex rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                    isOpen
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "border border-border bg-background text-muted-foreground hover:border-primary/40 hover:bg-primary/10 hover:text-primary",
                  )}
                >
                  {isOpen ? hideTripsLabel : viewTripsLabel}
                </span>
              </button>

              {isOpen ? (
                <div className="bg-background">
                  {group.items.map((item, index) => (
                    <div
                      key={`${group.key}-${item.travelId}`}
                      className={cn(
                        "grid gap-3 p-3 transition hover:bg-primary/5 md:grid-cols-[1fr_auto] md:items-center md:gap-5 md:p-4",
                        index > 0 ? "border-t border-border" : "",
                      )}
                    >
                      <Link href={item.travelHref} className="grid gap-3 md:grid-cols-[220px_1fr] md:items-center md:gap-5" title={"View trip details"}>
                        <div className="overflow-hidden rounded-xl">
                          <SmartImage
                            imageUrls={item.imageUrls}
                            alt={item.title}
                            width={520}
                            height={300}
                            className="h-[108px] w-full object-cover md:h-[130px]"
                          />
                        </div>

                        <div className="min-w-0 space-y-1.5 md:space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            {item.destination ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary-foreground md:px-2.5 md:text-xs">
                                <MapPin className="h-3 w-3 md:h-3.5 md:w-3.5" />
                                {item.destination}
                              </span>
                            ) : null}
                            <span className="rounded-full border border-primary/40 px-2 py-1 text-[11px] font-semibold text-primary md:px-2.5 md:text-xs">
                              {t("booking.private")}
                            </span>
                          </div>
                          <h3 className="text-lg font-semibold uppercase tracking-wide text-foreground md:text-xl">{item.title}</h3>
                          <p className="text-lg text-foreground md:text-xl">
                            {!isConsultPrice(item.price) ? `${t("booking.from")} ` : ""}
                            <span className="font-semibold">
                              {isConsultPrice(item.price) ? consultPriceLabel : formatPrice(item.price)}
                            </span>
                            {!isConsultPrice(item.price) ? ` / ${t("booking.perPerson")}` : ""}
                            {item.duration ? ` • ${item.duration}` : ""}
                          </p>
                        </div>
                      </Link>

                      <div className="justify-self-start md:justify-self-end">
                        <Link href={item.actionHref} className="inline-flex rounded-lg bg-primary px-2.5 py-1 text-sm font-semibold text-primary-foreground md:px-3 md:py-1.5" title={"Open booking action"}>
                          {bookNowLabel}
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
    </div>
  );
};
