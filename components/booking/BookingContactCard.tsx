import { motion } from 'framer-motion';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ContactForm from '@/components/ContactForm';
import { useT } from '@/i18n/useT';

type BookingContactCardProps = {
  travelId: string;
};

export const BookingContactCard = ({ travelId }: BookingContactCardProps) => {
  const { t } = useT();

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="mt-8"
    >
      <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-6">
          <CardTitle className="text-2xl font-bold">{t('contact.title')}</CardTitle>
        </CardHeader>
        <CardContent className="pb-8">
          <ContactForm travelId={travelId} />
        </CardContent>
      </Card>
    </motion.div>
  );
};
