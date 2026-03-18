'use client';

import { forwardRef } from 'react';
import Link from 'next/link';
import { SquareCheckBig, Download } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatPrice } from '@/utils/price';
import { sanitizeHtmlContent } from '@/utils/sanitizeHtml';
import { useT } from '@/i18n/useT';
import { useLanguage } from '@/context/LanguageContext';
import type { Travel } from '@/types/travel';
import { getRibbonStyle } from '@/utils/ribbon';

type TravelPriceCardProps = {
  travel: Travel;
  bookingHref?: string;
};


const getDiscountPct = (original?: number, current?: number): number => {
  if (
    typeof original !== 'number' ||
    typeof current !== 'number' ||
    original <= 0 ||
    current <= 0 ||
    original <= current
  ) {
    return 0;
  }

  return Math.round(((original - current) / original) * 100);
};

export const TravelPriceCard = forwardRef<HTMLDivElement, TravelPriceCardProps>(
  ({ travel, bookingHref = 'book' }, ref) => {
  const { t } = useT();
  const { language } = useLanguage();
  const price = travel?.price ?? -1;
  const dto_etiqueta = travel?.dto_etiqueta;
  const ribbon = getRibbonStyle(travel?.ribbon);
  const fallbackOldPrice = typeof price === 'number' ? price + 400 : undefined;
  const oldPrice =
    typeof travel?.originalPrice === 'number' ? travel.originalPrice : fallbackOldPrice;
  const discountPct = getDiscountPct(oldPrice, price);
  const formatDownloadName = (title: string) => {
    const sanitized = sanitizeHtmlContent(title);
    const safeTitle = sanitized
      .replace(/[\\/:*?"<>|]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!safeTitle) return 'B4Experience.pdf';

    const titleCase = safeTitle
      .toLowerCase()
      .split(' ')
      .filter(Boolean)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    return `${titleCase} - B4Experience.pdf`;
  };
  const downloadName = formatDownloadName(travel.title);
  const downloadUrl = `https://aqfvdnnmeywvzivkvlhi.supabase.co/storage/v1/object/public/pdf/${language}/${travel.id}.pdf?download=1`;

  const handleDownload = async (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();

    try {
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error('Download failed');
      }
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = downloadName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(downloadUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const scrollToContact = () => {
    const element = document.getElementById('contact');
    if (element) {
      const headerOffset = 140;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };
  const scrollToDepartures = () => {
    const element = document.getElementById('departures');
    if (element) {
      const headerOffset =
        parseFloat(
          getComputedStyle(document.documentElement)
            .getPropertyValue("--header-visible-height")
            .trim(),
        ) || 0;
      const navOffset =
        parseFloat(
          getComputedStyle(document.documentElement)
            .getPropertyValue("--sections-nav-height")
            .trim(),
        ) || 0;
      const offset = headerOffset + navOffset + 15;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };
  const getButtonClasses = () => {
    const baseClasses = 'justify-start w-full text-left border-2';

    if (dto_etiqueta === true) {
      return `${baseClasses} border-blue-500 text-blue-700 bg-blue-50 hover:bg-blue-100`;
    }

    if (dto_etiqueta === false) {
      return `${baseClasses} border-yellow-500 text-yellow-700 bg-yellow-50 hover:bg-yellow-100`;
    }

    return `${baseClasses} border-gray-300 text-gray-900 bg-white hover:bg-gray-50`;
  };
  return (
    <Card
      ref={ref}
      className="relative transition-all duration-300"
    >
      {ribbon ? (
        <span
          className={`absolute right-4 top-4 z-10 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide shadow-md ${ribbon.className}`}
        >
          {ribbon.label}
        </span>
      ) : null}
      <CardContent className="p-5 space-y-4">
        <div>
          {discountPct > 0 && (
            <p className="text-sm text-muted-foreground line-through">
              {oldPrice !== undefined ? formatPrice(oldPrice) : null}
            </p>
          )}

          {price !== -1 && <p className="text-sm">{t('travel.price.from')}</p>}

          <div className="flex items-center gap-2">
            {price === -1 ? (
              <a
                href="https://wa.me/34613037700"
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="text-4xl font-bold text-blue-500 hover:underline"
               title={"Chat on WhatsApp"}>
                {t('card.consultPrice')}
              </a>
            ) : (
              <p className="text-4xl font-bold">{formatPrice(price)}</p>
            )}

            {price !== -1 && discountPct > 0 && (
              <Badge className="bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors cursor-pointer">
                {discountPct}%
              </Badge>
            )}
          </div>
        </div>

        <ul className="space-y-2">
          <li className="flex items-start gap-3">
            <SquareCheckBig className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-sm">{t('travel.cta.groups')}</p>
          </li>
          <li className="flex items-start gap-3">
            <SquareCheckBig className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-sm">{t('travel.cta.otherDates')}</p>
          </li>
        </ul>

        <Button size="lg" className="w-full" onClick={scrollToDepartures}>
          {t('travel.buttons.checkAvailability')}
        </Button>

        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a
              href="https://wa.me/34613037700"
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="w-full"
             title={"Chat on WhatsApp"}>
              <Button className="w-full bg-black text-white hover:bg-black/90">
                {t('card.chatWithUs')}
              </Button>
            </a>
            <Button
              className="w-full bg-white text-black border border-black hover:bg-white/90"
              onClick={scrollToContact}
            >
              {t('travel.buttons.sendInquiry')}
            </Button>
          </div>

          <Separator />
          <p className="text-lg font-semibold mb-4">{t('travel.plan.title')}</p>
          <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="block w-full"
            onClick={handleDownload}
            title={"Download trip PDF"}>
            <Button variant="outline" className={getButtonClasses()}>
              <Download className="h-4 w-4 mr-2" />
              {t('travel.plan.downloadPdf')}
            </Button>
          </a>
        </div>
      </CardContent>
    </Card>
  );
});

TravelPriceCard.displayName = 'TravelPriceCard';
