'use client';

import Link from "next/link";
import { useState, useMemo, useEffect, useRef } from "react";
import { ArrowLeft, Calendar, Loader, X } from "lucide-react";
import { motion } from "framer-motion";

import { SearchBar } from "@/components/SearchBar";
import { CarouselTravelCard } from "@/components/CarouselTravelCard";
import { useActivityBySlug } from "@/hooks/useActivityBySlug";
import { useTravelData } from "@/hooks/useTravelData";
import { useCountries } from "@/hooks/useCountries";
import { useActivities } from "@/hooks/useActivities";
import type { FilterState } from "@/components/filters/FilterMenu";
import { FilterMenu } from "@/components/filters/FilterMenu";
import { SearchSection } from "@/components/search/SearchSection";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import type { Language } from "@/context/LanguageContext";
import { useT } from "@/i18n/useT";
import { useMetaTags } from "@/hooks/useMetaTags";
import { useLocalizedPath } from "@/utils/localizedPaths";
import { DetailHeroSection } from "@/components/DetailHeroSection";
import { SectionDetailCategory } from "./SectionDetailCategory";
import type { Activity } from "@/types/activity";
import type { Country } from "@/types/country";
import type { TravelsResponse } from "@/services/travelService";
import type { Travel } from "@/types/travel";
import {
  applyAdvancedFilters,
  buildFilterMetadata,
  createEmptyAdvancedFilters,
  hasActiveAdvancedFilters,
  mapContinentNumbers,
  type AdvancedFilters,
  type ContinentId,
  BUDGET_OPTIONS,
  DIFFICULTY_OPTIONS,
  DURATION_OPTIONS,
  GROUP_TYPE_OPTIONS,
  MONTH_IDS,
  type BudgetId,
  type DifficultyId,
  type DurationId,
  type GroupType,
} from "@/lib/searchFilters";
import { monthNames } from "@/utils/monthMapper";

interface ActivityDetailPageClientProps {
  slug: string;
  language: Language;
  initialActivity?: Activity;
  initialTravels?: TravelsResponse;
  initialCountries?: Country[];
  initialActivities?: Activity[];
}

export const ActivityDetailPageClient = (props: ActivityDetailPageClientProps) => {
  const {
    slug,
    language,
    initialActivity,
    initialTravels,
    initialCountries,
    initialActivities,
  } = props;
  const { t } = useT();
  const { language: contextLanguage } = useLanguage();
  const effectiveLanguage = contextLanguage ?? language;
  const buildPath = useLocalizedPath();
  const searchQuery = "";
  const [filters, setFilters] = useState<FilterState>({ sort: "relevance", country: "", activity: "" });
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>(() => createEmptyAdvancedFilters());
  const initialAdvancedRef = useRef(false);

  const {
    data: activity,
    isLoading: isLoadingActivity,
    error: activityError,
  } = useActivityBySlug(slug, language, { initialData: initialActivity });

  useEffect(() => {
    if (initialAdvancedRef.current) return;
    if (activity?.id == null) return;
    const activityId = String(activity.id);
    setAdvancedFilters(prev => ({
      ...prev,
      activities: prev.activities.includes(activityId) ? prev.activities : [...prev.activities, activityId],
    }));
    initialAdvancedRef.current = true;
  }, [activity?.id]);

  const travelFilters = useMemo(
    () => ({ sort: filters.sort, country: "", activity: "" }),
    [filters.sort],
  );

  const {
    data: travelData,
    isLoading: isLoadingTravels,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useTravelData(searchQuery, travelFilters, { initialData: initialTravels, language });

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage || isLoadingTravels) return;
    fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, isLoadingTravels]);

  const { data: countriesData } = useCountries({ initialData: initialCountries, language });
  const { data: activitiesData } = useActivities({ initialData: initialActivities, language });

  useMetaTags({
    title: activity?.titulo_60 ? `${activity.titulo_60} - B4Experience` : t('meta.activities.title'),
    description: activity?.desc_150 || t('meta.activities.description'),
    image: activity?.foto_banner || activity?.foto_actividad || undefined,
    url: `https://b4experience.com${buildPath(`/activity/${slug}`)}`,
    type: 'website',
    keywords: activity ? `${activity.name}, outdoor, adventure, travel, activities` : undefined,
  });

  useEffect(() => {
    if (activity?.titulo_60) {
      document.title = `${activity.titulo_60} - B4Experience`;
    }
  }, [activity]);

  const allTravels = useMemo<Travel[]>(
    () => travelData?.pages.flatMap((page: TravelsResponse) => page.travels) ?? [],
    [travelData],
  );

  const countries = countriesData ?? [];
  const activities = activitiesData ?? [];

  const gridItems = useMemo(
    () => allTravels.map((travel: Travel) => ({ ...travel, type: "travel" as const })),
    [allTravels],
  );

  const handleFiltersChange = (next: FilterState) => {
    setFilters(next);
  };
  const handleAdvancedFiltersChange = (next: AdvancedFilters) => {
    setAdvancedFilters(next);
  };
  const handleResetAdvancedFilters = () => {
    setAdvancedFilters(createEmptyAdvancedFilters());
  };

  const baseTravelItems = useMemo(
    () => gridItems.map(item => ({ ...item })),
    [gridItems],
  );
  const countryLookup = useMemo(() => {
    const map = new Map<number, { label: string; continents?: ContinentId[] }>();
    countries.forEach(country => {
      if (country.id && country.name) {
        map.set(country.id, {
          label: country.name,
          continents: mapContinentNumbers(country.continentes),
        });
      }
    });
    return map;
  }, [countries]);
  const filtersMetadata = useMemo(
    () => buildFilterMetadata(baseTravelItems, countryLookup),
    [baseTravelItems, countryLookup],
  );
  const activityLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    activities.forEach(activityItem => {
      map.set(String(activityItem.id), activityItem.name);
    });
    Object.values(filtersMetadata.activities || {}).forEach(activityItem => {
      if (!map.has(activityItem.id)) {
        map.set(activityItem.id, activityItem.label);
      }
    });
    return map;
  }, [activities, filtersMetadata.activities]);
  const difficultyLabelMap = useMemo(() => {
    const map = new Map<DifficultyId, string>();
    DIFFICULTY_OPTIONS.forEach(option => {
      map.set(option.id, t(option.labelKey));
    });
    return map;
  }, [t]);
  const durationLabelMap = useMemo(() => {
    const map = new Map<DurationId, string>();
    DURATION_OPTIONS.forEach(option => {
      map.set(option.id, t(option.labelKey));
    });
    return map;
  }, [t]);
  const budgetLabelMap = useMemo(() => {
    const map = new Map<BudgetId, string>();
    BUDGET_OPTIONS.forEach(option => {
      map.set(option.id, t(option.labelKey));
    });
    return map;
  }, [t]);
  const groupTypeLabelMap = useMemo(() => {
    const map = new Map<GroupType, string>();
    GROUP_TYPE_OPTIONS.forEach(option => {
      map.set(option.id, t(option.labelKey));
    });
    return map;
  }, [t]);
  const monthLabelMap = useMemo(() => {
    const labels = monthNames[effectiveLanguage as keyof typeof monthNames] ?? monthNames.EN;
    const map = new Map<string, string>();
    MONTH_IDS.forEach((id, index) => {
      map.set(id, labels[index] ?? id);
    });
    return map;
  }, [effectiveLanguage]);
  const countryLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    filtersMetadata.continents.forEach(continent => {
      continent.countries.forEach(country => {
        map.set(country.id, country.label);
      });
    });
    return map;
  }, [filtersMetadata]);

  type FilterChip = {
    key: "continents" | "countries" | "difficulties" | "durations" | "budgets" | "activities" | "groupTypes" | "months";
    value: string;
    label: string;
  };
  const activeFilterTags = useMemo(() => {
    const tags: FilterChip[] = [];
    advancedFilters.continents.forEach(id => {
      tags.push({
        key: "continents",
        value: id,
        label: t(`filters.sidebar.continent.${id as ContinentId}`),
      });
    });
    advancedFilters.countries.forEach(id => {
      tags.push({
        key: "countries",
        value: id,
        label: countryLabelMap.get(id) ?? id,
      });
    });
    advancedFilters.activities.forEach(id => {
      tags.push({
        key: "activities",
        value: id,
        label: activityLabelMap.get(id) ?? id,
      });
    });
    advancedFilters.difficulties.forEach(id => {
      tags.push({
        key: "difficulties",
        value: id,
        label: difficultyLabelMap.get(id as DifficultyId) ?? id,
      });
    });
    advancedFilters.durations.forEach(id => {
      tags.push({
        key: "durations",
        value: id,
        label: durationLabelMap.get(id as DurationId) ?? id,
      });
    });
    advancedFilters.budgets.forEach(id => {
      tags.push({
        key: "budgets",
        value: id,
        label: budgetLabelMap.get(id as BudgetId) ?? id,
      });
    });
    advancedFilters.groupTypes.forEach(type => {
      tags.push({
        key: "groupTypes",
        value: type,
        label: groupTypeLabelMap.get(type as GroupType) ?? type,
      });
    });
    advancedFilters.months.forEach(monthId => {
      tags.push({
        key: "months",
        value: monthId,
        label: monthLabelMap.get(monthId) ?? monthId,
      });
    });
    return tags;
  }, [
    activityLabelMap,
    advancedFilters.activities,
    advancedFilters.budgets,
    advancedFilters.continents,
    advancedFilters.countries,
    advancedFilters.difficulties,
    advancedFilters.durations,
    advancedFilters.groupTypes,
    advancedFilters.months,
    budgetLabelMap,
    countryLabelMap,
    difficultyLabelMap,
    durationLabelMap,
    groupTypeLabelMap,
    monthLabelMap,
    t,
  ]);

  const filteredTravelItems = useMemo(
    () => applyAdvancedFilters(baseTravelItems, advancedFilters, countryLookup),
    [baseTravelItems, advancedFilters, countryLookup],
  );
  const travelItems = useMemo(
    () => filteredTravelItems.filter((item): item is Travel & { type: "travel" } => item.type === "travel"),
    [filteredTravelItems],
  );
  const hasAdvancedFilters = hasActiveAdvancedFilters(advancedFilters);
  const hasActiveSort = filters.sort !== "relevance";

  if (isLoadingActivity || isLoadingTravels) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader className="h-6 w-6 animate-spin" />
        <span className="ml-2">{t('activity.loading')}</span>
      </div>
    );
  }

  if (activityError || !activity) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-destructive">{t('activities.error.title')}</h1>
          <p>{t('activity.error')}</p>
          <Link href={buildPath('/')} title="B4Experience Home">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" /> {t('activity.backToHome')}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const backgroundImage = activity.foto_banner || activity.foto_actividad || undefined;

  const isLikelySpanish = (s: string) => {
    const text = (s || '').toLowerCase();
    return /[áéíóúñ]/.test(text) || /(\b|\s)(el|la|los|las|de|del|y|en)(\b|\s)/.test(text);
  };

  const titleText = effectiveLanguage === 'EN'
    ? (activity.titulo_60 && !isLikelySpanish(activity.titulo_60) ? activity.titulo_60 : t('activity.titleFor', { name: activity.name }))
    : (activity.titulo_60 || t('activity.titleFor', { name: activity.name }));

  const descText = effectiveLanguage === 'EN'
    ? (activity.desc_150 && !isLikelySpanish(activity.desc_150) ? activity.desc_150 : t('activity.defaultDesc', { name: activity.name }))
    : (activity.desc_150 || t('activity.defaultDesc', { name: activity.name }));

  return (
    <>
      <div className="relative h-[32vh] min-h-[250px] overflow-hidden">
        {backgroundImage && (
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${backgroundImage})` }}
          />
        )}
        {!backgroundImage && <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20" />}
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative h-full flex items-center justify-center px-4">
          <motion.div
            className="text-center text-white w-full max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-3 tracking-tight leading-tight">
              {titleText}
            </h1>
            {descText && (
              <h2 className="text-sm sm:text-base md:text-lg text-white/80 mb-3 leading-relaxed">
                {descText}
              </h2>
            )}
            {activity.num_viatges > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-2 text-white/90">
                <Calendar className="w-5 h-5" />
                <span className="text-sm sm:text-base">
                  {activity.num_viatges} {t('activity.tripsAvailable')}
                </span>
              </div>
            )}
            <div className="mt-4 w-full max-w-[560px] mx-auto">
              <SearchBar
                onSearch={(query) => {
                  const searchPath = language === 'ES' ? '/es/search' : language === 'FR' ? '/fr/search' : '/search';

                  window.location.href = `${searchPath}?q=${encodeURIComponent(query)}`;
                }}
              />
            </div>
          </motion.div>
        </div>
      </div>

      {(activity.titulo_1 || activity.desc1) && (
        <div className="px-4 md:px-8 lg:px-40 py-5">
          <DetailHeroSection
            title={activity.titulo_1 ?? ''}
            description={activity.desc1 ?? ''}
            mediaUrl={activity.video ?? activity.alt_image ?? activity.foto_actividad ?? undefined}
          />
        </div>
      )}

      <h2 className="px-8 text-2xl font-semibold tracking-tight text-slate-900 mt-2">
        {language === 'ES' ? 'Todos nuestros viajes de' : 'All our'} {activity.name} {language === 'EN' ? 'trips' : ''}
      </h2>

      <div className="px-4 md:px-6 lg:px-8 py-8">
        <SearchSection
          filters={filters}
          onFiltersChange={handleFiltersChange}
          advancedFilters={advancedFilters}
          metadata={filtersMetadata}
          activities={activities}
          onAdvancedFiltersChange={handleAdvancedFiltersChange}
          onResetAdvancedFilters={handleResetAdvancedFilters}
          hasSidebarFilters={hasAdvancedFilters}
          filtersTitle={t("filters.sidebar.title")}
          clearLabel={t("filters.clear")}
          enableFloatingMobileBar
          contentClassName="space-y-8"
        >
          <div className="hidden lg:flex lg:flex-wrap lg:items-center lg:justify-between lg:gap-3">
            <div className="flex flex-wrap gap-2">
              {activeFilterTags.map(tag => (
                <button
                  key={`${tag.key}-${tag.value}`}
                  type="button"
                  onClick={() => handleAdvancedFiltersChange({
                    ...advancedFilters,
                    [tag.key]: (advancedFilters[tag.key as keyof AdvancedFilters] as string[]).filter(item => String(item) !== tag.value),
                  } as AdvancedFilters)}
                  className="flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1 text-sm font-medium text-foreground shadow-sm transition hover:border-primary hover:text-primary"
                >
                  <span>{tag.label}</span>
                  <X className="h-3.5 w-3.5" />
                </button>
              ))}
            </div>
            <FilterMenu
              value={filters}
              onChange={handleFiltersChange}
              hasActive={hasActiveSort}
            />
          </div>
          {activeFilterTags.length > 0 && (
            <div className="flex flex-wrap gap-2 lg:hidden">
              {activeFilterTags.map(tag => (
                <button
                  key={`${tag.key}-${tag.value}`}
                  type="button"
                  onClick={() => handleAdvancedFiltersChange({
                    ...advancedFilters,
                    [tag.key]: (advancedFilters[tag.key as keyof AdvancedFilters] as string[]).filter(item => String(item) !== tag.value),
                  } as AdvancedFilters)}
                  className="flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1 text-sm font-medium text-foreground shadow-sm transition hover:border-primary hover:text-primary"
                >
                  <span>{tag.label}</span>
                  <X className="h-3.5 w-3.5" />
                </button>
              ))}
            </div>
          )}

          {isLoadingTravels ? (
            <div className="flex justify-center py-12">
              <Loader className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <>
              {travelItems.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                  {travelItems.map(travel => (
                    <CarouselTravelCard key={travel.id} travel={travel} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 rounded-3xl border border-dashed border-border">
                  <p className="text-muted-foreground text-lg">{t("search.noResults")}</p>
                </div>
              )}
            </>
          )}
        </SearchSection>

        <SectionDetailCategory
          title={activity.titulo_2 ?? ''}
          description={activity.desc2 ?? ''}
          fallbackTitle={activity.name ?? ''}
          fallbackDescription={activity.desc_150 ?? ''}
        />
      </div>
    </>
  );
};

export default ActivityDetailPageClient;
