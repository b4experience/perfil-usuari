import { useState, useMemo, useEffect, memo, useCallback, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useT } from '@/i18n/useT'
import { useLanguage } from '@/context/LanguageContext'

interface BookingDate {
  id: number | string
  date: Date
  endDate?: Date | null
  price: number
  available_spots: number
  is_open_group: boolean
  is_private_group?: boolean
  name_event?: string
  categoria?: string
  places_total: number
  places_taken: number
  sold_out: boolean
  min_pers?: number
  max_pers?: number
}

interface BookingCalendarProps {
  dates: BookingDate[]
  selectedDate: Date | undefined
  onDateSelect: (date: Date | undefined, bookingDate?: BookingDate) => void
  peopleCount: number
  onPeopleCountChange: (count: number) => void
  hidePassengers?: boolean
  selectedCategory: string
  minPeople?: number
  groupTypeMode?: 'all' | 'open' | 'private'
  lockGroupType?: boolean
  initialMonth?: string | null
  travel?: {
    months?: (number | string)[]
    price?: number
    duration?: string
    days?: number
  }
  privateGroups?: Array<{
    id: string
    price: number
    min_pers: number
    max_pers: number
    etiquetas: string
  }>
  priceByMinPersons?: Array<{
    min_pers: number
    price: number
  }>
}
const normalizeDate = (date: Date | null | undefined): Date | null => {
  if (!date) return null
  const normalized = new Date(date)
  normalized.setHours(0, 0, 0, 0)
  return normalized
}

const extractDate = (dateObj: any): Date | null => {
  if (!dateObj) return null
  
  if (dateObj._type === "Date" && dateObj.value) {
    return new Date(dateObj.value.iso || dateObj.value.value)
  }
  
  if (dateObj instanceof Date) {
    return dateObj
  }
  if (typeof dateObj === 'string') {
    return new Date(dateObj)
  }
  
  return null
}

const renderMonthDays = (
  month: Date, 
  dates: BookingDate[], 
  selectedDate: Date | undefined, 
  onDateSelect: (date: Date | undefined, bookingDate?: BookingDate) => void,
  peopleCount: number,
  travel?: { months?: (number | string)[], price?: number, duration?: string, days?: number },
  privateGroups?: Array<{
    id: string
    price: number
    min_pers: number
    max_pers: number
    etiquetas: string
  }>,
  hoveredDate?: Date | null,
  onDateHover?: (date: Date | null) => void,
  t?: (key: string) => string,
  language?: string
) => {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1)
  const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0)
  const mondayOffset = (firstDay.getDay() + 6) % 7 // Convert Sunday=0 to Monday=0

  const getTripDaysFromTravel = () => {
    if (travel?.days) return travel.days
    if (travel?.duration && typeof travel.duration === 'string') {
      const match = travel.duration.match(/(\d+)/)
      return match ? parseInt(match[1]) : 8
    }
    return 0 
  }

  const selectedTrip = selectedDate ? dates.find(date => {
    const dateStart = extractDate(date.date)
    const selectedNorm = normalizeDate(selectedDate)
    return dateStart && selectedNorm && normalizeDate(dateStart)?.getTime() === selectedNorm.getTime()
  }) : null
  
  const days = []
  
  for (let i = 0; i < mondayOffset; i++) {
    days.push(
      <div key={`empty-${i}`} className="h-[60px] sm:h-[83px] w-full"></div>
    )
  }
  
  for (let dayNum = 1; dayNum <= lastDay.getDate(); dayNum++) {
    const dayDate = new Date(month.getFullYear(), month.getMonth(), dayNum)
    const dayNormalized = normalizeDate(dayDate)
    
    const isToday = dayDate.toDateString() === new Date().toDateString()
    
    const eventForDay = dates.find(date => {
      const eventStart = extractDate(date.date)
      const eventEnd = extractDate(date.endDate)
      
      if (!eventStart || !dayNormalized) return false
      
      const eventStartNorm = normalizeDate(eventStart)
      const eventEndNorm = eventEnd ? normalizeDate(eventEnd) : null
      const dayTime = dayNormalized.getTime()
      
      if (date.is_open_group && eventStartNorm) {
        return dayTime === eventStartNorm.getTime()
      }
      
      if (date.is_private_group && eventStartNorm && eventEndNorm) {
        return dayTime >= eventStartNorm.getTime() && dayTime <= eventEndNorm.getTime()
      }
      
      return false
    })
    
    const hasEvent = !!eventForDay
    const isSelected = selectedDate && dayNormalized?.getTime() === normalizeDate(selectedDate)?.getTime()
    const isPast = dayDate < new Date(new Date().setHours(0, 0, 0, 0))
    
    let isInHoveredTrip = false
    let isHoveredEndDate = false
    let hoveredTripIsPrivate = false
    let hoveredTripEndDate: Date | null = null
    
    if (hoveredDate && dayNormalized) {
      const hoveredNorm = normalizeDate(hoveredDate)
      if (hoveredNorm) {
        const hoveredEvent = dates.find(date => {
          const eventStart = extractDate(date.date)
          const eventEnd = extractDate(date.endDate)
          
          if (!eventStart) return false
          
          const eventStartNorm = normalizeDate(eventStart)
          const eventEndNorm = eventEnd ? normalizeDate(eventEnd) : null
          const hoveredTime = hoveredNorm.getTime()
          
          if (!eventStartNorm) return false
          
          if (date.is_open_group && eventStartNorm.getTime() === hoveredTime) {
            return true
          }
          
          if (date.is_private_group && eventStartNorm && eventEndNorm) {
            return hoveredTime >= eventStartNorm.getTime() && 
                   hoveredTime <= eventEndNorm.getTime()
          }
          
          return false
        })
        
        if (hoveredEvent) {
          hoveredTripIsPrivate = hoveredEvent.is_private_group === true
          const dayTime = dayNormalized.getTime()
          const hoveredTime = hoveredNorm.getTime()
          
          if (hoveredEvent.is_open_group) {
            const eventEnd = extractDate(hoveredEvent.endDate)
            if (eventEnd) {
              const eventEndNorm = normalizeDate(eventEnd)
              if (eventEndNorm) {
                const endTime = eventEndNorm.getTime()
                hoveredTripEndDate = eventEndNorm
                isHoveredEndDate = dayTime === endTime
                isInHoveredTrip = dayTime > hoveredTime && dayTime < endTime
              } else {
                const tripDays = getTripDaysFromTravel()
                const endTime = hoveredTime + (tripDays - 1) * 24 * 60 * 60 * 1000
                hoveredTripEndDate = new Date(endTime)
                isHoveredEndDate = dayTime === endTime
                isInHoveredTrip = dayTime > hoveredTime && dayTime < endTime
              }
            } else {
              const tripDays = getTripDaysFromTravel()
              const endTime = hoveredTime + (tripDays - 1) * 24 * 60 * 60 * 1000
              hoveredTripEndDate = new Date(endTime)
              isHoveredEndDate = dayTime === endTime
              isInHoveredTrip = dayTime > hoveredTime && dayTime < endTime
            }
          } 
          else if (hoveredEvent.is_private_group) {
            const tripDays = getTripDaysFromTravel()
            const endTime = hoveredTime + (tripDays - 1) * 24 * 60 * 60 * 1000
            hoveredTripEndDate = new Date(endTime)
            isHoveredEndDate = dayTime === endTime
            isInHoveredTrip = dayTime > hoveredTime && dayTime < endTime
          }
        }
      }
    }
    
    let isInSelectedTrip = false
    let isSelectedEndDate = false
    let selectedTripIsPrivate = false
    let selectedTripEndDate: Date | null = null
    
    if (selectedTrip && dayNormalized && selectedDate) {
      selectedTripIsPrivate = selectedTrip.is_private_group === true
      const selectedDateNorm = normalizeDate(selectedDate)
      const dayTime = dayNormalized.getTime()
      
      if (selectedDateNorm) {
        const selectedTime = selectedDateNorm.getTime()
        let endTime: number
        
        if (selectedTrip.is_open_group) {
          const selectedEventEnd = extractDate(selectedTrip.endDate)
          if (selectedEventEnd) {
            const selectedEndNorm = normalizeDate(selectedEventEnd)
            if (selectedEndNorm) {
              endTime = selectedEndNorm.getTime()
              selectedTripEndDate = selectedEndNorm
            } else {
              const tripDays = getTripDaysFromTravel()
              endTime = selectedTime + (tripDays - 1) * 24 * 60 * 60 * 1000
              selectedTripEndDate = new Date(endTime)
            }
          } else {
            const tripDays = getTripDaysFromTravel()
            endTime = selectedTime + (tripDays - 1) * 24 * 60 * 60 * 1000
            selectedTripEndDate = new Date(endTime)
          }
        } 
        else if (selectedTrip.is_private_group) {
          const tripDays = getTripDaysFromTravel()
          endTime = selectedTime + (tripDays - 1) * 24 * 60 * 60 * 1000
          selectedTripEndDate = new Date(endTime)
        } else {
          const tripDays = getTripDaysFromTravel()
          endTime = selectedTime + (tripDays - 1) * 24 * 60 * 60 * 1000
          selectedTripEndDate = new Date(endTime)
        }
        
        isSelectedEndDate = dayTime === endTime
        isInSelectedTrip = dayTime > selectedTime && dayTime < endTime
      }
    }

    const shouldDimOtherEvents = selectedTrip && eventForDay && eventForDay.id !== selectedTrip.id && !isSelectedEndDate
    
    const isHoveredCell = hoveredDate && dayNormalized?.getTime() === normalizeDate(hoveredDate)?.getTime()
    const isHoverRange = !isPast && (isInHoveredTrip || isHoveredCell || isHoveredEndDate)
    
    const isPrivateEvent = eventForDay?.is_private_group === true
    const isOpenEvent = eventForDay?.is_open_group === true
    
    days.push(
      <div
        key={dayDate.toDateString()}
        className={`
          h-[60px] sm:h-[83px] w-full flex flex-col transition-all duration-200 relative p-0.5 sm:p-1 border border-border
          ${isPast || !hasEvent ? 'text-muted-foreground/60 bg-muted/10 cursor-not-allowed border-transparent' : 'cursor-pointer'}
          ${shouldDimOtherEvents ? 'opacity-30 bg-muted/20 hover:bg-muted/30' : ''}
          ${hasEvent && !isPast && !shouldDimOtherEvents && !isSelected && !isSelectedEndDate && !isInSelectedTrip ? 
            (isPrivateEvent ? 'bg-transparent hover:bg-blue-200 border-blue-300' : 
             isOpenEvent ? 'bg-transparent hover:bg-blue-200 border-blue-300' : 
             'bg-transparent hover:bg-primary/20 border-primary/30') : 
            (!shouldDimOtherEvents && !isSelected && !isSelectedEndDate && !isInSelectedTrip && hasEvent ? 'hover:bg-muted/50' : '')}
          ${isSelected ? 'bg-blue-600 text-white shadow-lg' : ''}
          ${isSelectedEndDate ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-400' : ''}
          ${isInSelectedTrip ? 'bg-blue-200/80 border-blue-400/80' : ''}
          ${isHoverRange ? '!bg-blue-200/80 !border-blue-300/80' : ''}
          ${isHoveredCell && !isPast ? '!bg-blue-400/90 !border-blue-500/90' : ''}
          ${isHoveredEndDate && !isPast ? '!bg-blue-400/90 !border-blue-500/90' : ''}
          ${isToday ? 'ring-2 ring-primary/50' : ''}
        `}
        onMouseEnter={() => {
          if (!isPast && hasEvent && onDateHover) {
            onDateHover(dayDate)
          }
        }}
        onMouseLeave={() => {
          if (onDateHover) {
            onDateHover(null)
          }
        }}
        onClick={() => {
          if (!isPast && hasEvent) {
            const clickedDateNorm = normalizeDate(dayDate)
            const selectedDateNorm = normalizeDate(selectedDate)
            
            if (selectedDate && clickedDateNorm?.getTime() === selectedDateNorm?.getTime()) {
              onDateSelect(undefined)
            } else {
              if (eventForDay) {
                if (eventForDay.is_private_group) {
                  onDateSelect(new Date(dayDate), eventForDay)
                } 
                else if (eventForDay.is_open_group) {
                  const eventStartDate = extractDate(eventForDay.date)
                  if (eventStartDate) {
                    onDateSelect(new Date(eventStartDate), eventForDay)
                  }
                }
              }
            }
          } else {
          }
        }}
      >
        <span className="text-xs sm:text-sm font-medium self-start">{dayNum}</span>
        
        <div className="flex-1 flex items-center justify-center">
          {isSelectedEndDate && (
            <div className="text-center">
              <div className={`inline-flex h-8 items-center justify-center px-2 sm:px-3 py-1 sm:py-1.5 rounded text-[8px] sm:text-[10px] font-bold shadow-sm bg-blue-700 text-white ${
                selectedTripIsPrivate ? '' : ''
              }`}>
                <div className="text-[7px] sm:text-[9px] uppercase tracking-wide">{language === 'ES' ? 'FIN VIAJE' : language === 'FR' ? 'FIN VOYAGE' : 'END TRIP'}</div>
              </div>
            </div>
          )}
          {isHoveredEndDate && !isPast && (
            <div className="text-center">
              <div className={`inline-flex h-8 items-center justify-center px-2 sm:px-3 py-1 sm:py-1.5 rounded text-[8px] sm:text-[10px] font-bold shadow-sm bg-blue-700 text-white ${
                hoveredTripIsPrivate ? '' : ''
              }`}>
                <div className="text-[7px] sm:text-[9px] uppercase tracking-wide">{language === 'ES' ? 'FIN VIAJE' : language === 'FR' ? 'FIN VOYAGE' : 'TRIP END'}</div>
              </div>
            </div>
          )}
          {hasEvent && eventForDay && !isPast && !isSelectedEndDate && !isHoveredEndDate && !isInHoveredTrip && !isInSelectedTrip && (
            <div className="text-center">
              {eventForDay.is_private_group ? (
                // Para grupos privados: mostrar precio exacto de la base de datos en VERDE
                <div 
                  className={`inline-flex h-8 items-center justify-center bg-blue-600 text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded text-[8px] sm:text-[10px] font-bold shadow-sm ${eventForDay.price === -1 ? 'cursor-pointer hover:bg-blue-700' : ''}`}
                  onClick={eventForDay.price === -1 ? () => window.open('https://wa.me/34613037700', '_blank') : undefined}
                >
                  <div className="leading-tight">
                    {eventForDay.price === -1 ? (t ? t('booking.request') : 'CONSULTAR') : `${eventForDay.price}€`}
                  </div>
                </div>
              ) : (
                // Para grupos abiertos: precio + "open group" en AZUL
                <div 
                  className={`inline-flex h-8 items-center justify-center bg-blue-600 text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded text-[8px] sm:text-[10px] font-bold shadow-sm ${eventForDay.price === -1 ? 'cursor-pointer hover:bg-blue-700' : ''}`}
                  onClick={eventForDay.price === -1 ? () => window.open('https://wa.me/34613037700', '_blank') : undefined}
                >
                  <div className="leading-tight">{eventForDay.price === -1 ? (t ? t('booking.request') : 'CONSULTAR') : `${eventForDay.price}€`}</div>
                  <div className="text-[7px] sm:text-[9px] uppercase tracking-wide">{language === 'ES' ? 'grupo abierto' : language === 'FR' ? 'groupe ouvert' : 'open group'}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }
  
  return days
}

const BookingCalendarComponent = ({
  dates,
  selectedDate,
  onDateSelect,
  peopleCount,
  onPeopleCountChange,
  hidePassengers = false,
  selectedCategory,
  minPeople = 1,
  groupTypeMode = 'all',
  lockGroupType = false,
  initialMonth = null,
  travel,
  privateGroups = [],
  priceByMinPersons = []
}: BookingCalendarProps) => {
  const today = useMemo(() => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    return now
  }, [])
  
  const [currentMonth, setCurrentMonth] = useState(today)
  const hasInitializedMonthRef = useRef(false)
  const lastInitialMonthRef = useRef<string | null>(null)
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null)
  const [groupTypeFilter, setGroupTypeFilter] = useState<'all' | 'open' | 'private'>(groupTypeMode)
  const { t } = useT()
  const { language } = useLanguage()
  const priceLocale = language === 'ES' ? 'es-ES' : language === 'FR' ? 'fr-FR' : 'en-US'
  const formatPrice = useCallback(
    (value: number) =>
      new Intl.NumberFormat(priceLocale, {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0,
      }).format(value),
    [priceLocale],
  )
  const showPassengers = !hidePassengers
  
  const hasAnyDates = useMemo(() => dates.length > 0, [dates])

  useEffect(() => {
    if (lockGroupType) {
      setGroupTypeFilter(groupTypeMode)
    }
  }, [groupTypeMode, lockGroupType])
  
  
  // Get available categories from the actual dates and private groups
  const availableCategories = useMemo(() => {
    const categories = new Set<string>()
    let hasSpecificCategories = false
    
    // Add categories from open dates
    dates.forEach(date => {
      if (date.categoria) {
        categories.add(date.categoria.toLowerCase())
        hasSpecificCategories = true
      } else {
        // NULL categoria se interpreta como 'Standard'
        categories.add('Standard')
      }
    })
    
    // Add categories from private groups (using etiquetas field)  
    privateGroups.forEach(group => {
      if (group.etiquetas && group.etiquetas !== "Grupo privado") {
        categories.add(group.etiquetas.toLowerCase())
        hasSpecificCategories = true
      } else {
        // NULL etiquetas se interpreta como 'Standard'
        categories.add('Standard')
      }
    })
    
    return Array.from(categories)
  }, [dates, privateGroups])

  const filteredDates = useMemo(() => {
    let filtered = dates
    
    // Apply group type filter first - this is the primary and definitive filter
    if (groupTypeFilter === 'open') {
      // Show ONLY open group events that are not sold out - no private groups ever
      filtered = dates.filter(date => date.is_open_group && !date.sold_out)
      
      // Apply category filter only to open events (never include private)
      if (selectedCategory !== "todas") {
        filtered = filtered.filter(date => {
          if (selectedCategory.toLowerCase() === 'Standard') {
            // Para 'Standard': mostrar eventos sin categoría (NULL) o con categoría 'Standard'
            return !date.categoria || date.categoria.toLowerCase() === 'Standard'
          } else {
            // Para otras categorías: SOLO mostrar los que tengan esa categoría específica
            return date.categoria && date.categoria.toLowerCase() === selectedCategory.toLowerCase()
          }
        })
      }
      
      // Apply availability filter for open groups
      filtered = filtered.filter(date => {
        const availablePlaces = date.places_total - date.places_taken
        return availablePlaces >= peopleCount && availablePlaces > 0
      })
      
    } else if (groupTypeFilter === 'private') {
      // Show ONLY private group events
      filtered = dates.filter(date => date.is_private_group === true)
      
      // Apply category filter for private groups
      if (selectedCategory !== "todas") {
        filtered = filtered.filter(date => {
          if (selectedCategory.toLowerCase() === 'Standard') {
            return !date.categoria || date.categoria.toLowerCase() === 'Standard'
          } else {
            return date.categoria && date.categoria.toLowerCase() === selectedCategory.toLowerCase()
          }
        })
      }
      
      // Apply availability filter for private groups
      filtered = filtered.filter(date => {
        return date.min_pers && date.max_pers && 
               peopleCount >= date.min_pers && peopleCount <= date.max_pers
      })
      
    } else {
      // groupTypeFilter === 'all' - show both types based on category
      if (selectedCategory !== "todas") {
        filtered = filtered.filter(date => {
          if (selectedCategory.toLowerCase() === 'Standard') {
            // Para 'Standard': mostrar eventos sin categoría (NULL) o con categoría 'Standard'
            return !date.categoria || date.categoria.toLowerCase() === 'Standard'
          } else {
            // Para otras categorías: SOLO mostrar los que tengan esa categoría específica
            return date.categoria && date.categoria.toLowerCase() === selectedCategory.toLowerCase()
          }
        })
      }
      
      // Apply availability filter based on event type
      filtered = filtered.filter(date => {
        if (date.is_private_group === true) {
          return date.min_pers && date.max_pers && 
                 peopleCount >= date.min_pers && peopleCount <= date.max_pers
        } else {
          const availablePlaces = date.places_total - date.places_taken
          return availablePlaces >= peopleCount && availablePlaces > 0
        }
      })
    }
    
    return filtered
  }, [dates, selectedCategory, peopleCount, groupTypeFilter])

  useEffect(() => {
    if (initialMonth && initialMonth !== lastInitialMonthRef.current) {
      const [yearStr, monthStr] = initialMonth.split('-')
      const year = Number(yearStr)
      const month = Number(monthStr)
      if (Number.isFinite(year) && Number.isFinite(month) && month >= 1 && month <= 12) {
        const initialDate = new Date(year, month - 1, 1)
        setCurrentMonth(initialDate)
        hasInitializedMonthRef.current = true
        lastInitialMonthRef.current = initialMonth
        return
      }
    }

    if (hasInitializedMonthRef.current) return
    if (filteredDates.length === 0) return

    const currentMonthHasTrips = filteredDates.some(date => {
      const dateStart = extractDate(date.date)
      const dateEnd = extractDate(date.endDate)
      
      if (!dateStart) return false
      
      const normalized = normalizeDate(dateStart)
      if (!normalized) return false
      
      // For trips with date ranges, check if current month falls within the range
      if (dateEnd) {
        const normalizedEnd = normalizeDate(dateEnd)
        if (normalizedEnd) {
          const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1)
          const currentMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)
          
          return (normalized <= currentMonthEnd && normalizedEnd >= currentMonthStart)
        }
      }
      return normalized.getFullYear() === today.getFullYear() &&
             normalized.getMonth() === today.getMonth() &&
             normalized.getTime() >= today.getTime()
    })
    
    if (currentMonthHasTrips) {
      setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1))
      hasInitializedMonthRef.current = true
      return
    }

    const futureDates = filteredDates.filter(date => {
      const dateStart = extractDate(date.date)
      return dateStart && normalizeDate(dateStart)!.getTime() >= today.getTime()
    })
    
    if (futureDates.length > 0) {
      const earliestFutureDate = futureDates.reduce((earliest, date) => {
        const currentDate = extractDate(date.date)
        const earliestDateObj = extractDate(earliest.date)
        return currentDate && earliestDateObj && currentDate < earliestDateObj ? date : earliest
      })
      
      const dateObj = extractDate(earliestFutureDate.date)
      if (dateObj) {
        const firstMonth = new Date(dateObj.getFullYear(), dateObj.getMonth(), 1)
        setCurrentMonth(firstMonth)
        hasInitializedMonthRef.current = true
      }
    } else {
      setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1))
      hasInitializedMonthRef.current = true
    }
  }, [filteredDates, today, initialMonth])

  const handlePrevMonth = useCallback(() => {
    setCurrentMonth(prev => {
      const prevMonth = new Date(prev)
      prevMonth.setMonth(prevMonth.getMonth() - 1)
      return prevMonth
    })
  }, [])

  const handleNextMonth = useCallback(() => {
    setCurrentMonth(prev => {
      const nextMonth = new Date(prev)
      nextMonth.setMonth(nextMonth.getMonth() + 1)
      return nextMonth
    })
  }, [])

  const availablePassengerOptions = useMemo(() => {
    let maxOpenGroupSpots = 0
    dates.forEach(date => {
      if (date.is_open_group || !date.is_private_group) {
        const availableSpots = date.places_total - date.places_taken
        if (availableSpots > maxOpenGroupSpots) {
          maxOpenGroupSpots = availableSpots
        }
      }
    })
    
    let maxPrivateGroupCapacity = 0
    
    dates.forEach(date => {
      if (date.is_private_group && date.max_pers) {
        if (date.max_pers > maxPrivateGroupCapacity) {
          maxPrivateGroupCapacity = date.max_pers
        }
      }
    })
    
    privateGroups.forEach(pg => {
      if (pg.max_pers > maxPrivateGroupCapacity) {
        maxPrivateGroupCapacity = pg.max_pers
      }
    })
    
    const finalMax = Math.max(maxOpenGroupSpots, maxPrivateGroupCapacity)
  
    const options = []
    for (let i = 1; i <= finalMax; i++) {
      options.push(i)
    }
    
    return options
  }, [dates, privateGroups])

  const handlePeopleCountChange = useCallback((value: string) => {
    onPeopleCountChange(Number(value))
  }, [onPeopleCountChange])

  return (
    <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
      <CardContent className="p-3 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">{t('booking.selectDate')}</h2>
        
        {!hasAnyDates && (
          <div className="bg-muted/50 rounded-xl border-2 border-dashed border-muted-foreground/20 p-8 text-center">
            <p className="text-lg font-medium text-muted-foreground mb-2">
              {t('booking.noDatesAvailable')}
            </p>
            <p className="text-sm text-muted-foreground">
              {language === 'ES' 
                ? 'No hay viajes disponibles por el momento. Por favor, contacte con nosotros para más información.'
                : 'No trips available at the moment. Please contact us for more information.'}
            </p>
          </div>
        )}
        
        {hasAnyDates && (
          <>
        {/* Filters Section */}
<div className="bg-gradient-to-r from-background/80 to-muted/50 rounded-xl border p-4 sm:p-6 mb-6 sm:mb-8 backdrop-blur-sm">
  <div className="grid grid-cols-1 gap-4 sm:gap-6 justify-items-stretch">
    
    {/* Passengers Counter */}
    {showPassengers && (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(280px,_1fr)_minmax(240px,_1fr)] md:items-center">
        <div className="space-y-3">
          <label className="text-sm font-semibold text-foreground flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            {t('booking.passengers')}
          </label>
          <div className="bg-background/80 border-2 border-primary/20 rounded-lg p-3 hover:border-primary/40 transition-colors">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-all duration-200 disabled:opacity-30"
                onClick={() => peopleCount > minPeople && onPeopleCountChange(peopleCount - 1)}
                disabled={peopleCount <= minPeople}
              >
                -
              </Button>
              <div className="flex flex-col items-center">
                <span className="font-bold text-lg text-foreground">{peopleCount}</span>
                <span className="text-xs text-muted-foreground">{peopleCount === 1 ? t('booking.adult') : t('booking.adults')}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-all duration-200 disabled:opacity-30"
                onClick={() =>
                  peopleCount < Math.max(...availablePassengerOptions) && onPeopleCountChange(peopleCount + 1)
                }
                disabled={peopleCount >= Math.max(...availablePassengerOptions)}
              >
                +
              </Button>
            </div>
          </div>
        </div>
        <div className="text-sm text-muted-foreground md:text-base md:border-l md:border-border/40 md:pl-6">
          <div className="text-sm font-semibold text-foreground mb-2">
            {t('home.travelFormats.private.priceNote')}
          </div>
          {priceByMinPersons.length > 0 && (
            <ul className="space-y-3">
              {priceByMinPersons.map((entry) => (
                <li key={entry.min_pers} className="flex items-baseline justify-between gap-4 text-muted-foreground">
                  <span>{t('booking.priceFromByMinPersons', { min: entry.min_pers })}</span>
                  <span className="font-semibold text-foreground tabular-nums">
                    {t('booking.from')} {formatPrice(entry.price)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    )}

  </div>
</div>

        {/* Calendar Section */}
        <div className="bg-background rounded-2xl border overflow-hidden">
          {/* Calendar Navigation */}
          <div className="flex items-center justify-between p-3 sm:p-4 border-b bg-muted/30">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrevMonth}
              className="flex items-center gap-1 sm:gap-2 text-muted-foreground hover:text-foreground text-xs sm:text-sm"
            >
              <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">{t('booking.previous')}</span>
              <span className="sm:hidden">Ant</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNextMonth}
              className="flex items-center gap-1 sm:gap-2 text-muted-foreground hover:text-foreground text-xs sm:text-sm"
            >
              <span className="hidden sm:inline">{t('booking.next')}</span>
              <span className="sm:hidden">Sig</span>
              <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>

          {/* Calendar Grid */}
          <div className="p-2 sm:p-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
              {/* Current Month */}
              <div>
                <h3 className="text-lg font-bold mb-4 text-center">
                  {currentMonth.toLocaleDateString(language === 'ES' ? 'es-ES' : language === 'FR' ? 'fr-FR' : 'en-US', { month: 'long', year: 'numeric' })}
                </h3>
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {(language === 'ES' ? ['lu', 'ma', 'mi', 'ju', 'vi', 'sá', 'do'] : language === 'FR' ? ['lu', 'ma', 'me', 'je', 've', 'sa', 'di'] : ['mo', 'tu', 'we', 'th', 'fr', 'sa', 'su']).map(day => (
                    <div key={day} className="text-center text-xs font-medium text-muted-foreground p-2">
                      {day}
                    </div>
                  ))}
                </div>
                 <div className="grid grid-cols-7 gap-1">
                   {renderMonthDays(currentMonth, filteredDates, selectedDate, onDateSelect, peopleCount, travel, groupTypeFilter === 'open' ? [] : privateGroups, hoveredDate, setHoveredDate, t, language)}
                 </div>
               </div>

               {/* Next Month */}
               <div>
                 {(() => {
                   const nextMonth = new Date(currentMonth)
                   nextMonth.setMonth(nextMonth.getMonth() + 1)
                   return (
                     <>
                       <h3 className="text-lg font-bold mb-4 text-center">
                         {nextMonth.toLocaleDateString(language === 'ES' ? 'es-ES' : language === 'FR' ? 'fr-FR' : 'en-US', { month: 'long', year: 'numeric' })}
                       </h3>
                        <div className="grid grid-cols-7 gap-1 mb-2">
                          {(language === 'ES' ? ['lu', 'ma', 'mi', 'ju', 'vi', 'sá', 'do'] : language === 'FR' ? ['lu', 'ma', 'me', 'je', 've', 'sa', 'di'] : ['mo', 'tu', 'we', 'th', 'fr', 'sa', 'su']).map(day => (
                            <div key={day} className="text-center text-xs font-medium text-muted-foreground p-2">
                              {day}
                            </div>
                          ))}
                        </div>
                         <div className="grid grid-cols-7 gap-1">
                           {renderMonthDays(nextMonth, filteredDates, selectedDate, onDateSelect, peopleCount, travel, groupTypeFilter === 'open' ? [] : privateGroups, hoveredDate, setHoveredDate, t, language)}
                         </div>
                    </>
                  )
                })()}
              </div>
            </div>
          </div>
        </div>
        </>
        )}
      </CardContent>
    </Card>
  )
}

export const BookingCalendar = memo(BookingCalendarComponent)
