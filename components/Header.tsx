'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { HamburgerMenu } from '@/components/HamburgerMenu';
import { useRouteTranslator } from '@/hooks/useRouteTranslator';
import { useCountrySlugDictionary } from '@/hooks/useTravelSlugDictionary';
import { useT } from '@/i18n/useT';

export const Header = () => {
  const { language, setLanguage } = useLanguage();
  const { t } = useT();
  const router = useRouter();
  const pathname = usePathname();
  const { translatePath } = useRouteTranslator();
  const { data: countrySlugDictionary } = useCountrySlugDictionary();
  const headerRef = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const homePath = language === 'ES' ? '/es' : language === 'FR' ? '/fr' : '/';

  useLayoutEffect(() => {
    const updateHeaderHeight = () => {
      if (headerRef.current) {
        const headerHeight = headerRef.current.offsetHeight;
        document.documentElement.style.setProperty(
          '--header-height',
          `${headerHeight}px`,
        );
        document.documentElement.style.setProperty(
          '--header-visible-height',
          isVisible ? `${headerHeight}px` : '0px',
        );
      }
    };

    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);
    return () => window.removeEventListener('resize', updateHeaderHeight);
  }, [isVisible]);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;
    const threshold = 4;
    const mobileQuery = window.matchMedia('(max-width: 767px)');

    const onScroll = () => {
      if (!mobileQuery.matches) return;
      if (ticking) return;
      ticking = true;

      window.requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        const isAtTop = currentScrollY <= 0;
        const isScrollingUp = currentScrollY < lastScrollY - threshold;
        const isScrollingDown = currentScrollY > lastScrollY + threshold;

        if (isAtTop || isScrollingUp) {
          setIsVisible(true);
        } else if (isScrollingDown) {
          setIsVisible(false);
        }

        lastScrollY = currentScrollY;
        ticking = false;
      });
    };

    const onMediaChange = (event: MediaQueryListEvent) => {
      if (!event.matches) {
        setIsVisible(true);
      }
    };

    mobileQuery.addEventListener('change', onMediaChange);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      mobileQuery.removeEventListener('change', onMediaChange);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const switchLanguage = (next: 'EN' | 'ES' | 'FR') => {
    if (next === language) return;
    setLanguage(next);
    const translatedPath = translatePath(pathname || '/', next);
    const currentQuery = typeof window !== 'undefined' ? window.location.search : '';
    const translatedParams = new URLSearchParams(currentQuery);
    const countriesParam = translatedParams.get('countries');
    if (countriesParam) {
      const dictBySlug = countrySlugDictionary?.bySlug ?? {};
      const dictById = countrySlugDictionary?.byId ?? {};
      const translatedCountries = countriesParam
        .split(',')
        .map(value => value.trim())
        .filter(Boolean)
        .map((countrySlug) => {
          const entry = dictBySlug[countrySlug];
          if (!entry) return countrySlug;
          return dictById[entry.id]?.[next] ?? countrySlug;
        });

      if (translatedCountries.length > 0) {
        translatedParams.set('countries', translatedCountries.join(','));
      } else {
        translatedParams.delete('countries');
      }
    }
    const queryString = translatedParams.toString();
    const translatedUrl = queryString ? `${translatedPath}?${queryString}` : translatedPath;
    router.replace(translatedUrl);
  };

  return (
    <motion.header
      ref={headerRef}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : -100 }}
      transition={{ duration: 0.25 }}
      style={{
        top: 'var(--header-top-offset, 0px)',
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
      className="text-primary-foreground shadow-md fixed inset-x-0 top-0 z-[10000] bg-slate-950 transition-[top] duration-300 ease-out"
    >
      <div className="container mx-auto px-4 py-3 bg-slate-950">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <HamburgerMenu />

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Link
                href={homePath}
                className="flex items-center hover:opacity-80 transition-opacity"
                title="B4Experience"
                onClick={(e) => {
                  if (pathname === homePath) {
                    e.preventDefault();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
              >
                <img
                  src="https://aqfvdnnmeywvzivkvlhi.supabase.co/storage/v1/object/public/logos/B4E_White_Horiz.png"
                  alt="B4Experience Logo"
                  title="B4Experience Logo"
                  width={220}
                  height={50}
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  className="h-10 w-auto object-contain"
                />
              </Link>
            </motion.div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="bg-black text-white "
            >
              <a href={language === 'ES' ? 'https://ed.b4experience.com/mis-cursos/' : 'https://ed.b4experience.com/en/my-courses/'} target="_blank" rel="noopener noreferrer nofollow" title={"Login"}>
                Login
              </a>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="hover:bg-primary-foreground/10">
                  <img
                    src={
                      language === 'EN'
                        ? 'https://aqfvdnnmeywvzivkvlhi.supabase.co/storage/v1/object/public/lang/gb.svg'
                        : language === 'FR'
                          ? 'https://aqfvdnnmeywvzivkvlhi.supabase.co/storage/v1/object/public/lang/fr.svg'
                          : 'https://aqfvdnnmeywvzivkvlhi.supabase.co/storage/v1/object/public/lang/es.svg'
                    }
                    alt={language}
                    title={language}
                    className="h-6 w-6"
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background w-20 p-1 border shadow-lg z-[10001]">
                <DropdownMenuItem
                  className="flex items-center gap-2 px-2 py-1 hover:bg-muted cursor-pointer"
                  onClick={() => switchLanguage('EN')}
                >
                  <img 
                    src="https://aqfvdnnmeywvzivkvlhi.supabase.co/storage/v1/object/public/lang/gb.svg" 
                    alt="EN"
                    title="EN"
                    className="h-6 w-6"
                  />
                  <span className="text-sm">{t("lang.english")}</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex items-center gap-2 px-2 py-1 hover:bg-muted cursor-pointer"
                  onClick={() => switchLanguage('ES')}
                >
                  <img 
                    src="https://aqfvdnnmeywvzivkvlhi.supabase.co/storage/v1/object/public/lang/es.svg" 
                    alt="ES"
                    title="ES"
                    className="h-6 w-6"
                  />
                  <span className="text-sm">{t("lang.spanish")}</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex items-center gap-2 px-2 py-1 hover:bg-muted cursor-pointer"
                  onClick={() => switchLanguage('FR')}
                >
                  <img 
                    src="https://aqfvdnnmeywvzivkvlhi.supabase.co/storage/v1/object/public/lang/fr.svg" 
                    alt="FR"
                    title="FR"
                    className="h-6 w-6"
                  />
                  <span className="text-sm">{t("lang.french")}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </motion.header>
  );
};
