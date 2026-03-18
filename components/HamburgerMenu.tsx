'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useLocalizedPath } from '@/utils/localizedPaths';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useT } from '@/i18n/useT';
import { useRouteTranslator } from '@/hooks/useRouteTranslator';
import { usePathname, useRouter } from 'next/navigation';
import { useActivitiesGeneralByLanguage } from '@/hooks/useActivitiesByLanguage';
import { useActivitySlugDictionary } from '@/hooks/useTravelSlugDictionary';
import { slugify } from '@/utils/slugify';

export const HamburgerMenu = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isActivitiesOpen, setIsActivitiesOpen] = useState(false);
  const { language, setLanguage } = useLanguage();
  const buildPath = useLocalizedPath();
  const { t } = useT();
  const router = useRouter();
  const pathname = usePathname();
  const { translatePath } = useRouteTranslator();
  const isSpanish = language === 'ES';
  const isFrench = language === 'FR';
  const loginUrl = isSpanish
    ? 'https://ed.b4experience.com/mis-cursos/'
    : 'https://ed.b4experience.com/en/my-courses/';
  const { data: activities = [], isLoading: activitiesLoading } = useActivitiesGeneralByLanguage();
  const { data: activitySlugs } = useActivitySlugDictionary();
  const topActivities = useMemo(
    () =>
      activities
        .filter(act => (act.num_viatges || 0) > 0)
        .sort((a, b) => (b.num_viatges || 0) - (a.num_viatges || 0))
        .slice(0, 8),
    [activities],
  );

  const navItems = useMemo(
    () => [
      {
        type: 'internal' as const,
        path: '/destinations',
        label: isSpanish ? 'Destinos' : isFrench ? 'Destinations' : 'Destinations',
      },
      {
        type: 'internal' as const,
        path: '/courses',
        label: isSpanish ? 'Cursos Online' : isFrench ? 'Cours en ligne' : 'Online Courses',
      },
      {
        type: 'external' as const,
        url: isSpanish ? 'https://quiz-es.b4experience.com/' : 'https://quiz-en.b4experience.com/',
        label: isSpanish ? 'Tu Nivel y Ruta' : isFrench ? 'Votre niveau et votre itineraire' : 'Your Level & Route',
      },
      {
        type: 'internal' as const,
        path: '/tailor-made-trips',
        label: isSpanish ? 'Viajes a Medida' : isFrench ? 'Voyages sur mesure' : 'Tailor Made Trips',
      },
      {
        type: 'internal' as const,
        path: '/about-us',
        label: isSpanish ? 'Sobre Nosotros' : isFrench ? 'A propos de nous' : 'About Us',
      },
      {
        type: 'internal' as const,
        path: '/blog',
        label: 'Blog',
      },
      {
        type: 'internal' as const,
        path: '/contact',
        label: isSpanish ? 'Contacto' : isFrench ? 'Contact' : 'Contact',
      },
    ],
    [isFrench, isSpanish],
  );
  const close = () => setIsMenuOpen(false);
  const switchLanguage = (next: 'EN' | 'ES' | 'FR') => {
    if (next === language) return;
    setLanguage(next);
    const translatedPath = translatePath(pathname || '/', next);
    router.replace(translatedPath);
    close();
  };

  return (
    <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-primary-foreground hover:!bg-white/10 hover:!text-primary-foreground transition-colors"
          aria-label={isSpanish ? 'Abrir menú de navegación' : isFrench ? 'Ouvrir le menu de navigation' : 'Open navigation menu'}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 bg-background border-r z-[10001]">
        <SheetTitle className="sr-only">
          {isSpanish ? 'Menú de navegación' : isFrench ? 'Menu de navigation' : 'Navigation menu'}
        </SheetTitle>
        <div className="flex flex-col h-full">
          <div className="p-0 flex items-center justify-center">
            <Link href={buildPath('/')} onClick={close} className="hover:opacity-80 transition-opacity" title="B4Experience">
              <img
                src="https://aqfvdnnmeywvzivkvlhi.supabase.co/storage/v1/object/public/logos/B4E_Black_Horiz.png"
                alt="B4Experience Logo"
                title="B4Experience Logo"
                loading="eager"
                decoding="async"
                className="h-16 w-auto object-contain"
              />
            </Link>
          </div>

          <nav className="flex-1 p-4 space-y-2 bg-background overflow-y-auto">
            <div className="rounded-lg">
              <div className="w-full h-11 px-4 text-sm font-medium text-left rounded-lg hover:bg-muted/50 hover:text-foreground transition-all duration-200 flex items-center justify-between">
                <Link href={buildPath('/activities')} onClick={close} className="flex-1" title={"View activities"}>
                  <span>{isSpanish ? 'Actividades' : isFrench ? 'Activites' : 'Activities'}</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setIsActivitiesOpen(prev => !prev)}
                  aria-expanded={isActivitiesOpen}
                  aria-controls="activities-menu-list"
                  aria-label={isSpanish ? 'Mostrar actividades' : isFrench ? 'Afficher les activites' : 'Show activities'}
                  className="ml-2 inline-flex items-center justify-center"
                >
                  <ChevronDown
                    className={`h-4 w-4 text-muted-foreground transition-transform ${isActivitiesOpen ? 'rotate-180' : ''}`}
                  />
                </button>
              </div>

              <div
                id="activities-menu-list"
                className={`overflow-hidden transition-all duration-300 ${isActivitiesOpen ? 'max-h-[460px] opacity-100 mt-2' : 'max-h-0 opacity-0 mt-0'}`}
              >
                <Link
                  href={buildPath('/activities')}
                  onClick={close}
                  className="block rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
                 title={"View activities"}>
                  {isSpanish ? 'Ver todas' : isFrench ? 'Voir tout' : 'See all'}
                </Link>

                {activitiesLoading && (
                  <p className="px-4 py-2 text-sm text-slate-500">
                    {t('footer.loadingActivities') ?? 'Loading...'}
                  </p>
                )}

                {!activitiesLoading && topActivities.map(activity => {
                  const activitySlug =
                    activitySlugs?.byId?.[activity.id]?.[language] || slugify(activity.name);
                  return (
                    <Link
                      key={activity.id}
                      href={buildPath(`/activity/${activitySlug}`)}
                      onClick={close}
                      className="block rounded-lg px-4 py-2 text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
                      title={activity.name}
                    >
                      {activity.name}
                    </Link>
                  );
                })}
              </div>
            </div>

            {navItems.map((item) => {
              const sharedButtonProps = {
                variant: "ghost" as const,
                className:
                  "w-full justify-start h-11 px-4 text-sm font-medium hover:bg-muted/50 hover:text-foreground transition-all duration-200 rounded-lg text-left",
                asChild: true,
              };

              if (item.type === "external") {
                return (
                  <Button key={item.url} {...sharedButtonProps}>
                    <a
                      href={item.url}
                      onClick={close}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      title={typeof item.label === "string" ? item.label : "Open external page"}
                    >
                      {item.label}
                    </a>
                  </Button>
                );
              }

              return (
                <Button key={item.path} {...sharedButtonProps}>
                  <Link
                    href={buildPath(item.path)}
                    onClick={close}
                    title={typeof item.label === "string" ? item.label : "Open page"}
                  >
                    {item.label}
                  </Link>
                </Button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-border bg-background">
            <div className="flex gap-3">
              <Button
                asChild
                className="flex-1 h-11 bg-black text-white hover:bg-black/90"
              >
                <a href={loginUrl} target="_blank" rel="noopener noreferrer nofollow" title={"Login"}>
                  Login
                </a>
              </Button>

              <button
                type="button"
                onClick={() => window.open('https://wa.me/34613037700', '_blank', 'noopener')}
                aria-label="Contact via WhatsApp"
                className="flex-1 h-11 rounded-md bg-[#25D366] hover:bg-[#1ebe57] transition-colors flex items-center justify-center shadow-sm"
              >
                <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884"/>
                </svg>
              </button>

              <div className="flex-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full h-11 border border-border bg-background justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <img
                          src={
                            language === 'EN'
                              ? 'https://aqfvdnnmeywvzivkvlhi.supabase.co/storage/v1/object/public/lang/gb.svg'
                              : language === 'FR'
                                ? 'https://aqfvdnnmeywvzivkvlhi.supabase.co/storage/v1/object/public/lang/fr.svg'
                                : 'https://aqfvdnnmeywvzivkvlhi.supabase.co/storage/v1/object/public/lang/es.svg'
                          }
                          alt={language}
                          className="h-5 w-5"
                        />
                        {language}
                      </span>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-background w-28 p-1 border shadow-lg z-[10001]">
                    <DropdownMenuItem
                      className="flex items-center gap-2 px-2 py-1 hover:bg-muted cursor-pointer"
                      onClick={() => switchLanguage('EN')}
                    >
                      <img
                        src="https://aqfvdnnmeywvzivkvlhi.supabase.co/storage/v1/object/public/lang/gb.svg"
                        alt="EN"
                        className="h-5 w-5"
                      />
                      <span className="text-sm">{t('lang.english')}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="flex items-center gap-2 px-2 py-1 hover:bg-muted cursor-pointer"
                      onClick={() => switchLanguage('ES')}
                    >
                      <img
                        src="https://aqfvdnnmeywvzivkvlhi.supabase.co/storage/v1/object/public/lang/es.svg"
                        alt="ES"
                        className="h-5 w-5"
                      />
                      <span className="text-sm">{t('lang.spanish')}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="flex items-center gap-2 px-2 py-1 hover:bg-muted cursor-pointer"
                      onClick={() => switchLanguage('FR')}
                    >
                      <img
                        src="https://aqfvdnnmeywvzivkvlhi.supabase.co/storage/v1/object/public/lang/fr.svg"
                        alt="FR"
                        className="h-5 w-5"
                      />
                      <span className="text-sm">{t('lang.french')}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
