// src/components/TravelCard.tsx
"use client";

import { useState, memo, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Travel } from '@/types/travel';
import { formatPrice } from '@/utils/price';
import { slugify } from '@/utils/slugify';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { updateSavedCount } from '@/services/saveService';
import { useToast } from '@/hooks/use-toast';
import { LazyImage } from '@/components/LazyImage';
import { optimizeSupabaseImage } from '@/utils/image';
import { getRibbonStyle } from '@/utils/ribbon';

import { useT } from "@/i18n/useT";
import { useLanguage } from "@/context/LanguageContext";
import { useEnglishTravelSlugMap } from '@/hooks/useEnglishSlugs';
import { useLocalizedPath } from '@/utils/localizedPaths';

interface TravelCardProps {
  travel: Travel;
  aspectRatio?: string;
  onSaveUpdate?: (travelId: number, newSavedCount: number) => void;
}

export const TravelCard = memo(({
  travel,
  aspectRatio = '3/4',
  onSaveUpdate
}: TravelCardProps) => {
  const { t } = useT();
  const { language } = useLanguage();
  const buildPath = useLocalizedPath();

  const [savedCount, setSavedCount] = useState(travel.num_saved);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  // Memoize expensive calculations
  const { data: enTravelSlugs = {} } = useEnglishTravelSlugMap(language === 'EN');
  const to = useMemo(() => {
    const slug =
      language === 'ES'
        ? slugify(travel.title)
        : enTravelSlugs[travel.id] ?? slugify(travel.title)
    return buildPath(`/${slug}`)
  }, [buildPath, travel.id, enTravelSlugs, travel.title, language]);
  
  const originalPrice = travel.originalPrice ?? 0;
  const discountPercentage = travel.percentage ?? 0;
  const ribbon = useMemo(() => getRibbonStyle(travel.ribbon), [travel.ribbon]);

  const hasDiscount = useMemo(() => 
    originalPrice > 0 && originalPrice > travel.price, 
    [originalPrice, travel.price]
  );

  const handleSaveClick = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isUpdating) return;

    setIsUpdating(true);
    const originalCount = savedCount;
    const newCount = savedCount + 1;

    // Optimistic UI
    setSavedCount(newCount);

    try {
      await updateSavedCount(travel.id, newCount, language);
      onSaveUpdate?.(travel.id, newCount);
      toast({
        description: t("toast.saved") || "Saved to favorites!",
        duration: 2000,
      });
    } catch (error) {
      setSavedCount(originalCount);
      console.error('Error updating saved count:', error);
      toast({
        variant: "destructive",
        description: t("toast.saveError") || "Error saving to favorites. Try again.",
        duration: 3000,
      });
    } finally {
      setIsUpdating(false);
    }
  }, [travel.id, savedCount, language, onSaveUpdate, t, toast]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSaveClick(e as any);
    }
  }, [handleSaveClick]);

  return (
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
        {ribbon ? (
          <span
            className={`absolute right-2 top-2 z-20 rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide shadow-md ${ribbon.className}`}
          >
            {ribbon.label}
          </span>
        ) : null}
        <Link 
          href={to}
          className="block focus:outline-none"
          aria-label={`${t("card.viewDetailsOf") || "View details of"} ${travel.title}`}
          title={travel.title}
        >
          <div className="relative overflow-hidden" style={{ aspectRatio }}>
            <LazyImage
              src={optimizeSupabaseImage(travel.imgUrl, { width: 600, height: 800 })}
              alt={`${t("card.imageAltPrefix") || "Trip image of"} ${travel.title}`}
              title={travel.title}
              width={600}
              height={800}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />

            <div className="absolute top-2 left-2 flex items-center backdrop-blur-sm bg-black/50 rounded-full z-10">
              <span className="text-xs text-white font-medium px-2 py-1">
                {savedCount}
              </span>
              <button
                onClick={handleSaveClick}
                onKeyDown={handleKeyDown}
                disabled={isUpdating}
                className="p-2 hover:bg-white/10 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
                aria-label={
                  isUpdating
                    ? `${t("card.saving") || "Saving..."}: ${travel.title}`
                    : `${t("card.saveToFavorites") || "Save to favorites"}: ${travel.title}`
                }
                title={
                  isUpdating
                    ? `${t("card.saving") || "Saving..."}: ${travel.title}`
                    : `${t("card.saveToFavorites") || "Save to favorites"}: ${travel.title}`
                }
              >
                <Heart
                  className={`w-4 h-4 sm:w-5 sm:h-5 transition-all duration-200 ${isUpdating ? 'animate-pulse' : ''}`}
                  fill="rgba(156, 163, 175, 0.3)"
                  stroke="white"
                  strokeWidth={2}
                  style={{ fill: isUpdating ? 'red' : undefined }}
                  onMouseEnter={(e) => { if (!isUpdating) e.currentTarget.style.fill = 'red'; }}
                  onMouseLeave={(e) => { if (!isUpdating) e.currentTarget.style.fill = 'rgba(156, 163, 175, 0.3)'; }}
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>
          
          <CardContent className="p-3 space-y-1">
            <h3 className="font-semibold text-card-foreground line-clamp-2 text-sm leading-tight">
              {travel.title}
            </h3>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                {hasDiscount && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="line-through">{formatPrice(originalPrice)}</span>
                    {discountPercentage > 0 && (
                      <span
                        className="rounded-full bg-black px-1.5 py-0.5 text-xs font-semibold text-white shadow-lg sm:px-2 sm:text-sm"
                        role="status"
                        aria-label={`${t("card.discount") || "Discount"} ${discountPercentage}%`}
                      >
                        -{discountPercentage}%
                      </span>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-primary">
                    {travel.price === -1
                      ? t("card.consultPrice") || "Contáctanos"
                      : formatPrice(travel.price)}
                  </span>
                  <span className="text-muted-foreground" aria-hidden="true">|</span>
                  <span className="text-muted-foreground text-sm">
                    {travel.duration}
                  </span>
                </div>

              </div>
            </div>
          </CardContent>
        </Link>
      </Card>
    </motion.div>
  );
});
