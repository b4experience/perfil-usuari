// src/components/ResponsiveDescription.tsx
import { useState } from 'react'

interface ResponsiveDescriptionProps {
  text?: string
  maxChars?: number
}

const ResponsiveDescription = ({ text, maxChars = 70 }: ResponsiveDescriptionProps) => {
  const [expanded, setExpanded] = useState(false)

  if (!text) return null

  const shouldTruncate = text.length > maxChars
  const mobileText = shouldTruncate && !expanded ? text.slice(0, maxChars) + '…' : text

  return (
    <div className="text-sm lg:text-base text-muted-foreground">
      {/* Móvil: truncado si es necesario */}
      <p className="block sm:hidden">
        {mobileText}
        {shouldTruncate && !expanded && (
          <button
            onClick={() => setExpanded(true)}
            className="ml-1 text-primary underline text-xs"
          >
            Leer más
          </button>
        )}
      </p>

      {/* Escritorio: texto completo */}
      <p className="hidden sm:block">{text}</p>
    </div>
  )
}

export default ResponsiveDescription
