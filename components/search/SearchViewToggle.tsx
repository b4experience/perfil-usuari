import { CalendarDays, LayoutGrid, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useT } from '@/i18n/useT';

export type SearchView = 'grid' | 'map' | 'calendar';

type SearchViewToggleProps = {
  value: SearchView;
  onChange: (next: SearchView) => void;
  className?: string;
};

export const SearchViewToggle = ({ value, onChange, className }: SearchViewToggleProps) => {
  const { t } = useT();

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-full p-1.5 shadow-xl backdrop-blur sm:gap-1.5 sm:p-2',
        className,
      )}
      style={{ backgroundColor: 'rgb(32, 91, 218)' }}
      data-view-selector="true"
      role="tablist"
      aria-label={t('search.results')}
    >
      <button
        type="button"
        role="tab"
        aria-selected={value === 'grid'}
        onClick={() => onChange('grid')}
        className={cn(
          'inline-flex items-center gap-2 rounded-full px-4 py-2 text-base font-semibold transition sm:gap-2.5 sm:px-5 sm:py-2.5',
          value === 'grid'
            ? 'border border-white bg-white text-[rgb(32,91,218)] shadow-sm'
            : 'border border-white text-white hover:bg-white/15',
        )}
      >
        <LayoutGrid className="h-5 w-5" />
        <span>{t('search.view.grid')}</span>
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={value === 'map'}
        onClick={() => onChange('map')}
        className={cn(
          'inline-flex items-center gap-2 rounded-full px-4 py-2 text-base font-semibold transition sm:gap-2.5 sm:px-5 sm:py-2.5',
          value === 'map'
            ? 'border border-white bg-white text-[rgb(32,91,218)] shadow-sm'
            : 'border border-white text-white hover:bg-white/15',
        )}
      >
        <MapPin className="h-5 w-5" />
        <span>{t('search.view.map')}</span>
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={value === 'calendar'}
        onClick={() => onChange('calendar')}
        className={cn(
          'inline-flex items-center gap-2 rounded-full px-4 py-2 text-base font-semibold transition sm:gap-2.5 sm:px-5 sm:py-2.5',
          value === 'calendar'
            ? 'border border-white bg-white text-[rgb(32,91,218)] shadow-sm'
            : 'border border-white text-white hover:bg-white/15',
        )}
      >
        <CalendarDays className="h-5 w-5" />
        <span>{t('search.view.calendar')}</span>
      </button>
    </div>
  );
};
