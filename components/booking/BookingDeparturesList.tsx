import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, Users } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/utils/price';
import { useT } from '@/i18n/useT';
import type { BookingDate } from '@/types/booking';

type BookingDeparturesListProps = {
  dates: BookingDate[];
  language: string;
  onReserve: (date: BookingDate) => void;
};

const getLocale = (language: string) => {
  if (language === 'ES') return 'es-ES';
  if (language === 'FR') return 'fr-FR';
  return 'en-US';
};

export const BookingDeparturesList = ({ dates, language, onReserve }: BookingDeparturesListProps) => {
  const { t } = useT();

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-6">
          <CardTitle className="text-2xl font-bold">{t('booking.groupDepartures')}</CardTitle>
          <p className="text-muted-foreground mt-2">{t('booking.joinOtherTravelers')}</p>
        </CardHeader>
        <CardContent className="pb-8">
          <div className="space-y-4">
            {dates.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/30 flex items-center justify-center">
                  <CalendarIcon className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-lg">{t('booking.noGroupDepartures')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {dates.map((date) => {
                  const locale = getLocale(language);
                  const startDateLabel = date.date.toLocaleDateString(locale, {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  });
                  const endDateLabel = date.endDate
                    ? date.endDate.toLocaleDateString(locale, {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })
                    : null;

                  return (
                    <motion.div
                      key={date.id}
                      className="relative p-6 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all duration-300"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ y: -2 }}
                    >
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="text-xl font-bold text-foreground mb-1">
                              {startDateLabel}
                              {endDateLabel && (
                                <span className="text-base text-muted-foreground ml-2">
                                  - {endDateLabel}
                                </span>
                              )}
                            </div>

                            {date.name_event && (
                              <div className="text-sm font-medium text-primary mb-2">
                                {date.name_event}
                              </div>
                            )}

                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Users className="h-4 w-4" />
                              <span>
                                {date.available_spots}{' '}
                                {date.available_spots === 1
                                  ? t('booking.spotLeft')
                                  : t('booking.spotsLeft')}
                              </span>
                            </div>
                          </div>

                          <div className="text-right ml-4">
                            <div className="text-3xl font-bold text-foreground mb-1">
                              {formatPrice(date.price)}
                            </div>
                            <div className="text-sm text-muted-foreground mb-3">
                              {t('booking.perPerson')}
                            </div>
                            <Button
                              size="lg"
                              className="min-w-[120px] font-semibold"
                              onClick={() => onReserve(date)}
                              disabled={date.sold_out}
                            >
                              {date.sold_out ? t('booking.soldOut') : t('booking.reserve')}
                            </Button>
                          </div>
                        </div>

                        {date.sold_out && (
                          <Badge variant="destructive" className="w-fit">
                            {t('booking.soldOut')}
                          </Badge>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
