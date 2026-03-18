import { Calendar as CalendarIcon, Users, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

type BookingHeroProps = {
  headline: string;
  travelTitle: string;
  duration: string;
  destination: string;
  monthsLabel: string;
  showMonths?: boolean;
};

export const BookingHero = ({
  headline,
  travelTitle,
  duration,
  destination,
  monthsLabel,
  showMonths = true,
}: BookingHeroProps) => (
  <div className="mb-6 sm:mb-8 text-center max-w-4xl mx-auto px-0">
    <motion.h1
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-primary via-primary to-primary/80 bg-clip-text text-transparent leading-tight py-[6px] lg:text-6xl"
    >
      {headline}
    </motion.h1>

    <motion.p
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="text-lg sm:text-xl text-muted-foreground mb-4 sm:mb-6 py-[4px] font-medium md:text-2xl"
    >
      {travelTitle}
    </motion.p>

    <motion.div
      className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 lg:gap-8 text-sm sm:text-base text-muted-foreground"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <div className="flex items-center gap-2 bg-background/60 backdrop-blur-sm px-3 py-2 rounded-full border border-border/50">
        <Clock className="h-4 w-4 text-primary" />
        <span className="font-medium">{duration}</span>
      </div>
      <div className="flex items-center gap-2 bg-background/60 backdrop-blur-sm px-3 py-2 rounded-full border border-border/50">
        <Users className="h-4 w-4 text-primary" />
        <span className="font-medium">{destination}</span>
      </div>
      {showMonths && (
        <div className="flex items-center gap-2 bg-background/60 backdrop-blur-sm px-3 py-2 rounded-full border border-border/50">
          <CalendarIcon className="h-4 w-4 text-primary" />
          <span className="font-medium">{monthsLabel}</span>
        </div>
      )}
    </motion.div>
  </div>
);
