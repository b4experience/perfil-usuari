'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useActivePromoByType } from '@/hooks/useActivePromoByType';
import { useT } from '@/i18n/useT';

const HOME_PATHS = new Set(['/', '/es', '/fr']);

export const PromoStrip = () => {
  const pathname = usePathname();
  const isHome = HOME_PATHS.has(pathname || '/');
  const { t } = useT();
  const { data: promo } = useActivePromoByType('strip');
  const [isAtTop, setIsAtTop] = useState(true);

  const shouldRender = Boolean(promo?.content?.title || promo?.content?.subtitle);
  const isStripVisible = shouldRender && isAtTop;

  useEffect(() => {
    const onScroll = () => {
      setIsAtTop(window.scrollY <= 0);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const stripHeight = isStripVisible ? 'var(--header-height, 72px)' : '0px';
    const headerTopOffset = isStripVisible && isHome ? stripHeight : '0px';

    root.style.setProperty('--promo-strip-height', stripHeight);
    root.style.setProperty('--header-top-offset', headerTopOffset);

    return () => {
      root.style.setProperty('--promo-strip-height', '0px');
      root.style.setProperty('--header-top-offset', '0px');
    };
  }, [isHome, isStripVisible]);

  if (!shouldRender || !promo) return null;

  const topOffset = isHome ? '0px' : 'var(--header-visible-height, var(--header-height, 72px))';
  const bgColor = promo.bg_color ?? 'rgb(248, 212, 71)';
  const textColor = promo.text_color ?? 'rgb(15, 23, 42)';
  const title = promo.content.title ?? '';
  const subtitle = promo.content.subtitle?.trim();
  const label = subtitle ? `${title} · ${subtitle}` : title;
  const hasAction = Boolean(promo.content.link);
  const actionText = promo.content.button_text?.trim() || t('common.learnMore', 'Learn more');

  return (
    <div
      className={`fixed inset-x-0 z-[9999] h-[var(--header-height,72px)] transition-all duration-300 ease-out ${
        isStripVisible
          ? 'translate-y-0 opacity-100 pointer-events-auto'
          : '-translate-y-full opacity-0 pointer-events-none'
      }`}
      style={{
        top: topOffset,
        backgroundColor: bgColor,
        color: textColor,
        zIndex: 9999,
      }}
      data-promo-strip="true"
    >
      <div className="container mx-auto flex w-full max-w-[900px] flex-col items-center justify-center gap-1.5 px-4 py-2 text-center md:flex-row md:h-full md:items-center md:justify-center md:gap-4 md:px-6 md:py-0">
        <div className="flex w-full flex-col items-center justify-center gap-1.5 text-center md:hidden">
          {promo.icon_url ? (
            <img
              src={promo.icon_url}
              alt=""
              className="h-6 w-6 shrink-0 object-contain"
              loading="lazy"
              decoding="async"
            />
          ) : null}
          <p className="text-base font-medium leading-tight">{label}</p>
          {hasAction ? (
            <a
              href={promo.content.link as string}
              className="text-sm font-semibold underline underline-offset-2"
              title={actionText}>
              {actionText}
            </a>
          ) : null}
        </div>
        <div className="hidden items-center justify-center gap-1 md:flex md:h-full md:gap-4">
          <div className="flex min-w-0 items-center justify-center gap-2 md:gap-5">
            {promo.icon_url ? (
              <img
                src={promo.icon_url}
                alt=""
                className="h-6 w-6 shrink-0 object-contain"
                loading="lazy"
                decoding="async"
              />
            ) : null}
            <p className="text-sm font-medium leading-tight">{label}</p>
          </div>
          {hasAction ? (
            <>
              <span className="h-8 w-px bg-current" aria-hidden="true" />
              <a
                href={promo.content.link as string}
                className="shrink-0 rounded-full bg-transparent py-1.5 text-sm font-semibold transition-colors duration-200 hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-current/80 md:border md:border-black md:px-5 md:py-1"
                title={actionText}>
                {actionText}
              </a>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};
