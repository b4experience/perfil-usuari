import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { HTMLContent } from '@/components/HTMLContent';
import { useT } from '@/i18n/useT';
import type { Travel } from '@/types/travel';

type TravelThingsSectionProps = {
  travel: Travel;
};

export const TravelThingsSection = ({ travel }: TravelThingsSectionProps) => {
  const { t } = useT();
  const [openItems, setOpenItems] = useState<string[]>([]);

  const availableItems = useMemo(() => {
    const items: string[] = [];
    if (travel.details?.desc_compl && travel.details?.desc_compl_titulo) {
      items.push('desc_compl');
    }
    if (travel.details?.included || travel.details?.no_included) {
      items.push('included');
    }
    if (travel.details?.material_titulo) {
      items.push('material');
    }
    if (travel.details?.politica && travel.details?.politica_titulo) {
      items.push('policy');
    }
    return items;
  }, [travel.details]);

  if (!availableItems.length) {
    return null;
  }

  const allOpen = openItems.length === availableItems.length && availableItems.length > 0;
  const toggleAll = () => setOpenItems(allOpen ? [] : availableItems);

  return (
    <section id="things" data-scrollspy className="scroll-mt-[140px]">
      <div id="things-anchor" data-scrollspy-anchor className="h-0" />
      <Card>
        <CardContent className="p-5 space-y-3 sm:p-6">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold">
              {t('travel.things.title')} {travel?.title}
            </h2>
            <Button size="sm" variant="outline" onClick={toggleAll}>
              {allOpen ? t('travel.itinerary.collapseAll') : t('travel.itinerary.expandAll')}
            </Button>
          </div>

          <Accordion type="multiple" className="w-full" value={openItems} onValueChange={setOpenItems}>
            {travel.details?.desc_compl && travel.details?.desc_compl_titulo && (
              <AccordionItem value="desc_compl">
                <AccordionTrigger className="py-3">{travel.details?.desc_compl_titulo}</AccordionTrigger>
                <AccordionContent className="pb-3">
                  <HTMLContent
                    content={travel.details?.desc_compl || ''}
                    variant="details"
                    className="text-muted-foreground"
                  />
                </AccordionContent>
              </AccordionItem>
            )}

            {(travel.details?.included || travel.details?.no_included) && (
              <AccordionItem value="included">
                <AccordionTrigger className="py-3">{t('travel.things.includedTitle')}</AccordionTrigger>
                <AccordionContent className="pb-3">
                  <div className="mt-2 grid gap-3 md:grid-cols-2 md:gap-4">
                    <div>
                      <h4 className="mb-1.5 font-semibold text-green-600">{t('travel.things.included')}</h4>
                      <ul className="space-y-1.5 text-sm">
                        {(travel.details?.included ?? []).map((item: string, idx: number) => (
                          <li key={idx}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="mb-1.5 font-semibold text-red-600">{t('travel.things.notIncluded')}</h4>
                      <ul className="space-y-1.5 text-sm">
                        {(travel.details?.no_included ?? []).map((item: string, idx: number) => (
                          <li key={idx}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {travel.details?.material_titulo && (
              <AccordionItem value="material">
                <AccordionTrigger className="py-3">{travel.details?.material_titulo}</AccordionTrigger>
                <AccordionContent className="pb-3">
                  <HTMLContent
                    content={travel.details.material || ''}
                    variant="small"
                    className="text-muted-foreground html-content-materials text-[14px] leading-relaxed"
                  />
                </AccordionContent>
              </AccordionItem>
            )}

            {travel.details?.politica && travel.details?.politica_titulo && (
              <AccordionItem value="policy">
                <AccordionTrigger className="py-3 text-left">
                  {travel.details.politica_titulo}
                </AccordionTrigger>
                <AccordionContent className="pb-3">
                  <HTMLContent
                    content={travel.details.politica || ''}
                    variant="details"
                    className="text-muted-foreground"
                  />
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </CardContent>
      </Card>
    </section>
  );
};
