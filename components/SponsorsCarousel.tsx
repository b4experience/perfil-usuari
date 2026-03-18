import { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/autoplay";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/i18n/translations";
import { optimizeSupabaseImage } from "@/utils/image";

interface Sponsor {
  id: number;
  name: string;
  url: string;
}

export const SponsorsCarousel = () => {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const { language } = useLanguage(); // 👈 Obtenemos el idioma actual (ES o EN)

  // 🔹 Cargar patrocinadores desde la tabla "SponsorCarousel"
  useEffect(() => {
    const fetchSponsors = async () => {
      const { data, error } = await supabase
        .from("SponsorCarousel" as any)
        .select("*")
        .order("id", { ascending: true });

      if (error) {
        console.error("❌ Error cargando patrocinadores:", error.message);
      } else {
        setSponsors((data as any) || []);
      }
    };

    fetchSponsors();
  }, []);

  // 🔸 Traducciones locales para los textos del carrusel
  const titleText = language === "ES" ? "Con la ayuda de" : language === "FR" ? "Avec le soutien de" : "With the support of";
  const loadingText = language === "ES" ? "Cargando patrocinadores..." : language === "FR" ? "Chargement des sponsors..." : "Loading sponsors...";

  return (
    <div className="bg-white pt-2 pb-10">
      <p className="text-center text-foreground font-semibold text-lg mb-6">{titleText}</p>

      <div className="max-w-7xl mx-auto px-4">
        {sponsors.length === 0 ? (
          <p className="text-center text-muted-foreground">{loadingText}</p>
        ) : (
          <Swiper
            modules={[Autoplay]}
            spaceBetween={40}
            slidesPerView={4}
            loop={true}
            autoplay={{
              delay: 0,
              disableOnInteraction: false,
            }}
            speed={4000}
            cssMode={false}
            grabCursor={true}
            breakpoints={{
              320: { slidesPerView: 2, spaceBetween: 20 },
              640: { slidesPerView: 3, spaceBetween: 30 },
              1024: { slidesPerView: 5, spaceBetween: 40 },
            }}
            className="mySwiper"
          >
            {sponsors.map(sponsor => (
              <SwiperSlide key={sponsor.id}>
                <div className="bg-white rounded-lg shadow flex items-center justify-center h-14 sm:h-18 md:h-20 p-1 hover:scale-105 transition-transform">
                  <img
                    src={optimizeSupabaseImage(sponsor.url, { width: 200, height: 70, quality: 85 })}
                    alt={sponsor.name}
                    title={sponsor.name}
                    width={200}
                    height={70}
                    className="max-h-full w-auto object-contain"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        )}
      </div>
    </div>
  );
};
