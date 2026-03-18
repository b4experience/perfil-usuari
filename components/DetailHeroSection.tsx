import { motion } from "framer-motion";
import { HTMLContent } from "@/components/HTMLContent";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

interface DetailHeroSectionProps {
  title: string;
  description: string;
  mediaUrl?: string;
}

export const DetailHeroSection = ({ 
  title, 
  description, 
  mediaUrl
}: DetailHeroSectionProps) => {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [hasOverflow, setHasOverflow] = useState(false);
  const descriptionRef = useRef<HTMLDivElement | null>(null);
  const { language } = useLanguage();

  const isYouTubeUrl = mediaUrl?.includes('youtube.com') || mediaUrl?.includes('youtu.be');
  const readMoreText = language === 'ES' ? 'Leer más' : 'Read more';
  const showLessText = language === 'ES' ? 'Mostrar menos' : 'Show less';
  
  const getYouTubeId = (url: string) => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const youtubeId = mediaUrl ? getYouTubeId(mediaUrl) : null;
  const youtubeEmbedUrl = youtubeId ? `https://www.youtube.com/embed/${youtubeId}?autoplay=0&rel=0` : null;
  const titleContainsHeadingTag = /<h[1-6][\s>]/i.test(title);

  const shouldClamp = hasOverflow && !isDescriptionExpanded;

  useEffect(() => {
    const el = descriptionRef.current;
    if (!el) return;

    const checkOverflow = () => {
      if (!descriptionRef.current) return;
      const styles = window.getComputedStyle(descriptionRef.current);
      const lineHeight = Number.parseFloat(styles.lineHeight) || 20;
      const maxHeight = lineHeight * 5;
      setHasOverflow(descriptionRef.current.scrollHeight > maxHeight + 1);
    };

    checkOverflow();
    window.addEventListener("resize", checkOverflow);
    return () => window.removeEventListener("resize", checkOverflow);
  }, [description]);

  return (
    <section className="relative overflow-hidden rounded-[32px] border border-white/70 bg-gradient-to-br from-white via-slate-50 to-slate-100 px-4 py-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] md:px-8 md:py-8">
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.15),transparent_45%)]" />
        <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-primary/5 to-transparent" />
      </div>

      <div className="relative grid gap-10 md:grid-cols-2 items-center">
        <motion.div 
          className={`space-y-1 order-1 md:order-1 ${!mediaUrl ? 'md:col-span-2 max-w-4xl mx-auto' : ''}`}
          initial={false}
          animate={{ opacity: 1, y: 0 }}
        >
          <HTMLContent 
            content={title} 
            as={titleContainsHeadingTag ? "div" : "h2"}
            className="text-xl md:text-2xl font-semibold tracking-tight text-slate-900 mt-3 [&_h1]:text-xl [&_h2]:text-xl [&_h3]:text-xl [&_h4]:text-xl [&_h5]:text-xl [&_h6]:text-xl md:[&_h1]:text-2xl md:[&_h2]:text-2xl md:[&_h3]:text-2xl md:[&_h4]:text-2xl md:[&_h5]:text-2xl md:[&_h6]:text-2xl"
          />
          
          <div className="text-sm md:text-base text-muted-foreground leading-relaxed text-justify">
            <div
              ref={descriptionRef}
              className={cn(
                "overflow-hidden",
                shouldClamp && "line-clamp-5 max-h-[7.5em]",
              )}
            >
              <HTMLContent content={description} />
            </div>
            {hasOverflow && !isDescriptionExpanded && (
              <button
                onClick={() => setIsDescriptionExpanded(true)}
                className="text-primary hover:underline mt-2 font-medium text-sm"
              >
                {readMoreText}
              </button>
            )}
            {hasOverflow && isDescriptionExpanded && (
              <button
                onClick={() => setIsDescriptionExpanded(false)}
                className="text-primary hover:underline mt-2 font-medium text-sm"
              >
                {showLessText}
              </button>
            )}
          </div>
        </motion.div>

        {mediaUrl && (
          <motion.div
            className="order-2 md:order-2 flex justify-center"
            initial={false}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="relative w-full max-w-[520px] rounded-[26px] border border-white/70 bg-white/60 p-1 shadow-[0_25px_80px_rgba(15,23,42,0.25)]">
              <div
                className={cn(
                  "overflow-hidden rounded-[22px] bg-slate-200 aspect-video",
                  shouldClamp && "md:aspect-[4/3] lg:aspect-[3/2] md:max-h-[320px] lg:max-h-[340px]",
                )}
              >
                {isYouTubeUrl && youtubeEmbedUrl ? (
                  <>
                    {isVideoLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                      </div>
                    )}
                    <iframe
                      src={youtubeEmbedUrl}
                      title="YouTube video player"
                      className="h-full w-full object-cover"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      onLoad={() => setIsVideoLoading(false)}
                    />
                  </>
                ) : (
                  <img
                    src={mediaUrl}
                    alt="Media content"
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
};
