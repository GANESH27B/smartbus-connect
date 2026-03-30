
'use client';

import {
  Search, Mic, MicOff, Navigation, Layers, MapPin,
  X, ExternalLink, Navigation2,
  ChevronRight, Compass, ArrowUpRight, Bus, RefreshCw,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useGoogleMaps } from '@/context/GoogleMapsContext';
import { GoogleMap, Marker, Circle, InfoWindow } from '@react-google-maps/api';

// ─── Map style ────────────────────────────────────────────────────────────
const darkMapStyles: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#1a1c24' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1c24' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#20232d' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#64748b' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2a2d3a' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca3af' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#374151' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1f2937' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#334155' }] },
];

const defaultCenter = { lat: 20.5937, lng: 78.9629 };

// ─── Types ─────────────────────────────────────────────────────────────────
interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  class: string;
}

interface BusStop {
  id: number;
  name: string;
  lat: number;
  lng: number;
  distance?: number; // metres
  ref?: string;
  network?: string;
}

interface SelectedPlace {
  name: string;
  display_name: string;
  lat: number;
  lng: number;
  type: string;
  placeClass: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────
function getTypeMeta(type: string, placeClass: string) {
  const t = (type + ' ' + placeClass).toLowerCase();
  if (t.includes('station') || t.includes('bus') || t.includes('railway') || t.includes('transit') || t.includes('stop'))
    return { label: 'Transit', color: 'text-emerald-400', bg: 'bg-emerald-500/15', dot: '#10b981' };
  if (t.includes('restaurant') || t.includes('food') || t.includes('cafe') || t.includes('fast_food'))
    return { label: 'Food', color: 'text-amber-400', bg: 'bg-amber-500/15', dot: '#f59e0b' };
  if (t.includes('hospital') || t.includes('clinic') || t.includes('health') || t.includes('pharmacy'))
    return { label: 'Health', color: 'text-rose-400', bg: 'bg-rose-500/15', dot: '#f43f5e' };
  if (t.includes('school') || t.includes('college') || t.includes('university') || t.includes('education'))
    return { label: 'Education', color: 'text-blue-400', bg: 'bg-blue-500/15', dot: '#3b82f6' };
  if (t.includes('mall') || t.includes('shop') || t.includes('store') || t.includes('market'))
    return { label: 'Shopping', color: 'text-pink-400', bg: 'bg-pink-500/15', dot: '#ec4899' };
  if (t.includes('park') || t.includes('garden') || t.includes('forest'))
    return { label: 'Park', color: 'text-teal-400', bg: 'bg-teal-500/15', dot: '#14b8a6' };
  if (t.includes('hotel') || t.includes('lodging') || t.includes('motel'))
    return { label: 'Hotel', color: 'text-indigo-400', bg: 'bg-indigo-500/15', dot: '#6366f1' };
  if (t.includes('place') || t.includes('city') || t.includes('town') || t.includes('village') || t.includes('suburb'))
    return { label: 'Area', color: 'text-violet-400', bg: 'bg-violet-500/15', dot: '#8b5cf6' };
  if (t.includes('road') || t.includes('street') || t.includes('highway') || t.includes('avenue'))
    return { label: 'Road', color: 'text-sky-400', bg: 'bg-sky-500/15', dot: '#0ea5e9' };
  return { label: 'Place', color: 'text-white/50', bg: 'bg-white/8', dot: '#94a3b8' };
}

function getShortName(result: NominatimResult) {
  const parts = result.display_name.split(', ');
  return { main: parts[0] || result.display_name, secondary: parts.slice(1, 4).join(', ') };
}

function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <span className="text-white/70">{text}</span>;
  const idx = text.toLowerCase().indexOf(query.trim().toLowerCase());
  if (idx === -1) return <span className="text-white/70">{text}</span>;
  return (
    <span className="text-white/70">
      {text.slice(0, idx)}
      <span className="text-white font-extrabold">{text.slice(idx, idx + query.trim().length)}</span>
      {text.slice(idx + query.trim().length)}
    </span>
  );
}

function haversineMetres(a: google.maps.LatLngLiteral, b: { lat: number; lng: number }) {
  const R = 6371000;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLon = (b.lng - a.lng) * Math.PI / 180;
  const sin2 = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(sin2));
}

function formatDist(m: number) {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}

// ─── Main Component ────────────────────────────────────────────────────────
export default function MapSearchPage() {
  const { isLoaded } = useGoogleMaps();

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isSatellite, setIsSatellite] = useState(false);
  const [userLocation, setUserLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [pulseSize, setPulseSize] = useState(1);

  // Search
  const [query, setQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [hasSpeechSupport, setHasSpeechSupport] = useState(false);
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  // Selected place
  const [selectedPlace, setSelectedPlace] = useState<SelectedPlace | null>(null);
  const [searchMarker, setSearchMarker] = useState<google.maps.LatLngLiteral | null>(null);
  const [showPanel, setShowPanel] = useState(false);

  // Nearby bus stops
  const [nearbyStops, setNearbyStops] = useState<BusStop[]>([]);
  const [loadingStops, setLoadingStops] = useState(false);
  const [showStopsPanel, setShowStopsPanel] = useState(true);
  const [activeStop, setActiveStop] = useState<BusStop | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const stopsAbortRef = useRef<AbortController | null>(null);

  // ─── Pulse ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => setPulseSize(s => (s >= 2 ? 1 : s + 0.05)), 80);
    return () => clearInterval(id);
  }, []);

  // ─── Geolocation ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      p => setUserLocation({ lat: p.coords.latitude, lng: p.coords.longitude }),
      null, { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  // ─── Fetch Nearby Bus Stops via Overpass API (free) ────────────────────
  const fetchNearbyStops = useCallback(async (loc: google.maps.LatLngLiteral) => {
    stopsAbortRef.current?.abort();
    stopsAbortRef.current = new AbortController();
    setLoadingStops(true);

    const radius = 3000; // 3 km
    const query = `
      [out:json][timeout:20];
      (
        node["highway"="bus_stop"](around:${radius},${loc.lat},${loc.lng});
        node["amenity"="bus_station"](around:${radius},${loc.lat},${loc.lng});
        node["public_transport"="stop_position"]["bus"="yes"](around:${radius},${loc.lat},${loc.lng});
        node["public_transport"="platform"]["bus"="yes"](around:${radius},${loc.lat},${loc.lng});
      );
      out body;
    `;

    try {
      const res = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: `data=${encodeURIComponent(query)}`,
        signal: stopsAbortRef.current.signal,
      });
      if (!res.ok) throw new Error('Overpass error');
      const data = await res.json();

      const stops: BusStop[] = (data.elements || [])
        .filter((el: any) => el.lat && el.lon)
        .map((el: any) => ({
          id: el.id,
          name: el.tags?.name || el.tags?.ref || 'Bus Stop',
          lat: el.lat,
          lng: el.lon,
          distance: haversineMetres(loc, { lat: el.lat, lng: el.lon }),
          ref: el.tags?.ref,
          network: el.tags?.network || el.tags?.operator,
        }))
        .sort((a: BusStop, b: BusStop) => (a.distance ?? 0) - (b.distance ?? 0))
        .slice(0, 20); // top 20 nearest

      setNearbyStops(stops);
    } catch (err: any) {
      if (err.name !== 'AbortError') setNearbyStops([]);
    } finally {
      setLoadingStops(false);
    }
  }, []);

  // Fetch stops when user location detected
  useEffect(() => {
    if (userLocation) fetchNearbyStops(userLocation);
  }, [userLocation, fetchNearbyStops]);

  // ─── Speech ────────────────────────────────────────────────────────────
  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    setHasSpeechSupport(true);
    const rec = new SR();
    rec.continuous = false;
    rec.lang = 'en-US';
    rec.onresult = (e: any) => {
      const text: string = e.results[0][0].transcript;
      setQuery(text);
      fetchNominatim(text);
    };
    rec.onend = () => setIsListening(false);
    (window as any)._sr = rec;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Click outside ─────────────────────────────────────────────────────
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node))
        setShowSuggestions(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // ─── Nominatim search ─────────────────────────────────────────────────
  const fetchNominatim = useCallback(async (value: string) => {
    if (!value.trim()) { setSuggestions([]); setShowSuggestions(false); return; }
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setIsLoadingSuggestions(true);
    try {
      const params = new URLSearchParams({
        q: value, format: 'json', addressdetails: '1',
        extratags: '1', namedetails: '1', limit: '15', dedupe: '1', 'accept-language': 'en',
      });
      const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
        signal: abortRef.current.signal, headers: { 'Accept-Language': 'en' },
      });
      if (!res.ok) throw new Error('Nominatim error');
      const data: NominatimResult[] = await res.json();
      const seen = new Set<string>();
      const deduped = data.filter(r => {
        const key = r.display_name.split(', ').slice(0, 2).join(',').toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key); return true;
      });
      setSuggestions(deduped);
      setShowSuggestions(deduped.length > 0);
    } catch (err: any) {
      if (err.name !== 'AbortError') { setSuggestions([]); setShowSuggestions(false); }
    } finally { setIsLoadingSuggestions(false); }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    clearTimeout(debounceRef.current);
    if (!value.trim()) { setSuggestions([]); setShowSuggestions(false); return; }
    debounceRef.current = setTimeout(() => fetchNominatim(value), 350);
  };

  const selectSuggestion = useCallback((result: NominatimResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    const { main } = getShortName(result);
    setQuery(main);
    setSuggestions([]); setShowSuggestions(false);
    setSearchMarker({ lat, lng });
    setSelectedPlace({ name: main, display_name: result.display_name, lat, lng, type: result.type, placeClass: result.class });
    setShowPanel(true);
    setMap(prev => { prev?.panTo({ lat, lng }); prev?.setZoom(16); return prev; });
  }, []);

  const handleSearch = () => {
    if (suggestions.length > 0) selectSuggestion(suggestions[0]);
    else fetchNominatim(query);
  };

  const clearSearch = () => {
    setQuery(''); setSuggestions([]); setShowSuggestions(false);
    setSearchMarker(null); setSelectedPlace(null); setShowPanel(false);
    inputRef.current?.focus();
  };

  const onMapLoad = useCallback((m: google.maps.Map) => setMap(m), []);

  const openGoogleMapsBusStops = useCallback(() => {
    const center = map?.getCenter();
    const fallback = userLocation || defaultCenter;
    const lat = center?.lat() ?? fallback.lat;
    const lng = center?.lng() ?? fallback.lng;
    const zoom = map?.getZoom() ?? 15;
    const url = `https://www.google.com/maps/search/bus+stop/@${lat},${lng},${zoom}z`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }, [map, userLocation]);

  const mapOptions: google.maps.MapOptions = {
    disableDefaultUI: true,
    mapTypeId: isSatellite ? 'hybrid' : 'roadmap',
    styles: isSatellite ? [] : darkMapStyles,
    backgroundColor: '#1a1c24',
    gestureHandling: 'greedy',
    zoomControl: false, mapTypeControl: false, streetViewControl: false, fullscreenControl: false,
  };

  return (
    <div className="h-[calc(100vh-4rem)] w-full relative overflow-hidden bg-[#1a1c24]">

      {/* ─── Map ──────────────────────────────────────────────────────── */}
      {isLoaded ? (
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={userLocation || defaultCenter}
          zoom={userLocation ? 14 : 5}
          options={mapOptions}
          onLoad={onMapLoad}
          onClick={() => { setActiveStop(null); }}
        >
          {/* Nearby bus stop markers */}
          {nearbyStops.map(stop => (
            <Marker
              key={stop.id}
              position={{ lat: stop.lat, lng: stop.lng }}
              title={stop.name}
              zIndex={50}
              onClick={() => { setActiveStop(stop); map?.panTo({ lat: stop.lat, lng: stop.lng }); }}
              icon={{
                path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
                fillColor: '#10b981',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2,
                scale: 1.8,
                anchor: { x: 12, y: 22 } as any,
              }}
            />
          ))}

          {/* InfoWindow for clicked stop */}
          {activeStop && (
            <InfoWindow
              position={{ lat: activeStop.lat, lng: activeStop.lng }}
              onCloseClick={() => setActiveStop(null)}
            >
              <div className="p-2 min-w-[180px] text-slate-900">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600">Bus Stop</p>
                </div>
                <p className="font-black text-sm leading-tight mb-1">{activeStop.name}</p>
                {activeStop.ref && <p className="text-xs text-slate-500">Ref: {activeStop.ref}</p>}
                {activeStop.distance && <p className="text-xs font-bold text-slate-400 mt-1">{formatDist(activeStop.distance)} away</p>}
                {activeStop.network && <p className="text-[10px] text-slate-400">{activeStop.network}</p>}
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${activeStop.lat},${activeStop.lng}`}
                  target="_blank" rel="noopener noreferrer"
                  className="mt-2 flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700"
                >
                  <Navigation2 className="w-3 h-3" /> Get Directions
                </a>
              </div>
            </InfoWindow>
          )}

          {/* Search result marker */}
          {searchMarker && (
            <>
              <Circle center={searchMarker} radius={200}
                options={{ fillColor: '#8b5cf6', fillOpacity: 0.1, strokeColor: '#8b5cf6', strokeOpacity: 0.4, strokeWeight: 1.5, clickable: false }} />
              <Marker position={searchMarker} title={selectedPlace?.name} zIndex={200}
                onClick={() => setShowPanel(true)}
                icon={{ path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
                  fillColor: '#8b5cf6', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2.5, scale: 2.8,
                  anchor: { x: 12, y: 22 } as any }} />
            </>
          )}

          {/* User location */}
          {userLocation && (
            <>
              <Circle center={userLocation} radius={30 * pulseSize}
                options={{ fillColor: '#3b82f6', fillOpacity: 0.12, strokeColor: '#3b82f6', strokeOpacity: 0.6, strokeWeight: 1, clickable: false }} />
              <Marker position={userLocation} zIndex={150}
                icon={{ path: 0, scale: 12, fillColor: '#3b82f6', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 3 }} />
            </>
          )}
        </GoogleMap>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
          <Compass className="w-12 h-12 text-violet-500 animate-spin" />
          <p className="text-white/50 text-xs font-bold uppercase tracking-widest">Initialising Maps…</p>
        </div>
      )}

      {/* ─── Search Bar + Suggestions ─────────────────────────────────── */}
      <div ref={containerRef} className="absolute top-5 left-1/2 -translate-x-1/2 z-30 w-[calc(100%-2rem)] max-w-2xl">

        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="absolute -inset-[1.5px] rounded-[2rem] bg-gradient-to-r from-violet-600 via-fuchsia-500 to-blue-500 blur-sm opacity-50 pointer-events-none" />
          <div className="relative flex items-center bg-[#1d1f2e]/97 backdrop-blur-2xl rounded-[2rem] shadow-2xl px-2 py-2 gap-2 border border-white/5">
            {/* Icon */}
            <div className="flex-shrink-0 bg-violet-600/20 p-2.5 rounded-xl ml-1">
              {isLoadingSuggestions
                ? <div className="w-5 h-5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                : <Search className="w-5 h-5 text-violet-400" />}
            </div>
            <input
              ref={inputRef}
              id="map-search-input"
              type="text"
              autoComplete="off"
              spellCheck={false}
              placeholder="Search any place, bus stop, landmark…"
              value={query}
              onChange={handleInputChange}
              onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
              onKeyDown={e => {
                if (e.key === 'Enter') { e.preventDefault(); handleSearch(); }
                if (e.key === 'Escape') setShowSuggestions(false);
              }}
              className="flex-1 bg-transparent outline-none text-white placeholder:text-white/28 text-sm font-semibold py-2 px-1 min-w-0"
            />
            {query && (
              <button onClick={clearSearch} className="p-2 rounded-xl text-white/35 hover:text-white hover:bg-white/10 transition-all flex-shrink-0">
                <X className="w-4 h-4" />
              </button>
            )}
            {hasSpeechSupport && (
              <button
                onClick={() => {
                  const rec = (window as any)._sr;
                  if (!rec) return;
                  if (isListening) rec.stop(); else { rec.start(); setIsListening(true); }
                }}
                className={cn('p-2.5 rounded-xl transition-all flex-shrink-0',
                  isListening ? 'bg-rose-500/20 text-rose-400 animate-pulse' : 'text-white/35 hover:text-white hover:bg-white/10')}>
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            )}
            {/* Search button */}
            <AnimatePresence>
              {query.trim() && (
                <motion.button key="search-btn"
                  initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ duration: 0.18 }} onClick={handleSearch}
                  className="flex-shrink-0 flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white text-xs font-black uppercase tracking-wider px-4 py-2.5 rounded-[1.2rem] shadow-lg shadow-violet-500/30 transition-all hover:scale-105 mr-1 whitespace-nowrap">
                  <Search className="w-3.5 h-3.5" /> Search
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Suggestions Dropdown */}
        <AnimatePresence>
          {showSuggestions && suggestions.length > 0 && (
            <motion.div key="suggestions-dropdown"
              initial={{ opacity: 0, y: 8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.99 }} transition={{ duration: 0.15 }}
              className="mt-2 overflow-hidden rounded-[1.6rem] bg-[#1d1f2e]/98 backdrop-blur-2xl border border-white/8 shadow-[0_32px_64px_rgba(0,0,0,0.65)]">
              <div className="flex items-center justify-between px-5 py-3 border-b border-white/6">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-[0.28em] text-white/35">Location Suggestions</span>
                </div>
                <span className="text-[9px] text-white/20">{suggestions.length} places found • OpenStreetMap</span>
              </div>
              <ul className="py-2 max-h-[420px] overflow-y-auto scroll-smooth">
                {suggestions.map((result, idx) => {
                  const meta = getTypeMeta(result.type, result.class);
                  const { main, secondary } = getShortName(result);
                  return (
                    <motion.li key={result.place_id}
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03, duration: 0.16 }}>
                      <button
                        onMouseDown={e => { e.preventDefault(); selectSuggestion(result); }}
                        className="w-full flex items-center gap-3.5 px-4 py-3.5 hover:bg-white/5 active:bg-white/8 transition-colors group text-left">
                        <div className={cn('flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center', meta.bg)}>
                          <MapPin className={cn('w-4 h-4', meta.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate leading-snug">
                            <HighlightText text={main} query={query} />
                          </p>
                          {secondary && <p className="text-[11px] text-white/30 truncate mt-0.5 leading-snug">{secondary}</p>}
                        </div>
                        <div className="flex-shrink-0 flex items-center gap-2">
                          <span className={cn('hidden sm:block text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-lg', meta.bg, meta.color)}>
                            {meta.label}
                          </span>
                          <ArrowUpRight className="w-3.5 h-3.5 text-white/15 group-hover:text-white/50 transition-colors" />
                        </div>
                      </button>
                    </motion.li>
                  );
                })}
              </ul>
              <div className="flex items-center justify-end gap-1.5 px-5 py-2.5 border-t border-white/5">
                <span className="text-[9px] text-white/20">Powered by</span>
                <span className="text-[9px] font-bold text-white/30">OpenStreetMap</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Map Controls ─────────────────────────────────────────────── */}
      <div className="absolute top-5 right-5 z-20 flex flex-col gap-3">
        <button onClick={() => setIsSatellite(v => !v)}
          className={cn('w-12 h-12 rounded-2xl flex items-center justify-center border transition-all hover:scale-105 shadow-2xl',
            isSatellite ? 'bg-violet-600 border-violet-400/30 shadow-violet-500/30' : 'bg-[#1d1f2e]/90 backdrop-blur border-white/10 text-white/60 hover:text-white hover:bg-white/10')}>
          <Layers className="w-5 h-5 text-white" />
        </button>
        {userLocation && (
          <button onClick={() => { map?.panTo(userLocation); map?.setZoom(15); }}
            className="w-12 h-12 rounded-2xl flex items-center justify-center bg-blue-600 border border-blue-400/30 text-white hover:bg-blue-500 shadow-2xl shadow-blue-500/30 hover:scale-105 transition-all">
            <Navigation className="w-5 h-5" />
          </button>
        )}
        {/* Refresh nearby stops */}
        {userLocation && (
          <button onClick={() => fetchNearbyStops(userLocation)}
            title="Refresh nearby stops"
            className={cn('w-12 h-12 rounded-2xl flex items-center justify-center bg-emerald-600 border border-emerald-400/30 text-white hover:bg-emerald-500 shadow-2xl shadow-emerald-500/30 hover:scale-105 transition-all',
              loadingStops && 'opacity-60 cursor-wait')}>
            <RefreshCw className={cn('w-5 h-5', loadingStops && 'animate-spin')} />
          </button>
        )}

        {/* Open Google Maps search for bus stops */}
        <button
          onClick={openGoogleMapsBusStops}
          title="Open Google Maps and search bus stops"
          className={cn(
            'w-12 h-12 rounded-2xl flex items-center justify-center border text-white shadow-2xl hover:scale-105 transition-all',
            'bg-sky-600 border-sky-400/30 shadow-sky-500/30 hover:bg-sky-500'
          )}
        >
          <Bus className="w-5 h-5" />
        </button>
      </div>

      {/* ─── Nearby Bus Stands Panel ───────────────────────────────────── */}
      <AnimatePresence>
        {!showPanel && nearbyStops.length > 0 && (
          <motion.div key="stops-panel"
            initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
            className="absolute bottom-6 left-5 z-30 w-[300px] rounded-[2rem] bg-[#1d1f2e]/97 backdrop-blur-2xl border border-white/8 shadow-[0_32px_64px_rgba(0,0,0,0.55)] text-white overflow-hidden">

            {/* Header */}
            <button
              onClick={() => setShowStopsPanel(v => !v)}
              className="w-full flex items-center justify-between px-5 py-4 border-b border-white/6 hover:bg-white/3 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                  <Bus className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-black text-white">Nearby Bus Stands</p>
                  <p className="text-[10px] text-white/40">
                    {loadingStops ? 'Searching…' : `${nearbyStops.length} stops within 3 km`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {loadingStops && <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />}
                {showStopsPanel ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
              </div>
            </button>

            {/* Stop List */}
            <AnimatePresence>
              {showStopsPanel && (
                <motion.div
                  initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                  transition={{ duration: 0.25 }} className="overflow-hidden">
                  <ul className="max-h-[300px] overflow-y-auto scroll-smooth divide-y divide-white/4">
                    {nearbyStops.map((stop, idx) => (
                      <motion.li key={stop.id}
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.04 }}>
                        <button
                          onClick={() => { setActiveStop(stop); map?.panTo({ lat: stop.lat, lng: stop.lng }); map?.setZoom(17); }}
                          className={cn(
                            'w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors group text-left',
                            activeStop?.id === stop.id && 'bg-emerald-500/10'
                          )}>
                          {/* Stop index */}
                          <div className={cn(
                            'flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black',
                            activeStop?.id === stop.id ? 'bg-emerald-500 text-white' : 'bg-white/8 text-white/50'
                          )}>
                            {idx + 1}
                          </div>
                          {/* Stop info */}
                          <div className="flex-1 min-w-0">
                            <p className={cn('text-sm font-bold truncate leading-snug',
                              activeStop?.id === stop.id ? 'text-emerald-400' : 'text-white/80 group-hover:text-white')}>
                              {stop.name}
                            </p>
                            <p className="text-[10px] text-white/35 mt-0.5">
                              {stop.distance ? formatDist(stop.distance) + ' away' : ''}
                              {stop.network ? ` · ${stop.network}` : ''}
                            </p>
                          </div>
                          {/* Distance badge */}
                          <div className="flex-shrink-0">
                            <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg">
                              {stop.distance ? formatDist(stop.distance) : '—'}
                            </span>
                          </div>
                        </button>
                      </motion.li>
                    ))}
                  </ul>

                  {/* Footer */}
                  <div className="px-4 py-3 border-t border-white/6 flex items-center justify-between">
                    <p className="text-[9px] text-white/25">Via OpenStreetMap Overpass</p>
                    <button onClick={() => userLocation && fetchNearbyStops(userLocation)}
                      className="text-[9px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1">
                      <RefreshCw className="w-2.5 h-2.5" /> Refresh
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Selected Place Details Panel ─────────────────────────────── */}
      <AnimatePresence>
        {showPanel && selectedPlace && (
          <motion.div key="place-panel"
            initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
            className="absolute bottom-6 left-5 z-30 w-[320px] rounded-[2rem] bg-[#1d1f2e]/97 backdrop-blur-2xl border border-white/8 shadow-[0_32px_64px_rgba(0,0,0,0.6)] text-white overflow-hidden">
            {(() => {
              const meta = getTypeMeta(selectedPlace.type, selectedPlace.placeClass);
              return (
                <div className="relative h-[90px] flex items-end p-5 overflow-hidden"
                  style={{ background: `linear-gradient(135deg, ${meta.dot}22, ${meta.dot}10)` }}>
                  <div className="absolute inset-0 border-b border-white/6" />
                  <button onClick={() => setShowPanel(false)}
                    className="absolute top-3 right-3 p-2 rounded-xl bg-black/30 backdrop-blur text-white/60 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.25em] mb-0.5" style={{ color: meta.dot }}>{meta.label}</p>
                    <h3 className="text-xl font-black leading-tight">{selectedPlace.name}</h3>
                  </div>
                </div>
              );
            })()}
            <div className="p-5 space-y-3.5">
              <div className="flex gap-3 items-start">
                <div className="mt-0.5 p-2 bg-white/5 rounded-xl shrink-0"><MapPin className="w-4 h-4 text-violet-400" /></div>
                <p className="text-sm text-white/55 leading-relaxed">{selectedPlace.display_name}</p>
              </div>
              <div className="flex gap-3 items-center">
                <div className="p-2 bg-white/5 rounded-xl shrink-0"><Compass className="w-4 h-4 text-white/35" /></div>
                <span className="text-xs text-white/40 font-mono">{selectedPlace.lat.toFixed(5)}, {selectedPlace.lng.toFixed(5)}</span>
              </div>
              <div className="border-t border-white/6 pt-4 space-y-2.5">
                <a href={`https://www.google.com/maps/search/?api=1&query=${selectedPlace.lat},${selectedPlace.lng}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-between w-full px-5 py-3.5 bg-violet-600 hover:bg-violet-500 rounded-xl font-bold text-sm group">
                  <span className="flex items-center gap-2"><ExternalLink className="w-4 h-4" />Open in Google Maps</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>
                <a href={`https://www.google.com/maps/dir/?api=1&destination=${selectedPlace.lat},${selectedPlace.lng}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-between w-full px-5 py-3.5 bg-white/5 hover:bg-white/10 text-white/65 rounded-xl font-bold text-sm border border-white/8 group">
                  <span className="flex items-center gap-2"><Navigation2 className="w-4 h-4 text-white/40" />Get Directions</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Legend ───────────────────────────────────────────────────── */}
      <div className="absolute bottom-6 right-5 z-20">
        <div className="bg-[#1d1f2e]/90 backdrop-blur-xl border border-white/8 rounded-2xl px-5 py-3 flex items-center gap-4 shadow-2xl">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Bus Stop</span>
          </div>
          <div className="w-px h-3.5 bg-white/10" />
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.9)]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Search</span>
          </div>
          <div className="w-px h-3.5 bg-white/10" />
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.9)]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">You</span>
          </div>
        </div>
      </div>

      {/* ─── Empty hint ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {!query && !showPanel && nearbyStops.length === 0 && !loadingStops && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ delay: 0.6 }}
            className="absolute top-24 left-1/2 -translate-x-1/2 z-10 pointer-events-none whitespace-nowrap">
            <div className="flex items-center gap-2 px-5 py-2.5 bg-[#1d1f2e]/80 backdrop-blur border border-white/8 rounded-full shadow-xl">
              <Search className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-xs font-semibold text-white/35">Search any stop, landmark or address above</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}