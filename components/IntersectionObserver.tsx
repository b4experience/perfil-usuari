import { useRef, useState, useEffect } from 'react'
const anchorNavRef = useRef<HTMLDivElement>(null)
const [showStickyAnchor, setShowStickyAnchor] = useState(false)

useEffect(() => {
  if (!anchorNavRef.current) return

  const observer = new IntersectionObserver(
    ([entry]) => {
      setShowStickyAnchor(!entry.isIntersecting)
    },
    { threshold: 0 }
  )

  observer.observe(anchorNavRef.current)

  return () => observer.disconnect()
}, [])
