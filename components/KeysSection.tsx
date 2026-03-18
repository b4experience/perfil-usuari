'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Brain, GraduationCap, Headset, Leaf, Medal, Plane, ShieldCheck, Users, Video, type LucideIcon } from 'lucide-react';

import { useT } from '@/i18n/useT';
import { useLocalizedPath } from '@/utils/localizedPaths';
import type { Language } from '@/context/LanguageContext';

type KeysSectionProps = {
  language: Language;
};

const readMoreLabels: Record<Language, { more: string; less: string }> = {
  EN: { more: "Read more", less: "Read less" },
  ES: { more: "Ver más", less: "Ver menos" },
  FR: { more: "Voir plus", less: "Voir moins" },
};

const ExpandableText = ({ children, language }: { children: ReactNode; language: Language }) => {
  const textRef = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);

  useEffect(() => {
    if (expanded) return;
    const el = textRef.current;
    if (!el) return;
    const checkOverflow = () => {
      const hasOverflow = el.scrollHeight > el.clientHeight + 1;
      setCanExpand(hasOverflow);
    };
    checkOverflow();
    const observer = new ResizeObserver(checkOverflow);
    observer.observe(el);
    return () => observer.disconnect();
  }, [children, expanded]);

  const label = readMoreLabels[language] ?? readMoreLabels.EN;

  return (
    <div className="relative z-10">
      <p
        ref={textRef}
        className="text-sm leading-relaxed text-slate-600"
        style={
          expanded
            ? undefined
            : {
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }
        }
      >
        {children}
      </p>
      {canExpand && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="mt-2 text-xs font-semibold text-blue-600 underline-offset-4 hover:underline hover:text-blue-700"
        >
          {expanded ? label.less : label.more}
        </button>
      )}
    </div>
  );
};

export const KeysSection = ({ language }: KeysSectionProps) => {
  const { t } = useT();
  const buildPath = useLocalizedPath();
  const isSpanish = language === 'ES';
  const shortsSrc = isSpanish
    ? "https://www.youtube.com/embed/GCeXI1jNBrQ"
    : "https://www.youtube.com/embed/qZ-lahMXWS4";
  const vrPlaylist = isSpanish
    ? "https://www.youtube.com/playlist?list=PLYpQ__EcRNniyYB_co00gWQSvNWFgc0r_"
    : "https://www.youtube.com/playlist?list=PLYpQ__EcRNngYFI7kjrqk1GOcKBzjbOfV";

  const keysItems = useMemo(() => {
    const policyHref = buildPath("/terms-and-conditions");
    const scheduledTripsHref = `${buildPath("/search")}?groupTypes=open`;
    const whatsappHref = "https://api.whatsapp.com/send/?phone=34613037700&text&type=phone_number&app_absent=0";
    const quizHref = "https://quiz-es.b4experience.com";
    const certsHref = "https://b4experience.com/es/certificaciones";
    const portersHref =
      "https://b4experience.com/es/blog/proyecto-solidario-karakorum-dona-portatiles-salva-vidas";
    const whatsappLabel = "WhatsApp";
    const whatsappDetails = t("home.keys.items.1.body.detail");
    const whatsappParts = whatsappDetails.split(whatsappLabel);
    const portersLabelMap: Record<Language, string> = {
      EN: "technical training for porters in Pakistan",
      ES: "formacion tecnica para porteadores en Pakistan",
      FR: "formation technique pour porteurs au Pakistan",
    };
    const portersLabel = portersLabelMap[language] ?? portersLabelMap.EN;
    const certsAfterLink = t("home.keys.items.8.body.afterLink");
    const certsParts = certsAfterLink.split(portersLabel);
    const certsAfterText =
      certsParts.length === 1 ? (
        certsAfterLink
      ) : (
        <>
          {certsParts[0]}
          <a
            href={portersHref}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="font-semibold text-blue-600 underline-offset-4 hover:underline hover:text-blue-700"
            title={"Learn about porter training project"}>
            {portersLabel}
          </a>
          {certsParts.slice(1).join(portersLabel)}
        </>
      );
    const whatsappText =
      whatsappParts.length === 1 ? (
        whatsappDetails
      ) : (
        <>
          {whatsappParts[0]}
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="font-semibold text-blue-600 underline-offset-4 hover:underline hover:text-blue-700"
            title={"Chat with us on WhatsApp"}>
            {whatsappLabel}
          </a>
          {whatsappParts.slice(1).join(whatsappLabel)}
        </>
      );

    return [
      {
        id: "support",
        title: t("home.keys.items.1.title"),
        href: whatsappHref,
        external: true,
        icon: Headset,
        body: whatsappText,
      },
      {
        id: "refund",
        title: t("home.keys.items.2.title"),
        href: policyHref,
        icon: ShieldCheck,
        body: (
          <>
            <span className="font-semibold text-slate-900">{t("home.keys.items.2.body.emphasis")}</span>{" "}
            {t("home.keys.items.2.body.beforeLink")}
            <Link href={policyHref} className="font-semibold text-blue-600 underline-offset-4 hover:underline hover:text-blue-700" title={"View policy details"}>
              {t("home.keys.items.2.body.link")}
            </Link>
            {t("home.keys.items.2.body.afterLink")}
          </>
        ),
      },
      {
        id: "level",
        title: t("home.keys.items.3.title"),
        href: quizHref,
        external: true,
        icon: Brain,
        body: (
          <>
            {t("home.keys.items.3.body.beforeLink")}
            <a
              href={quizHref}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="font-semibold text-blue-600 underline-offset-4 hover:underline hover:text-blue-700"
              title={"Take the level quiz"}>
              {t("home.keys.items.3.body.link")}
            </a>
            {t("home.keys.items.3.body.afterLink")}
          </>
        ),
      },
      {
        id: "guides",
        title: t("home.keys.items.4.title"),
        href: buildPath("/about-us"),
        icon: Medal,
        body: <>{t("home.keys.items.4.body")}</>,
      },
      {
        id: "logistics",
        title: t("home.keys.items.5.title"),
        href: buildPath("/tailor-made-trips"),
        icon: Plane,
        body: (
          <>
            <span className="font-semibold text-slate-900">{t("home.keys.items.5.body.emphasis")}</span>{" "}
            {t("home.keys.items.5.body.detail")}
          </>
        ),
      },
      {
        id: "academy",
        title: t("home.keys.items.6.title"),
        href: buildPath("/courses"),
        icon: GraduationCap,
        body: (
          <>
            {t("home.keys.items.6.body.beforeLink")}
            <Link href={buildPath("/courses")} className="font-semibold text-blue-600 underline-offset-4 hover:underline hover:text-blue-700" title={"View courses"}>
              {t("home.keys.items.6.body.link")}
            </Link>
            {t("home.keys.items.6.body.afterLink")}
          </>
        ),
      },
      {
        id: "solo",
        title: t("home.keys.items.7.title"),
        href: scheduledTripsHref,
        icon: Users,
        body: (
          <>
            {t("home.keys.items.7.body.beforeLink")}
            <Link href={scheduledTripsHref} className="font-semibold text-blue-600 underline-offset-4 hover:underline hover:text-blue-700" title={"View scheduled trips"}>
              {t("home.keys.items.7.body.link")}
            </Link>
            {t("home.keys.items.7.body.afterLink")}
          </>
        ),
      },
      {
        id: "certs",
        title: t("home.keys.items.8.title"),
        href: certsHref,
        external: true,
        icon: Leaf,
        body: (
          <>
            {t("home.keys.items.8.body.beforeLink")}
            <a
              href={certsHref}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="font-semibold text-blue-600 underline-offset-4 hover:underline hover:text-blue-700"
              title={"View sustainability certification details"}>
              {t("home.keys.items.8.body.link")}
            </a>
            {certsAfterText}
          </>
        ),
      },
      {
        id: "vr",
        title: t("home.keys.items.9.title"),
        href: vrPlaylist,
        external: true,
        icon: Video,
        body: (
          <>
            {t("home.keys.items.9.body.beforeLink")}
            <a
              href={vrPlaylist}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="font-semibold text-blue-600 underline-offset-4 hover:underline hover:text-blue-700"
              title={"Watch the VR playlist"}>
              {t("home.keys.items.9.body.link")}
            </a>
            {t("home.keys.items.9.body.afterLink")}
          </>
        ),
      },
    ];
  }, [buildPath, language, t, vrPlaylist]);

  return (
    <section className="md:px-6 lg:px-8 px-[16px] py-8" aria-labelledby="home-keys">
      <div className="mt-2 space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          {t("home.keys.eyebrow") || "SAFETY, COMMITMENT & TECHNOLOGY"}
        </p>
        <h2 id="home-keys" className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
          {t("home.differentiators.title") || "The 9 Keys of B4Experience"}
        </h2>
      </div>
      <div className="mt-6 grid gap-8 lg:grid-cols-[5fr_2fr] lg:items-start">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 lg:pl-24">
          {keysItems.map(item => {
            const Icon = item.icon as LucideIcon;
            const tileLink = item.external ? (
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer nofollow"
                aria-label={item.title}
                className="absolute inset-0 z-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                title={item.title}/>
            ) : (
              <Link
                href={item.href}
                aria-label={item.title}
                className="absolute inset-0 z-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                title={item.title}/>
            );

            return (
              <div
                key={item.id}
                className="group relative flex h-full flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2"
              >
                {tileLink}
                <div className="relative z-10 flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white shadow-sm transition group-hover:scale-105">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
                </div>
                <ExpandableText language={language}>{item.body}</ExpandableText>
              </div>
            );
          })}
        </div>
        <div className="flex flex-col gap-4 lg:items-center lg:self-center lg:justify-center">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm lg:mx-auto">
            <div className="aspect-[9/16] w-full max-h-[1240px] lg:max-h-[1440px]">
              <iframe
                title={isSpanish ? "B4Experience Shorts ES" : "B4Experience Shorts EN"}
                src={shortsSrc}
                loading="lazy"
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
