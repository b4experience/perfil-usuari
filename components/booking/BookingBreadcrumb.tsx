import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useT } from '@/i18n/useT';

type BookingBreadcrumbProps = {
  onBack: () => void;
  travelTitle: string;
};

export const BookingBreadcrumb = ({ onBack, travelTitle }: BookingBreadcrumbProps) => {
  const { t } = useT();

  return (
    <div className="mb-6 sm:mb-8">
      <Button
        variant="ghost"
        onClick={onBack}
        className="mb-4 sm:mb-6 -ml-2 text-muted-foreground hover:text-foreground transition-colors duration-200 group"
      >
        <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
        <span className="hidden sm:inline">
          {t('booking.backTo')} {travelTitle}
        </span>
        <span className="sm:hidden">{t('booking.backTo')}</span>
      </Button>
    </div>
  );
};
