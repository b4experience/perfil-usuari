"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { useT } from "@/i18n/useT";
import { useLocalizedPath } from "@/utils/localizedPaths";

const VIDEO_EMBEDS = {
  ES: "https://www.youtube.com/embed/dEo1zIiuAWA",
  EN: "https://www.youtube.com/embed/JjlTatOeqts",
  FR: "https://www.youtube.com/embed/JjlTatOeqts",
} as const;

export const WhoWeAreSection = () => {
  const { t } = useT();
  const { language } = useLanguage();
  const buildPath = useLocalizedPath();
  const videoSrc = VIDEO_EMBEDS[language] ?? VIDEO_EMBEDS.ES;
  const aboutLink = buildPath("/about-us");

  return (
    <section>
      <div className="bg-white px-6 py-10 md:px-12 shadow-[0_15px_50px_rgba(15,23,42,0.06)]">
        <div className="grid gap-10 md:grid-cols-2 items-center">
          <div className="relative w-full overflow-hidden rounded-[32px] shadow-[0_20px_60px_rgba(15,23,42,0.15)]">
            <div className="aspect-video bg-black">
              <iframe
                className="h-full w-full"
                src={`${videoSrc}?rel=0`}
                title={t("home.about.subtitle")}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
                loading="lazy"
              />
            </div>
          </div>

          <div className="space-y-5">
            <p className="text-sm font-semibold tracking-[0.3em] text-muted-foreground uppercase">
              {t("home.about.title")}
            </p>
            <h3 className="text-3xl md:text-4xl font-bold text-foreground">
              {t("home.about.subtitle")}
            </h3>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {t("home.about.description.part1")}
              <span className="font-semibold text-foreground">
                {t("home.about.description.highlight.innovation")}
              </span>
              {t("home.about.description.part2")}
              <span className="font-semibold text-foreground">
                {t("home.about.description.highlight.personalization")}
              </span>
              {t("home.about.description.part3")}
              <span className="font-semibold text-foreground">
                {t("home.about.description.highlight.expertGuidance")}
              </span>
              {t("home.about.description.part4")}
              <span className="font-semibold text-foreground">
                {t("home.about.description.highlight.adventures")}
              </span>
              {t("home.about.description.part5")}
              <span className="font-semibold text-foreground">
                {t("home.about.description.highlight.relaxedExperience")}
              </span>
              {t("home.about.description.part6")}
            </p>

            <div>
              <Link
                href={aboutLink}
                className="inline-flex items-center gap-2 font-semibold text-primary hover:text-primary/80 transition-colors"
                title={"Learn more about us"}>
                {t("home.about.readMore")}
                <span aria-hidden="true" className="text-lg">
                  →
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
