import { Fragment, useMemo, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronDown, HelpCircle } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useLocalizedPath } from "@/utils/localizedPaths";
import { useLanguage } from "@/context/LanguageContext";
import { useT } from "@/i18n/useT";
import { useTravelDepartures } from "@/hooks/useTravelDepartures";
import { formatPrice } from "@/utils/price";
import { formatDurationFromRange } from "@/utils/dateDuration";
import type { BookingDate } from "@/types/booking";

type TravelDeparturesSectionProps = {
  travelId: number;
  bookingHref?: string;
  travelMeta?: {
    title: string;
    destino: string;
    duration: string;
    imgUrl: string;
    level: string;
    initialPaymentPercentage?: number | null;
    originalPrice?: number | null;
  };
  onSelectPrivateMonth?: (label: string) => void;
  months?: Array<number | string> | null;
};

type MonthGroup = {
  label: string;
  key: string;
  rows: BookingDate[];
};

type MonthPill = {
  key: string;
  monthLabel: string;
  yearLabel: string;
  fullLabel: string;
};

const getLocale = (language: string) => {
  if (language === "ES") return "es-ES";
  if (language === "FR") return "fr-FR";
  return "en-US";
};

const formatDateRange = (date: Date, endDate: Date | null | undefined, locale: string) => {
  const startLabel = date.toLocaleDateString(locale, {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
  if (!endDate) return startLabel;
  const endLabel = endDate.toLocaleDateString(locale, {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
  return `${startLabel} - ${endLabel}`;
};

const formatMonthHeader = (date: Date, locale: string) => {
  const formatter = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" });
  return formatter.format(date).toUpperCase();
};

const groupByMonth = (dates: BookingDate[], locale: string): MonthGroup[] => {
  const groups = new Map<string, MonthGroup>();

  dates.forEach((date) => {
    const monthKey = `${date.date.getFullYear()}-${date.date.getMonth()}`;
    const label = formatMonthHeader(date.date, locale);
    if (!groups.has(monthKey)) {
      groups.set(monthKey, { key: monthKey, label, rows: [] });
    }
    groups.get(monthKey)?.rows.push(date);
  });

  return Array.from(groups.values()).sort((a, b) => (a.key > b.key ? 1 : -1));
};

const buildMonthLabel = (date: Date, locale: string) => {
  const month = new Intl.DateTimeFormat(locale, { month: "long" }).format(date);
  const year = new Intl.DateTimeFormat(locale, { year: "numeric" }).format(date);
  return { month, year };
};

export const TravelDeparturesSection = ({
  travelId,
  bookingHref,
  travelMeta,
  onSelectPrivateMonth,
  months,
}: TravelDeparturesSectionProps) => {
  const { t } = useT();
  const { language } = useLanguage();
  const buildPath = useLocalizedPath();
  const locale = getLocale(language);
  const { data, isLoading } = useTravelDepartures(travelId, language);
  const [isDesktop, setIsDesktop] = useState(true);
  const [infoOpen, setInfoOpen] = useState(false);
  const [scheduledInfoOpen, setScheduledInfoOpen] = useState(false);
  const [privateInfoOpen, setPrivateInfoOpen] = useState(false);
  const [tailorInfoOpen, setTailorInfoOpen] = useState(false);
  const scrollWrapRef = useRef<HTMLDivElement | null>(null);
  const [showScrollHint, setShowScrollHint] = useState(false);
  const infoTriggerRef = useRef<HTMLButtonElement | null>(null);
  const infoContentRef = useRef<HTMLDivElement | null>(null);
  const scheduledTriggerRef = useRef<HTMLButtonElement | null>(null);
  const scheduledContentRef = useRef<HTMLDivElement | null>(null);
  const privateTriggerRef = useRef<HTMLButtonElement | null>(null);
  const privateContentRef = useRef<HTMLDivElement | null>(null);
  const tailorTriggerRef = useRef<HTMLButtonElement | null>(null);
  const tailorContentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setIsDesktop(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (isDesktop) return;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;

      if (
        infoTriggerRef.current?.contains(target) ||
        infoContentRef.current?.contains(target)
      ) {
        return;
      }
      if (
        scheduledTriggerRef.current?.contains(target) ||
        scheduledContentRef.current?.contains(target)
      ) {
        return;
      }
      if (
        privateTriggerRef.current?.contains(target) ||
        privateContentRef.current?.contains(target)
      ) {
        return;
      }
      if (
        tailorTriggerRef.current?.contains(target) ||
        tailorContentRef.current?.contains(target)
      ) {
        return;
      }

      setInfoOpen(false);
      setScheduledInfoOpen(false);
      setPrivateInfoOpen(false);
      setTailorInfoOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isDesktop]);


  const scheduledDates = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    return (data?.scheduled ?? []).filter((date) => date.date >= startOfToday);
  }, [data?.scheduled]);
  const privateDates = useMemo(
    () => (data?.privateDates ?? []).filter((date) => date.is_private_group),
    [data?.privateDates],
  );

  const groupedScheduled = useMemo(
    () => groupByMonth(scheduledDates, locale),
    [scheduledDates, locale],
  );

  useEffect(() => {
    const element = scrollWrapRef.current;
    if (!element) return;

    const update = () => {
      const hasOverflow = element.scrollHeight - element.clientHeight > 4;
      const nearBottom = element.scrollTop + element.clientHeight >= element.scrollHeight - 4;
      setShowScrollHint(hasOverflow && !nearBottom);
    };

    update();
    element.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      element.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [groupedScheduled.length, isLoading]);

  const privateMonths = useMemo<MonthPill[]>(() => {
    const monthMap = new Map<string, MonthPill>();
    const now = new Date();
    const currentYear = now.getFullYear();

    const normalizedMonths = Array.from(
      new Set(
        (months ?? [])
          .map((value) => (typeof value === "number" ? value : Number(value)))
          .filter((value) => Number.isFinite(value) && value >= 1 && value <= 12),
      ),
    ).sort((a, b) => a - b);

    if (normalizedMonths.length > 0) {
      normalizedMonths.forEach((month) => {
        [currentYear, currentYear + 1].forEach((year) => {
          const date = new Date(year, month - 1, 1);
          const { month: rawMonthLabel, year: yearLabel } = buildMonthLabel(date, locale);
          const monthLabel =
            language === "ES" ? rawMonthLabel.replace(/\s+de\s+/i, " ") : rawMonthLabel;
          const key = `${year}-${month}`;
          const fullLabel = `${monthLabel} ${yearLabel}`;
          monthMap.set(key, { key, monthLabel, yearLabel, fullLabel });
        });
      });
    } else {
      privateDates.forEach((date) => {
        const { month: rawMonthLabel, year: yearLabel } = buildMonthLabel(date.date, locale);
        const monthLabel =
          language === "ES" ? rawMonthLabel.replace(/\s+de\s+/i, " ") : rawMonthLabel;
        const key = `${date.date.getFullYear()}-${date.date.getMonth() + 1}`;
        const fullLabel = `${monthLabel} ${yearLabel}`;
        monthMap.set(key, { key, monthLabel, yearLabel, fullLabel });
      });
    }

    return Array.from(monthMap.values()).sort((a, b) => {
      const [aYear, aMonth] = a.key.split("-").map(Number);
      const [bYear, bMonth] = b.key.split("-").map(Number);
      if (aYear !== bYear) return aYear - bYear;
      return aMonth - bMonth;
    });
  }, [months, privateDates, locale, language]);

  const title =
    language === "ES"
      ? "Próximas Salidas"
      : language === "FR"
        ? "Prochains départs"
        : "Next Departures";

  const scheduledLabel =
    t("home.travelFormats.scheduled.title") || "Scheduled Departures";
  const privateLabel =
    t("home.travelFormats.private.title") || "Private Departures";
  const tailorLabel = t("home.travelFormats.tailor.title") || "Tailor-made trip";
  const tailorDescription =
    t("home.travelFormats.tailor.description") ||
    (language === "ES"
      ? "Ruta personalizada donde cada vuelo, estancia y actividad encaja contigo."
      : language === "FR"
        ? "Un itineraire personnalise ou chaque vol, sejour et activite s'adapte a vous."
        : "A custom route where every flight, stay, and activity fits your style and budget.");
  const talkWithUsLabel =
    t("card.chatWithUs") ||
    (language === "ES"
      ? "¡Chatea con nosotros!"
      : language === "FR"
        ? "Discutez avec nous !"
        : "Chat with us!");
  const privatePriceNote =
    t("home.travelFormats.private.priceNote") ||
    (language === "ES"
      ? "El precio varía en función del número de gente."
      : language === "FR"
        ? "Le prix varie en fonction du nombre de personnes."
        : "Price varies based on group size.");

  const availabilityLabel = (date: BookingDate) => {
    if (date.sold_out || date.available_spots <= 0) {
      return t("booking.soldOut") || "Sold out";
    }
    const suffix = language === "ES" ? "disponibles" : language === "FR" ? "disponibles" : "available";
    return `${date.available_spots} ${suffix}`;
  };

  const buildPrivateBookingHref = (key: string) => {
    if (!bookingHref) return "";
    const [year, month] = key.split("-").map((value) => Number(value));
    if (!year || !month) return bookingHref;
    const privateMonth = `${year}-${String(month).padStart(2, "0")}`;
    const [path, query] = bookingHref.split("?");
    const params = new URLSearchParams(query ?? "");
    params.set("mode", "private");
    params.set("privateMonth", privateMonth);
    params.set("groupType", "private");
    const qs = params.toString();
    return qs ? `${path}?${qs}` : path;
  };

  const handlePrivateMonth = (_label: string, key: string) => {
    if (!bookingHref) return;
    window.location.href = buildPrivateBookingHref(key);
  };

  const tableColumnCount = 3 + (bookingHref ? 1 : 0);
  const privateMonthsByYear = useMemo(() => {
    const grouped = new Map<string, MonthPill[]>();
    privateMonths.forEach((pill) => {
      const list = grouped.get(pill.yearLabel) ?? [];
      list.push(pill);
      grouped.set(pill.yearLabel, list);
    });
    return Array.from(grouped.entries()).sort(
      ([aYear], [bYear]) => Number(aYear) - Number(bYear),
    );
  }, [privateMonths]);

  const hasPrivateRangeForMonth = (key: string) => {
    const [yearStr, monthStr] = key.split("-");
    const year = Number(yearStr);
    const month = Number(monthStr);
    if (!Number.isFinite(year) || !Number.isFinite(month)) return false;
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    if (monthEnd < startOfToday) return false;
    return privateDates.some((date) => {
      const start = date.date;
      const end = date.endDate ?? date.date;
      return start <= monthEnd && end >= monthStart;
    });
  };

  const buildCheckoutHref = (date: BookingDate) => {
    const checkoutPath = buildPath("/checkout");
    const tripTitle = travelMeta?.title ?? "Viaje";
    const unitPrice = Number.isFinite(date.price) ? date.price : 0;
    const defaultPeople = 1;
    const params = new URLSearchParams({
      titulo: `Reserva: ${tripTitle}`,
      trip_title: tripTitle,
      grupo: date.is_open_group ? "Grupo abierto" : "Grupo privado",
      num_personas: String(defaultPeople),
      fecha: date.date instanceof Date ? date.date.toISOString() : "",
      fecha_fin: date.endDate instanceof Date ? date.endDate.toISOString() : date.date.toISOString(),
      paga_parcial: "false",
      notas_adicionales: date.name_event ?? "",
      precio_unitario: String(unitPrice),
      total: String(unitPrice * defaultPeople),
      travel_id: String(travelId),
      booking_id: String(date.id),
      max_personas: String(Math.max(1, date.available_spots || 1)),
      min_personas: String(Math.max(1, date.min_pers ?? 1)),
      destino: travelMeta?.destino ?? "",
      duracion: travelMeta?.duration ?? "",
      imagen: travelMeta?.imgUrl ?? "",
      nivel: travelMeta?.level ?? "",
      initial_payment_percentage:
        travelMeta?.initialPaymentPercentage != null ? String(travelMeta.initialPaymentPercentage) : "",
    });
    return `${checkoutPath}?${params.toString()}`;
  };

  return (
    <section id="departures" data-scrollspy className="scroll-mt-[140px]">
      <div id="departures-anchor" data-scrollspy-anchor className="h-0" />
      <Card>
        <CardContent className="p-5 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold">{title}</h2>
              <TooltipProvider>
                <Tooltip
                  open={!isDesktop ? infoOpen : undefined}
                  onOpenChange={!isDesktop ? setInfoOpen : undefined}
                >
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      ref={infoTriggerRef}
                      onClick={(event) => {
                        if (isDesktop) {
                          event.preventDefault();
                          return;
                        }
                        event.preventDefault();
                        setInfoOpen((current) => !current);
                      }}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                      aria-label={t("travel.help") || "Help"}
                    >
                      <HelpCircle className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent ref={infoContentRef} className="max-w-xs">
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="font-semibold">
                          {scheduledLabel}:
                        </span>{" "}
                        {t("home.travelFormats.scheduled.description") ||
                          "Join a fixed-date departure and share the experience."}
                      </p>
                      <p>
                        <span className="font-semibold">
                          {privateLabel}:
                        </span>{" "}
                        {t("home.travelFormats.private.description") ||
                          "Exclusive trip for your family or friends. We adapt date, level, and pace."}
                      </p>
                      <p>
                        <span className="font-semibold">
                          {tailorLabel}:
                        </span>{" "}
                        {tailorDescription}
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="flex flex-wrap items-center gap-2" />
          </div>

          <div className="min-h-[220px]">
            <div className="space-y-6">
              <Card className="relative border border-border shadow-sm">
                <CardContent className="p-6 pb-0 space-y-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-foreground">{scheduledLabel}</h3>
                    <TooltipProvider>
                      <Tooltip
                        open={!isDesktop ? scheduledInfoOpen : undefined}
                        onOpenChange={!isDesktop ? setScheduledInfoOpen : undefined}
                      >
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            ref={scheduledTriggerRef}
                            onClick={(event) => {
                              if (isDesktop) {
                                event.preventDefault();
                                return;
                              }
                              event.preventDefault();
                              setScheduledInfoOpen((current) => !current);
                            }}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                            aria-label={t("travel.help") || "Help"}
                          >
                            <HelpCircle className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent ref={scheduledContentRef} className="max-w-xs">
                          <div className="text-sm">
                            {t("home.travelFormats.scheduled.description") ||
                              "Join a fixed-date departure and share the experience."}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div
                    ref={scrollWrapRef}
                    className="max-h-[420px] overflow-y-auto overflow-x-auto -mx-6"
                  >
                    <table className="min-w-full text-sm">
                      <thead className="bg-muted/40 text-muted-foreground">
                        <tr className="text-left">
                          <th className="px-4 py-3 font-medium hidden sm:table-cell">
                            {language === "ES" ? "Fechas" : language === "FR" ? "Dates" : "Dates"}
                          </th>
                          <th className="px-4 py-3 font-medium hidden sm:table-cell">
                            {language === "ES" ? "Disponibilidad" : language === "FR" ? "Disponibilité" : "Availability"}
                          </th>
                          <th className="px-4 py-3 font-medium hidden sm:table-cell">
                            {language === "ES" ? "Precio" : language === "FR" ? "Prix" : "Price"}
                          </th>
                          {bookingHref && (
                            <th className="px-4 py-3 font-medium hidden sm:table-cell" aria-hidden="true" />
                          )}
                        </tr>
                      </thead>
                      {isLoading && (
                        <tbody>
                          <tr>
                            <td className="px-4 py-6 text-muted-foreground" colSpan={tableColumnCount}>
                              {t("booking.loading") || "Loading..."}
                            </td>
                          </tr>
                        </tbody>
                      )}
                      {!isLoading && groupedScheduled.length === 0 && (
                        <tbody>
                          <tr>
                            <td className="px-4 py-6 text-muted-foreground" colSpan={tableColumnCount}>
                              {t("booking.noGroupDepartures") ||
                                "No group departures available at this time"}
                            </td>
                          </tr>
                        </tbody>
                      )}
                      {groupedScheduled.map((group) => {
                        const colSpan = 3 + (bookingHref ? 1 : 0);
                        return (
                          <tbody key={group.key}>
                            <tr className="bg-muted/60">
                              <td
                                className="px-4 py-2 text-xs font-semibold tracking-widest text-slate-600"
                                colSpan={colSpan}
                              >
                                {group.label}
                              </td>
                            </tr>
                            {group.rows.map((date) => {
                              const canReserve = !date.sold_out && date.available_spots > 0;
                              const eventLabel =
                                date.name_etiqueta && date.name_etiqueta !== "-1"
                                  ? date.name_etiqueta
                                  : null;
                              const durationLabel = formatDurationFromRange(
                                date.date,
                                date.endDate ?? null,
                                language,
                              );

                              return (
                              <Fragment key={date.id}>
                              <tr className="hidden border-t border-border/60 sm:table-row">
                                <td className="px-4 py-3 font-medium text-slate-900">
                                  <div className="hidden sm:block">
                                    <span>{`${formatDateRange(date.date, date.endDate ?? null, locale)} • ${durationLabel}`}</span>
                                    {eventLabel && (
                                      <div className="mt-1.5 text-xs font-medium text-muted-foreground">
                                        {eventLabel}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3 hidden sm:table-cell">
                                  <span
                                    className={
                                      date.sold_out || date.available_spots <= 0
                                        ? "text-red-600"
                                        : "text-foreground"
                                    }
                                  >
                                    {availabilityLabel(date)}
                                  </span>
                                </td>
                                <td className="px-4 py-3 hidden sm:table-cell">
                                  <div className="text-base font-semibold text-slate-900">
                                    {formatPrice(date.price)}
                                  </div>
                                  {typeof travelMeta?.originalPrice === "number" &&
                                    travelMeta.originalPrice > date.price && (
                                      <div className="text-xs text-muted-foreground line-through">
                                        {formatPrice(travelMeta.originalPrice)}
                                      </div>
                                    )}
                                </td>
                                {bookingHref && (
                                  <td className="px-4 py-3 text-right hidden sm:table-cell">
                                    <Link
                                      href={buildCheckoutHref(date)}
                                      className={`inline-flex items-center justify-center rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm transition ${
                                        canReserve
                                          ? "bg-blue-600 text-white hover:bg-blue-700"
                                          : "cursor-not-allowed bg-muted text-muted-foreground"
                                      }`}
                                      aria-disabled={!canReserve}
                                      onClick={(event) => {
                                        if (!canReserve) {
                                          event.preventDefault();
                                        }
                                      }}
                                      title={"Book this departure"}>
                                      {t("booking.reserve") || "Book"}
                                    </Link>
                                  </td>
                                )}
                              </tr>
                              <tr className="sm:hidden">
                                <td className="px-4 pt-2 pb-2" colSpan={3}>
                                  {bookingHref && canReserve ? (
                                    <Link
                                      href={buildCheckoutHref(date)}
                                      className="block"
                                      aria-label={t("booking.reserve") || "Book"}
                                      title={"Book this departure"}>
                                      <div className="flex w-full flex-col gap-1 rounded-xl border border-border/60 bg-muted/20 px-3 py-2 text-xs transition hover:border-primary/60 hover:bg-muted/30">
                                        <div className="flex items-start justify-between gap-2">
                                          <div>
                                            <div className="text-xs font-semibold leading-snug text-slate-900">
                                              {`${formatDateRange(date.date, date.endDate ?? null, locale)} • ${durationLabel}`}
                                            </div>
                                            {eventLabel && (
                                              <div className="mt-1 text-xs font-medium text-muted-foreground">
                                                {eventLabel}
                                              </div>
                                            )}
                                          </div>
                                          <div className="text-right">
                                            <div className="text-sm font-semibold leading-snug text-slate-900">
                                              {formatPrice(date.price)}
                                            </div>
                                            {typeof travelMeta?.originalPrice === "number" &&
                                              travelMeta.originalPrice > date.price && (
                                                <div className="text-[11px] text-muted-foreground line-through">
                                                  {formatPrice(travelMeta.originalPrice)}
                                                </div>
                                              )}
                                          </div>
                                        </div>
                                        <div className="flex items-center justify-between gap-2">
                                          <div className="font-medium">
                                            <span className="text-foreground">
                                              {availabilityLabel(date)}
                                            </span>
                                          </div>
                                          <div className="inline-flex items-center justify-center rounded-full px-3 py-1 text-[11px] font-semibold shadow-sm bg-blue-600 text-white">
                                            {t("booking.reserve") || "Book"}
                                          </div>
                                        </div>
                                      </div>
                                    </Link>
                                  ) : (
                                    <div className="flex w-full flex-col gap-1 rounded-xl border border-border/60 bg-muted/20 px-3 py-2 text-xs">
                                      <div className="flex items-start justify-between gap-2">
                                        <div>
                                          <div className="text-xs font-semibold leading-snug text-slate-900">
                                            {`${formatDateRange(date.date, date.endDate ?? null, locale)} • ${durationLabel}`}
                                          </div>
                                          {eventLabel && (
                                            <div className="mt-1 text-xs font-medium text-muted-foreground">
                                              {eventLabel}
                                            </div>
                                          )}
                                        </div>
                                        <div className="text-right">
                                          <div className="text-sm font-semibold leading-snug text-slate-900">
                                            {formatPrice(date.price)}
                                          </div>
                                          {typeof travelMeta?.originalPrice === "number" &&
                                            travelMeta.originalPrice > date.price && (
                                              <div className="text-[11px] text-muted-foreground line-through">
                                                {formatPrice(travelMeta.originalPrice)}
                                              </div>
                                            )}
                                        </div>
                                      </div>
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="font-medium">
                                          <span
                                            className={
                                              date.sold_out || date.available_spots <= 0
                                                ? "text-red-600"
                                                : "text-foreground"
                                            }
                                          >
                                            {availabilityLabel(date)}
                                          </span>
                                        </div>
                                        {bookingHref && (
                                          <div
                                            className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-[11px] font-semibold shadow-sm ${
                                              canReserve
                                                ? "bg-blue-600 text-white"
                                                : "cursor-not-allowed bg-muted text-muted-foreground"
                                            }`}
                                            aria-disabled={!canReserve}
                                          >
                                            {t("booking.reserve") || "Book"}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </td>
                              </tr>
                              </Fragment>
                            );
                            })}
                          </tbody>
                        );
                      })}
                    </table>
                  </div>
                  {showScrollHint && (
                    <div className="absolute inset-x-0 bottom-2 flex justify-center animate-bounce">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/95 text-muted-foreground shadow-md ring-1 ring-black/5">
                        <ChevronDown className="h-7 w-7" />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card className="border border-border shadow-sm">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-foreground">{privateLabel}</h3>
                    <TooltipProvider>
                      <Tooltip
                        open={!isDesktop ? privateInfoOpen : undefined}
                        onOpenChange={!isDesktop ? setPrivateInfoOpen : undefined}
                      >
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            ref={privateTriggerRef}
                            onClick={(event) => {
                              if (isDesktop) {
                                event.preventDefault();
                                return;
                              }
                              event.preventDefault();
                              setPrivateInfoOpen((current) => !current);
                            }}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                            aria-label={t("travel.help") || "Help"}
                          >
                            <HelpCircle className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent ref={privateContentRef} className="max-w-xs">
                          <div className="text-sm">
                            {t("home.travelFormats.private.description") ||
                              "Exclusive trip for your family or friends. We adapt date, level, and pace."}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                {privateMonths.length === 0 ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                    <p className="text-sm text-muted-foreground">
                      {language === "ES"
                        ? "No hay disponibilidad privada por ahora."
                        : language === "FR"
                          ? "Aucune disponibilité privée pour le moment."
                          : "No private availability at the moment."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {privateMonthsByYear.map(([yearLabel, months]) => (
                      <div key={yearLabel} className="space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                          {yearLabel}
                        </p>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                          {months.map(({ key, monthLabel, fullLabel }) => {
                            const isAvailable = hasPrivateRangeForMonth(key);
                            return (
                              <button
                                key={key}
                                type="button"
                                onClick={() => isAvailable && handlePrivateMonth(fullLabel, key)}
                                disabled={!isAvailable}
                                className={`relative flex w-full flex-col items-center justify-center rounded-2xl border px-4 py-3 text-base font-semibold shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                                  isAvailable
                                    ? "border-blue-600 bg-blue-600 text-white hover:border-blue-700 hover:bg-blue-700"
                                    : "cursor-not-allowed border-border/60 bg-muted/40 text-muted-foreground"
                                }`}
                              >
                                {!isAvailable && (
                                  <span
                                    aria-hidden="true"
                                    className="pointer-events-none absolute inset-0 flex items-center justify-center"
                                  >
                                    <span className="h-px w-[120%] -rotate-12 bg-red-500/70" />
                                  </span>
                                )}
                                <span className="text-base capitalize">
                                  {language === "ES"
                                    ? monthLabel.replace(/\s+de\s+/i, " ")
                                    : monthLabel}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-sm text-muted-foreground">{privatePriceNote}</p>
                </CardContent>
              </Card>
              <Card className="border border-border shadow-sm">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-foreground">{tailorLabel}</h3>
                    <TooltipProvider>
                      <Tooltip
                        open={!isDesktop ? tailorInfoOpen : undefined}
                        onOpenChange={!isDesktop ? setTailorInfoOpen : undefined}
                      >
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            ref={tailorTriggerRef}
                            onClick={(event) => {
                              if (isDesktop) {
                                event.preventDefault();
                                return;
                              }
                              event.preventDefault();
                              setTailorInfoOpen((current) => !current);
                            }}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                            aria-label={t("travel.help") || "Help"}
                          >
                            <HelpCircle className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent ref={tailorContentRef} className="max-w-xs">
                          <div className="text-sm">{tailorDescription}</div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className="text-sm text-muted-foreground">{tailorDescription}</p>
                  <a
                    href="https://wa.me/34613037700"
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="inline-flex"
                   title={"Chat on WhatsApp"}>
                    <Button className="bg-black text-white hover:bg-black/90">
                      {talkWithUsLabel}
                    </Button>
                  </a>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};
