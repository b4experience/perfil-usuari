"use client";

import { memo, useRef } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Country } from '@/types/country';
import { motion } from 'framer-motion';
import { LazyImage } from '@/components/LazyImage';
import { optimizeSupabaseImage } from '@/utils/image';
import { useT } from '@/i18n/useT';
import { useLanguage } from '@/context/LanguageContext';
import { slugify } from '@/utils/slugify';
import { useCountrySlugDictionary } from '@/hooks/useTravelSlugDictionary';
import { useLocalizedPath } from '@/utils/localizedPaths';

interface CountryCardProps {
  country: Country;
  aspectRatio?: string;
}

export const CountryCard = memo(({
  country,
  aspectRatio = '1/1'
}: CountryCardProps) => {
  const { t } = useT();
  const { language } = useLanguage();
  const buildPath = useLocalizedPath();
  const backgroundImage = country.foto_country;
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: countrySlugs } = useCountrySlugDictionary();
  const countrySlug =
    countrySlugs?.byId?.[country.id]?.[language] ?? slugify(country.name);

  return (
    <Link href={buildPath(`/country/${countrySlug}`)} title={country.name}>
      <motion.div
        layout 
        initial={{ opacity: 0, scale: 0.9 }} 
        animate={{ opacity: 1, scale: 1 }} 
        exit={{ opacity: 0, scale: 0.9 }} 
        whileHover={{ y: -4 }} 
        transition={{ duration: 0.2 }}
        className="group"
      >
        <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 overflow-hidden rounded-2xl relative focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2">
          <div ref={containerRef} className="relative overflow-hidden aspect-square">
            {/* Country image with lazy loading */}
            <LazyImage
              src={backgroundImage ? optimizeSupabaseImage(backgroundImage, { width: 600, height: 800 }) : ''}
              alt={`${country.name} destination`}
              title={country.name}
              width={600}
              height={800}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
            
            {/* Dark overlay for better text contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/20 to-black/10" />
            
            {/* Country name and description */}
            <div className="absolute inset-0 flex flex-col justify-between p-4">
              {/* Country name at top */}
              <div className="flex-1 flex items-center justify-center p-2">
                <h3 className="text-white uppercase text-center leading-tight font-bold text-lg md:text-xl break-words">
                  {country.name}
                </h3>
              </div>

              {/* Description and trip count at bottom */}
              <div className="text-center space-y-2 mb-4">
                
                {country.num_viatges && (
                  <p className="text-white/90 uppercase font-bold tracking-widest text-xs">
                    {country.num_viatges}{" "}
                    {country.num_viatges === 1 ? t("home.trip.one") : t("home.trip.many")}
                  </p>
                )}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </Link>
  );
});
