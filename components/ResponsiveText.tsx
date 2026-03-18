import { memo, useEffect, useRef, useState, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveTextProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  containerRef?: React.RefObject<HTMLElement>;
}

export const ResponsiveText = memo(forwardRef<HTMLHeadingElement, ResponsiveTextProps>(({
  children,
  className,
  style,
  containerRef
}, ref) => {
  const internalTextRef = useRef<HTMLHeadingElement>(null);
  const textRef = ref || internalTextRef;
  const [fontSize, setFontSize] = useState(16);

  const calculateOptimalFontSize = () => {
    if (!containerRef?.current || !textRef || typeof textRef === 'function' || !textRef.current) return;
    
    const container = containerRef.current;
    const textEl = textRef.current;
    const paddingX = 32;
    const paddingY = 48;
    const maxWidth = Math.max(0, container.clientWidth - paddingX);
    const maxHeight = Math.max(0, container.clientHeight - paddingY);

    // Detectar si es dispositivo móvil
    const ua = navigator.userAgent || '';
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)
      || (window.matchMedia ? window.matchMedia('(max-width: 640px)').matches : false)
      || container.clientWidth <= 420;

    // Reset wrapping para medir correctamente
    textEl.style.whiteSpace = 'normal';
    textEl.style.wordBreak = 'normal';
    textEl.style.overflowWrap = 'break-word';
    textEl.style.hyphens = 'auto';
    textEl.style.maxWidth = `${maxWidth}px`;
    textEl.style.maxHeight = `${maxHeight}px`;
    textEl.style.overflow = 'hidden';

    // Binary search para encontrar el mejor tamaño
    let low = 8;
    let high = Math.min(maxWidth * 0.2, maxHeight * 0.25, 48);
    let best = low;
    
    for (let i = 0; i < 12; i++) {
      const mid = (low + high) / 2;
      textEl.style.fontSize = `${mid}px`;
      const fits = textEl.scrollWidth <= maxWidth && textEl.scrollHeight <= maxHeight;
      if (fits) {
        best = mid;
        low = mid + 0.5;
      } else {
        high = mid - 0.5;
      }
    }

    // Aplicar tamaño encontrado
    textEl.style.fontSize = `${best}px`;
    textEl.getBoundingClientRect(); // forzar reflow

    // Ajuste para móvil con múltiples líneas
    const numberOfLines = Math.round(textEl.scrollHeight / parseFloat(getComputedStyle(textEl).lineHeight));
    if (numberOfLines > 1 && isMobile) {
      const hasSpaces = textEl.innerText.trim().includes(' ');

      if (hasSpaces) {
        const factor2 = 0.68;
        const factorMore = 0.52;
        best *= numberOfLines === 2 ? factor2 : factorMore;
      } else {
        // palabra larga sin espacios → evitar cortes
        textEl.style.whiteSpace = 'nowrap';
        const minSize = 10;
        while (textEl.scrollWidth > maxWidth && best > minSize) {
          best -= 0.8;
          textEl.style.fontSize = `${best}px`;
        }
      }
    }

    setFontSize(Math.floor(best));
  };

  useEffect(() => {
    if (!containerRef?.current) return;
    
    calculateOptimalFontSize();
    
    const resizeObserver = new ResizeObserver(() => {
      calculateOptimalFontSize();
    });
    
    resizeObserver.observe(containerRef.current);
    
    return () => resizeObserver.disconnect();
  }, [children, containerRef]);

  return (
    <h3
      ref={textRef}
      className={cn(className)}
      style={{
        ...style,
        fontSize: `${fontSize}px`
      }}
    >
      {children}
    </h3>
  );
}));

ResponsiveText.displayName = 'ResponsiveText';