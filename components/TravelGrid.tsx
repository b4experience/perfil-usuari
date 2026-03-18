import { GridItem } from '@/types/gridItem'
import { TravelCard } from './TravelCard'
import { CountryCard } from './CountryCard'
import { ActivityCard } from './ActivityCard'
import { motion } from 'framer-motion'
import Masonry from 'react-masonry-css'
import { memo, useMemo, useCallback } from 'react'

interface TravelGridProps {
  items: GridItem[]
}

export const TravelGrid = memo(({ items }: TravelGridProps) => {
  // Aspect ratio para los travels
  const getRandomAspect = useCallback((index: number) => {
    const aspects = ['9/16']
    return aspects[index % aspects.length]
  }, [])

  // Columnas responsivas para Masonry
  const breakpointColumns = useMemo(() => ({
    default: 5,
    1024: 4,
    768: 3,
    640: 2,
    320: 2  // Minimum 2 columns on mobile
  }), [])

  // Distribución intercalando países y actividades (mínimo 1 viaje),
  // empezando por el país con más viajes y alternando después
  const distributedItems = useMemo(() => {
    const travels = items.filter(item => item.type === 'travel')

    // Separar y ordenar por nº de viajes (desc), filtrando mínimo 1 viaje
    const countries = items
      .filter(item => item.type === 'country' && (((item as any).num_viatges ?? 0) >= 1))
      .sort((a, b) => (((b as any).num_viatges ?? 0) - ((a as any).num_viatges ?? 0)))

    const activities = items
      .filter(item => item.type === 'activity' && (((item as any).num_viatges ?? 0) >= 1))
      .sort((a, b) => (((b as any).num_viatges ?? 0) - ((a as any).num_viatges ?? 0)))

    // Generadores circulares independientes
    let countryIndex = 0
    let activityIndex = 0

    const getNextCountry = () => {
      if (countries.length === 0) return null
      const item = countries[countryIndex]
      countryIndex = (countryIndex + 1) % countries.length
      return item
    }

    const getNextActivity = () => {
      if (activities.length === 0) return null
      const item = activities[activityIndex]
      activityIndex = (activityIndex + 1) % activities.length
      return item
    }

    const result: GridItem[] = []

    // Si aún no hay viajes cargados, mostramos igualmente top countries/activities
    if (travels.length === 0) {
      let toggleCountry = true
      while (result.length < 12) {
        const next = toggleCountry ? getNextCountry() : getNextActivity()
        if (!next) break
        result.push(next)
        toggleCountry = !toggleCountry
        if (toggleCountry && countries.length === 0) toggleCountry = false
        if (!toggleCountry && activities.length === 0) toggleCountry = true
      }
      // keep deterministic order based on id
      return result.sort((a, b) => (a.id ?? 0) - (b.id ?? 0))
    }

    let nextIsCountry = true // Empezar por país con más viajes

    for (let i = 0; i < travels.length; i++) {
      // Siempre metemos un travel
      result.push(travels[i])

      // Asegurar que los TOP aparezcan muy pronto
      if (i === 0) {
        const c = getNextCountry()
        if (c) result.push(c)
        nextIsCountry = false // siguiente preferimos actividad
      } else if (i === 1) {
        const a = getNextActivity()
        if (a) result.push(a)
        nextIsCountry = true
      }

      // A partir del 5º travel, cada 5 intercalamos uno (país/actividad alternando)
      if (i >= 8 && (i - 4) % 5 === 0) {
        let other: GridItem | null = null
        if (nextIsCountry) {
          other = getNextCountry() as GridItem | null
          if (!other) other = getNextActivity() as GridItem | null
        } else {
          other = getNextActivity() as GridItem | null
          if (!other) other = getNextCountry() as GridItem | null
        }

        if (other) {
          result.push(other)
          nextIsCountry = !nextIsCountry
        }
      }
    }

    // Completar con algunos TOP si hay pocos viajes
    while (result.length < Math.min(travels.length + 6, travels.length + countries.length + activities.length)) {
      const other = nextIsCountry ? getNextCountry() : getNextActivity()
      if (!other) break
      result.push(other)
      nextIsCountry = !nextIsCountry
    }

    return result
  }, [items])

  // Custom column balancing algorithm
  const balancedItems = useMemo(() => {
    if (distributedItems.length === 0) return distributedItems

    const columnCount = 4
    const columns: GridItem[][] = Array.from({ length: columnCount }, () => [])
    const columnHeights: number[] = Array(columnCount).fill(0)

    // Estimate item heights (simplified)
    const getEstimatedHeight = (item: GridItem) => {
      if (item.type === 'travel') return 400 // Travel cards are taller (9:16 aspect ratio)
      return 300 // Country and activity cards are shorter (1:1 aspect ratio)
    }

    // Distribute items to columns with least height
    distributedItems.forEach((item) => {
      // Find column with minimum height
      const minHeightIndex = columnHeights.indexOf(Math.min(...columnHeights))
      
      columns[minHeightIndex].push(item)
      columnHeights[minHeightIndex] += getEstimatedHeight(item) + 16 // Add margin
    })

    // Flatten back to single array while maintaining column order
    const balanced: GridItem[] = []
    const maxLength = Math.max(...columns.map(col => col.length))
    
    for (let i = 0; i < maxLength; i++) {
      for (let col = 0; col < columnCount; col++) {
        if (columns[col][i]) {
          balanced.push(columns[col][i])
        }
      }
    }

    return balanced
  }, [distributedItems])

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="scroll-smooth"
      style={{ scrollSnapType: 'y mandatory' }}
    >
      <Masonry
        breakpointCols={breakpointColumns}
        className="flex w-auto -ml-3 sm:-ml-4"
        columnClassName="pl-3 sm:pl-4 bg-clip-padding"
        style={{ scrollSnapAlign: 'start' }}
      >
        {balancedItems.map((item, index) => {
          const shouldAnimate = index < 20 // Animar solo los primeros 20

          return (
            <motion.div
              key={`${item.type}-${item.id}-${index}`}
              initial={shouldAnimate ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              transition={
                shouldAnimate
                  ? { duration: 0.15, delay: Math.min(index * 0.01, 0.2), type: 'tween' }
                  : undefined
              }
              className="mb-3 sm:mb-4"
            >
              {item.type === 'travel' ? (
                <TravelCard travel={item} aspectRatio={getRandomAspect(index)} />
              ) : item.type === 'country' ? (
                <CountryCard country={item} />
              ) : (
                <ActivityCard activity={item} />
              )}
            </motion.div>
          )
        })}
      </Masonry>
    </motion.div>
  )
})
