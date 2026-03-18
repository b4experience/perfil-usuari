import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { HTMLContent } from '@/components/HTMLContent';
import { useT } from '@/i18n/useT';
import type { Travel } from '@/types/travel';

type ItineraryEntry = NonNullable<Travel['fullItinerary']>[string];
type ItineraryItem = [string, ItineraryEntry];

type TravelItinerarySectionProps = {
  travelTitle: string;
  itineraryItems: ItineraryItem[];
};

export const TravelItinerarySection = ({
  travelTitle,
  itineraryItems,
}: TravelItinerarySectionProps) => {
  const { t } = useT();

  const [openDays, setOpenDays] = useState<string[]>([]);
  const allOpen = openDays.length === itineraryItems.length && itineraryItems.length > 0;

  useEffect(() => {
    if (itineraryItems.length) {
      setOpenDays([itineraryItems[0][0]]);
    }
  }, [itineraryItems]);

  const handleChange = (values: string[]) => setOpenDays(values);
  const toggleAll = () => setOpenDays(allOpen ? [] : itineraryItems.map(([id]) => id));

  if (!itineraryItems.length) {
    return null;
  }

  return (
    <section id="itinerary" data-scrollspy className="scroll-mt-[140px]">
      <div id="itinerary-anchor" data-scrollspy-anchor className="h-0" />
      <Card>
        <CardContent className="p-5 space-y-3 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold mb-2 text-left lg:text-left">
              {t('travel.itinerary.title')} - {travelTitle}
            </h2>
            {itineraryItems.length > 1 && (
              <Button size="sm" variant="outline" onClick={toggleAll}>
                {allOpen ? t('travel.itinerary.collapseAll') : t('travel.itinerary.expandAll')}
              </Button>
            )}
          </div>

          <Accordion type="multiple" className="w-full" value={openDays} onValueChange={handleChange}>
            {itineraryItems.map(([id, value]) => (
              <AccordionItem key={id} value={id}>
                <AccordionTrigger className="py-3 text-left">{value.title}</AccordionTrigger>
                <AccordionContent className="pb-3">
                  {value.desc && (
                    <HTMLContent content={value.desc} variant="itinerary" className="text-muted-foreground" />
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </section>
  );
};
