import { ChevronDown, ChevronUp, Star, User } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useReviews, Review, ReviewsResponse } from '@/hooks/useReviews'
import { useT } from '@/i18n/useT'
import { formatDistanceToNowStrict } from 'date-fns'
import { es, enUS, fr } from 'date-fns/locale'
import { useLanguage } from '@/context/LanguageContext'
import { useState } from 'react'

interface ReviewsSectionProps {
  productId: number
  initialData?: ReviewsResponse | null
}

const StarRating = ({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  }

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizeClasses[size]} ${
            star <= rating 
              ? 'fill-yellow-400 text-yellow-400' 
              : 'text-gray-300'
          }`}
        />
      ))}
    </div>
  )
}

const ReviewCard = ({ review }: { review: Review }) => {
  const { t } = useT()
  const { language } = useLanguage()

  const formatDate = (dateString?: string) => {
    if (!dateString) return ''
    try {
      const date = new Date(dateString)
      return formatDistanceToNowStrict(date, {
        addSuffix: true,
        locale: language === 'ES' ? es : language === 'FR' ? fr : enUS
      })
    } catch {
      return dateString
    }
  }

  return (
    <Card className="border-l-4 border-l-primary/20">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">
                {review.name_user || t('reviews.anonymous')}
              </p>
              {review.date && (
                <p className="text-xs text-muted-foreground">
                  {formatDate(review.date)}
                </p>
              )}
            </div>
          </div>
          {review.stars && (
            <StarRating rating={review.stars} size="sm" />
          )}
        </div>

        {review.title && (
          <h4 className="font-medium mb-2 text-sm">{review.title}</h4>
        )}

        {review.content && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {review.content}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

const RatingDistribution = ({ starDistribution, totalReviews }: { 
  starDistribution: Record<number, number>
  totalReviews: number 
}) => {
  const { t } = useT()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="space-y-1.5">
      <button
        type="button"
        className="flex w-full items-center justify-end gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-controls="rating-distribution"
      >
        {t('reviews.distribution')}
        {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>
      {isOpen ? (
        <div id="rating-distribution" className="space-y-1.5">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = starDistribution[stars] || 0
            const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0
            
            return (
              <div key={stars} className="flex items-center gap-1.5 text-xs">
                <span className="w-3 text-xs">{stars}</span>
                <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
                <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="bg-yellow-400 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-6 text-xs text-muted-foreground">
                  {count}
                </span>
              </div>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

export const ReviewsSection = ({ productId, initialData }: ReviewsSectionProps) => {
  const { t } = useT()
  const { language } = useLanguage()
  const { data, isLoading, error } = useReviews(productId, { 
    initialData: initialData || undefined,
    language
  })
  const [showingMore, setShowingMore] = useState(false)

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !data) {
    return null
  }

  const { reviews, stats } = data

  if (stats.totalReviews === 0) {
    return null
  }

  return (
    <section id="reviews" data-scrollspy className="scroll-mt-[120px]">
      <div id="reviews-anchor" data-scrollspy-anchor className="h-0" />
      <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{t('reviews.title')}</h2>
          <Badge variant="secondary" className="text-xs">
            {stats.totalReviews} {stats.totalReviews === 1 ? t('reviews.review') : t('reviews.reviews')}
          </Badge>
        </div>

          {/* Rating Overview */}
          <div className="grid md:grid-cols-2 gap-4 mb-5">
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-3xl font-bold">{stats.averageRating}</span>
                <div className="flex flex-col">
                  <StarRating rating={Math.round(stats.averageRating)} size="md" />
                  <span className="text-xs text-muted-foreground mt-0.5">
                    {t('reviews.basedOn')} {stats.totalReviews} {stats.totalReviews === 1 ? t('reviews.review') : t('reviews.reviews')}
                  </span>
                </div>
              </div>
            </div>

            <div className="w-full md:max-w-xs md:ml-auto">
              <RatingDistribution 
                starDistribution={stats.starDistribution} 
                totalReviews={stats.totalReviews} 
              />
            </div>
          </div>

          {/* Reviews List */}
          <div className="space-y-3">
            <h3 className="font-medium mb-2 text-sm">
              {t('reviews.latest')}
            </h3>
            {(showingMore ? reviews : reviews.slice(0, 2)).map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
            
            {reviews.length > 2 && (
              <div className="text-center pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowingMore(!showingMore)}
                  className="text-sm"
                >
                  {showingMore 
                    ? t('reviews.showLess') 
                    : `${t('reviews.showMore')} (${reviews.length - 2})`
                  }
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
