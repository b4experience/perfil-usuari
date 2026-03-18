"use client";

import { Send } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/i18n/useT";
import { useLanguage } from "@/context/LanguageContext";
import normalizeQuery from "@/lib/normalize";
import { FilterMenu, type FilterState } from "@/components/filters/FilterMenu";

interface StickySearchBarProps {
  onSearch: (query: string) => void;
  currentQuery: string;
  filters: FilterState;                        
  onFiltersChange: (next: FilterState) => void;
}

export const StickySearchBar = ({
  onSearch,
  currentQuery,
  filters,
  onFiltersChange,
}: StickySearchBarProps) => {
  const { t, ta } = useT();
  const router = useRouter(); 
  const { language } = useLanguage(); 

  const [query, setQuery] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [typingText, setTypingText] = useState("");
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);

  const phrases = ta("search.typing");

  const typingIntervalRef = useRef<number | null>(null);
  const nextTimerRef = useRef<number | null>(null);

  // sync con el padre
  useEffect(() => { setQuery(currentQuery); }, [currentQuery]);

  useEffect(() => {
    if (!phrases || phrases.length === 0) {
      setTypingText(t("search.placeholder"));
      setCurrentPhraseIndex(0);
      if (typingIntervalRef.current) window.clearInterval(typingIntervalRef.current);
      if (nextTimerRef.current) window.clearTimeout(nextTimerRef.current);
      return;
    }
    setCurrentPhraseIndex(0);
    setTypingText("");
    if (typingIntervalRef.current) window.clearInterval(typingIntervalRef.current);
    if (nextTimerRef.current) window.clearTimeout(nextTimerRef.current);
  }, [phrases?.length]);

  useEffect(() => {
    if (!phrases || phrases.length === 0) return;

    const currentPhrase = phrases[currentPhraseIndex] || "";
    let i = 0;
    setTypingText("");

    if (typingIntervalRef.current) window.clearInterval(typingIntervalRef.current);
    if (nextTimerRef.current) window.clearTimeout(nextTimerRef.current);

    typingIntervalRef.current = window.setInterval(() => {
      if (i <= currentPhrase.length) {
        setTypingText(currentPhrase.slice(0, i));
        i++;
      } else {
        if (typingIntervalRef.current) window.clearInterval(typingIntervalRef.current);
        nextTimerRef.current = window.setTimeout(() => {
          setCurrentPhraseIndex(prev => (prev + 1) % phrases.length);
        }, 2000);
      }
    }, 80);

    return () => {
      if (typingIntervalRef.current) window.clearInterval(typingIntervalRef.current);
      if (nextTimerRef.current) window.clearTimeout(nextTimerRef.current);
    };
  }, [currentPhraseIndex, phrases]);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setIsVisible(window.scrollY > 200);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = normalizeQuery(query);
    console.debug("StickySearchBar submit", { raw: query, normalized, filters, language });
    onSearch(normalized);
    
    if (normalized.trim()) {
      const searchPath = language === "ES" ? "/es/search" : language === "FR" ? "/fr/search" : "/search";
      router.push(`${searchPath}?q=${encodeURIComponent(normalized.trim())}`);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setQuery(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const normalized = normalizeQuery(query);
      // eslint-disable-next-line no-console
      console.debug("StickySearchBar keydown Enter", { raw: query, normalized, filters, language });
      onSearch(normalized);
      
      if (normalized.trim()) {
        const searchPath = language === "ES" ? "/es/search" : language === "FR" ? "/fr/search" : "/search";
        router.push(`${searchPath}?q=${encodeURIComponent(normalized.trim())}`);
      }
    }
  };

  const hasActiveFilters =
    !!(filters.country || filters.activity || filters.sort !== "relevance");

  return (
    <div className={`fixed top-16 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/50 transition-all duration-300 ${isVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"}`}>
      <div className="container mx-auto px-4 py-3">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
          <div className="relative">
            <div className="absolute inset-y-0 right-4 flex items-center gap-2">
              <button
                type="submit"
                className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors duration-200"
                aria-label={t("nav.search")}
                title={t("nav.search")}
              >
                <Send className="w-4 h-4 text-white" />
              </button>

              <FilterMenu
                value={filters}
                hasActive={hasActiveFilters}
                onChange={onFiltersChange}
                onClear={() =>
                  onFiltersChange({ sort: "relevance", country: "", activity: "" })
                }
              />
            </div>

            <textarea
              name="search"
              aria-label={t("search.ariaLabel")}
              value={query}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown} 
              placeholder={typingText || t("search.placeholder")}
              rows={1}
              className="w-full min-h-[56px] pl-6 pr-24 py-3 border-2 border-brand-primary/30 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all duration-200 shadow-lg hover:shadow-xl bg-gray-50 rounded-2xl resize-none text-sm leading-tight"
            />
          </div>
        </form>
      </div>
    </div>
  );
};
