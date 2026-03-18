'use client';

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/useT";
import { formatPrice } from "@/utils/price";

interface StickyPriceBarProps {
  price: number;
  originalPrice?: number | null;
  bookingHref: string;
}

const getDiscountPct = (original?: number, current?: number): number => {
  if (
    typeof original !== 'number' ||
    typeof current !== 'number' ||
    original <= 0 ||
    current <= 0 ||
    original <= current
  ) {
    return 0;
  }

  return Math.round(((original - current) / original) * 100);
};

export const StickyPriceBar = ({ price, originalPrice, bookingHref }: StickyPriceBarProps) => {
  const { t } = useT();

  // Verificar si hay descuento real
  const hasDiscount = originalPrice && originalPrice > price;
  const discountPct = getDiscountPct(originalPrice || undefined, price);
  const scrollToDepartures = () => {
    const element = document.getElementById("departures");
    if (!element) {
      window.location.href = bookingHref;
      return;
    }
    const headerOffset =
      parseFloat(
        getComputedStyle(document.documentElement)
          .getPropertyValue("--header-visible-height")
          .trim(),
      ) || 0;
    const navOffset =
      parseFloat(
        getComputedStyle(document.documentElement)
          .getPropertyValue("--sections-nav-height")
          .trim(),
      ) || 0;
    const offset = headerOffset + navOffset + 8;
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - offset;

    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth",
    });
    window.setTimeout(() => {
      const updatedHeaderOffset =
        parseFloat(
          getComputedStyle(document.documentElement)
            .getPropertyValue("--header-visible-height")
            .trim(),
        ) || 0;
      const updatedNavOffset =
        parseFloat(
          getComputedStyle(document.documentElement)
            .getPropertyValue("--sections-nav-height")
            .trim(),
        ) || 0;
      const updatedOffset = updatedHeaderOffset + updatedNavOffset + 8;
      const updatedTop =
        element.getBoundingClientRect().top + window.pageYOffset - updatedOffset;
      if (Math.abs(updatedTop - window.scrollY) > 2) {
        window.scrollTo({ top: updatedTop, behavior: "smooth" });
      }
    }, 220);
  };

  return (
    <motion.div
      id="sticky-price-bar"
      className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            {hasDiscount && discountPct > 0 ? (
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm text-gray-500 line-through truncate">
                  {formatPrice(originalPrice!)}
                </p>
                <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded whitespace-nowrap">
                  -{discountPct}%
                </span>
              </div>
            ) : null}
            <p className="text-lg font-bold text-gray-900 truncate">
              {t("travel.price.from")} {formatPrice(price)}
            </p>
          </div>
          <Button
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap"
            onClick={scrollToDepartures}
          >
            {t("travel.buttons.checkAvailability")}
          </Button>
        </div>
      </div>
    </motion.div>
  );
};
