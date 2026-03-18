'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export const ScrollToTop = () => {
  const pathname = usePathname();

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    const reset = () => {
      window.scrollTo(0, 0);
    };

    // Reset immediately and after paint to override browser back/forward restoration
    reset();
    const raf = requestAnimationFrame(reset);
    const timeout = setTimeout(reset, 0);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timeout);
    };
  }, [pathname]);

  return null;
};
