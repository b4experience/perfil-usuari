import { useEffect, useMemo, useRef, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { HTMLContent } from '@/components/HTMLContent';
import { useT } from '@/i18n/useT';
import { optimizeSupabaseImage } from '@/utils/image';
import type { TravelAccommodation, TravelGuide } from '@/types/travel';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Swiper as SwiperType } from 'swiper';

type SectionView = 'accommodations' | 'guides';

type TravelAccommodationsSectionProps = {
  accommodations?: TravelAccommodation[];
  guides?: TravelGuide[];
};

export const TravelAccommodationsSection = ({
  accommodations = [],
  guides = [],
}: TravelAccommodationsSectionProps) => {
  const { t } = useT();
  const imageSwiperRef = useRef<SwiperType | null>(null);
  const outerSwiperRef = useRef<SwiperType | null>(null);
  const [activeAccommodationIndex, setActiveAccommodationIndex] = useState(0);

  const sortedAccommodations = useMemo(
    () =>
      [...accommodations].sort(
        (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)
      ),
    [accommodations]
  );

  const maxAccommodationIndex = Math.max(
    0,
    sortedAccommodations.length - 1
  );

  const hasAccommodationContent = sortedAccommodations.some(
    (item) =>
      item.title ||
      item.description ||
      item.images.length ||
      Boolean(item.lang)
  );

  const hasGuideContent = guides.some(
    (guide) => guide.name || guide.description || guide.imageUrl
  );
  const hasGuides = hasGuideContent;

  const guidesSwiperRef = useRef<SwiperType | null>(null);
  const [activeGuideIndex, setActiveGuideIndex] = useState(0);

  const [activeView, setActiveView] = useState<SectionView>(() =>
    hasAccommodationContent
      ? 'accommodations'
      : hasGuides
        ? 'guides'
        : 'accommodations'
  );

  useEffect(() => {
    setActiveAccommodationIndex((previous) =>
      Math.min(previous, maxAccommodationIndex)
    );
  }, [maxAccommodationIndex]);

  useEffect(() => {
    setActiveGuideIndex((previous) =>
      Math.min(previous, Math.max(0, guides.length - 1))
    );
  }, [guides.length]);

  const viewOptions = useMemo(() => {
    const options: { id: SectionView; label: string }[] = [];
    if (hasAccommodationContent) {
      options.push({
        id: 'accommodations',
        label: t('travel.accommodations.title'),
      });
    }
    if (hasGuides) {
      options.push({
        id: 'guides',
        label: t('travel.guides.title'),
      });
    }
    return options;
  }, [hasAccommodationContent, hasGuides, t]);

  const availableViews = useMemo(
    () => viewOptions.map((option) => option.id),
    [viewOptions]
  );

  useEffect(() => {
    if (!availableViews.length) return;
    setActiveView((current) =>
      availableViews.includes(current) ? current : availableViews[0]
    );
  }, [availableViews]);

  if (!hasAccommodationContent && !hasGuides) {
    return null;
  }

  const hasMultipleAccommodations = sortedAccommodations.length > 1;
  const canPrev = activeAccommodationIndex > 0;
  const canNext = activeAccommodationIndex < sortedAccommodations.length - 1;
  const hasMultipleGuides = guides.length > 1;
  const canPrevGuide = activeGuideIndex > 0;
  const canNextGuide = activeGuideIndex < guides.length - 1;
  const sectionTitle =
    activeView === 'guides'
      ? t('travel.guides.title')
      : t('travel.accommodations.title');

  return (
    <section id="accommodations" data-scrollspy className="scroll-mt-[140px]">
      <div id="accommodations-anchor" data-scrollspy-anchor className="h-0" />
      <Card className="relative overflow-visible">
        <CardContent className="space-y-6 p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold">{sectionTitle}</h2>
            {viewOptions.length > 1 && (
            <div className="mx-auto flex w-full max-w-[320px] items-center justify-center gap-2 rounded-full border border-border/60 bg-muted/40 p-1 text-sm lg:ml-auto lg:mx-0 lg:justify-end">
              {viewOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setActiveView(option.id)}
                  aria-pressed={activeView === option.id}
                    className={cn(
                      'flex-1 min-w-[120px] rounded-full px-3 py-1 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 text-center sm:px-4',
                      activeView === option.id
                        ? 'bg-primary text-primary-foreground shadow'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                >
                  {option.label}
                </button>
              ))}
              </div>
            )}
          </div>

          {activeView === 'accommodations' && hasAccommodationContent && (
            <div className="relative overflow-visible px-3">
              <Swiper
                onSwiper={(swiper) => {
                  outerSwiperRef.current = swiper;
                }}
                onSlideChange={(swiper) =>
                  setActiveAccommodationIndex(swiper.activeIndex)
                }
                spaceBetween={24}
                slidesPerView={1}
                className="travel-accommodations-swiper"
              >
                {sortedAccommodations.map((accommodation, index) => {
                  const displayOrder =
                    typeof accommodation.orderIndex === 'number'
                      ? accommodation.orderIndex + 1
                      : index + 1;
                  const heading =
                    accommodation.title ||
                    t('travel.accommodations.defaultTitle', {
                      index: displayOrder,
                    });
                  const hasImages = accommodation.images.length > 0;

                  return (
                    <SwiperSlide key={accommodation.id}>
                      <article
                        className={`flex h-full flex-col gap-6 ${
                          hasImages ? 'xl:flex-row xl:items-stretch' : ''
                        }`}
                      >
                        <div
                          className={`space-y-2 ${
                            hasImages ? 'xl:w-[50%]' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-foreground">
                              {heading}
                            </h3>
                          </div>
                          {accommodation.description && (
                            <HTMLContent
                              content={accommodation.description}
                              variant="details"
                              className="text-sm text-muted-foreground max-w-3xl"
                            />
                          )}
                        </div>

                        {hasImages && (
                          <div className="relative flex-1 xl:w-[50%]">
                            <div className="relative">
                              <Swiper
                                modules={[Pagination]}
                                pagination={{ clickable: true }}
                                spaceBetween={8}
                                slidesPerView={1}
                                className="accommodation-image-swiper rounded-2xl border border-border/70 bg-muted p-0"
                                onSwiper={(swiper) => {
                                  imageSwiperRef.current = swiper;
                                }}
                              >
                                {accommodation.images.map(
                                  (imageUrl, imageIndex) => (
                                    <SwiperSlide
                                      key={`${accommodation.id}-${imageIndex}`}
                                    >
                                      <div className="relative h-[220px] w-full overflow-hidden rounded-2xl bg-black/5 sm:h-[260px]">
                                        <img
                                          src={optimizeSupabaseImage(imageUrl, {
                                            width: 1400,
                                          })}
                                          alt={`${heading} ${
                                            imageIndex + 1
                                          }`}
                                          className="h-full w-full object-cover"
                                          loading="lazy"
                                        />
                                      </div>
                                    </SwiperSlide>
                                  )
                                )}
                              </Swiper>
                              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                <button
                                  type="button"
                                  onClick={() =>
                                    imageSwiperRef.current?.slidePrev()
                                  }
                                  className="pointer-events-auto absolute left-1 top-1/2 hidden -translate-y-1/2 rounded-full border border-border/50 bg-white/90 p-2 shadow-lg transition hover:border-primary hover:text-primary lg:inline-flex"
                                  aria-label={t(
                                    'travel.accommodations.prevButton'
                                  )}
                                >
                                  <ChevronLeft className="h-5 w-5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    imageSwiperRef.current?.slideNext()
                                  }
                                  className="pointer-events-auto absolute right-1 top-1/2 hidden -translate-y-1/2 rounded-full border border-border/50 bg-white/90 p-2 shadow-lg transition hover:border-primary hover:text-primary lg:inline-flex"
                                  aria-label={t(
                                    'travel.accommodations.nextButton'
                                  )}
                                >
                                  <ChevronRight className="h-5 w-5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </article>
                    </SwiperSlide>
                  );
                })}
              </Swiper>
            </div>
          )}

          {activeView === 'guides' && hasGuides && (
            <div className="relative overflow-visible px-3">
              <Swiper
                onSwiper={(swiper) => {
                  guidesSwiperRef.current = swiper;
                }}
                onSlideChange={(swiper) => setActiveGuideIndex(swiper.activeIndex)}
                spaceBetween={24}
                slidesPerView={1}
                className="travel-accommodations-swiper"
              >
                {guides.map((guide) => (
                <SwiperSlide key={`guide-${guide.id}`}>
                  <article className="flex flex-col gap-4 rounded-2xl bg-background/80 p-4 transition sm:flex-row sm:items-center">
                    {guide.imageUrl && (
                      <div className="relative w-full overflow-hidden rounded-2xl bg-muted/60 sm:w-[30%]">
                        <div className="h-[260px] w-full sm:h-full">
                          <img
                            src={optimizeSupabaseImage(guide.imageUrl, {
                              width: 1600,
                            })}
                            alt={guide.name}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      </div>
                    )}
                    <div
                      className={`flex-1 space-y-2 ${guide.imageUrl ? 'sm:w-[70%]' : ''}`}
                    >
                      <h3 className="text-lg font-semibold text-foreground">
                        {guide.name}
                      </h3>
                      {guide.description && (
                        <HTMLContent
                          content={guide.description}
                          variant="details"
                          className="text-sm text-muted-foreground max-w-3xl"
                        />
                      )}
                    </div>
                  </article>
                </SwiperSlide>
                ))}
              </Swiper>
            </div>
          )}
        </CardContent>
        {activeView === 'accommodations' && hasMultipleAccommodations && (
          <div
            className="pointer-events-none absolute inset-x-0 top-1/2 z-50 flex items-center justify-between"
            style={{ left: '1rem', right: '1rem' }}
          >
            <button
              type="button"
              onClick={() => outerSwiperRef.current?.slidePrev()}
              disabled={!canPrev}
              className={`pointer-events-auto rounded-full border-2 border-border/90 bg-background/90 p-2 shadow-2xl shadow-black/30 ring-1 ring-white/60 transition hover:border-primary hover:text-primary ${
                !canPrev ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              aria-label={t('travel.accommodations.prevAccommodation')}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => outerSwiperRef.current?.slideNext()}
              disabled={!canNext}
              className={`pointer-events-auto rounded-full border-2 border-border/90 bg-background/90 p-2 shadow-2xl shadow-black/30 ring-1 ring-white/60 transition hover:border-primary hover:text-primary ${
                !canNext ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              aria-label={t('travel.accommodations.nextAccommodation')}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
        {activeView === 'guides' && hasMultipleGuides && (
          <div
            className="pointer-events-none absolute inset-x-0 top-1/2 z-50 flex items-center justify-between"
            style={{ left: '1rem', right: '1rem' }}
          >
            <button
              type="button"
              onClick={() => guidesSwiperRef.current?.slidePrev()}
              disabled={!canPrevGuide}
              className={`pointer-events-auto rounded-full border-2 border-border/90 bg-background/90 p-2 shadow-2xl shadow-black/30 ring-1 ring-white/60 transition hover:border-primary hover:text-primary ${
                !canPrevGuide ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              aria-label={t('travel.accommodations.prevAccommodation')}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => guidesSwiperRef.current?.slideNext()}
              disabled={!canNextGuide}
              className={`pointer-events-auto rounded-full border-2 border-border/90 bg-background/90 p-2 shadow-2xl shadow-black/30 ring-1 ring-white/60 transition hover:border-primary hover:text-primary ${
                !canNextGuide ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              aria-label={t('travel.accommodations.nextAccommodation')}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </Card>
      <style jsx global>{`
        .accommodation-image-swiper .swiper-pagination-bullet {
          background: rgba(255, 255, 255, 0.92);
          border: 2px solid rgba(15, 23, 42, 0.25);
          width: 8px;
          height: 8px;
          border-radius: 999px;
          margin: 0 4px !important;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.25);
        }
        .accommodation-image-swiper .swiper-pagination-bullet-active {
          background: rgba(59, 130, 246, 0.98);
          border-color: rgba(59, 130, 246, 0.4);
          box-shadow: 0 0 0 2px rgba(15, 23, 42, 0.35);
          width: 8px;
          height: 8px;
        }
        .accommodation-image-swiper .swiper-pagination {
          position: absolute;
          bottom: 12px !important;
          left: 50% !important;
          transform: translateX(-50%);
          padding: 2px 4px !important;
          background: rgba(15, 23, 42, 0.7);
          border-radius: 999px;
          box-shadow: 0 14px 25px rgba(15, 23, 42, 0.35);
          backdrop-filter: blur(12px);
          display: inline-flex;
          justify-content: center;
          width: max-content !important;
          min-width: 0 !important;
        }
      `}</style>
    </section>
  );
};
