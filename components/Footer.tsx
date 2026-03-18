"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Facebook, Instagram, Youtube, Linkedin, Mail, Phone } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useT } from "@/i18n/useT";
import { supabase } from "@/integrations/supabase/client";
import dynamic from "next/dynamic";
import { SponsorsCarousel } from "@/components/SponsorsCarousel";
import { TrustIndexWidget } from "./TrustIndexWidget";
import { useActivitiesGeneralByLanguage } from "@/hooks/useActivitiesByLanguage";
import { useActivitySlugDictionary } from "@/hooks/useTravelSlugDictionary";
import { slugify } from "@/utils/slugify";
import isoEN from "@/assets/ISO-EN.webp";
import isoES from "@/assets/ISO-ES.webp";
import { useLocalizedPath } from "@/utils/localizedPaths";

export const Footer = () => {
  const { language } = useLanguage();
  const { t } = useT();
  const buildPath = useLocalizedPath();
  const pathname = usePathname();

  const normalizePathname = (path: string) => {
    if (path === "/") return "/";
    const trimmed = path.replace(/\/+$/, "");
    return trimmed.length === 0 ? "/" : trimmed;
  };

  const normalizedPath = normalizePathname(pathname || '/');
  const pathSegments = normalizedPath.split("/").filter(Boolean);
  const isHomePage = pathSegments.length === 0 || (pathSegments.length === 1 && pathSegments[0] === "es");

  const [sponsors, setSponsors] = useState<{ id: number; name: string; url: string }[]>([]);

  const { data: activities = [], isLoading: activitiesLoading } = useActivitiesGeneralByLanguage();
  const { data: activitySlugs } = useActivitySlugDictionary();

  // Filtrar y limitar las actividades más relevantes (máximo 6)
  const topActivities = activities
    .filter(act => act.num_viatges && act.num_viatges > 0)
    .sort((a, b) => (b.num_viatges || 0) - (a.num_viatges || 0))
    .slice(0, 6);

  // 🔹 Obtener patrocinadores desde Supabase
  useEffect(() => {
    const fetchSponsors = async () => {
      const { data, error } = await supabase
        .from("Sponsor" as any)
        .select("id, name, url")
        .order("id", { ascending: true });

      if (error) console.error("❌ Error cargando patrocinadores:", error.message);
      else setSponsors((data as any) || []);
    };
    fetchSponsors();
  }, []);

  const ClientNewsletterStrip = dynamic(
    () => import("./NewsletterStrip").then((mod) => mod.NewsletterStrip),
    { ssr: false },
  );

  return (
    <motion.footer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-slate-950 text-primary-foreground shadow-md border-t"
    >

      {/* 🔹 Carrusel de opiniones */}
      {!isHomePage && (
        <TrustIndexWidget
          title={t("home.reviewsTitle") ?? "What travelers say"}
          sectionClassName="bg-white"
          containerClassName="container mx-auto px-4 md:px-6 lg:px-8 py-10"
          cardClassName="w-full"
        />
      )}

      {/* 🔹 Carrusel de patrocinadores */}
      <div className="bg-slate-950/95">
        <SponsorsCarousel />
      </div>

      <ClientNewsletterStrip />

      {/* 🔹 Contenido principal del footer */}
      <div className="container mx-auto px-4 pt-6 pb-8">
        {/* H2 semántico oculto para estructura correcta */}
        <h2 className="sr-only">{t("footer.mainHeading") || "Footer Information"}</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* 🔸 Columna 1 */}
          <div>
            <Link href={buildPath('/')} className="flex items-center mb-4" title="B4Experience">
              <img
                src="https://aqfvdnnmeywvzivkvlhi.supabase.co/storage/v1/object/public/logos/B4E_White_Horiz.png"
                alt="B4Experience Logo"
                title="B4Experience Logo"
                width={220}
                height={50}
                loading="lazy"
                decoding="async"
                className="h-8 w-auto object-contain"
              />
            </Link>

            <p className="text-primary-foreground/80 text-sm mb-4">{t("footer.description")}</p>

            <h3 className="text-sm font-semibold mb-3">{t("footer.contactInfo")}</h3>
            <ul className="space-y-2 text-sm mb-4">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary-foreground/60" />
                <a href="mailto:info@b4experience.com" className="hover:text-primary-foreground transition-colors" title="Email: info@b4experience.com">
                  info@b4experience.com
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary-foreground/60" />
                <a href="tel:+34613037700" className="hover:text-primary-foreground transition-colors" title="Phone: +34 613 037 700">
                  +34 613 037 700
                </a>
              </li>
            </ul>

            {/* 🔹 Redes sociales */}
            <div className="flex gap-4 mb-6">
              <a
                href="https://www.facebook.com/b4experience"
                target="_blank"
                rel="noopener noreferrer nofollow"
                aria-label="Facebook"
                title="Facebook"
              >
                <Facebook className="h-5 w-5 text-primary-foreground/60 hover:text-primary-foreground transition-colors" />
              </a>
              <a
                href="https://www.instagram.com/b4experience_/"
                target="_blank"
                rel="noopener noreferrer nofollow"
                aria-label="Instagram"
                title="Instagram"
              >
                <Instagram className="h-5 w-5 text-primary-foreground/60 hover:text-primary-foreground transition-colors" />
              </a>
              <a
                href="https://www.youtube.com/@b4experience"
                target="_blank"
                rel="noopener noreferrer nofollow"
                aria-label="YouTube"
                title="YouTube"
              >
                <Youtube className="h-5 w-5 text-primary-foreground/60 hover:text-primary-foreground transition-colors" />
              </a>
              <a
                href="https://es.linkedin.com/company/b4experience"
                target="_blank"
                rel="noopener noreferrer nofollow"
                aria-label="LinkedIn"
                title="LinkedIn"
              >
                <Linkedin className="h-5 w-5 text-primary-foreground/60 hover:text-primary-foreground transition-colors" />
              </a>
            </div>

            {/* 🔹 Certificados ISO */}
            <Link href={buildPath('/certifications')} title={t("footer.certifications") || "ISO Certifications"}>
              <img
                src={(language === "ES" ? isoES : isoEN).src}
                alt="B4Experience ISO Certification"
                title="B4Experience ISO Certification"
                width={200}
                height={200}
                loading="lazy"
                decoding="async"
                className="h-40 w-auto object-contain hover:scale-105 transition-transform cursor-pointer"
              />
            </Link>
          </div>

          {/* 🔸 Columna 2: Enlaces rápidos */}
          <div>
            <h3 className="text-sm font-semibold mb-3">{t("footer.quickLinks")}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href={buildPath('/activities')} className="hover:text-primary-foreground" title={t("footer.activities")}>
                  {t("footer.activities")}
                </Link>
              </li>
              <li>
                <Link href={buildPath('/destinations')} className="hover:text-primary-foreground" title={t("footer.destinations")}>
                  {t("footer.destinations")}
                </Link>
              </li>
              <li>
                <Link href={buildPath('/blog')} className="hover:text-primary-foreground" title={t("footer.blog")}>
                  {t("footer.blog")}
                </Link>
              </li>
              <li>
                <Link href={buildPath('/about-us')} className="hover:text-primary-foreground" title={t("footer.aboutUs") || "About Us"}>
                  {t("footer.aboutUs") || "About Us"}
                </Link>
              </li>
              <li>
                <Link href={buildPath('/places')} className="hover:text-primary-foreground" title={t("footer.places")}>
                  {t("footer.places")}
                </Link>
              </li>
              <li>
                <Link href={buildPath('/courses')} className="hover:text-primary-foreground" title={t("footer.courses")}>
                  {t("footer.courses")}
                </Link>
              </li>
              <li>
                <Link href={buildPath('/tailor-made-trips')} className="hover:text-primary-foreground" title={t("footer.privateAdventures")}>
                  {t("footer.privateAdventures")}
                </Link>
              </li>
            </ul>
          </div>

          {/* 🔸 Columna 3: Actividades */}
          <div>
            <h3 className="text-sm font-semibold mb-3">{t("footer.activities")}</h3>
            <ul className="space-y-2 text-sm">
              {activitiesLoading && (
                <li className="text-primary-foreground/60">
                  {t("footer.loadingActivities") ?? "Loading..."}
                </li>
              )}
              {!activitiesLoading && topActivities.map((activity) => {
                const activitySlug =
                  activitySlugs?.byId?.[activity.id]?.[language] || slugify(activity.name);
                return (
                  <li key={activity.id}>
                    <Link
                      href={buildPath(`/activity/${activitySlug}`)}
                      className="text-left hover:text-primary-foreground transition-colors"
                      title={activity.name}
                    >
                      {activity.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* 🔸 Columna 4: With the support of */}
          <div>
            <h3 className="text-sm font-semibold mb-3">{t("footer.withSupport")}</h3>
            {sponsors.length === 0 ? (
              <p className="text-sm text-primary-foreground/60">{t("footer.loadingSponsors")}</p>
            ) : (
              <div className="flex flex-col gap-3 rounded-2xl border border-primary-foreground/10 bg-white/5 p-4">
                {sponsors.map((sponsor) => (
                  <div
                    key={sponsor.id}
                    className="rounded-lg bg-white/95 p-3 transition-transform hover:scale-[1.02]"
                  >
                    <img
                      src={sponsor.url}
                      alt={sponsor.name}
                      title={sponsor.name}
                      className="h-auto w-full max-h-24 object-contain sm:max-h-32 md:max-h-40"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 🔹 Barra inferior */}
        <div className="border-t border-primary-foreground/20 mt-8 pt-6 flex flex-col items-center gap-3 text-center text-sm text-primary-foreground/60 lg:flex-row lg:items-center lg:justify-between lg:text-left">
          <p>&copy; {new Date().getFullYear()} B4Experience. {t("footer.copyright")}</p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 lg:justify-end">
            <Link href={buildPath('/privacy-policy')} className="hover:text-primary-foreground transition-colors" title={t("footer.privacyPolicy")}>
              {t("footer.privacyPolicy")}
            </Link>
            <Link href={buildPath('/cookies-policy')} className="hover:text-primary-foreground transition-colors" title={t("footer.cookies")}>
              {t("footer.cookies")}
            </Link>
            <Link href={buildPath('/terms-and-conditions')} className="hover:text-primary-foreground transition-colors" title={t("footer.termsConditions")}>
              {t("footer.termsConditions")}
            </Link>
          </div>
        </div>
      </div>
    </motion.footer>
  );
};
