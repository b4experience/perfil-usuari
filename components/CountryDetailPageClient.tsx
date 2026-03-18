'use client';

import Link from "next/link";
import { useState, useMemo, useEffect, useRef } from "react";
import { ArrowLeft, Calendar, Loader, X } from "lucide-react";
import { motion } from "framer-motion";

import { SearchBar } from "@/components/SearchBar";
import { CarouselTravelCard } from "@/components/CarouselTravelCard";
import { useCountryBySlug } from "@/hooks/useCountryBySlug";
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

interface CountryDetailPageClientProps {
  slug: string;
  language: Language;
  initialCountry?: Country;
  initialTravels?: TravelsResponse;
  initialCountries?: Country[];
  initialActivities?: Activity[];
}

export const CountryDetailPageClient = ({
  slug,
  language,
  initialCountry,
  initialTravels,
  initialCountries,
  initialActivities,
}: CountryDetailPageClientProps) => {
  const { t } = useT();
  const { language: contextLanguage } = useLanguage();
  const effectiveLanguage = contextLanguage ?? language;
  const buildPath = useLocalizedPath();
  const searchQuery = "";
  const [filters, setFilters] = useState<FilterState>({ sort: "relevance", country: "", activity: "" });
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>(() => createEmptyAdvancedFilters());
  const initialAdvancedRef = useRef(false);

  const normalizeCountryName = (value?: string | null) =>
    (value ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

  const {
    data: country,
    isLoading: isLoadingCountry,
    error: countryError,
  } = useCountryBySlug(slug, language);

  // ✅ CAMBIO CLAVE: Usar initialCountry inmediatamente si existe
  const currentCountry = initialCountry || country;

  useEffect(() => {
    if (initialAdvancedRef.current) return;
    if (!currentCountry?.name) return;
    const countryId = normalizeCountryName(currentCountry.name);
    if (!countryId) return;
    setAdvancedFilters(prev => ({
      ...prev,
      countries: prev.countries.includes(countryId) ? prev.countries : [...prev.countries, countryId],
    }));
    initialAdvancedRef.current = true;
  }, [currentCountry?.name]);
  // Función auxiliar para obtener la URL del media
const getMediaUrlForDetailHero = (country: Country | undefined) => {
  if (!country) return undefined;
  
  // Verificar si es un string válido (no "false", no "null", no vacío)
  const isValidMediaUrl = (url: any): url is string => {
    return typeof url === 'string' && 
           url.trim() !== '' && 
           url.toLowerCase() !== 'false' && 
           url.toLowerCase() !== 'null' &&
           url !== 'undefined';
  };
  
  // Prioridad: video -> alt_image -> banner_country
  if (isValidMediaUrl(country.video)) {
    return country.video;
  }
  
  if (isValidMediaUrl(country.alt_image)) {
    return country.alt_image;
  }
  
  if (isValidMediaUrl(country.banner_country)) {
    return country.banner_country;
  }
  return undefined;
};

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
    title: currentCountry?.titulo_60 
      ? `${currentCountry.titulo_60} - B4Experience` 
      : t('meta.countries.title'),
    description: currentCountry?.desc_150 || t('meta.countries.description'),
    image: currentCountry?.banner_country || currentCountry?.foto_country || undefined,
    url: `https://b4experience.com${buildPath(`/country/${slug}`)}`,
    type: 'website',
    keywords: currentCountry 
      ? `${currentCountry.name}, travel, destination, tourism` 
      : undefined,
  });

  useEffect(() => {
    if (currentCountry?.titulo_60) {
      document.title = `${currentCountry.titulo_60} - B4Experience`;
    }
  }, [currentCountry]);

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
    countries.forEach(countryItem => {
      if (countryItem.id && countryItem.name) {
        map.set(countryItem.id, {
          label: countryItem.name,
          continents: mapContinentNumbers(countryItem.continentes),
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
      continent.countries.forEach(countryItem => {
        map.set(countryItem.id, countryItem.label);
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
    () => filteredTravelItems.filter((item: any) => item.type === "travel") as Travel[],
    [filteredTravelItems],
  );
  const hasAdvancedFilters = hasActiveAdvancedFilters(advancedFilters);
  const hasActiveSort = filters.sort !== "relevance";
// Para el bloque con initialCountry:
  // ✅ RENDERIZADO INMEDIATO si tenemos initialCountry
  if (initialCountry) {
    return (
      <>
        {/* CONTENIDO ESTÁTICO QUE APARECERÁ EN EL CÓDIGO FUENTE */}
        <div className="relative h-[32vh] min-h-[250px] overflow-hidden">
          {initialCountry.banner_country && (
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${initialCountry.banner_country})` }}
            />
          )}
          {!initialCountry.banner_country && <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20" />}
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative h-full flex items-center justify-center px-4">
            <div className="text-center text-white w-full max-w-2xl mx-auto">
              <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-3 tracking-tight leading-tight">
                {initialCountry.titulo_60 || `Travel to ${initialCountry.name}`}
              </h1>
              {initialCountry.desc_150 && (
                <h2 className="text-sm sm:text-base md:text-lg text-white/80 mb-3 leading-relaxed">
                  {initialCountry.desc_150}
                </h2>
              )}
              {initialCountry.num_viatges > 0 && (
                <div className="flex flex-wrap items-center justify-center gap-2 text-white/90">
                  <Calendar className="w-5 h-5" />
                  <span className="text-sm sm:text-base">
                    {initialCountry.num_viatges} {t('country.tripsAvailable')}
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
            </div>
          </div>
        </div>

        {/* DESCRIPCIONES - Aparecerán en el código fuente */}
        {(initialCountry.titulo_1 || initialCountry.desc1) && (
          <div className="px-4 md:px-6 lg:px-40 py-5">
            <DetailHeroSection
              title={initialCountry.titulo_1 ?? ''}
              description={initialCountry.desc1 ?? ''}
              mediaUrl={getMediaUrlForDetailHero(initialCountry)}
            />
          </div>
        )}

        {/* TÍTULO DE VIAJES */}
        <h2 className="px-8 text-2xl font-semibold tracking-tight text-slate-900 mt-6">
          {language === 'ES' 
            ? `Todos nuestros viajes a ${initialCountry.name}` 
            : `All our trips to ${initialCountry.name}`}
        </h2>
        
        {/* SECCIÓN DE VIAJES (se carga en cliente) */}
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

          {/* SECCIÓN FINAL - Aparecerá en el código fuente */}
          <SectionDetailCategory
            title={initialCountry.titulo_2 ?? ''}
            description={initialCountry.desc2 ?? ''}
            fallbackTitle={initialCountry.name ?? ''}
            fallbackDescription={initialCountry.desc_150 ?? ''}
          />
        </div>
      </>
    );
  }

  // ✅ Si NO hay initialCountry, usar el hook normal
  if (isLoadingCountry || isLoadingTravels) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader className="h-6 w-6 animate-spin" />
        <span className="ml-2">{t('country.loading')}</span>
      </div>
    );
  }

  if (countryError || !currentCountry) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-destructive">{t('countries.error.title')}</h1>
          <p>{t('country.error')}</p>
          <Link href={buildPath('/')} title="B4Experience Home">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" /> {t('country.backToHome')}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

// Para el bloque con currentCountry:
  const backgroundImage = currentCountry.banner_country || currentCountry.foto_country || undefined;

  const isLikelySpanish = (s: string) => {
    const text = (s || '').toLowerCase();
    return /[áéíóúñ]/.test(text) || /(\b|\s)(el|la|los|las|de|del|y|en)(\b|\s)/.test(text);
  };

  const titleText = effectiveLanguage === 'EN'
    ? (currentCountry.titulo_60 && !isLikelySpanish(currentCountry.titulo_60) 
        ? currentCountry.titulo_60 
        : t('country.titleFor', { name: currentCountry.name }))
    : (currentCountry.titulo_60 || t('country.titleFor', { name: currentCountry.name }));

  const descText = effectiveLanguage === 'EN'
    ? (currentCountry.desc_150 && !isLikelySpanish(currentCountry.desc_150) 
        ? currentCountry.desc_150 
        : t('country.defaultDesc', { name: currentCountry.name }))
    : (currentCountry.desc_150 || t('country.defaultDesc', { name: currentCountry.name }));

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
            className="text-center text-white"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-wide">{titleText}</h1>
            {descText && <h2 className="text-lg text-white/80 mb-2">{descText}</h2>}
            {currentCountry.num_viatges > 0 && (
              <div className="flex items-center justify-center gap-2 text-xl text-white/90">
                <Calendar className="w-5 h-5" />
                <span className="text-sm">{currentCountry.num_viatges} {t('country.tripsAvailable')}</span>
              </div>
            )}
            <div className='mt-3'>
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

      {(currentCountry.titulo_1 || currentCountry.desc1) && (
        <div className="px-4 md:px-6 lg:px-8 py-5">
          <DetailHeroSection
            title={currentCountry.titulo_1 ?? ''}
            description={currentCountry.desc1 ?? ''}
            
            mediaUrl={getMediaUrlForDetailHero(currentCountry)}
          />
        </div>
      )}

      <h2 className="px-8 text-2xl font-semibold tracking-tight text-slate-900 mt-6">
        {language === 'ES' 
          ? `Todos nuestros viajes a ${currentCountry.name}` 
          : `All our trips to ${currentCountry.name}`}
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
          title={currentCountry.titulo_2 ?? ''}
          description={currentCountry.desc2 ?? ''}
          fallbackTitle={currentCountry.name ?? ''}
          fallbackDescription={currentCountry.desc_150 ?? ''}
        />
      </div>
    </>
  );
};

export default CountryDetailPageClient;
