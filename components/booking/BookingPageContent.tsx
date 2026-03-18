'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';

import { BookingBreadcrumb } from '@/components/booking/BookingBreadcrumb';
import { BookingDeparturesList } from '@/components/booking/BookingDeparturesList';
import { BookingTravelSummary } from '@/components/booking/BookingTravelSummary';
import { BookingCalendar } from '@/components/BookingCalendar';
import { Button } from '@/components/ui/button';
import { useTravelBySlug } from '@/hooks/useTravelBySlug';
import { useT } from '@/i18n/useT';
import { supabase } from '@/integrations/supabase/client';
import type { BookingDate, PrivateGroupOption } from '@/types/booking';
import { useLanguage } from '@/context/LanguageContext';
import { useLocalizedPath } from '@/utils/localizedPaths';

const toInt = (n: any, def = 0) => {
  const v = Number(n);
  return Number.isFinite(v) ? v : def;
};

const iso = (d?: Date | null) => (d instanceof Date ? d.toISOString() : null);

const reservaTitle = (tripTitle?: string) => {
  const base = (tripTitle || '').trim();
  return `Reserva: ${base || 'Viaje'}`;
};

export type BookingPageContentProps = {
  slug?: string;
};

export const BookingPageContent = ({ slug }: BookingPageContentProps) => {
  const { t } = useT();
  const { language } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const buildPath = useLocalizedPath();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [peopleCount, setPeopleCount] = useState(2);
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');
  const privatePeopleInitializedRef = useRef(false);

  const mode = searchParams?.get('mode') ?? '';
  const privateMonth = searchParams?.get('privateMonth');
  const isPrivateMode = mode === 'private';

  const { data: travel, isLoading: travelLoading } = useTravelBySlug(slug);

  useEffect(() => {
    if (travel?.title) {
      document.title = `${travel.title} - B4Experience`;
    }
  }, [travel?.title]);

  const { data: queryResult, isLoading: datesLoading } = useQuery<{
    dates: BookingDate[];
    privateGroups: PrivateGroupOption[];
  }>({
    queryKey: ['booking-dates', travel?.id],
    queryFn: async () => {
      if (!travel?.id) throw new Error('Travel ID not available');

      const [openDatesResult, privateDatesResult] = await Promise.all([
        (supabase as any)
          .from('FechasAbiertas')
          .select('*')
          .filter('"id prod"', 'eq', travel.id)
          .not('date_start', 'is', null)
          .order('date_start', { ascending: true }),
        (supabase as any)
          .from('FechasPrivadas')
          .select('*')
          .filter('"id prod"', 'eq', travel.id)
          .order('min_pers', { ascending: true }),
      ]);

      if (openDatesResult.error) throw openDatesResult.error;
      if (privateDatesResult.error) throw privateDatesResult.error;

      const openDates = openDatesResult.data || [];
      const privateDates = privateDatesResult.data || [];

      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const mappedOpenDates: BookingDate[] = openDates
        .map((date: any) => ({
          id: date.id,
          date: new Date(date.date_start!),
          endDate: date.date_end ? new Date(date.date_end) : null,
          price: Number(date.price) || 0,
          available_spots: Math.max(0, (date.places_total || 8) - (date.places_taken || 0)),
          is_open_group: !date.sold_out,
          is_private_group: false,
          name_event: date.name_event || t('booking.openGroup'),
          name_etiqueta: date.name_etiqueta || '',
          categoria: date.categoria ?? 'estandar',
          places_total: date.places_total || 8,
          places_taken: date.places_taken || 0,
          sold_out: !!date.sold_out,
          min_pers: date.min_pers || undefined,
          max_pers: date.max_pers || undefined,
        }))
        .filter((date: { date: Date; }) => date.date >= startOfToday);

      const mappedPrivateDates: BookingDate[] = privateDates
        .filter((date: any) => date.date_begin)
        .map((date: any) => {
          const startDate = new Date(date.date_begin);
          const endDate = date.date_end ? new Date(date.date_end) : startDate;

          return {
            id: `private_${date.id}`,
            date: startDate,
            endDate,
            price: Number(date.price) || 0,
            available_spots: date.max_pers || 10,
            is_open_group: false,
            is_private_group: true,
            name_event: t('booking.privateGroup'),
            categoria: date.categoria ?? 'estandar',
            places_total: date.max_pers || 10,
            places_taken: 0,
            sold_out: false,
            min_pers: date.min_pers || 2,
            max_pers: date.max_pers || 10,
          };
        })
        .filter((date: any) => {
          const end = date.endDate instanceof Date ? date.endDate : date.date;
          return end >= startOfToday;
        });

      const privateGroupsData: PrivateGroupOption[] = privateDates.map((date: any) => ({
        id: `private_${date.id}`,
        price: Number(date.price) || 0,
        min_pers: date.min_pers || 2,
        max_pers: date.max_pers || 10,
        etiquetas: date.etiquetas || 'Grupo privado',
      }));

      const allDates = [...mappedOpenDates, ...mappedPrivateDates].sort(
        (a, b) => a.date.getTime() - b.date.getTime(),
      );

      return { dates: allDates, privateGroups: privateGroupsData };
    },
    enabled: !!travel?.id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
  });

  const dates = queryResult?.dates || [];
  const privateGroups = queryResult?.privateGroups || [];

  const priceByMinPersons = useMemo(() => {
    if (!dates.length) return [];
    const currentYear = new Date().getFullYear();
    const minPriceByMinPers = new Map<number, number>();
    dates.forEach((date) => {
      if (!date.is_private_group) return;
      if (!(date.date instanceof Date)) return;
      if (date.date.getFullYear() < currentYear) return;
      const minPers = typeof date.min_pers === 'number' ? date.min_pers : undefined;
      if (!minPers || !Number.isFinite(minPers)) return;
      const price = Number(date.price);
      if (!Number.isFinite(price)) return;
      const existing = minPriceByMinPers.get(minPers);
      if (existing === undefined || price < existing) {
        minPriceByMinPers.set(minPers, price);
      }
    });
    return Array.from(minPriceByMinPers.entries())
      .map(([min_pers, price]) => ({ min_pers, price }))
      .sort((a, b) => a.min_pers - b.min_pers);
  }, [dates]);

  const minPeopleForPrivate = useMemo(() => {
    if (!isPrivateMode) return 1;
    const minValues = dates
      .filter((date) => date.is_private_group)
      .map((date) => date.min_pers)
      .filter((min): min is number => typeof min === 'number' && min > 0)
      .sort((a, b) => a - b);
    return minValues.length > 0 ? minValues[0] : 1;
  }, [dates, isPrivateMode]);

  useEffect(() => {
    if (dates.length > 0 || privateGroups.length > 0) {
      if (isPrivateMode) {
        if (!privatePeopleInitializedRef.current) {
          setPeopleCount(minPeopleForPrivate);
          privatePeopleInitializedRef.current = true;
        } else if (peopleCount < minPeopleForPrivate) {
          setPeopleCount(minPeopleForPrivate);
        }
        return;
      }

      const hasOpenDatesFor2 = dates.some(
        (date) =>
          (date.is_open_group || !date.is_private_group) && date.places_total - date.places_taken >= 2,
      );
      const hasPrivateDatesFor2 = privateGroups.some((pg) => pg.min_pers <= 2 && pg.max_pers >= 2);

      if (!hasOpenDatesFor2 && !hasPrivateDatesFor2) {
        const minValues = privateGroups
          .map((pg) => pg.min_pers)
          .filter((min) => min > 2)
          .sort((a, b) => a - b);
        if (minValues.length > 0) setPeopleCount(minValues[0]);
      }
    }
  }, [dates, privateGroups, isPrivateMode, minPeopleForPrivate]);

  const filteredDates = useMemo(() => {
    const base = isPrivateMode ? dates.filter((date) => date.is_private_group) : dates;
    if (selectedCategory === 'todas') return base;
    if (selectedCategory === 'estandar') {
      return base.filter((date) => !date.categoria || date.categoria === 'estandar');
    }
    return base.filter((date) => date.categoria === selectedCategory);
  }, [dates, selectedCategory, isPrivateMode]);

  const openGroupDates = useMemo(
    () => filteredDates.filter((date) => date.is_open_group),
    [filteredDates],
  );

  const privateDatesOnly = useMemo(
    () => dates.filter((date) => date.is_private_group),
    [dates],
  );

  const hasPrivateDatesForMonth = useMemo(() => {
    if (!isPrivateMode || !privateMonth) return true;
    const [yearStr, monthStr] = privateMonth.split('-');
    const year = Number(yearStr);
    const month = Number(monthStr);
    if (!Number.isFinite(year) || !Number.isFinite(month)) return true;
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0);
    return privateDatesOnly.some((date) => {
      const rangeStart = date.date;
      const rangeEnd = date.endDate ?? date.date;
      return rangeStart <= monthEnd && rangeEnd >= monthStart;
    });
  }, [isPrivateMode, privateMonth, privateDatesOnly]);

  const clampPeopleForDate = (count: number, selectedBookingDate?: BookingDate) => {
    let next = Math.max(1, count);
    if (!selectedBookingDate) return next;
    if (selectedBookingDate.is_private_group) {
      next = Math.max(next, minPeopleForPrivate);
      if (typeof selectedBookingDate.max_pers === 'number') {
        next = Math.min(next, selectedBookingDate.max_pers);
      }
      return next;
    }
    const maxOpen = selectedBookingDate.places_total - selectedBookingDate.places_taken;
    if (Number.isFinite(maxOpen) && maxOpen > 0) {
      next = Math.min(next, maxOpen);
    }
    return next;
  };

  const buildCheckoutNormalized = (selectedBookingDate?: BookingDate, ppl?: number) => {
    const tripTitle = travel?.title ?? 'Viaje';
    const titulo = reservaTitle(tripTitle);
    const rawCount = toInt(ppl ?? peopleCount, 1);
    const count = clampPeopleForDate(rawCount, selectedBookingDate);
    const unit = toInt(selectedBookingDate?.price, 0);
    const total = unit * count;

    const normalized = {
      titulo,
      trip_title: tripTitle,
      grupo: selectedBookingDate
        ? selectedBookingDate.is_open_group
          ? 'Grupo abierto'
          : 'Grupo privado'
        : 'Sin fecha',
      num_personas: String(count),
      categoria: selectedBookingDate?.categoria ?? 'estandar',
      fecha: iso(selectedBookingDate?.date) || '',
      fecha_fin: iso(selectedBookingDate?.endDate ?? selectedBookingDate?.date) || '',
      paga_parcial: 'false',
      notas_adicionales: selectedBookingDate?.name_event ?? '',
      precio_unitario: String(unit),
      total: String(total),
      travel_id: travel?.id ? String(travel.id) : '',
      booking_id: selectedBookingDate?.id ? String(selectedBookingDate.id) : '',
      max_personas: String(selectedBookingDate?.available_spots ?? selectedBookingDate?.max_pers ?? ''),
      min_personas: selectedBookingDate
        ? String(
            Math.max(
              1,
              selectedBookingDate.is_private_group ? minPeopleForPrivate : selectedBookingDate?.min_pers ?? 1,
            ),
          )
        : '',
      destino: travel?.destino ?? '',
      duracion: travel?.duration ?? '',
      imagen: travel?.imgUrl ?? '',
      nivel: travel?.level ?? '',
      initial_payment_percentage:
        travel?.initialPaymentPercentage != null ? String(travel.initialPaymentPercentage) : '',
    };
    return normalized;
  };

  const pushToCheckout = (selectedBookingDate?: BookingDate, ppl?: number) => {
    if (selectedBookingDate && selectedBookingDate.price === -1) {
      window.open('https://wa.me/34613037700', '_blank');
      return;
    }

    const normalized = buildCheckoutNormalized(selectedBookingDate, ppl);

    try {
      sessionStorage.setItem('checkout_normalized', JSON.stringify({ normalized }));
    } catch {}

    const qp = new URLSearchParams(normalized as any);
    const checkoutPath = buildPath('/checkout');
    router.push(`${checkoutPath}?${qp.toString()}`);
  };


  const handleBackHome = () => router.push(buildPath('/'));

  const isDateInRange = (target: Date, start: Date, end?: Date | null) => {
    const targetDay = new Date(target);
    targetDay.setHours(0, 0, 0, 0);
    const startDay = new Date(start);
    startDay.setHours(0, 0, 0, 0);
    const endDay = new Date(end ?? start);
    endDay.setHours(0, 0, 0, 0);
    return targetDay >= startDay && targetDay <= endDay;
  };

  if (travelLoading || datesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div className="flex items-center gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
          <span className="text-lg text-muted-foreground font-medium">{t('booking.loadingOptions')}</span>
        </motion.div>
      </div>
    );
  }

  if (!travel) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md mx-auto px-6">
          <h1 className="text-3xl font-bold mb-4 text-foreground">{t('booking.tripNotFound')}</h1>
          <p className="text-muted-foreground mb-6">{t('booking.tripNotAvailable')}</p>
          <Button onClick={handleBackHome} variant="default" size="lg">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('booking.backToHome')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <main className="bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-6 sm:py-8">
        <motion.div
          className="max-w-7xl mx-auto space-y-8 sm:space-y-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <BookingBreadcrumb
            onBack={() => {
              if (slug) {
                router.push(buildPath(`/${slug}`));
              } else {
                router.back();
              }
            }}
            travelTitle={travel.title}
          />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8"
          >
            <BookingCalendar
              dates={isPrivateMode ? privateDatesOnly : dates}
              selectedDate={selectedDate}
              onDateSelect={(date, bookingDateFromCalendar) => {
                if (date) {
                  const bookingDate =
                    bookingDateFromCalendar ??
                    (() => {
                      const privateCandidates = filteredDates.filter(
                        (d) => d.is_private_group && isDateInRange(date, d.date, d.endDate ?? d.date),
                      );
                      if (privateCandidates.length > 0) {
                        return (
                          privateCandidates.find((d) => {
                            const categoryOk =
                              selectedCategory === 'todas' ||
                              (d.categoria || 'estandar') === selectedCategory;
                            const minOk =
                              typeof d.min_pers === 'number' ? peopleCount >= d.min_pers : true;
                            const maxOk =
                              typeof d.max_pers === 'number' ? peopleCount <= d.max_pers : true;
                            return categoryOk && minOk && maxOk;
                          }) ?? privateCandidates[0]
                        );
                      }
                      return filteredDates.find(
                        (d) =>
                          !d.is_private_group &&
                          d.date.toDateString() === date.toDateString(),
                      );
                    })();
                  if (bookingDate) {
                    const clamped = clampPeopleForDate(peopleCount, bookingDate);
                    if (clamped !== peopleCount) {
                      setPeopleCount(clamped);
                    }
                    pushToCheckout(bookingDate, clamped);
                  } else {
                    const availablePrivate = privateGroups.find(
                      (g) => peopleCount >= g.min_pers && peopleCount <= g.max_pers,
                    );
                    if (availablePrivate) {
                      const mock: BookingDate = {
                        id: availablePrivate.id,
                        date,
                        endDate: date,
                        price: availablePrivate.price,
                        available_spots: peopleCount,
                        is_open_group: false,
                        is_private_group: true,
                        name_event: availablePrivate.etiquetas || t('booking.privateGroup'),
                        categoria: selectedCategory === 'todas' ? 'estandar' : selectedCategory,
                        places_total: peopleCount,
                        places_taken: 0,
                        sold_out: false,
                        min_pers: availablePrivate.min_pers,
                        max_pers: availablePrivate.max_pers,
                      };
                      const clamped = clampPeopleForDate(peopleCount, mock);
                      if (clamped !== peopleCount) {
                        setPeopleCount(clamped);
                      }
                      pushToCheckout(mock, clamped);
                    }
                  }
                }
                setSelectedDate(date === undefined ? undefined : date);
              }}
              peopleCount={peopleCount}
              onPeopleCountChange={setPeopleCount}
              hidePassengers={false}
              minPeople={isPrivateMode ? minPeopleForPrivate : 1}
              selectedCategory={selectedCategory}
              groupTypeMode={isPrivateMode ? 'private' : 'all'}
              lockGroupType={isPrivateMode}
              initialMonth={isPrivateMode ? privateMonth : null}
              travel={{
                months: travel?.months,
                price: travel?.price,
                duration: travel?.duration,
                days: travel?.duration ? parseInt(travel.duration.match(/(\d+)/)?.[1] || '8', 10) : 8,
              }}
              privateGroups={privateGroups}
              priceByMinPersons={priceByMinPersons}
            />
          </motion.div>

          <div
            className={`grid grid-cols-1 gap-6 sm:gap-8 lg:gap-12 ${
              isPrivateMode ? "" : "xl:grid-cols-3"
            }`}
          >
            <div className={isPrivateMode ? "space-y-6 sm:space-y-8" : "xl:col-span-2 space-y-6 sm:space-y-8"}>
              {!isPrivateMode && (
                <BookingDeparturesList
                  dates={openGroupDates}
                  language={language}
                  onReserve={(date) => {
                    setSelectedDate(date.date);
                    pushToCheckout(date, peopleCount);
                  }}
                />
              )}

            </div>

            {!isPrivateMode && (
              <div className="space-y-8">
                <BookingTravelSummary
                  imageUrl={travel.imgUrl}
                  title={travel.title}
                  duration={travel.duration}
                  destination={travel.destino}
                  level={travel.level}
                />
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </main>
  );
};
