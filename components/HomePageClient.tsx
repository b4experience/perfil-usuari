'use client';

import { useMemo, useEffect } from 'react';
import Link from 'next/link';

import { useCountries } from '@/hooks/useCountries';
import { useActivities } from '@/hooks/useActivities';
import { useLocalizedPath } from "@/utils/localizedPaths";

import { useT } from "@/i18n/useT";
import { useLanguage } from "@/context/LanguageContext";
import { useMetaTags } from '@/hooks/useMetaTags';
import { ActivitiesCarousel } from "@/components/ActivitiesCarousel";
import { HottestTripsCarousel } from "@/components/HottestTripsCarousel";
import { DifferentiatorsSection } from "@/components/DifferentiatorsSection";
import { WhoWeAreSection } from "@/components/WhoWeAreSection";
import { TrustIndexWidget } from "@/components/TrustIndexWidget";
import { CountryCard } from "@/components/CountryCard";
import { usePriorityTravels } from "@/hooks/usePriorityTravels";
import type { HomeInitialData } from "@/services/travelService";
import { SearchBar } from '@/components/SearchBar';
import { KeysSection } from "@/components/KeysSection";
import { useActivePromosByType } from '@/hooks/useActivePromosByType';

interface HomePageClientProps extends HomeInitialData {}

export const HomePageClient = ({
  countries: initialCountries = [],
  activities: initialActivities = [],
  priorityTravels: initialPriorityTravels = [],
  language: serverLanguage,
}: HomePageClientProps) => {
  const { t } = useT();
  const buildPath = useLocalizedPath();
  const { language: contextLanguage } = useLanguage();
  const effectiveLanguage = contextLanguage ?? serverLanguage;

  useMetaTags({
    title: t('meta.home.title'),
    description: t('meta.home.description'),
    url: `https://b4experience.com${buildPath("/")}`,
    type: 'website',
    keywords: 'outdoor, adventure, travel, trekking, skiing, mountaineering, sailing, personalized trips',
  });

  useEffect(() => {
    document.title = "B4Experience - Outdoor Adventure Travel";
  }, []);

  const shouldUseInitial = serverLanguage === effectiveLanguage;
  const { data: countries = [] } = useCountries({
    initialData: shouldUseInitial ? initialCountries : undefined,
    language: effectiveLanguage,
  });
  const { data: activities = [] } = useActivities({
    initialData: shouldUseInitial ? initialActivities : undefined,
    language: effectiveLanguage,
  });
  const { data: priorityTravels = [] } = usePriorityTravels({
    initialData: shouldUseInitial ? initialPriorityTravels : undefined,
    language: effectiveLanguage,
  });
  const { data: bannerPromos = [] } = useActivePromosByType('banner');
  const hasActiveBannerSlider = bannerPromos.some((banner) => Boolean(banner.image_url || banner.video_url));
  const topCountries = useMemo(
    () => [...countries]
      .filter(country => (country.num_viatges ?? 0) > 0)
      .sort((a, b) => (b.num_viatges ?? 0) - (a.num_viatges ?? 0))
      .slice(0, 14),
    [countries],
  );

  return (
    <>
      <div className="md:px-6 lg:px-8 py-0 px-[16px]">
        {!hasActiveBannerSlider ? (
          <SearchBar onSearch={() => { /* SearchBar already routes to /search */ }} />
        ) : null}

        <div className="flex justify-center mt-3 mb-0 pb-0">
          <div className="flex flex-col items-center">
            <a
              href="https://www.trustindex.io/reviews/b4experience.com"
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="inline-flex group"
              title={"Read verified reviews on Trustindex"}>
              <img
                src="/rating.png"
                alt="Rating reviews for B4Experience"
                className="h-auto w-32 md:w-40 transition-transform duration-300 ease-out group-hover:scale-105"
                loading="lazy"
              />
            </a>
            <a
              href="https://www.trustindex.io/reviews/b4experience.com"
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="mt-1 text-[10px] font-medium text-slate-900 underline transition-colors hover:text-slate-600"
              title={"Read verified reviews on Trustindex"}>
              {t("home.readAllReviews")}
            </a>
          </div>
        </div>

        <ActivitiesCarousel activities={activities} />
      </div>

      <DifferentiatorsSection />
      <div className="md:px-6 lg:px-8 py-0 px-[16px]">
        <HottestTripsCarousel travels={priorityTravels} />
      </div>
      <section className="py-6" aria-labelledby="home-travel-formats">
        <div
          className="relative flex min-h-[520px] items-center overflow-hidden bg-cover bg-center py-12 md:min-h-[600px] lg:min-h-[680px]"
          style={{
            backgroundImage:
              "url('https://aqfvdnnmeywvzivkvlhi.supabase.co/storage/v1/object/public/home-img/VIAJES%20ADAPTADOS%20A%20TI.jpg')",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/5" aria-hidden="true" />
          <div className="relative z-10 w-full">
            <div className="mx-auto max-w-6xl px-6 md:px-12 text-left">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-200/80">
                {t("home.travelFormats.eyebrow")}
              </p>
              <h2 id="home-travel-formats" className="mt-2 text-2xl font-semibold tracking-tight text-white capitalize md:text-3xl">
                {t("home.travelFormats.title")}
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-200">
                {t("home.travelFormats.description")}
              </p>
              <div className="mt-6 flex flex-col gap-4">
                <Link
                  href={`${buildPath("/search")}?groupTypes=open`}
                  className="group flex h-full w-full max-w-sm cursor-pointer flex-col rounded-2xl border border-white/25 bg-white/95 p-4 shadow-[0_18px_45px_rgba(15,23,42,0.18)] backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:border-white/50 hover:bg-white hover:shadow-[0_22px_60px_rgba(15,23,42,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                  title={"Browse scheduled group trips"}>
                  <span className="text-lg font-semibold text-slate-900">
                    {t("home.travelFormats.scheduled.title")}
                  </span>
                  <span className="mt-2 text-sm leading-relaxed text-slate-600">
                    {t("home.travelFormats.scheduled.description")}
                  </span>
                  <span className="mt-4 inline-flex h-9 items-center justify-center self-start rounded-full bg-blue-600 px-4 text-[0.7rem] font-semibold tracking-wide text-white transition-colors duration-200 group-hover:bg-blue-700">
                    {t("home.travelFormats.cta")}
                  </span>
                </Link>
                <Link
                  href={`${buildPath("/search")}?groupTypes=private`}
                  className="group flex h-full w-full max-w-sm cursor-pointer flex-col rounded-2xl border border-white/25 bg-white/95 p-4 shadow-[0_18px_45px_rgba(15,23,42,0.18)] backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:border-white/50 hover:bg-white hover:shadow-[0_22px_60px_rgba(15,23,42,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                  title={"Browse private group trips"}>
                  <span className="text-lg font-semibold text-slate-900">
                    {t("home.travelFormats.private.title")}
                  </span>
                  <span className="mt-2 text-sm leading-relaxed text-slate-600">
                    {t("home.travelFormats.private.description")}
                  </span>
                  <span className="mt-4 inline-flex h-9 items-center justify-center self-start rounded-full bg-blue-600 px-4 text-[0.7rem] font-semibold tracking-wide text-white transition-colors duration-200 group-hover:bg-blue-700">
                    {t("home.travelFormats.cta")}
                  </span>
                </Link>
                <Link
                  href={buildPath("/tailor-made-trips")}
                  className="group flex h-full w-full max-w-sm cursor-pointer flex-col rounded-2xl border border-white/25 bg-white/95 p-4 shadow-[0_18px_45px_rgba(15,23,42,0.18)] backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:border-white/50 hover:bg-white hover:shadow-[0_22px_60px_rgba(15,23,42,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                 title={"View tailor made trips"}>
                  <span className="text-lg font-semibold text-slate-900">
                    {t("home.travelFormats.tailor.title")}
                  </span>
                  <span className="mt-2 text-sm leading-relaxed text-slate-600">
                    {t("home.travelFormats.tailor.description")}
                  </span>
                  <span className="mt-4 inline-flex h-9 items-center justify-center self-start rounded-full bg-blue-600 px-4 text-[0.7rem] font-semibold tracking-wide text-white transition-colors duration-200 group-hover:bg-blue-700">
                    {t("home.travelFormats.tailor.cta")}
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      <div className="md:px-6 lg:px-8 px-[16px]">
        <TrustIndexWidget
          title={t("home.reviewsTitle") ?? "What the B4Experience community is saying"}
          sectionClassName="bg-transparent"
          containerClassName="px-0 pt-8 pb-0"
          cardClassName="w-full"
        />
      </div>
      <section className="md:px-6 lg:px-8 px-[16px] py-8" aria-labelledby="home-countries">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {t("home.countries.eyebrow")}
          </p>
          <h2 id="home-countries" className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 capitalize md:text-3xl">
            {t("home.countries.title")}
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
          {topCountries.map((country, index) => (
            <div key={country.id} className={index >= 6 ? "hidden sm:block" : ""}>
              <CountryCard country={country} />
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-center">
          <Link
            href={buildPath("/destinations")}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-full bg-blue-600 px-4 text-xs font-semibold tracking-wide text-white transition-colors duration-200 hover:bg-blue-700"
           title={"View destinations"}>
            {t("home.countries.cta") ?? "View all destinations"}
          </Link>
        </div>
      </section>
      <KeysSection language={effectiveLanguage} />
      <WhoWeAreSection />
    </>
  );
}
