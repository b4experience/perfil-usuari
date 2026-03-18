"use client";

import { Search } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/i18n/useT";
import { useLanguage } from "@/context/LanguageContext"; 
import normalizeQuery from "@/lib/normalize";

import { FilterMenu, type FilterState } from "@/components/filters/FilterMenu";
interface SearchBarProps {
  onSearch: (query: string) => void;
  filters?: FilterState;                       
  onFiltersChange?: (next: FilterState) => void;
  initialQuery?: string;
  showFilterMenu?: boolean;
  preventNavigation?: boolean;
}
export const SearchBar = ({
  onSearch,
  filters,
  onFiltersChange,
  initialQuery = "",
  showFilterMenu = true,
  preventNavigation = false,
}: SearchBarProps) => {
  const { t, ta } = useT();
  const router = useRouter();
  const { language } = useLanguage(); 
  const [query, setQuery] = useState(initialQuery);
  const [typingText, setTypingText] = useState("");
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);

  const phrases = ta("search.typing"); 
  const typingIntervalRef = useRef<number | null>(null);
  const nextTimerRef = useRef<number | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = normalizeQuery(query);
    onSearch(normalized);
    if (preventNavigation) {
      return;
    }
    const searchPath = language === "ES" ? "/es/search" : language === "FR" ? "/fr/search" : "/search";
    const trimmed = normalized.trim();
    const url = trimmed
      ? `${searchPath}?q=${encodeURIComponent(trimmed)}`
      : searchPath;
    router.push(url);
  };

  const hasActive = !!(filters && (filters.sort && filters.sort !== 'relevance'));

  const clearFilters = () => {
    if (filters && onFiltersChange) {
      onFiltersChange({ ...filters, sort: 'relevance' });
    }
  };

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
  }, [
    /* only restart when the phrases array length changes */
    phrases?.length,
  ]);

  // Efecto de escritura automática
  useEffect(() => {
    if (!phrases || phrases.length === 0) return;

    const currentPhrase = phrases[currentPhraseIndex] || "";
    let i = 0;
    setTypingText("");

    // limpia previos
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
    setQuery(initialQuery);
  }, [initialQuery]);

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="relative" role="search" aria-label={t("search.ariaLabel")}>
        <div className="relative">
          <div className="min-h-[56px] px-4 py-3 border-2 border-brand-primary/30 text-foreground placeholder:text-muted-foreground transition-all duration-200 shadow-lg bg-gray-50 rounded-2xl flex items-center gap-3 focus-within:ring-2 focus-within:ring-brand-primary/20 focus-within:border-brand-primary">
            <textarea
              name="search"
              aria-label={t("search.ariaLabel")}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder={typingText || t("search.placeholder")}
              rows={1}
              className="flex-1 bg-transparent resize-none text-sm leading-tight focus:outline-none overflow-hidden whitespace-nowrap text-ellipsis"
            />
            <button
              type="submit"
              className="h-9 px-4 bg-blue-600 rounded-full flex items-center justify-center gap-2 text-white text-[0.7rem] font-semibold tracking-wide normal-case transition-colors duration-200 hover:bg-blue-700"
              aria-label={t("search.button")}
              title={t("search.button")}
            >
              <Search className="w-4 h-4 text-white" />
              <span>{t("search.button")}</span>
            </button>
            {filters && onFiltersChange && showFilterMenu && (
              <FilterMenu
                value={filters}
                onChange={onFiltersChange}
                onClear={hasActive ? clearFilters : undefined}
                hasActive={hasActive}
              />
            )}
          </div>
        </div>
      </form>
    </div>
  );
};
