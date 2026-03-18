'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { RelatedTravelsCarousel } from "@/components/RelatedTravelsCarousel";
import { StickyPriceBar } from "@/components/travel/StickyPriceBar";

import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/useT";
import { HottestTripsCarousel } from "@/components/HottestTripsCarousel";
import { useReviews } from "@/hooks/useReviews";
import { useActivityNames } from "@/hooks/useActivityNames";
import { useActivitySlugDictionary } from "@/hooks/useTravelSlugDictionary";
import { ChatWidget } from "@/components/ChatWidget";
import { PhotoGallery } from "@/components/PhotoGallery";
import { ReviewsSection } from "@/components/ReviewsSection";
import { useLocalizedPath } from "@/utils/localizedPaths";
import { slugify } from "@/utils/slugify";
import type { Travel } from "@/types/travel";
import { TravelDetailHeader } from "@/components/travel/TravelDetailHeader";
import { TravelSectionsNav } from "@/components/travel/TravelSectionsNav";
import { TravelIntroSection } from "@/components/travel/TravelIntroSection";
import { TravelItinerarySection } from "@/components/travel/TravelItinerarySection";
import { TravelAccommodationsSection } from "@/components/travel/TravelAccommodationsSection";
import { TravelDeparturesSection } from "@/components/travel/TravelDeparturesSection";
import { TravelThingsSection } from "@/components/travel/TravelThingsSection";
import { TravelFaqsSection } from "@/components/travel/TravelFaqsSection";
import { TravelPriceCard } from "@/components/travel/TravelPriceCard";
import { AlternativeTripsSection } from "@/components/AlternativeTripsSection";
import ContactForm from "@/components/ContactForm";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/context/LanguageContext";

const formatDuration = (duration: string | undefined, t: ReturnType<typeof useT>["t"]) => {
  if (!duration) return "";
  const match = duration.match(/(\d+)/);
  if (!match) return duration;
  const count = parseInt(match[1], 10);
  return t("card.daysFormat", { count: count.toString() });
};

const fallbackLabel = (value: string, fallback: string) =>
  !value || value.startsWith("travel.nav") ? fallback : value;

type NavItem = {
  id: string;
  label: string;
};

type FaqEntry = [string, NonNullable<Travel["faqs"]>[string]];
type ItineraryItem = [string, NonNullable<Travel["fullItinerary"]>[string]];

interface TravelDetailPageClientProps {
  travel: Travel;
  slug?: string | null;
}

const TravelDetailPageClient = ({ travel, slug }: TravelDetailPageClientProps) => {
  const { t } = useT();
  const { getFirstActivityName } = useActivityNames();
  const { data: activitySlugs } = useActivitySlugDictionary();
  const { language } = useLanguage();
  const { data: reviewsData } = useReviews(travel.id, { language });
  const router = useRouter();
  const buildPath = useLocalizedPath();
  const [activeSection, setActiveSection] = useState<string>("intro");
  const [preferredMonth, setPreferredMonth] = useState<string | null>(null);

  const [showSticky, setShowSticky] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const hasPushedTravelViewRef = useRef(false);

  const desktopPriceCardRef = useRef<HTMLDivElement>(null);
  const mobilePriceCardRef = useRef<HTMLDivElement>(null);

  const formatTravelDuration = (value: string | undefined) => formatDuration(value, t);
  const averageRating = reviewsData?.stats.averageRating ?? null;
  const totalReviews = reviewsData?.stats.totalReviews ?? null;
  const hasReviews = (totalReviews ?? 0) > 0;

  const navItems: NavItem[] = useMemo(() => {
    const items: NavItem[] = [
      { id: "intro", label: fallbackLabel(t("travel.nav.intro"), "Intro") },
      { id: "itinerary", label: fallbackLabel(t("travel.nav.itinerary"), "Itinerary") },
      { id: "departures", label: fallbackLabel(t("travel.nav.departures"), "Departures") },
      { id: "things", label: fallbackLabel(t("travel.nav.things"), "Info") },
      { id: "faqs", label: fallbackLabel(t("travel.nav.faqs"), "FAQs") },
    ];
    if (hasReviews) {
      items.push({ id: "reviews", label: t("travel.nav.reviews") });
    }
    return items;
  }, [t, hasReviews, travel.accommodations?.length]);

  const metaTitle =
    travel?.metatitle?.trim() || (travel?.title ? `${travel.title} - B4Experience` : "B4Experience");
  const metaDescription =
    travel?.metadescription?.trim() || travel?.details?.descript_250 || travel?.description || t("meta.home.description");

  // Detectar si es móvil
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);

      if (!mobile) {
        setShowSticky(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Controlar visibilidad del sticky bar en móvil
  useEffect(() => {
    if (!isMobile) {
      setShowSticky(false);
      return;
    }

    let lastScrollY = window.scrollY;
    let ticking = false;

    const checkSticky = () => {
      const shouldShow = window.scrollY > 300;
      setShowSticky(shouldShow);
      ticking = false;
    };

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (Math.abs(currentScrollY - lastScrollY) > 10) {
        lastScrollY = currentScrollY;

        if (!ticking) {
          window.requestAnimationFrame(checkSticky);
          ticking = true;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    checkSticky();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobile]);

  // Observar cuando la tarjeta de precio móvil no es visible
  useEffect(() => {
    if (!isMobile || !mobilePriceCardRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;

        const shouldShow = !entry.isIntersecting && window.scrollY > 100;
        setShowSticky(shouldShow);
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -100px 0px"
      }
    );

    observer.observe(mobilePriceCardRef.current);
    return () => observer.disconnect();
  }, [isMobile]);

  // Efecto para resaltar la sección activa con un "checkpoint" bajo el header
  useEffect(() => {
    const anchorElements = navItems
      .map((item) => document.getElementById(`${item.id}-anchor`))
      .filter((anchor): anchor is HTMLElement => Boolean(anchor));

    if (!anchorElements.length) return;

    let observer: IntersectionObserver | null = null;
    let lastTopMargin = 0;
    const createObserver = () => {
      observer?.disconnect();

      const styles = getComputedStyle(document.documentElement);
      const headerVisible =
        parseFloat(styles.getPropertyValue("--header-visible-height").trim()) || 0;
      const headerHeight =
        parseFloat(styles.getPropertyValue("--header-height").trim()) || 0;
      const isMobileViewport = window.matchMedia("(max-width: 1023px)").matches;
      const headerOffset = isMobileViewport
        ? headerVisible
        : Math.max(headerVisible, headerHeight);
      const navOffset =
        parseFloat(
          getComputedStyle(document.documentElement)
            .getPropertyValue("--sections-nav-height")
            .trim(),
        ) || 0;
      const topMargin = headerOffset + navOffset + 8;
      lastTopMargin = topMargin;

      observer = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

          if (visible.length > 0) {
            const anchorId = visible[0].target.id;
            const sectionId = anchorId.replace("-anchor", "");
            setActiveSection(sectionId);
          }
        },
        {
          rootMargin: `-${topMargin}px 0px -60% 0px`,
          threshold: [0, 0.1, 0.5, 1],
        },
      );

      anchorElements.forEach((anchor) => observer?.observe(anchor));
    };

    createObserver();
    const handleScrollOrResize = () => {
      const styles = getComputedStyle(document.documentElement);
      const headerVisible =
        parseFloat(styles.getPropertyValue("--header-visible-height").trim()) || 0;
      const headerHeight =
        parseFloat(styles.getPropertyValue("--header-height").trim()) || 0;
      const isMobileViewport = window.matchMedia("(max-width: 1023px)").matches;
      const headerOffset = isMobileViewport
        ? headerVisible
        : Math.max(headerVisible, headerHeight);
      const navOffset =
        parseFloat(
          getComputedStyle(document.documentElement)
            .getPropertyValue("--sections-nav-height")
            .trim(),
        ) || 0;
      const topMargin = headerOffset + navOffset + 8;
      if (Math.abs(topMargin - lastTopMargin) > 1) {
        createObserver();
      }
    };
    window.addEventListener("resize", handleScrollOrResize);
    window.addEventListener("scroll", handleScrollOrResize, { passive: true });

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", handleScrollOrResize);
      window.removeEventListener("scroll", handleScrollOrResize);
    };
  }, [navItems, travel]);

  const faqsData = useMemo<FaqEntry[]>(() => {
    if (!travel?.faqs) return [];
    const entries = Object.entries(travel.faqs as Record<string, NonNullable<Travel["faqs"]>[string]>);

    return entries.filter(([, value]) => {
      const question = value?.question?.trim() ?? "";
      const answer = value?.answer?.trim() ?? "";
      const questionValid = question !== "" && question.toLowerCase() !== "false" && question.toLowerCase() !== "null";
      const answerValid = answer !== "";
      return questionValid && answerValid;
    }) as FaqEntry[];
  }, [travel?.faqs]);

  const itineraryItems = useMemo<ItineraryItem[]>(() => {
    if (!travel?.fullItinerary) return [];
    const entries = Object.entries(
      travel.fullItinerary as Record<string, NonNullable<Travel["fullItinerary"]>[string]>,
    );

    return entries.filter(([, value]) => {
      const title = value.title?.trim() ?? "";
      return title !== "" && title.toLowerCase() !== "false";
    }) as ItineraryItem[];
  }, [travel?.fullItinerary]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (!element) return;
    const styles = getComputedStyle(document.documentElement);
    const headerVisible =
      parseFloat(styles.getPropertyValue("--header-visible-height").trim()) || 0;
    const headerHeight =
      parseFloat(styles.getPropertyValue("--header-height").trim()) || 0;
    const isMobileViewport = window.matchMedia("(max-width: 1023px)").matches;
    const headerOffset = isMobileViewport
      ? headerVisible
      : Math.max(headerVisible, headerHeight);
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth",
    });
  };

  const handleSelectPrivateMonth = (label: string) => {
    setPreferredMonth(label);
    scrollToSection("contact");
  };

  useEffect(() => {
    if (metaTitle) {
      document.title = metaTitle;
    }
  }, [metaTitle]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    console.log("travel_detail_view effect init", {
      hasPushed: hasPushedTravelViewRef.current,
      hasDataLayer: Boolean(window.dataLayer),
      travelId: travel.id,
    });
    if (hasPushedTravelViewRef.current) return;
    window.dataLayer = window.dataLayer || [];

    window.dataLayer.push({
      event: "travel_detail_view",
      travelId: travel.id,
      travelTitle: travel.title,
      travelPrice: travel.price ?? null,
    });
    console.log("travel_detail_view pushed");
    hasPushedTravelViewRef.current = true;
  }, [travel.id, travel.price, travel.title]);

  const handleBack = () => router.push(buildPath("/"));
  const durationLabel = formatTravelDuration(travel.duration);
  const bookingHref = buildPath(`/${slug ?? ""}/book`);
  const activityIds = travel.actividades_generales ?? [];
  const firstActivityName = getFirstActivityName(activityIds);
  const firstActivityId = activityIds[0];
  const firstActivitySlug =
    firstActivityId && firstActivityName
      ? activitySlugs?.byId?.[firstActivityId]?.[language] ?? slugify(firstActivityName)
      : undefined;

  return (
    <>
      <div className="container mx-auto px-4 pt-6">
        <motion.div className="max-w-7xl mx-auto" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <TravelDetailHeader
            title={travel.title}
            durationLabel={durationLabel}
            location={travel.destino}
            averageRating={averageRating}
            totalReviews={totalReviews}
          />
          <nav aria-label="Breadcrumb" className="mb-4 text-xs text-muted-foreground">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link href={buildPath("/")} className="hover:text-primary transition-colors" title={"Go to homepage"}>
                  {t("breadcrumb.home")}
                </Link>
              </li>
              {firstActivityName && firstActivitySlug && (
                <>
                  <li aria-hidden="true">/</li>
                  <li>
                    <Link
                      href={buildPath(`/activity/${firstActivitySlug}`)}
                      className="hover:text-primary transition-colors"
                      title={firstActivityName}>
                      {firstActivityName}
                    </Link>
                  </li>
                </>
              )}
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="text-foreground font-medium">
                {travel.title}
              </li>
            </ol>
          </nav>
        </motion.div>
      </div>

      <div className="lg:hidden container mx-auto px-4">
        <PhotoGallery travelId={travel.id} travelTitle={travel.title} />
      </div>

      <div
        className="lg:hidden sticky z-40 bg-background shadow-md border-b"
        style={{ top: "var(--header-visible-height, 0px)" }}
      >
        <TravelSectionsNav
          navItems={navItems}
          activeSection={activeSection}
          sticky={false}
          className="shadow-none border-b-0"
        />
      </div>

      <div className="container mx-auto px-4 pb-6">
        <motion.div className="max-w-7xl mx-auto" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] items-start">
            <div className="space-y-6 min-w-0">
              <div className="hidden lg:block">
                <PhotoGallery travelId={travel.id} travelTitle={travel.title} />
              </div>
              <div
                className="hidden lg:block sticky z-40 bg-background shadow-md border-b"
                style={{ top: "var(--header-visible-height, 0px)" }}
              >
                <TravelSectionsNav
                  navItems={navItems}
                  activeSection={activeSection}
                  sticky={false}
                  className="shadow-none border-b-0"
                />
              </div>
              <TravelIntroSection
                travel={travel}
                getFirstActivityName={getFirstActivityName}
                bookingHref={bookingHref}
                durationLabel={durationLabel}
                alternativeIds={travel.alternative_product_ids}
              />
              <TravelItinerarySection travelTitle={travel.title} itineraryItems={itineraryItems} />
              <TravelAccommodationsSection
                accommodations={travel.accommodations}
                guides={travel.guides}
              />
              <TravelDeparturesSection
                travelId={travel.id}
                bookingHref={bookingHref}
                travelMeta={{
                  title: travel.title,
                  destino: travel.destino,
                  duration: travel.duration,
                  imgUrl: travel.imgUrl,
                  level: travel.level,
                  initialPaymentPercentage: travel.initialPaymentPercentage ?? null,
                  originalPrice: travel.originalPrice ?? null,
                }}
                onSelectPrivateMonth={handleSelectPrivateMonth}
                months={travel.months}
              />
              <TravelThingsSection travel={travel} />
              <TravelFaqsSection travelTitle={travel.title} faqsData={faqsData} />
              {hasReviews && (
                <ReviewsSection productId={travel.id} initialData={reviewsData ?? undefined} />
              )}
              <section id="contact">
                <Card>
                  <CardContent className="p-6 sm:p-8 space-y-6">
                    <h2 className="text-2xl font-semibold">{t("contact.inquiry.title")}</h2>
                    <ContactForm
                      travelId={String(travel.id)}
                      travelTitle={travel.title}
                      actividadInteres={getFirstActivityName(travel.actividades_generales ?? [])}
                      preferredMonth={preferredMonth}
                      className="max-w-none w-full"
                    />
                  </CardContent>
                </Card>
              </section>

              {/* Tarjeta de precio para móvil */}
              <div className="lg:hidden mt-8" ref={mobilePriceCardRef}>
                <TravelPriceCard travel={travel} bookingHref={bookingHref} />
              </div>
            </div>

            {/* Tarjeta de precio para desktop */}
            <div className="hidden lg:block sticky top-24 self-start space-y-6">
              <div ref={desktopPriceCardRef}>
                <TravelPriceCard travel={travel} bookingHref={bookingHref} />
              </div>
              <AlternativeTripsSection
                className="mt-2"
                alternativeIds={travel.alternative_product_ids}
                currentTravelId={travel.id}
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Sticky bar para móvil */}
      {showSticky && isMobile && (
        <StickyPriceBar
          price={travel.price}
          originalPrice={travel.originalPrice}
          bookingHref={bookingHref}
        />
      )}

      <CardContent className="p-6 sm:p-8 space-y-6">
        <RelatedTravelsCarousel
          currentTravelId={travel.id}
          activityIds={travel.actividades_generales || []}
        />
      </CardContent>

      <ChatWidget />
    </>
  );
};

export default TravelDetailPageClient;
