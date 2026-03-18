import { useState, useEffect, useMemo } from 'react';
import { optimizeSupabaseImage } from '@/utils/image';

// mismo base que usas en PhotoGallery
const STORAGE_PUBLIC_BASE =
  "https://aqfvdnnmeywvzivkvlhi.supabase.co/storage/v1/object/public/";

const normalizeStorageUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  let u = String(url).trim().replace("procudct-img", "product-img");

  if (u === "placeholder.svg" || u === "/placeholder.svg") {
    return "/placeholder.svg";
  }

  // si ya es URL absoluta
  if (/^https?:\/\//.test(u)) {
    return u;
  }

  // quita /
  u = u.replace(/^\/+/, "");

  // buckets conocidos
  if (/^(product-img|home-img|activities|logos|quiz-img|countires)\//.test(u)) {
    return STORAGE_PUBLIC_BASE + u;
  }
  return null;
};

interface SmartImageProps {
  imageUrls: string[];
  alt: string;
  className?: string;
  width?: number;
  height?: number;
}

export const SmartImage = ({ imageUrls, alt, className, width, height }: SmartImageProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // normalizar y optimizar urls que vienen de supabase
  const normalizedUrls = useMemo(() => (
    imageUrls
      .map((u) => {
        const normalized = normalizeStorageUrl(u);
        if (!normalized) return null;
        return optimizeSupabaseImage(normalized, {
          width: width || 800,
          height,
          quality: 85,
          format: 'webp'
        });
      })
      .filter((u): u is string => Boolean(u))
  ), [imageUrls, width, height]);

  const urlsKey = normalizedUrls.join('|');

  const handleImageError = () => {
    if (currentImageIndex < normalizedUrls.length - 1) {
      setCurrentImageIndex((i) => i + 1);
      setImageError(false);
      setImageLoaded(false);
    } else {
      setImageError(true);
    }
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  useEffect(() => {
    setCurrentImageIndex(0);
    setImageError(false);
    setImageLoaded(false);
  }, [urlsKey]);

  if (!normalizedUrls || normalizedUrls.length === 0 || imageError) {
    return (
      <div className={`bg-muted flex items-center justify-center ${className}`}>
        <p className="text-muted-foreground text-sm">No image available</p>
      </div>
    );
  }

  return (
    <>
      {!imageLoaded && (
        <div className={`bg-muted animate-pulse ${className}`} />
      )}
      <img
        src={normalizedUrls[currentImageIndex]}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={`${className} ${imageLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
        onError={handleImageError}
        onLoad={handleImageLoad}
      />
    </>
  );
};
