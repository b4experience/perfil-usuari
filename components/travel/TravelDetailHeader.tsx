import { Star } from 'lucide-react';

import { useT } from '@/i18n/useT';

type TravelDetailHeaderProps = {
  title: string;
  durationLabel: string;
  location?: string;
  averageRating?: number | null;
  totalReviews?: number | null;
};

export const TravelDetailHeader = ({
  title,
  durationLabel,
  location,
  averageRating,
  totalReviews,
}: TravelDetailHeaderProps) => {
  const { t } = useT();
  const roundedRating = Math.round(averageRating || 0);
  const hasReviews = (totalReviews ?? 0) > 0;
  const reviewsLabel = `${averageRating?.toFixed(1)} (${totalReviews} ${
    totalReviews === 1 ? t('reviews.review') : t('reviews.reviews')
  })`;

  return (
    <div className="mb-3 space-y-2">
      {location && (
        <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-muted-foreground">
          {location}
        </p>
      )}
      <h1 className="text-3xl font-bold">{title}</h1>
      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <span>{durationLabel}</span>
        {hasReviews && (
          <>
            <span>•</span>
            <div className="flex items-center gap-1 text-foreground">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < roundedRating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                  }`}
                />
              ))}
              <a
                href="#reviews"
                className="ml-1 font-medium hover:underline hover:text-primary transition-colors"
               title={"Jump to section"}>
                {reviewsLabel}
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
