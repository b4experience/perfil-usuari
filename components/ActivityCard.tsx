"use client";

import { memo, useRef } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Activity } from '@/types/activity';
import { motion } from 'framer-motion';
import { LazyImage } from '@/components/LazyImage';
import { optimizeSupabaseImage } from '@/utils/image';
import { useT } from '@/i18n/useT';
import { useLanguage } from '@/context/LanguageContext';
import { slugify } from '@/utils/slugify';
import { useLocalizedPath } from '@/utils/localizedPaths';
import { useActivitySlugDictionary } from '@/hooks/useTravelSlugDictionary';
interface ActivityCardProps {
  activity: Activity;
  aspectRatio?: string;
}
export const ActivityCard = memo(({
  activity,
  aspectRatio = '1/1'
}: ActivityCardProps) => {
  const { t } = useT();
  const { language } = useLanguage();
  const buildPath = useLocalizedPath();
  const backgroundImage = activity.foto_actividad;
  const containerRef = useRef<HTMLDivElement>(null);
  const { data: activitySlugs } = useActivitySlugDictionary();
  
  const activitySlug =
    activitySlugs?.byId?.[activity.id]?.[language] ?? slugify(activity.name);
  
  return <Link href={buildPath(`/activity/${activitySlug}`)} title={activity.name}>
      <motion.div layout initial={{
      opacity: 0,
      scale: 0.9
    }} animate={{
      opacity: 1,
      scale: 1
    }} exit={{
      opacity: 0,
      scale: 0.9
    }} whileHover={{
      y: -4
    }} transition={{
      duration: 0.2
    }} className="group">
        <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 overflow-hidden rounded-2xl relative focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2">
          <div ref={containerRef} className="relative overflow-hidden aspect-square">
            {/* Imagen de la actividad */}
            <LazyImage
              src={backgroundImage ? optimizeSupabaseImage(backgroundImage, { width: 600, height: 800 }) : ''}
              alt={`${activity.name} activity`}
              title={activity.name}
              width={600}
              height={800}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />

            {/* Overlay oscuro */}  
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/30 to-black/15" />

            {/* Activity name and description */}
            <div className="absolute inset-0 flex flex-col justify-between p-4">
              {/* Activity name at top */}
              <div className="flex-1 flex items-center justify-center p-2">
                <h3 className="text-white uppercase text-center leading-tight font-bold text-lg md:text-xl break-words">
                  {activity.name}
                </h3>
              </div>

              {/* Description and trip count at bottom */}
              <div className="text-center space-y-2 mb-4">
            
                {activity.num_viatges && (
                  <p className="text-white/90 uppercase font-bold tracking-widest text-xs">
                    {activity.num_viatges}{" "}
                    {activity.num_viatges === 1 ? t("home.trip.one") : t("home.trip.many")}
                  </p>
                )}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </Link>;
});
