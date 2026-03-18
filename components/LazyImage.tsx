import { useState, useRef, useEffect, memo } from 'react';
import { optimizeSupabaseImage } from '@/utils/image';

interface LazyImageProps {
  src: string;
  alt: string;
  title?: string;
  className?: string;
  style?: React.CSSProperties;
  onLoad?: () => void;
  onError?: () => void;
  loading?: 'lazy' | 'eager';
  decoding?: 'async' | 'sync' | 'auto';
  width?: number;
  height?: number;
}

export const LazyImage = memo(({
  src,
  alt,
  title,
  className = '',
  style,
  onLoad,
  onError,
  loading = 'lazy',
  decoding = 'async',
  width,
  height
}: LazyImageProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(loading === 'eager');
  const imgRef = useRef<HTMLImageElement>(null);

  const normalizedSrc = src?.trim() ?? '';
  const optimizedSrc = normalizedSrc
    ? optimizeSupabaseImage(normalizedSrc, {
    width: width || 800,
    height,
    quality: 85,
    format: 'webp'
  })
    : null;

  useEffect(() => {
    if (!optimizedSrc || loading === 'eager') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0,
        rootMargin: '400px' // Cargar imágenes mucho antes de que sean visibles
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [loading, optimizedSrc]);

  const handleLoad = () => {
    setImageLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setImageError(true);
    setImageLoaded(true);
    onError?.();
  };

  return (
    <div ref={imgRef} className={`relative ${className}`} style={style}>
      {!imageLoaded && !imageError && optimizedSrc && (
        <div className="absolute inset-0 bg-muted/50 animate-pulse" />
      )}
      
      {shouldLoad && !imageError && optimizedSrc && (
        <img
          src={optimizedSrc}
          alt={alt}
          title={title}
          loading="eager"
          decoding={decoding}
          fetchPriority={loading === 'eager' ? 'high' : 'auto'}
          width={width}
          height={height}
          className={`${className} ${imageLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}
          style={style}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
      
      {(!optimizedSrc || imageError) && (
        <div className="absolute inset-0 bg-muted flex items-center justify-center text-muted-foreground text-sm">
          Image not available
        </div>
      )}
    </div>
  );
});

LazyImage.displayName = 'LazyImage';
