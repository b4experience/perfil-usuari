import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

type NavItem = {
  id: string;
  label: string;
};

type TravelSectionsNavProps = {
  navItems: NavItem[];
  activeSection: string;
  sticky?: boolean;
  className?: string;
};

const scrollToSection = (id: string) => {
  const element = document.getElementById(id);

  if (!element) {
    return;
  }
  const styles = getComputedStyle(document.documentElement);
  const headerVisible = parseFloat(styles.getPropertyValue("--header-visible-height").trim()) || 0;
  const headerHeight = parseFloat(styles.getPropertyValue("--header-height").trim()) || 0;
  const isMobile = window.matchMedia("(max-width: 1023px)").matches;
  const headerOffset = isMobile ? headerVisible : Math.max(headerVisible, headerHeight);
  const navOffset = parseFloat(
    getComputedStyle(document.documentElement)
      .getPropertyValue("--sections-nav-height")
      .trim(),
  ) || 0;
  const offset = headerOffset + navOffset + 15;
  const top = element.getBoundingClientRect().top + window.pageYOffset - offset;
  window.scrollTo({ top, behavior: 'smooth' });
  window.setTimeout(() => {
    const updatedStyles = getComputedStyle(document.documentElement);
    const updatedHeaderVisible =
      parseFloat(updatedStyles.getPropertyValue("--header-visible-height").trim()) || 0;
    const updatedHeaderHeight =
      parseFloat(updatedStyles.getPropertyValue("--header-height").trim()) || 0;
    const updatedIsMobile = window.matchMedia("(max-width: 1023px)").matches;
    const updatedHeaderOffset = updatedIsMobile
      ? updatedHeaderVisible
      : Math.max(updatedHeaderVisible, updatedHeaderHeight);
    const updatedNavOffset = parseFloat(
      getComputedStyle(document.documentElement)
        .getPropertyValue("--sections-nav-height")
        .trim(),
    ) || 0;
    const updatedOffset = updatedHeaderOffset + updatedNavOffset + 15;
    const updatedTop =
      element.getBoundingClientRect().top + window.pageYOffset - updatedOffset;
    if (Math.abs(updatedTop - window.scrollY) > 2) {
      window.scrollTo({ top: updatedTop, behavior: 'smooth' });
    }
  }, 220);
};

export const TravelSectionsNav = ({
  navItems,
  activeSection,
  sticky = true,
  className = "",
}: TravelSectionsNavProps) => {
  const navRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const updateNavHeight = () => {
      const height = navRef.current?.offsetHeight ?? 0;
      if (height <= 0) return;
      document.documentElement.style.setProperty("--sections-nav-height", `${height}px`);
    };
    updateNavHeight();
    window.addEventListener("resize", updateNavHeight);
    return () => window.removeEventListener("resize", updateNavHeight);
  }, []);

  return (
    <motion.div
      ref={navRef}
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -60, opacity: 0 }}
      transition={{ duration: 0.3 }}
      className={`${sticky ? "sticky z-40" : ""} bg-background shadow-md border-b ${className}`.trim()}
      style={sticky ? { top: "var(--header-visible-height, 0px)" } : undefined}
    >
      <nav className="flex items-center justify-center gap-6 px-4 py-2 text-xs font-medium border-b md:text-sm md:gap-6 md:px-4 md:py-2 gap-3 px-3 py-1.5">
        {navItems.map(({ id, label }) => (
          <a
            key={id}
            href={`#${id}`}
            onClick={(e) => {
              e.preventDefault();
              scrollToSection(id);
            }}
            className={`relative text-muted-foreground hover:text-primary transition-colors cursor-pointer ${
              activeSection === id ? 'text-primary after:w-full' : 'after:w-0'
            } after:absolute after:left-0 after:bottom-[-10px] after:h-[2px] after:bg-primary after:transition-all after:duration-300`}
           title={"Jump to section"}>
            {label}
          </a>
        ))}
      </nav>
    </motion.div>
  );
};
