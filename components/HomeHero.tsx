"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Language } from "@/context/LanguageContext";
import { translations } from "@/i18n/translations";

const getMessageArray = (language: Language, key: string) => {
  const value = translations[language]?.[key] ?? translations.EN?.[key];
  if (Array.isArray(value)) return value;
  if (typeof value === "string") return [value];
  return [];
};

const getMessageString = (language: Language, key: string) => {
  const value = translations[language]?.[key] ?? translations.EN?.[key];
  if (Array.isArray(value)) return value[0] ?? "";
  if (typeof value === "string") return value;
  return "";
};

interface HomeHeroProps {
  language?: Language;
}

export const HomeHero = ({ language = "EN" }: HomeHeroProps) => {
  const [activePhrase, setActivePhrase] = useState(0);
  const dynamicPhrases = getMessageArray(language, "hero.subtitle.dynamic");
  const staticSubtitle = getMessageString(language, "hero.subtitle.static");
  const currentPhrase =
    dynamicPhrases.length > 0
      ? dynamicPhrases[activePhrase % dynamicPhrases.length]
      : "";
  const heroTitle = getMessageString(language, "hero.title");

  useEffect(() => {
    if (dynamicPhrases.length <= 1) return;

    const interval = setInterval(() => {
      setActivePhrase((prev) => (prev + 1) % dynamicPhrases.length);
    }, 3500);

    return () => {
      clearInterval(interval);
    };
  }, [dynamicPhrases]);

  useEffect(() => {
    setActivePhrase(0);
  }, [dynamicPhrases]);

  return (
    <section
      className="w-full relative px-4 md:px-6 lg:px-[60px] py-0"
      aria-labelledby="hero-title"
    >
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold tracking-tight text-muted-foreground leading-relaxed capitalize md:text-3xl">
          <span className="text-foreground font-medium block">
            {staticSubtitle}
          </span>
          <AnimatePresence mode="wait">
            {currentPhrase && (
              <motion.span
                key={currentPhrase}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                className="block text-brand-primary text-lg font-semibold mt-0 md:mt-1 text-blue-600 md:text-2xl"
              >
                {currentPhrase}
              </motion.span>
            )}
          </AnimatePresence>
        </h2>
      </div>
    </section>
  );
};
