import { motion } from 'framer-motion';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useT } from '@/i18n/useT';

type BookingTravelSummaryProps = {
  imageUrl: string;
  title: string;
  duration: string;
  destination: string;
  level: string;
};

export const BookingTravelSummary = ({
  imageUrl,
  title,
  duration,
  destination,
  level,
}: BookingTravelSummaryProps) => {
  const { t } = useT();

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm sticky top-6">
        <CardContent className="p-0">
          <div className="rounded-t-2xl overflow-hidden">
            <img src={imageUrl} alt={title} className="w-full h-auto object-contain" title={title} />
          </div>

          <div className="p-6">
            <h3 className="text-xl font-bold mb-4 leading-tight">{title}</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="font-medium text-muted-foreground">{t('booking.duration')}</span>
                <span className="font-bold">{duration}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="font-medium text-muted-foreground">{t('booking.destination')}</span>
                <span className="font-bold">{destination}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="font-medium text-muted-foreground">{t('booking.level')}</span>
                <Badge variant="secondary" className="font-medium">
                  {level}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
