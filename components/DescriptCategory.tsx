import { Link } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";
import { useT } from "@/i18n/useT";
import { useLocalizedPath } from "@/utils/localizedPaths";

const VIDEO_EMBEDS = {
  ES: "https://www.youtube.com/embed/dEo1zIiuAWA",
  EN: "https://www.youtube.com/embed/JjlTatOeqts",
  FR: "https://www.youtube.com/embed/JjlTatOeqts",
} as const;

export const DescriptCategory = ({
  activityName,
  activitySlug,
  countryName,
  countrySlug,
}: {
  activityName?: string
  activitySlug?: string
  countryName?: string
  countrySlug?: string
}) => {
  const { t } = useT();
  const { language } = useLanguage();
  const buildPath = useLocalizedPath();
  const videoSrc = VIDEO_EMBEDS[language] ?? VIDEO_EMBEDS.ES;
  

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
            <p className="text-sm font-semibold tracking-[0.3em] text-muted-foreground uppercase">¿Por qué hacer {t("home.about.title")} con B4Experience?
            </p>
            <h3 className="text-3xl md:text-4xl font-bold text-foreground">
              {t("home.about.subtitle")}
            </h3>
            {/* Optional activity/country badge */}
            {(activityName || countryName) && (
              <div className="mt-2">
                {activityName ? (
                  activitySlug ? (
                    <Link to={buildPath(`/activities/${activitySlug}`)} className="inline-block text-sm px-3 py-1 rounded bg-primary text-white" title={activityName}>
                      {activityName}
                    </Link>
                  ) : (
                    <span className="inline-block text-sm px-3 py-1 rounded bg-primary text-white">{activityName}</span>
                  )
                ) : countryName ? (
                  countrySlug ? (
                    <Link to={buildPath(`/countries/${countrySlug}`)} className="inline-block text-sm px-3 py-1 rounded bg-secondary text-white" title={countryName}>
                      {countryName}
                    </Link>
                  ) : (
                    <span className="inline-block text-sm px-3 py-1 rounded bg-secondary text-white">{countryName}</span>
                  )
                ) : null}
              </div>
            )}
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

          </div>
        </div>
      </div>
    </section>
  );
};
