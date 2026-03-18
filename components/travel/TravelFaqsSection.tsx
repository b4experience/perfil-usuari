import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useT } from '@/i18n/useT';
import type { Travel } from '@/types/travel';

type FaqEntry = [string, NonNullable<Travel['faqs']>[string]];

type TravelFaqsSectionProps = {
  travelTitle: string;
  faqsData: FaqEntry[];
};

export const TravelFaqsSection = ({ travelTitle, faqsData }: TravelFaqsSectionProps) => {
  const { t } = useT();
  const [openFaqs, setOpenFaqs] = useState<string[]>([]);

  if (!faqsData.length) {
    return null;
  }

  const allFaqsOpen = openFaqs.length === faqsData.length && faqsData.length > 0;
  const handleFaqsChange = (values: string[]) => setOpenFaqs(values);
  const toggleAllFaqs = () => setOpenFaqs(allFaqsOpen ? [] : faqsData.map(([id]) => id));

  return (
    <section id="faqs" data-scrollspy className="scroll-mt-[140px]">
      <div id="faqs-anchor" data-scrollspy-anchor className="h-0" />
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-left">
              {t('travel.faqs.title')} {travelTitle}
            </h3>
            {faqsData.length > 1 && (
              <Button size="sm" variant="outline" onClick={toggleAllFaqs}>
                {allFaqsOpen ? t('travel.itinerary.collapseAll') : t('travel.itinerary.expandAll')}
              </Button>
            )}
          </div>

          <Accordion type="multiple" className="w-full" value={openFaqs} onValueChange={handleFaqsChange}>
            {faqsData.map(([key, faq]) => (
              <AccordionItem key={key} value={key}>
                <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                <AccordionContent>
                  {faq.answer && <p className="text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </section>
  );
};
