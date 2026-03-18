import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/useT";
import { supabase } from "@/integrations/supabase/client";
import { optimizeSupabaseImage } from "@/utils/image";
interface PhotoGalleryProps {
  travelId: number;
  travelTitle: string;
}

// Public storage base URL
const STORAGE_PUBLIC_BASE = "https://aqfvdnnmeywvzivkvlhi.supabase.co/storage/v1/object/public/";

// Grid layout configuration (position and styling)
const GRID_LAYOUT = [{
  position: "main-left",
  className: "row-span-2"
}, {
  position: "top-center",
  className: "col-start-2"
}, {
  position: "bottom-center",
  className: "col-start-2"
}, {
  position: "main-right",
  className: "row-span-2 col-start-3 row-start-1"
}];

// Normalize storage URLs and accept paths like "product-img/..."
const normalizeStorageUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  let u = String(url).trim().replace("procudct-img", "product-img");

  // Already absolute URL
  if (/^https?:\/\//.test(u)) {
    return u;
  }

  // Remove leading slashes
  u = u.replace(/^\/+/, "");

  // Accept known buckets
  if (/^(product-img|home-img|activities|logos|quiz-img|countires)\//.test(u)) {
    return STORAGE_PUBLIC_BASE + u;
  }
  return null;
};

// Build default URLs when table data is missing
const buildDefaultUrls = (travelId: number, type: "vert" | "hor", count: number): string[] => {
  return Array.from({
    length: count
  }, (_, i) => `${STORAGE_PUBLIC_BASE}product-img/photo_${type}${i + 1}/${travelId}.webp`);
};

// Helper to pick random elements from array
const pickRandom = (array: string[], count: number): string[] => {
  if (array.length <= count) return [...array];
  const indices = new Set<number>();
  while (indices.size < count) {
    indices.add(Math.floor(Math.random() * array.length));
  }
  return Array.from(indices).map(i => array[i]);
};

const buildMobilePreviewImages = (
  verticalPhotos: string[],
  horizontalPhotos: string[],
  previewCount: number
): string[] => {
  const pattern = Array.from({ length: previewCount }, (_, i) => (i % 3 === 0 ? 'V' : 'H'));
  const verticalNeeded = pattern.filter((item) => item === 'V').length;
  const horizontalNeeded = pattern.length - verticalNeeded;
  const verticalPool = pickRandom(verticalPhotos, Math.min(verticalPhotos.length, verticalNeeded));
  const horizontalPool = pickRandom(horizontalPhotos, Math.min(horizontalPhotos.length, horizontalNeeded));
  const fallbackPool = pickRandom(
    [...verticalPhotos, ...horizontalPhotos].filter(
      (image) => !verticalPool.includes(image) && !horizontalPool.includes(image),
    ),
    Math.max(previewCount - (verticalPool.length + horizontalPool.length), 0),
  );
  let fallbackIndex = 0;
  let verticalIndex = 0;
  let horizontalIndex = 0;

  return pattern.map((type) => {
    if (type === 'V' && verticalIndex < verticalPool.length) {
      return verticalPool[verticalIndex++];
    }
    if (type === 'H' && horizontalIndex < horizontalPool.length) {
      return horizontalPool[horizontalIndex++];
    }
    if (fallbackIndex < fallbackPool.length) {
      return fallbackPool[fallbackIndex++];
    }
    if (verticalIndex < verticalPool.length) return verticalPool[verticalIndex++];
    if (horizontalIndex < horizontalPool.length) return horizontalPool[horizontalIndex++];
    return '';
  }).filter(Boolean) as string[];
};
export const PhotoGallery = ({
  travelId,
  travelTitle
}: PhotoGalleryProps) => {
  const {
    t
  } = useT();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [displayImages, setDisplayImages] = useState<string[]>([]);
  const [allImages, setAllImages] = useState<string[]>([]);
  const [totalImagesCount, setTotalImagesCount] = useState(0);
  const [viewAllBackground, setViewAllBackground] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [imagePosition, setImagePosition] = useState({
    x: 0,
    y: 0
  });
  const [transformOrigin, setTransformOrigin] = useState<string>('center center');
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);

  const getMobileLayoutClass = (index: number) => {
    const mod = index % 3;
    if (mod === 0) return 'row-span-2';
    if (mod === 1) return 'row-start-1';
    return 'row-start-2';
  };

  const nextImage = useCallback(() => {
    if (allImages.length === 0) return;
    setCurrentImageIndex(prev => (prev + 1) % allImages.length);
    setZoomLevel(1);
    setImagePosition({
      x: 0,
      y: 0
    });
  }, [allImages.length]);
  const previousImage = useCallback(() => {
    if (allImages.length === 0) return;
    setCurrentImageIndex(prev => (prev - 1 + allImages.length) % allImages.length);
    setZoomLevel(1);
    setImagePosition({
      x: 0,
      y: 0
    });
  }, [allImages.length]);
  const closeGallery = useCallback(() => {
    setIsGalleryOpen(false);
    setZoomLevel(1);
    setImagePosition({
      x: 0,
      y: 0
    });
  }, []);

  // Block scroll when modal is open
  useEffect(() => {
    if (isGalleryOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isGalleryOpen]);

  useEffect(() => {
    const updateViewport = () => {
      setIsMobile(window.innerWidth < 640);
    };
    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isGalleryOpen) return;

      if (event.key === 'Escape') {
        closeGallery();
        return;
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        nextImage();
        return;
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        previousImage();
      }
    };
    if (isGalleryOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [closeGallery, isGalleryOpen, nextImage, previousImage]);
  // Load only preview images initially (4 images for the grid)
  useEffect(() => {
    const loadPreviewPhotos = async () => {
      try {
        const {
          data: productPhotos,
          error
        } = await supabase.from("product_photos").select("*").eq("id", travelId).maybeSingle();
        if (error) {
          console.warn("product_photos error:", error);
        }
        let verticalPhotos: string[] = [];
        let horizontalPhotos: string[] = [];
        if (productPhotos) {
          for (let i = 1; i <= 12; i++) {
            const key = `photo_vert${i}` as keyof typeof productPhotos;
            const normalized = normalizeStorageUrl(productPhotos[key] as string | null);
            if (normalized) verticalPhotos.push(normalized);
          }
          for (let i = 1; i <= 5; i++) {
            const key = `photo_hor${i}` as keyof typeof productPhotos;
            const normalized = normalizeStorageUrl(productPhotos[key] as string | null);
            if (normalized) horizontalPhotos.push(normalized);
          }
        }

        if (verticalPhotos.length === 0) {
          verticalPhotos = buildDefaultUrls(travelId, "vert", 12);
        }
        if (horizontalPhotos.length === 0) {
          horizontalPhotos = buildDefaultUrls(travelId, "hor", 5);
        }

        const previewCount = isMobile ? 8 : 4;
        const gridImages = isMobile
          ? buildMobilePreviewImages(verticalPhotos, horizontalPhotos, previewCount)
          : (() => {
              const randomVertical = pickRandom(verticalPhotos, 2);
              const randomHorizontal = pickRandom(horizontalPhotos, 2);
              const baseGrid = [randomVertical[0], randomHorizontal[0], randomHorizontal[1], randomVertical[1]].filter(Boolean) as string[];
              const remaining = pickRandom(
                [...verticalPhotos, ...horizontalPhotos].filter(image => !baseGrid.includes(image)),
                Math.max(previewCount - baseGrid.length, 0)
              );
              return [...baseGrid, ...remaining].slice(0, previewCount);
            })();
        const remainingForButton = [...verticalPhotos, ...horizontalPhotos].filter(image => !gridImages.includes(image));
        const buttonBackground = remainingForButton[0] ?? gridImages[gridImages.length - 1] ?? null;
        setViewAllBackground(buttonBackground);
        setTotalImagesCount(verticalPhotos.length + horizontalPhotos.length);
        setDisplayImages(gridImages);
      } catch (err) {
        console.error("Error loading preview photos:", err);
        const fallback = [...buildDefaultUrls(travelId, "vert", 12), ...buildDefaultUrls(travelId, "hor", 5)];
        setTotalImagesCount(fallback.length);
        const fallbackImages = pickRandom(fallback, isMobile ? 9 : 4);
        setDisplayImages(fallbackImages);
        setViewAllBackground(fallbackImages[0] ?? null);
      }
    };
    loadPreviewPhotos();
  }, [travelId, isMobile]);

  // Load all images only when gallery is opened
  useEffect(() => {
    if (!isGalleryOpen) return;
    // Allow fetching when only preview images are present
    if (allImages.length > displayImages.length) return;
    const loadAllPhotos = async () => {
      try {
        const {
          data: productPhotos,
          error
        } = await supabase.from("product_photos").select("*").eq("id", travelId).maybeSingle();
        if (error) {
          console.warn("product_photos error:", error);
        }
        let verticalPhotos: string[] = [];
        let horizontalPhotos: string[] = [];
        if (productPhotos) {
          for (let i = 1; i <= 12; i++) {
            const key = `photo_vert${i}` as keyof typeof productPhotos;
            const normalized = normalizeStorageUrl(productPhotos[key] as string | null);
            if (normalized) verticalPhotos.push(normalized);
          }
          for (let i = 1; i <= 5; i++) {
            const key = `photo_hor${i}` as keyof typeof productPhotos;
            const normalized = normalizeStorageUrl(productPhotos[key] as string | null);
            if (normalized) horizontalPhotos.push(normalized);
          }
        }

        if (verticalPhotos.length === 0) {
          verticalPhotos = buildDefaultUrls(travelId, "vert", 12);
        }
        if (horizontalPhotos.length === 0) {
          horizontalPhotos = buildDefaultUrls(travelId, "hor", 5);
        }

        const seen = new Set<string>();
        const combined = [...verticalPhotos, ...horizontalPhotos].filter(url => {
          if (seen.has(url)) return false;
          seen.add(url);
          return true;
        });
        
        // Asegurar que displayImages estén al principio para mantener sincronización
        const reorderedImages = [...displayImages];
        combined.forEach(img => {
          if (!displayImages.includes(img)) {
            reorderedImages.push(img);
          }
        });
        
        setAllImages(reorderedImages);
      } catch (err) {
        console.error("Error loading all photos:", err);
        const fallback = [...buildDefaultUrls(travelId, "vert", 12), ...buildDefaultUrls(travelId, "hor", 5)];
        setAllImages(fallback);
      }
    };
    loadAllPhotos();
  }, [isGalleryOpen, travelId, allImages.length, displayImages]);
  const handleImageClick = (index: number) => {
    // Asegurar que las imágenes de vista previa estén en allImages antes de abrir
    setAllImages(prev => (prev.length > 0 ? prev : [...displayImages]));
    setCurrentImageIndex(index);
    setIsGalleryOpen(true);
  };
  const handleViewAllClick = () => {
    // Asegurar que las imágenes de vista previa estén en allImages antes de abrir
    setAllImages(prev => (prev.length > 0 ? prev : [...displayImages]));
    setCurrentImageIndex(0);
    setIsGalleryOpen(true);
  };
  const handleImageZoomClick = (e: React.MouseEvent) => {
    if (zoomLevel === 1) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setTransformOrigin(`${x}% ${y}%`);
      setImagePosition({ x: 0, y: 0 });
      setZoomLevel(2);
    } else {
      setZoomLevel(1);
      setTransformOrigin('center center');
      setImagePosition({ x: 0, y: 0 });
    }
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const moveX = (0.5 - x) * (zoomLevel - 1) * 50;
      const moveY = (0.5 - y) * (zoomLevel - 1) * 50;
      setImagePosition({
        x: moveX,
        y: moveY
      });
    }
  };

  // Touch handlers for mobile swipe navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
    setTouchEnd(null);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchEnd({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const deltaX = touchStart.x - touchEnd.x;
    const deltaY = touchStart.y - touchEnd.y;
    const minSwipeDistance = 50;
    
    // Only trigger swipe if horizontal movement is greater than vertical
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0) {
        // Swipe left - next image
        nextImage();
      } else {
        // Swipe right - previous image  
        previousImage();
      }
    }
    
    setTouchStart(null);
    setTouchEnd(null);
  };

  // Loading/empty state
  if (displayImages.length === 0) {
    return <div className="grid gap-2 grid-cols-3 auto-rows-[7rem] sm:grid-rows-2 sm:h-[220px] bg-muted rounded-2xl p-4">
        <div className="col-span-3 flex items-center justify-center text-muted-foreground">
          <p>Loading gallery...</p>
        </div>
      </div>;
  }
  const photosCount = totalImagesCount || allImages.length || displayImages.length;
  const showViewAllTile = isMobile;
  const mobileGridStyle = isMobile
    ? {
        gridAutoColumns: 'calc((100% - 1rem) / 3)',
        minWidth: 'calc(100% + ((100% - 1rem) / 6))',
      }
    : undefined;

  return <>
      {/* Grid de fotos */}
      <div className="overflow-x-auto sm:overflow-visible">
        <div
          className="grid gap-2 grid-flow-col auto-cols-[8rem] grid-rows-2 auto-rows-[7rem] sm:w-full sm:grid-flow-row sm:auto-cols-auto sm:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)_minmax(0,1fr)] sm:grid-rows-2 sm:h-[350px]"
          style={mobileGridStyle}
        >
          {displayImages.map((image, index) => {
          const layout = GRID_LAYOUT[index];
          const layoutClass = isMobile ? getMobileLayoutClass(index) : layout?.className || "";
          const optimizedImage = optimizeSupabaseImage(image, { width: 600, height: 800, quality: 85 });
          return <motion.div key={index} className={`relative overflow-hidden rounded-2xl cursor-pointer ${layoutClass}`} whileTap={{
            scale: 0.98
          }} transition={{
            duration: 0.2
          }} onClick={() => handleImageClick(index)}>
                <img 
                  src={optimizedImage} 
                  alt={`${travelTitle} - ${t("travel.gallery.view")} ${index + 1}`} 
                  loading="lazy"
                  title={`${travelTitle} - ${t("travel.gallery.view")} ${index + 1}`}
                  width={600}
                  height={800}
                  className="w-full h-full object-cover rounded-2xl transition-transform duration-200 hover:scale-110" 
                  onError={e => {
              console.warn("Failed to load image, hiding:", image);
              e.currentTarget.style.display = "none";
            }} />
                {index === displayImages.length - 1 && !isMobile && <div className="absolute bottom-2 right-2">
                    <Button size="default" variant="secondary" className="bg-background/90 backdrop-blur-sm hover:bg-background text-foreground text-sm px-3 py-2" aria-label={t("travel.gallery.viewAllAriaWithCount", { count: photosCount })} onClick={e => {
                e.stopPropagation();
                handleViewAllClick();
              }}>
                      <ImageIcon className="h-3 w-3 mr-1" />
                      {t("travel.gallery.viewAllWithCount", { count: photosCount })}
                    </Button>
                  </div>}
              </motion.div>;
        })}
          {showViewAllTile && (
            <motion.button
              type="button"
              className="relative overflow-hidden rounded-2xl cursor-pointer flex items-center justify-center border border-muted-foreground/20"
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
              onClick={handleViewAllClick}
              aria-label={t("travel.gallery.viewAllAriaWithCount", { count: photosCount })}
            >
              {viewAllBackground && (
                <img
                  src={optimizeSupabaseImage(viewAllBackground, { width: 600, height: 800, quality: 85 })}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-background/70" />
              <span className="relative inline-flex items-center gap-2 text-sm font-medium text-foreground">
                {t("travel.gallery.viewAllWithCount", { count: photosCount })}
              </span>
            </motion.button>
          )}
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isGalleryOpen && <motion.div initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }} className="fixed inset-0 bg-black/90 z-[11000] flex flex-col pt-16" onClick={closeGallery}>
            {/* Close button */}
            <div className="absolute right-4 z-20" style={{ top: "calc(env(safe-area-inset-top, 0px) + 12px)" }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeGallery}
                className="h-10 w-10 p-0 text-white border border-white/25 bg-black/30 hover:bg-white/10 hover:border-white/60 hover:text-white focus:text-white [&_svg]:text-white"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Navigation and image container */}
            <div className="flex-1 flex items-center justify-center relative px-4 py-4" 
                 onClick={closeGallery}
                 onTouchStart={handleTouchStart}
                 onTouchMove={handleTouchMove}
                 onTouchEnd={handleTouchEnd}
            >
              {/* Navigation arrows outside image */}
              {allImages.length > 1 && <>
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={e => {
              e.stopPropagation();
              previousImage();
            }}
                    className="absolute left-4 md:left-8 z-20 text-white border border-white/20 bg-black/10 hover:bg-white/15 hover:border-white/50 hover:text-white focus:text-white h-12 w-12 sm:h-16 sm:w-16 sm:border-white/40 sm:bg-black/20 sm:hover:border-white/70 [&_svg]:text-white"
                  >
                    <ChevronLeft className="w-2/3 h-2/3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={e => {
              e.stopPropagation();
              nextImage();
            }}
                    className="absolute right-4 md:right-8 z-20 text-white border border-white/20 bg-black/10 hover:bg-white/15 hover:border-white/50 hover:text-white focus:text-white h-12 w-12 sm:h-16 sm:w-16 sm:border-white/40 sm:bg-black/20 sm:hover:border-white/70 [&_svg]:text-white"
                  >
                   <ChevronRight className="w-2/3 h-2/3" />
                  </Button>
                </>}

              {/* Image container */}
              <div className="relative w-full max-w-2xl md:max-w-3xl aspect-square flex items-center justify-center" style={{
            overflow: zoomLevel > 1 ? 'visible' : 'hidden',
            cursor: zoomLevel === 1 ? 'zoom-in' : 'zoom-out'
          }}>
                <motion.div
                  key={currentImageIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="w-full h-full flex items-center justify-center overflow-visible"
                >
                  <img 
                    src={optimizeSupabaseImage(allImages[currentImageIndex], { width: 1400, height: 1400, quality: 90 })} 
                    alt={`${travelTitle} - ${t("travel.gallery.view")} ${currentImageIndex + 1}`} 
                    className="max-w-full max-h-full object-contain rounded-lg select-none" 
                    draggable={false}
                    style={{
                      transform: `translate(${imagePosition.x}px, ${imagePosition.y}px) scale(${zoomLevel})`,
                      transformOrigin: transformOrigin,
                      transition: 'transform 0.25s ease-out'
                    }} 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleImageZoomClick(e);
                    }} 
                    onMouseMove={handleMouseMove} 
                    onMouseLeave={() => {
                      if (zoomLevel === 1) {
                        setImagePosition({ x: 0, y: 0 });
                      }
                    }} 
                  />
                </motion.div>
              </div>
            </div>

            {/* Thumbnails */}

            {allImages.length > 0 && <div className="p-4 border-t border-white/10 relative z-30 bg-black/50" onClick={e => e.stopPropagation()}>
                <div className="flex gap-2 overflow-x-auto pb-2 justify-center">
                  {allImages.map((image, index) => <motion.button key={index} className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${index === currentImageIndex ? "border-primary" : "border-transparent hover:border-white/50"}`} onClick={() => setCurrentImageIndex(index)} whileHover={{
              scale: 1.05
            }} whileTap={{
              scale: 0.95
            }}>
                      <img src={image} alt={`${travelTitle} - ${t("travel.gallery.thumbnail")} ${index + 1}`} className="w-full h-full object-cover" title={`${travelTitle} - ${t("travel.gallery.thumbnail")} ${index + 1}`} />
                    </motion.button>)}
                </div>
                
                {/* Contador */}
                <div className="text-center text-white/70 text-sm pt-2">
                  {currentImageIndex + 1} / {allImages.length}
                </div>
              </div>}
          </motion.div>}
      </AnimatePresence>
    </>;
};
