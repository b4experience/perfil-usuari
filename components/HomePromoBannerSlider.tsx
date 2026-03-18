'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Language } from '@/context/LanguageContext';
import { useActivePromosByType } from '@/hooks/useActivePromosByType';
import { useT } from '@/i18n/useT';
import { HomeHero } from '@/components/HomeHero';
import { SearchBar } from '@/components/SearchBar';
import type { PromoResolved } from '@/types/promo';

const VIMEO_ID_REGEX = /vimeo\.com\/(?:.*\/)?(\d+)/i;

const getVimeoEmbedUrl = (videoUrl: string) => {
  const match = videoUrl.match(VIMEO_ID_REGEX);
  const id = match?.[1];
  if (!id) return null;
  return `https://player.vimeo.com/video/${id}?background=1&autoplay=1&loop=1&muted=1&controls=0&rel=0&playsinline=1`;
};

const SUPABASE_PROMOS_BASE = 'https://aqfvdnnmeywvzivkvlhi.supabase.co/storage/v1/object/public/promos/';
const VIDEO_PROXY_ENDPOINT = '/api/video';

const getProxiedVideoUrl = (videoUrl: string) => {
  try {
    const parsed = new URL(videoUrl);
    if (!parsed.href.startsWith(SUPABASE_PROMOS_BASE)) return videoUrl;
    const fileName = parsed.pathname.split('/').pop();
    if (!fileName) return videoUrl;
    return `${VIDEO_PROXY_ENDPOINT}?file=${encodeURIComponent(fileName)}`;
  } catch {
    return videoUrl;
  }
};

interface HomePromoBannerSliderProps {
  language?: Language;
}

const AUTOPLAY_MS = 7000;

export const HomePromoBannerSlider = ({ language = 'EN' }: HomePromoBannerSliderProps) => {
  const { t } = useT();
  const { data: banners = [], error, isSuccess, isFetching, isError } = useActivePromosByType('banner');
  const [displayIndex, setDisplayIndex] = useState(0);
  const [disableTransition, setDisableTransition] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const dragStartXRef = useRef<number | null>(null);
  const videoBlobUrlsRef = useRef<Record<number, string>>({});
  const [videoBlobUrls, setVideoBlobUrls] = useState<Record<number, string>>({});

  const baseSlides = useMemo(
    () => banners.filter((banner) => Boolean(banner.image_url || banner.video_url)),
    [banners],
  );
  const [cachedSlides, setCachedSlides] = useState<PromoResolved[]>([]);
  useEffect(() => {
    if (baseSlides.length > 0 && isSuccess) {
      setCachedSlides(baseSlides);
    }
  }, [baseSlides, isSuccess]);
  const shouldShowCachedSlides =
    cachedSlides.length > 0 && (isError || (!isSuccess && isFetching));
  const slides = shouldShowCachedSlides ? cachedSlides : baseSlides;
  const moveToNextSlide = useCallback(() => {
    setDisplayIndex((prev) => {
      if (slides.length <= 1) return 0;
      const maxIndex = slides.length + 1;
      const next = prev + 1;
      return next > maxIndex ? 1 : next;
    });
  }, [slides.length]);
  const moveToPreviousSlide = useCallback(() => {
    setDisplayIndex((prev) => {
      if (slides.length <= 1) return 0;
      const next = prev - 1;
      return next < 0 ? slides.length : next;
    });
  }, [slides.length]);

  const trackSlides = useMemo(() => {
    if (slides.length <= 1) return slides;
    return [slides[slides.length - 1], ...slides, slides[0]];
  }, [slides]);

  const activeIndex = useMemo(() => {
    if (slides.length <= 1) return 0;
    if (displayIndex === 0) return slides.length - 1;
    if (displayIndex === slides.length + 1) return 0;
    return displayIndex - 1;
  }, [displayIndex, slides]);

  useEffect(() => {
    const controllers: Record<number, AbortController> = {};
    const activeIds = new Set(slides.map((slide) => slide.id));

    Object.entries(videoBlobUrlsRef.current).forEach(([key, url]) => {
      const id = Number(key);
      if (!activeIds.has(id)) {
        URL.revokeObjectURL(url);
        delete videoBlobUrlsRef.current[id];
      }
    });

    slides.forEach((slide) => {
      if (!slide.video_url) return;
      if (videoBlobUrlsRef.current[slide.id]) return;

      const controller = new AbortController();
      controllers[slide.id] = controller;

      fetch(getProxiedVideoUrl(slide.video_url), { signal: controller.signal })
        .then((response) => {
          if (!response.ok) {
            throw new Error('failed to download video');
          }
          return response.blob();
        })
        .then((blob) => {
          const objectUrl = URL.createObjectURL(blob);
          videoBlobUrlsRef.current[slide.id] = objectUrl;
          setVideoBlobUrls({ ...videoBlobUrlsRef.current });
        })
        .catch(() => {
          // Fall back to the proxied/video URL already set.
        });
    });

    if (Object.keys(videoBlobUrlsRef.current).length) {
      setVideoBlobUrls({ ...videoBlobUrlsRef.current });
    }

    return () => {
      Object.values(controllers).forEach((controller) => controller.abort());
    };
  }, [slides]);

  useEffect(() => {
    if (!error) return;
    console.error('Banner slider query failed:', error);
  }, [error]);

  useEffect(() => {
    if (baseSlides.length > 0 || banners.length === 0) return;
    console.warn('Banner promos found but none has image_url or video_url. Check promo media columns.');
  }, [banners.length, baseSlides.length]);

  useEffect(() => {
    if (slides.length === 0) {
      setDisplayIndex(0);
      return;
    }

    setDisableTransition(true);
    setDisplayIndex(slides.length > 1 ? 1 : 0);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => setDisableTransition(false));
    });
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return;
    if (isDragging) return;

    const interval = setInterval(() => {
      moveToNextSlide();
    }, AUTOPLAY_MS);

    return () => clearInterval(interval);
  }, [slides.length, isDragging, moveToNextSlide]);

  useEffect(() => {
    return () => {
      Object.values(videoBlobUrlsRef.current).forEach((url) => URL.revokeObjectURL(url));
      videoBlobUrlsRef.current = {};
    };
  }, []);

  if (slides.length === 0) {
    return <HomeHero language={language} />;
  }

  const actionText = t('common.learnMore', 'Learn more');

  const jumpToLogicalIndex = (index: number) => {
    if (slides.length <= 1) {
      setDisplayIndex(0);
      return;
    }

    setDisableTransition(false);
    setDisplayIndex(index + 1);
  };

  const handleTransitionEnd = () => {
    if (slides.length <= 1) return;

    if (displayIndex === 0) {
      setDisableTransition(true);
      setDisplayIndex(slides.length);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setDisableTransition(false));
      });
      return;
    }

    if (displayIndex === slides.length + 1) {
      setDisableTransition(true);
      setDisplayIndex(1);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setDisableTransition(false));
      });
    }
  };

  const beginDrag = (clientX: number) => {
    if (slides.length <= 1) return;
    dragStartXRef.current = clientX;
    setIsDragging(true);
    setDragOffset(0);
  };

  const updateDrag = (clientX: number) => {
    if (!isDragging || dragStartXRef.current === null) return;
    setDragOffset(clientX - dragStartXRef.current);
  };

  const endDrag = () => {
    if (!isDragging) return;

    const threshold = 60;
    if (dragOffset <= -threshold) {
      moveToNextSlide();
    } else if (dragOffset >= threshold) {
      moveToPreviousSlide();
    }

    dragStartXRef.current = null;
    setIsDragging(false);
    setDragOffset(0);
  };

  return (
    <section className="relative min-h-[450px] overflow-hidden md:min-h-[490px] lg:min-h-[520px]">
      <div className="absolute inset-0 overflow-hidden">
        <div
          className={`flex h-full select-none ${disableTransition || isDragging ? '' : 'transition-transform duration-500 ease-out'}`}
          style={{
            transform: `translateX(calc(-${displayIndex * 100}% + ${dragOffset}px))`,
            touchAction: 'pan-y',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            cursor: isDragging ? 'grabbing' : 'grab',
          }}
          onTransitionEnd={handleTransitionEnd}
          onPointerDown={(event) => {
            const target = event.target as HTMLElement;
            if (target.closest('a, button, input, textarea, select, [role="button"]')) return;
            beginDrag(event.clientX);
          }}
          onPointerMove={(event) => updateDrag(event.clientX)}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onPointerLeave={endDrag}
        >
          {trackSlides.map((slide, index) => {
            const title = slide.content.title?.trim() ?? '';
            const subtitle = slide.content.subtitle?.trim();
            const hasAction = Boolean(slide.content.link);
            const buttonText = slide.content.button_text?.trim() || actionText;
            const isActive = index === displayIndex;
            const vimeoEmbedUrl = slide.video_url ? getVimeoEmbedUrl(slide.video_url) : null;
            const proxiedVideoUrl = slide.video_url ? getProxiedVideoUrl(slide.video_url) : null;
            const blobVideoUrl = videoBlobUrls[slide.id];

            return (
              <div key={`${slide.id}-${index}`} className="relative h-full min-w-full select-none">
                {vimeoEmbedUrl ? (
                  <iframe
                    title={title || 'Promo video'}
                    src={vimeoEmbedUrl}
                    className="absolute inset-0 h-full w-full border-0 pointer-events-none"
                    loading={isActive ? 'eager' : 'lazy'}
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                    aria-hidden="true"
                  />
                ) : blobVideoUrl ? (
                  <video
                    src={blobVideoUrl}
                    className="absolute inset-0 h-full w-full object-cover"
                    autoPlay={isActive}
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    crossOrigin="anonymous"
                    onDragStart={(event) => event.preventDefault()}
                  />
                ) : slide.image_url ? (
                  <img
                    src={slide.image_url as string}
                    alt={title || 'Promotion banner'}
                    className="h-full w-full object-cover"
                    loading={isActive ? 'eager' : 'lazy'}
                    fetchPriority={isActive ? 'high' : 'auto'}
                    decoding="async"
                    draggable={false}
                    onDragStart={(event) => event.preventDefault()}
                  />
                ) : (
                  <video
                    src={proxiedVideoUrl ?? ''}
                    className="h-full w-full object-cover"
                    autoPlay={isActive}
                    muted
                    loop={isActive}
                    playsInline
                    preload="metadata"
                    onDragStart={(event) => event.preventDefault()}
                  />
                )}

                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/45 to-black/15" aria-hidden="true" />

                <div className="absolute inset-0 z-10 mx-auto flex min-h-[430px] w-full max-w-7xl items-end px-4 py-10 md:min-h-[440px] md:px-6 lg:min-h-[520px] lg:px-8">
                  <div className="max-w-3xl mb-5">
                    {slide.content.mini_title ? (
                      <p className="text-[10px] md:text-xs font-semibold uppercase tracking-[0.5em] text-yellow-200 leading-none mb-4">
                        {slide.content.mini_title}
                      </p>
                    ) : null}
                    {title ? (
                      <h2 className="text-3xl font-semibold leading-tight text-white sm:text-4xl md:text-5xl lg:text-6xl">
                        {title}
                      </h2>
                    ) : null}
                    {subtitle ? (
                      <p className="mt-3 text-lg text-white/90 sm:text-xl md:text-2xl lg:text-3xl">
                        {subtitle}
                      </p>
                    ) : null}
                    {hasAction ? (
                      <a
                        href={slide.content.link as string}
                        className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-white px-6 text-lg font-semibold text-slate-900 transition-colors hover:bg-white/90"
                        title={buttonText}
                      >
                        {buttonText}
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="absolute left-0 right-0 top-5 z-20 px-4 md:top-7 md:px-6 lg:top-9 lg:px-8">
        <SearchBar onSearch={() => { /* SearchBar already routes to /search */ }} />
      </div>

      {slides.length > 1 ? (
        <div className="absolute bottom-6 right-6 z-20 flex items-center gap-3">
          {slides.map((slide, index) => {
            const isActive = index === activeIndex;
            return (
              <button
                key={slide.id}
                type="button"
                onClick={() => jumpToLogicalIndex(index)}
                className={`h-4 w-4 rounded-full border transition ${
                  isActive ? 'border-white bg-white' : 'border-white/85 bg-transparent'
                }`}
                aria-label={`Go to banner ${index + 1}`}
              />
            );
          })}
        </div>
      ) : null}
    </section>
  );
};
