import { useMemo } from 'react';
import { Calendar, Clock, Users, MapPin, BadgeCheck } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { HTMLContent } from '@/components/HTMLContent';
import { TravelPriceCard } from '@/components/travel/TravelPriceCard';
import { AlternativeTripsSection } from '@/components/AlternativeTripsSection';
import { useT } from '@/i18n/useT';
import { useLanguage } from '@/context/LanguageContext';
import type { Travel } from '@/types/travel';

type TravelIntroSectionProps = {
  travel: Travel;
  getFirstActivityName: (activities: number[]) => string;
  bookingHref: string;
  durationLabel: string;
  alternativeIds?: Array<number | string> | null;
};

const hasValidContent = (content: unknown): content is string => {
  if (typeof content !== 'string') {
    return false;
  }

  const trimmed = content.trim();
  return trimmed !== '' && trimmed.toLowerCase() !== 'null' && trimmed.toLowerCase() !== 'undefined';
};

const parseTimeToSeconds = (value: string): string => {
  if (!value) return value;
  if (/^\d+$/.test(value)) return value;

  const match = value.match(/(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)/i);
  if (!match) return value;

  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);

  const totalSeconds = hours * 3600 + minutes * 60 + seconds;
  return totalSeconds > 0 ? totalSeconds.toString() : value;
};

const buildYouTubeEmbedUrl = (videoId: string, params: URLSearchParams) => {
  if (!videoId) return '';

  const embedUrl = new URL(`https://www.youtube.com/embed/${videoId}`);
  const cleanedParams = new URLSearchParams(params.toString());
  cleanedParams.delete('v');

  const start = cleanedParams.get('start') || cleanedParams.get('t');
  if (start) {
    cleanedParams.delete('t');
    cleanedParams.set('start', parseTimeToSeconds(start));
  }

  const queryString = cleanedParams.toString();
  if (queryString) {
    embedUrl.search = `?${queryString}`;
  }

  return embedUrl.toString();
};

const getEmbeddableVideoUrl = (video: string): string => {
  try {
    const url = new URL(video);
    const hostname = url.hostname.replace(/^www\./, '');

    if (hostname === 'youtu.be') {
      const videoId = url.pathname.replace('/', '');
      return buildYouTubeEmbedUrl(videoId, url.searchParams);
    }

    if (hostname.endsWith('youtube.com')) {
      if (url.pathname.startsWith('/embed/')) {
        return video;
      }

      if (url.pathname === '/watch') {
        const videoId = url.searchParams.get('v');
        return buildYouTubeEmbedUrl(videoId || '', url.searchParams) || video;
      }

      if (url.pathname.startsWith('/shorts/')) {
        const [, , videoId] = url.pathname.split('/');
        return buildYouTubeEmbedUrl(videoId || '', url.searchParams) || video;
      }
    }

    return video;
  } catch {
    return video;
  }
};

const hasValidVideo = (video: unknown): boolean => {
  if (!hasValidContent(video)) {
    return false;
  }

  const trimmed = video.trim();

  if (/<iframe/i.test(trimmed)) {
    return /<iframe[^>]+src\s*=\s*['"][^'"]+['"][^>]*>/i.test(trimmed);
  }

  try {
    const url = new URL(trimmed);
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
};

const hasValidMap = (mapa: unknown): boolean => {
  if (!hasValidContent(mapa)) {
    return false;
  }

  const trimmed = mapa.trim();

  if (/<iframe/i.test(trimmed)) {
    return /<iframe[^>]+src\s*=\s*['"][^'"]+['"][^>]*>/i.test(trimmed);
  }

  try {
    const url = new URL(trimmed);
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
};

const scrollToSection = (id: string) => {
  const element = document.getElementById(id);
  if (!element) return;
  const headerOffset = parseFloat(
    getComputedStyle(document.documentElement)
      .getPropertyValue("--header-visible-height")
      .trim(),
  ) || 0;
  const elementPosition = element.getBoundingClientRect().top;
  const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

  window.scrollTo({
    top: offsetPosition,
    behavior: "smooth",
  });
};

export const TravelIntroSection = ({
  travel,
  getFirstActivityName,
  bookingHref,
  durationLabel,
  alternativeIds,
}: TravelIntroSectionProps) => {
  const { t } = useT();
  const { language } = useLanguage();

  const highlights = useMemo(
    () => travel?.details?.highlights ?? [],
    [travel?.details?.highlights],
  );
  const generalActivities = useMemo(
    () => travel?.actividades_generales || [],
    [travel?.actividades_generales],
  );

  const videoContent = travel?.multimedia?.video;
  const mapContent = travel?.multimedia?.mapa;
  const shouldShowVideo = hasValidVideo(videoContent);
  const shouldShowMap = hasValidMap(mapContent);
  const embeddableVideoUrl = useMemo(() => {
    if (!videoContent || /<iframe/i.test(videoContent)) {
      return null;
    }
    const url = getEmbeddableVideoUrl(videoContent);
    return url || videoContent;
  }, [videoContent]);

  return (
    <section id="intro" data-scrollspy className="scroll-mt-[140px]">
      <div id="intro-anchor" data-scrollspy-anchor className="h-0" />
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-bold mb-2">{travel.details?.subtitulo}</h2>

          <div>
            <HTMLContent
              content={travel.details?.descript_250 || ''}
              variant="itinerary"
              className="text-muted-foreground"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card>
          <CardContent className="p-6 sm:p-8">
            <h2 className="text-xl font-semibold mb-6 text-left">{t('travel.basic.title')}</h2>
            <ul className="space-y-4 text-base text-foreground">
              <li className="flex items-start">
                <MapPin className="h-5 w-5 text-primary mt-1 mr-3 flex-shrink-0" />
                <div className="flex w-full flex-wrap items-baseline">
                  <span className="font-medium text-muted-foreground">
                    {t('travel.basic.destination')}
                  </span>
                  <span className="mx-2 text-muted-foreground">|</span>
                  <span className="text-foreground">{travel.destino}</span>
                </div>
              </li>

              <li className="flex items-start">
                <Calendar className="h-5 w-5 text-primary mt-1 mr-3 flex-shrink-0" />
                <div className="flex w-full flex-wrap items-baseline">
                  <span className="font-medium text-muted-foreground">
                    {t('travel.basic.duration')}
                  </span>
                  <span className="mx-2 text-muted-foreground">|</span>
              <span className="text-foreground">{durationLabel}</span>
                </div>
              </li>

              <li className="flex items-start">
                <Users className="h-5 w-5 text-primary mt-1 mr-3 flex-shrink-0" />
                <div className="flex w-full flex-wrap items-baseline">
                  <span className="font-medium text-muted-foreground">
                    {t('travel.basic.groupType')}
                  </span>
                  <span className="mx-2 text-muted-foreground">|</span>
                  <span className="text-foreground">
                    {travel.open_group && travel.private_group && t('travel.basic.group.both')}
                    {travel.open_group && !travel.private_group && t('travel.basic.group.open')}
                    {travel.private_group && !travel.open_group && t('travel.basic.group.private')}
                    {!travel.open_group && !travel.private_group && t('travel.basic.group.ask')}
                  </span>
                  <span className="mx-2 text-muted-foreground">|</span>
                  <a
                    href="#departures"
                    onClick={(event) => {
                      event.preventDefault();
                      scrollToSection("departures");
                    }}
                    className="text-primary text-sm font-semibold hover:underline"
                   title={"Jump to section"}>
                    {t("travel.basic.seeDates") || "See dates"}
                  </a>
                </div>
              </li>

              <li className="flex items-start">
                <Clock className="h-5 w-5 text-primary mt-1 mr-3 flex-shrink-0" />
                <div className="flex w-full flex-wrap items-baseline">
                  <span className="font-medium text-muted-foreground">
                    {t('travel.basic.difficulty')}
                  </span>
                  <span className="mx-2 text-muted-foreground">|</span>
                  <span className="text-foreground">{travel.level}</span>
                </div>
              </li>

              <li className="flex items-start">
                <Clock className="h-5 w-5 text-primary mt-1 mr-3 flex-shrink-0" />
                <div className="flex w-full flex-wrap items-baseline">
                  <span className="font-medium text-muted-foreground">
                    {t('travel.basic.mainActivity')}
                  </span>
                  <span className="mx-2 text-muted-foreground">|</span>
                  <span className="text-foreground">
                    {getFirstActivityName(generalActivities)}
                  </span>
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 sm:p-8">
            <h2 className="text-xl font-semibold mb-6 text-left lg:text-left">
              {t('travel.highlights.title')}
            </h2>
            <ul className="text-base space-y-4">
              {highlights.map((highlight: string, index: number) => (
                <li key={index} className="flex items-start gap-3">
                  <BadgeCheck className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="block lg:hidden my-6">
        <TravelPriceCard travel={travel} bookingHref={bookingHref} />
      </div>

      <div className="block lg:hidden mt-6 pb-8">
        <AlternativeTripsSection
          alternativeIds={alternativeIds}
          currentTravelId={travel.id}
        />
      </div>

      {(shouldShowVideo || shouldShowMap) && (
        <div className="grid grid-cols-1 gap-6 mt-6 mb-8">
          {shouldShowVideo && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">{t('travel.video.title')}</h3>
                <div className="aspect-video w-full rounded-lg overflow-hidden bg-muted">
                  {videoContent && /<iframe/i.test(videoContent) ? (
                    <div
                      dangerouslySetInnerHTML={{ __html: videoContent }}
                      className="[&_iframe]:w-full [&_iframe]:h-full [&_iframe]:block"
                    />
                  ) : (
                    <iframe
                      src={embeddableVideoUrl || undefined}
                      title={`Video de ${travel.title}`}
                      className="w-full h-full block"
                      allowFullScreen
                      loading="lazy"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {shouldShowMap && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">{t('travel.map.title')}</h3>
                <div className="w-full rounded-lg overflow-hidden bg-muted">
                  <div
                    dangerouslySetInnerHTML={{ __html: mapContent || '' }}
                    className="aspect-[3/4] sm:aspect-[4/3] [&_iframe]:w-full [&_iframe]:h-full [&_iframe]:block"
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </section>
  );
};
