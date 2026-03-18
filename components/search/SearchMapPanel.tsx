import { useEffect, useMemo, useRef } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react';
import type { Travel } from '@/types/travel';
import { parseCoords } from '@/lib/coords';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';
import { useLocalizedPath } from '@/utils/localizedPaths';
import { useEnglishTravelSlugMap } from '@/hooks/useEnglishSlugs';
import { slugify } from '@/utils/slugify';

type SearchMapPanelProps = {
  travels: Travel[];
  className?: string;
};

type TravelWithCoords = Travel & {
  lat: number;
  lng: number;
};

type LeafletMapInstance = {
  fitBounds: (bounds: LeafletLatLngBoundsInstance, options?: { padding?: [number, number] }) => void;
  setView: (latLng: [number, number], zoom: number) => void;
  getZoom: () => number;
  panBy: (point: [number, number], options?: { animate?: boolean; duration?: number }) => void;
  closePopup: () => void;
  remove: () => void;
};

type LeafletMarkerInstance = {
  addTo: (map: LeafletMapInstance) => LeafletMarkerInstance;
  bindPopup: (
    html: string,
    options?: {
      closeButton?: boolean;
      autoClose?: boolean;
      closeOnClick?: boolean;
      autoPan?: boolean;
      className?: string;
      offset?: [number, number];
    },
  ) => LeafletMarkerInstance;
  openPopup: () => LeafletMarkerInstance;
  on: (
    eventName: 'click' | 'mouseover' | 'mouseout' | 'popupopen' | 'popupclose',
    handler: (event?: LeafletPopupEvent) => void,
  ) => LeafletMarkerInstance;
};

type LeafletTileLayerInstance = {
  addTo: (map: LeafletMapInstance) => LeafletTileLayerInstance;
};

type LeafletLatLngBoundsInstance = {
  extend: (latLng: [number, number]) => LeafletLatLngBoundsInstance;
};

type LeafletBoundsTuple = [[number, number], [number, number]];

type LeafletApi = {
  map: (
    element: HTMLElement,
    options?: {
      minZoom?: number;
      maxZoom?: number;
      zoomControl?: boolean;
      worldCopyJump?: boolean;
      maxBounds?: LeafletBoundsTuple;
      maxBoundsViscosity?: number;
    },
  ) => LeafletMapInstance;
  tileLayer: (
    urlTemplate: string,
    options?: {
      attribution?: string;
      maxZoom?: number;
      noWrap?: boolean;
    },
  ) => LeafletTileLayerInstance;
  marker: (
    latLng: [number, number],
    options?: {
      icon?: LeafletDivIconInstance;
    },
  ) => LeafletMarkerInstance;
  divIcon: (options: {
    className?: string;
    html?: string;
    iconSize?: [number, number];
    iconAnchor?: [number, number];
    popupAnchor?: [number, number];
  }) => LeafletDivIconInstance;
  latLngBounds: (latLngs: [number, number][]) => LeafletLatLngBoundsInstance;
};

type LeafletDivIconInstance = Record<string, unknown>;
type LeafletPopupInstance = {
  getElement: () => HTMLElement | null;
};
type LeafletPopupEvent = {
  popup?: LeafletPopupInstance;
};

type LeafletWindow = Window & {
  L?: LeafletApi;
};

let leafletPromise: Promise<LeafletApi> | null = null;

const LEAFLET_SCRIPT_ID = 'leaflet-js';
const LEAFLET_STYLE_ID = 'leaflet-css';
const MAP_MIN_ZOOM = 3;
const MAP_MAX_ZOOM = 13;
const MAP_MAX_BOUNDS: LeafletBoundsTuple = [[-85, -180], [85, 180]];

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const buildHoverPopupHtml = (travel: TravelWithCoords, href: string) => {
  const imageUrl = escapeHtml(travel.imgUrl || '/placeholder.svg');
  const destination = escapeHtml(travel.destino || '');
  const duration = travel.duration ? escapeHtml(travel.duration) : '';
  const title = escapeHtml(travel.title || '');
  const safeHref = escapeHtml(href);

  return `
    <a href="${safeHref}" class="search-map-card-link">
      <article class="search-map-card">
        <div class="search-map-card__media">
          <img src="${imageUrl}" alt="${title}" class="search-map-card__image" loading="lazy" />
          ${destination ? `<span class="search-map-card__pill search-map-card__pill--top">${destination}</span>` : ''}
          ${duration ? `<span class="search-map-card__pill search-map-card__pill--bottom">${duration}</span>` : ''}
        </div>
        <div class="search-map-card__body">
          <h4 class="search-map-card__title">${title}</h4>
          <span class="search-map-card__arrow">&#8250;</span>
        </div>
      </article>
    </a>
  `;
};

const loadLeaflet = (): Promise<LeafletApi> => {
  if (leafletPromise) return leafletPromise;

  leafletPromise = new Promise((resolve, reject) => {
    const win = window as LeafletWindow;
    if (win.L) {
      resolve(win.L);
      return;
    }

    if (!document.getElementById(LEAFLET_STYLE_ID)) {
      const style = document.createElement('link');
      style.id = LEAFLET_STYLE_ID;
      style.rel = 'stylesheet';
      style.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(style);
    }

    const existingScript = document.getElementById(LEAFLET_SCRIPT_ID) as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener('load', () => {
        const loadedL = (window as LeafletWindow).L;
        if (loadedL) {
          resolve(loadedL);
        } else {
          reject(new Error('Leaflet loaded without window.L'));
        }
      });
      existingScript.addEventListener('error', () => {
        reject(new Error('Failed to load Leaflet script'));
      });
      return;
    }

    const script = document.createElement('script');
    script.id = LEAFLET_SCRIPT_ID;
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.defer = true;

    script.onload = () => {
      const loadedL = (window as LeafletWindow).L;
      if (loadedL) {
        resolve(loadedL);
      } else {
        reject(new Error('Leaflet loaded without window.L'));
      }
    };

    script.onerror = () => {
      reject(new Error('Failed to load Leaflet script'));
    };

    document.head.appendChild(script);
  });

  return leafletPromise;
};

export const SearchMapPanel = ({ travels, className }: SearchMapPanelProps) => {
  const { language } = useLanguage();
  const buildPath = useLocalizedPath();
  const { data: enTravelSlugs = {} } = useEnglishTravelSlugMap(language === 'EN');
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<LeafletMapInstance | null>(null);
  const markerByTravelIdRef = useRef<Map<number, LeafletMarkerInstance>>(new Map());
  const popupHoveredRef = useRef(false);
  const closePopupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mappedTravels = useMemo<TravelWithCoords[]>(() => {
    return travels
      .map((travel) => {
        const parsed = parseCoords(travel.coords);
        if (!parsed) return null;
        return {
          ...travel,
          lat: parsed.lat,
          lng: parsed.lng,
        };
      })
      .filter((travel): travel is TravelWithCoords => Boolean(travel));
  }, [travels]);
  const travelHrefById = useMemo(() => {
    const hrefById = new Map<number, string>();
    mappedTravels.forEach((travel) => {
      const slug = language === 'ES'
        ? slugify(travel.title)
        : enTravelSlugs[travel.id] ?? slugify(travel.title);
      hrefById.set(travel.id, buildPath(`/${slug}`));
    });
    return hrefById;
  }, [buildPath, enTravelSlugs, language, mappedTravels]);
  const panMapBy = (x: number, y: number) => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.panBy([x, y], { animate: true, duration: 0.25 });
  };

  useEffect(() => {
    if (!mapRef.current || !mappedTravels.length) return;

    let cancelled = false;
    const markerStore = markerByTravelIdRef.current;
    const clearClosePopupTimer = () => {
      if (closePopupTimerRef.current) {
        clearTimeout(closePopupTimerRef.current);
        closePopupTimerRef.current = null;
      }
    };

    loadLeaflet()
      .then((L) => {
        if (cancelled || !mapRef.current) return;

        const map = L.map(mapRef.current, {
          minZoom: MAP_MIN_ZOOM,
          maxZoom: MAP_MAX_ZOOM,
          worldCopyJump: false,
          maxBounds: MAP_MAX_BOUNDS,
          maxBoundsViscosity: 1,
        });
        mapInstanceRef.current = map;

        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          attribution: 'Tiles &copy; Esri',
          maxZoom: MAP_MAX_ZOOM,
          noWrap: true,
        }).addTo(map);
        L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
          attribution: 'Boundaries & labels &copy; Esri',
          maxZoom: MAP_MAX_ZOOM,
          noWrap: true,
        }).addTo(map);

        const mountainIcon = L.divIcon({
          className: 'search-map-marker-icon',
          html:
            '<div class="search-map-marker-pin">' +
            '<span class="search-map-marker-logo-wrap">' +
            '<img src="/WhiteLogo.png" alt="" class="search-map-marker-logo" />' +
            '</span>' +
            '</div>',
          iconSize: [34, 44],
          iconAnchor: [17, 42],
          popupAnchor: [0, -20],
        });

        markerStore.clear();

        mappedTravels.forEach((travel) => {
          const href = travelHrefById.get(travel.id) ?? '#';
          const marker = L.marker([travel.lat, travel.lng], { icon: mountainIcon })
            .addTo(map)
            .bindPopup(buildHoverPopupHtml(travel, href), {
              closeButton: false,
              autoClose: false,
              closeOnClick: false,
              autoPan: false,
              className: 'search-map-hover-popup',
              offset: [0, 10],
            })
            .on('mouseover', () => {
              popupHoveredRef.current = false;
              clearClosePopupTimer();
              map.closePopup();
              marker.openPopup();
            })
            .on('mouseout', () => {
              clearClosePopupTimer();
              closePopupTimerRef.current = setTimeout(() => {
                if (!popupHoveredRef.current) {
                  map.closePopup();
                }
              }, 120);
            })
            .on('popupopen', (event) => {
              const popupElement = event?.popup?.getElement();
              if (!popupElement) return;

              const popupElementWithHandlers = popupElement as HTMLElement & {
                __searchMapEnter?: () => void;
                __searchMapLeave?: () => void;
              };

              popupElementWithHandlers.__searchMapEnter = () => {
                popupHoveredRef.current = true;
                clearClosePopupTimer();
              };
              popupElementWithHandlers.__searchMapLeave = () => {
                popupHoveredRef.current = false;
                map.closePopup();
              };

              popupElement.addEventListener('mouseenter', popupElementWithHandlers.__searchMapEnter);
              popupElement.addEventListener('mouseleave', popupElementWithHandlers.__searchMapLeave);
            })
            .on('popupclose', (event) => {
              const popupElement = event?.popup?.getElement();
              if (!popupElement) return;

              const popupElementWithHandlers = popupElement as HTMLElement & {
                __searchMapEnter?: () => void;
                __searchMapLeave?: () => void;
              };

              if (popupElementWithHandlers.__searchMapEnter) {
                popupElement.removeEventListener('mouseenter', popupElementWithHandlers.__searchMapEnter);
              }
              if (popupElementWithHandlers.__searchMapLeave) {
                popupElement.removeEventListener('mouseleave', popupElementWithHandlers.__searchMapLeave);
              }
              delete popupElementWithHandlers.__searchMapEnter;
              delete popupElementWithHandlers.__searchMapLeave;
              popupHoveredRef.current = false;
            })
            .on('click', () => {
              clearClosePopupTimer();
              marker.openPopup();
            });

          markerStore.set(travel.id, marker);
        });

        const bounds = L.latLngBounds([[mappedTravels[0].lat, mappedTravels[0].lng]]);
        mappedTravels.slice(1).forEach((travel) => {
          bounds.extend([travel.lat, travel.lng]);
        });
        map.fitBounds(bounds, { padding: [60, 60] });

        // For very broad/global result sets, keep minimum zoom but center on current results.
        if (map.getZoom() <= MAP_MIN_ZOOM) {
          const centerLat =
            mappedTravels.reduce((sum, travel) => sum + travel.lat, 0) / mappedTravels.length;
          const centerLng =
            mappedTravels.reduce((sum, travel) => sum + travel.lng, 0) / mappedTravels.length;
          map.setView([centerLat, centerLng], MAP_MIN_ZOOM);
        }
      })
      .catch((error) => {
        console.error('Leaflet initialization failed:', error);
      });

    return () => {
      cancelled = true;
      clearClosePopupTimer();
      popupHoveredRef.current = false;
      markerStore.clear();
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
    };
  }, [mappedTravels, travelHrefById]);

  if (!mappedTravels.length) {
    if (!travels.length) return null;
    const noCoordsMessage =
      language === "ES"
        ? "Hay viajes disponibles, pero no tienen coordenadas para mostrarlos en el mapa."
        : language === "FR"
          ? "Des voyages sont disponibles, mais ils n'ont pas de coordonnées à afficher sur la carte."
          : "Trips are available, but they don't have coordinates to display on the map.";
    return (
      <div className={cn('rounded-3xl border border-dashed border-border p-8 text-center', className)}>
        <p className="text-muted-foreground">{noCoordsMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn('rounded-3xl border border-border bg-card/40 p-2', className)}>
      <div className="relative">
        <div ref={mapRef} className="h-[560px] w-full rounded-2xl" />
        <div className="pointer-events-none absolute right-3 top-3 z-[1100]">
          <div className="pointer-events-auto grid grid-cols-3 gap-1.5">
            <div />
            <button
              type="button"
              onClick={() => panMapBy(0, -120)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-foreground/80 shadow transition hover:bg-white hover:text-foreground"
              aria-label="Pan map up"
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </button>
            <div />
            <button
              type="button"
              onClick={() => panMapBy(-120, 0)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-foreground/80 shadow transition hover:bg-white hover:text-foreground"
              aria-label="Pan map left"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <div />
            <button
              type="button"
              onClick={() => panMapBy(120, 0)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-foreground/80 shadow transition hover:bg-white hover:text-foreground"
              aria-label="Pan map right"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
            <div />
            <button
              type="button"
              onClick={() => panMapBy(0, 120)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-foreground/80 shadow transition hover:bg-white hover:text-foreground"
              aria-label="Pan map down"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            <div />
          </div>
        </div>
      </div>
    </div>
  );
};
