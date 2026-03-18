import { useMemo } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, FreeMode } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/free-mode";
import { CarouselTravelCard } from "./CarouselTravelCard";
import { useTravelDataByLanguage } from "@/hooks/useTravelDataByLanguage";
import { useT } from "@/i18n/useT";
import type { Travel } from "@/types/travel";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface RelatedTravelsCarouselProps {
  currentTravelId: number;
  activityIds?: number[];
}

export const RelatedTravelsCarousel = ({
  currentTravelId,
  activityIds = [],
}: RelatedTravelsCarouselProps) => {
  const { t } = useT();
  const { data: allTravels = [] } = useTravelDataByLanguage();
  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);
  const swiperRef = useRef<any>(null);

  const filteredTravels = useMemo(() => {
    let travels = allTravels.filter((travel: Travel) => travel.id !== currentTravelId);

    if (activityIds.length > 0) {
      travels = travels.filter((travel: Travel) =>
        travel.actividades_generales?.some((id) => activityIds.includes(id))
      );
    }

    travels.sort((a, b) => (a.prioridad ?? 999) - (b.prioridad ?? 999));

    return travels.slice(0, 6);
  }, [allTravels, currentTravelId, activityIds]);

  const updateNavigationState = () => {
    if (swiperRef.current) {
      setIsBeginning(swiperRef.current.isBeginning);
      setIsEnd(swiperRef.current.isEnd);
    }
  };

  useEffect(() => {
    return () => {
      if (swiperRef.current) {
        swiperRef.current.destroy();
        swiperRef.current = null;
      }
    };
  }, []);

  if (filteredTravels.length === 0) {
    return null;
  }

  const initialSlide = filteredTravels.length > 1 ? 1 : 0;

  return (
    <section className="py-5 px-4 sm:px-6 lg:px-8 bg-background rounded-lg mt-0 relative group">
      <h2 className="text-2xl font-bold mb-6 text-foreground">
        {t("travel.alternatives.title")}
      </h2>

      <div className="relative">
        <button
          onClick={() => swiperRef.current?.slidePrev()}
          disabled={isBeginning}
          className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 p-3 rounded-full transition-all duration-300 group-hover:translate-x-0 ${
            isBeginning 
              ? "opacity-0 cursor-not-allowed pointer-events-none" 
              : "opacity-100 bg-white/90 hover:bg-white text-gray-700 shadow-xl hover:shadow-2xl border border-gray-200 hover:scale-110"
          }`}
          aria-label="Anterior"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        <Swiper
          modules={[Navigation, FreeMode]}
          spaceBetween={16}
          slidesPerView={1.05}
          centeredSlides
          centeredSlidesBounds
          initialSlide={initialSlide}
          freeMode={{ enabled: true, sticky: false }}
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
            updateNavigationState();
          }}
          onSlideChange={updateNavigationState}
          breakpoints={{
            480: { slidesPerView: 1.4, spaceBetween: 16, slidesOffsetBefore: 12, slidesOffsetAfter: 12 },
            640: { slidesPerView: 2.2, spaceBetween: 16, slidesOffsetBefore: 16, slidesOffsetAfter: 16 },
            768: { slidesPerView: 3, spaceBetween: 20, slidesOffsetBefore: 16, slidesOffsetAfter: 16 },
            1024: { slidesPerView: 3.2, spaceBetween: 20, slidesOffsetBefore: 24, slidesOffsetAfter: 24 },
            1280: { slidesPerView: 4.2, spaceBetween: 24, slidesOffsetBefore: 24, slidesOffsetAfter: 24 },
          }}
          className="related-travels-swiper px-2 sm:px-0"
        >
          {filteredTravels.map((travel: Travel) => (
            <SwiperSlide key={travel.id} className="h-auto">
              <CarouselTravelCard travel={travel} />
            </SwiperSlide>
          ))}
        </Swiper>

        <button
          onClick={() => swiperRef.current?.slideNext()}
          disabled={isEnd}
          className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 p-3 rounded-full transition-all duration-300 group-hover:-translate-x-0 ${
            isEnd 
              ? "opacity-0 cursor-not-allowed pointer-events-none" 
              : "opacity-100 bg-white/90 hover:bg-white text-gray-700 shadow-xl hover:shadow-2xl border border-gray-200 hover:scale-110"
          }`}
          aria-label="Siguiente"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>

    </section>
  );
};
