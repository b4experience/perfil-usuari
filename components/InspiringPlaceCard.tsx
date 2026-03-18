import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { useVideoPlayer } from '@/context/VideoPlayerContext';
import { SmartImage } from '@/components/SmartImage';
import { useMemo, useRef } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { slugify } from '@/utils/slugify';
import { useEnglishTravelSlugMap } from '@/hooks/useEnglishSlugs';
import { useLocalizedPath } from '@/utils/localizedPaths';
import Link from 'next/link';
import type { InspiringPlace } from '@/types/inspiringPlace';

interface InspiringPlaceCardProps {
  place: InspiringPlace;
  index: number;
  onTagClick: (tagId: number) => void;
  getTagColor: (tagId: number) => string;
  getActivityById: (activityId: number) => { id: number; name: string } | undefined;
}

const getYouTubeEmbedUrl = (url: string) => {
  const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
  return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
};

export const InspiringPlaceCard = ({ place, index, onTagClick, getTagColor, getActivityById }: InspiringPlaceCardProps) => {
  const { setCurrentVideo } = useVideoPlayer();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { language } = useLanguage();
  const buildPath = useLocalizedPath();
  const { data: enTravelSlugs = {} } = useEnglishTravelSlugMap(language === 'EN');

  const detailUrl = useMemo(() => {
    const slug = language === 'ES'
      ? slugify(place.name)
      : enTravelSlugs[place.id] ?? slugify(place.name);
    return buildPath(`/${slug}`);
  }, [buildPath, enTravelSlugs, language, place.id, place.name]);

  const handleVideoPlay = () => {
    if (iframeRef.current) {
      setCurrentVideo(iframeRef.current);
    }
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 + index * 0.1 }}
    >
      <Card className="h-full hover:shadow-lg transition-all duration-300 group flex flex-col">
        {/* YouTube Video or Image */}
        <div className="relative overflow-hidden aspect-video">
          {place.videoUrl ? (
            <div onClick={handleVideoPlay} className="cursor-pointer aspect-video">
              <iframe
                ref={iframeRef}
                src={getYouTubeEmbedUrl(place.videoUrl)}
                title={place.name}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : place.imageUrls && place.imageUrls.length > 0 ? (
            <SmartImage
              imageUrls={place.imageUrls}
              alt={place.name}
              width={800}
              height={600}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <p className="text-muted-foreground">No media available</p>
            </div>
          )}
        </div>
        
        <div className="flex flex-col flex-1">
          <CardHeader className="flex-1">
            <CardTitle className="text-lg font-bold">
              {place.name}
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              {place.subtitle}
            </CardDescription>
            
            {/* Tags */}
            <div className="flex flex-wrap gap-2 mt-3">
              {place.tags.map((tagId) => {
                const activity = getActivityById(tagId);
                if (!activity) return null;
                return (
                  <Badge
                    key={tagId}
                    variant="secondary"
                    className={`cursor-pointer hover:opacity-80 transition-opacity ${getTagColor(tagId)}`}
                    onClick={() => onTagClick(tagId)}
                  >
                    {activity.name}
                  </Badge>
                );
              })}
            </div>
          </CardHeader>
          
          {/* Ver más button */}
          <CardContent className="pt-0">
            <div className="flex justify-end">
              <Button asChild variant="outline" size="sm" className="gap-2">
                <Link href={detailUrl} className="flex items-center gap-2" title={"View place details"}>
                  <Eye className="h-4 w-4" />
                  {language === 'ES' ? 'Ver más' : 'View more'}
                </Link>
              </Button>
            </div>
          </CardContent>
        </div>
      </Card>
    </motion.div>
  );
};
