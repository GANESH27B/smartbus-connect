
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleMap, Marker, Circle, InfoWindow } from '@react-google-maps/api';
import { useGoogleMaps } from '@/context/GoogleMapsContext';
import { cn } from '@/lib/utils';
import {
  Bus, Navigation, Navigation2, MapPin, RefreshCw,
  Compass, List, Map, ExternalLink, AlertCircle,
  ChevronRight, Radio, SortAsc, Wifi
} from 'lucide-react';

// ─── Dark map style ────────────────────────────────────────────────────────
const darkMapStyles: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#1a1c24' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1c24' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ visibility: 'off' }] },
  // Hide built-in POI/transit icons so we only show our markers
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
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

// ─── Types ─────────────────────────────────────────────────────────────────
type StopType = 1 | 2 | 3;

interface BusStop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  distance: number;
  stopType: StopType;
  stopTypeLabel: string;
  cityType?: 1 | 2 | 3;
  ref?: string;
  network?: string;
  operator?: string;
  shelter?: string;
  bench?: string;
  lit?: string;
  routes?: string;
}

// ─── Stop type detection ───────────────────────────────────────────────────
function detectStopType(tags: Record<string, string>): { type: StopType; label: string } {
  const highway      = tags?.highway || '';
  const amenity      = tags?.amenity || '';
  const pt           = tags?.public_transport || '';
  const rail         = tags?.railway || '';
  const busTag       = tags?.bus || '';
  const tram         = tags?.tram || '';
  const subway       = tags?.subway || '';

  // Type 3 — Major transit hubs: bus stations, rail/tram stops, subway
  if (amenity === 'bus_station') return { type: 3, label: 'Type 3 · Bus Station' };
  if (rail === 'tram_stop')      return { type: 3, label: 'Type 3 · Tram Stop' };
  if (subway === 'yes')          return { type: 3, label: 'Type 3 · Subway Stop' };
  if (pt === 'stop_area')       return { type: 3, label: 'Type 3 · Transit Hub' };

  // Type 2 — Platforms & formal PT stops
  if (pt === 'platform')        return { type: 2, label: 'Type 2 · Platform' };
  if (pt === 'stop_position' && busTag === 'yes') return { type: 2, label: 'Type 2 · Stop Position' };
  if (tram === 'yes')           return { type: 2, label: 'Type 2 · Tram Platform' };

  // Type 1 — Basic roadside bus stop
  if (highway === 'bus_stop')   return { type: 1, label: 'Type 1 · Bus Stop' };

  return { type: 1, label: 'Type 1 · Bus Stop' };
}

function getTypeStyle(t: StopType) {
  if (t === 3) return { color: 'text-violet-400', bg: 'bg-violet-500/15', border: 'border-violet-500/25', marker: '#8b5cf6', label: 'Type 3' };
  if (t === 2) return { color: 'text-amber-400',  bg: 'bg-amber-500/15',  border: 'border-amber-500/25',  marker: '#f59e0b', label: 'Type 2' };
  return         { color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/25', marker: '#10b981', label: 'Type 1' };
}

// ─── Helpers ───────────────────────────────────────────────────────────────
function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLon = (b.lng - a.lng) * Math.PI / 180;
  const sin2 =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(sin2));
}

function formatDist(m: number) {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}

function getDistColor(m: number) {
  if (m < 300) return { text: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/20' };
  if (m < 800) return { text: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/20' };
  return { text: 'text-rose-400', bg: 'bg-rose-500/15', border: 'border-rose-500/20' };
}

const RADIUS_OPTIONS = [500, 1000, 2000, 3000, 5000];
const TYPE_FILTERS: { label: string; value: StopType | 0 }[] = [
  { label: 'All', value: 0 },
  { label: 'Type 1', value: 1 },
  { label: 'Type 2', value: 2 },
  { label: 'Type 3', value: 3 },
];

// ─── Main Component ────────────────────────────────────────────────────────
export default function NearbyStopsPage() {
  const { isLoaded } = useGoogleMaps();

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [pulseSize, setPulseSize] = useState(1);

  const [stops, setStops] = useState<BusStop[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [radius, setRadius] = useState(2000);
  const [filterType, setFilterType] = useState<StopType | 0>(0);
  const [cityTypeFilter, setCityTypeFilter] = useState<0 | 1 | 2 | 3>(0);
  const [sourceMode, setSourceMode] = useState<'live' | 'system'>('system');

  const [activeStop, setActiveStop] = useState<BusStop | null>(null);
  const [viewMode, setViewMode] = useState<'split' | 'map' | 'list'>('split');
  const [isSatellite, setIsSatellite] = useState(false);
  const [highlightedStop, setHighlightedStop] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // ─── Pulse ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => setPulseSize(s => (s >= 2 ? 1 : s + 0.05)), 80);
    return () => clearInterval(id);
  }, []);

  // ─── GPS ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported in this browser.');
      return;
    }
    const id = navigator.geolocation.watchPosition(
      pos => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationError(null);
      },
      err => setLocationError('Could not get your location. Please allow location access.'),
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  const [dataSource, setDataSource] = useState<'Google' | 'OSM' | null>(null);

  // ─── System stops (DB) ───────────────────────────────────────────────────
  const fetchStopsSystem = useCallback(async (loc: { lat: number; lng: number }, rad: number, ct: 0 | 1 | 2 | 3) => {
    setLoading(true);
    setDataSource(null);
    try {
      const url = new URL('/api/stops', window.location.origin);
      if (ct !== 0) url.searchParams.set('cityType', String(ct));
      const res = await fetch(url.toString(), { cache: 'no-store' });
      const json = await res.json();
      const raw = (json?.data || []) as Array<{ _id?: string; id?: string; name: string; lat: number; lng: number; eta?: string; cityType?: 1 | 2 | 3 }>;

      const fetched: BusStop[] = raw
        .map((s) => {
          const dist = haversine(loc, { lat: s.lat, lng: s.lng });
          return {
            id: String(s._id || s.id || `${s.name}-${s.lat}-${s.lng}`),
            name: s.name,
            lat: s.lat,
            lng: s.lng,
            distance: dist,
            stopType: 1,
            stopTypeLabel: 'System · Saved Stop',
            cityType: s.cityType,
          };
        })
        .filter((s) => s.distance <= rad)
        .sort((a, b) => a.distance - b.distance);

      setStops(fetched);
      setLastFetched(new Date());
    } catch (e) {
      console.error('Failed to fetch system stops', e);
      setStops([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Robust Fallback: Multi-Mirror Overpass Search ─────────────────────────
  const fetchStopsOSM = useCallback(async (loc: { lat: number; lng: number }, rad: number) => {
    setDataSource('OSM');
    const query = `[out:json][timeout:30];(node["highway"="bus_stop"](around:${rad},${loc.lat},${loc.lng});node["amenity"="bus_station"](around:${rad},${loc.lat},${loc.lng});node["public_transport"="stop_position"](around:${rad},${loc.lat},${loc.lng}););out center body;`;

    const mirrors = [
      'https://overpass-api.de/api/interpreter',
      'https://overpass.kumi.systems/api/interpreter',
      'https://overpass.nchc.org.tw/api/interpreter'
    ];

    let success = false;
    for (const url of mirrors) {
      if (success) break;
      try {
        const res = await fetch(url, {
          method: 'POST',
          body: `data=${encodeURIComponent(query)}`,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        
        if (!res.ok) continue; // Try next mirror if 504/429
        
        const data = await res.json();
        const fetched: BusStop[] = (data.elements || []).map((el: any) => {
          const lat = el.lat ?? el.center?.lat;
          const lon = el.lon ?? el.center?.lon;
          const { type, label } = detectStopType(el.tags || {});
          return {
            id: String(el.id),
            name: el.tags?.name || el.tags?.['name:en'] || 'Bus Stop',
            lat, lng: lon,
            distance: haversine(loc, { lat, lng: lon }),
            stopType: type, stopTypeLabel: label,
          };
        }).sort((a: any, b: any) => a.distance - b.distance);

        setStops(fetched);
        setLastFetched(new Date());
        success = true;
      } catch (err) {
        console.warn(`Mirror ${url} failed, trying next...`);
      }
    }

    if (!success) {
      console.error('All OSM Mirrors failed.');
      setStops([]);
    }
    setLoading(false);
  }, []);

  // ─── Main Switcher: Google with OSM Fallback ─────────────────────────────
  const fetchStops = useCallback(async (loc: { lat: number; lng: number }, rad: number) => {
    if (!window.google || !map) {
      // If JS API not loaded, try OSM immediately
      fetchStopsOSM(loc, rad);
      return;
    }
    
    setLoading(true);
    setStops([]);
    
    const service = new google.maps.places.PlacesService(map);
    const center = new google.maps.LatLng(loc.lat, loc.lng);

    const searchRequest: google.maps.places.PlaceSearchRequest = {
      location: center,
      radius: rad,
      keyword: 'bus stop',
      type: 'bus_station',
    };

    service.nearbySearch(searchRequest, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        setDataSource('Google');
        const fetched: BusStop[] = results
          .filter(place => place.geometry && place.geometry.location)
          .filter(place => {
            const types = place.types || [];
            const isTransit = types.includes('bus_station') || types.includes('transit_station');
            if (isTransit) return true;
            const name = (place.name || '').toLowerCase();
            return name.includes('bus stop') || name.includes('bus stand') || name.includes('terminal');
          })
          .map(place => {
            const plat = place.geometry!.location!.lat();
            const plng = place.geometry!.location!.lng();
            const dist = haversine(loc, { lat: plat, lng: plng });
            
            let stopType: StopType = 1;
            let stopTypeLabel = 'Type 1 · Bus Stop';
            const types = place.types || [];
            if (types.includes('bus_station') || (place.name || '').toLowerCase().includes('terminal')) {
              stopType = 3; stopTypeLabel = 'Type 3 · Bus Station';
            } else if (types.includes('transit_station')) {
              stopType = 2; stopTypeLabel = 'Type 2 · Transport Hub';
            }

            return {
              id: String(place.place_id || Math.random().toString()),
              name: place.name || 'Unnamed Bus Stop',
              lat: plat, lng: plng,
              distance: dist,
              stopType, stopTypeLabel,
              ref: place.vicinity,
            };
          })
          .filter(s => s.distance <= rad)
          .sort((a, b) => a.distance - b.distance);

        setStops(fetched.slice(0, 60));
        setLastFetched(new Date());
        setLoading(false);
      } else {
        // Fallback to OSM if Google fails (e.g. BillingNotEnabledMapError)
        console.warn('Google Places Failed (likely billing), falling back to OSM:', status);
        fetchStopsOSM(loc, rad);
      }
    });
  }, [map, fetchStopsOSM]);

  // Auto-fetch when location + radius change
  useEffect(() => {
    if (!userLocation) return;
    if (sourceMode === 'system') {
      fetchStopsSystem(userLocation, radius, cityTypeFilter);
    } else {
      fetchStops(userLocation, radius);
    }
  }, [userLocation, radius, fetchStops, fetchStopsSystem, cityTypeFilter, sourceMode]);

  const filteredStops = filterType === 0 ? stops : stops.filter(s => s.stopType === filterType);

  // Count by type
  const typeCounts = stops.reduce((acc, s) => { acc[s.stopType] = (acc[s.stopType] || 0) + 1; return acc; }, {} as Record<number, number>);

  const onMapLoad = useCallback((m: google.maps.Map) => setMap(m), []);

  const focusStop = (stop: BusStop) => {
    setActiveStop(stop);
    setHighlightedStop(stop.id);
    map?.panTo({ lat: stop.lat, lng: stop.lng });
    map?.setZoom(17);
    // scroll list item into view
    const el = document.getElementById(`stop-${stop.id}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const mapOptions: google.maps.MapOptions = {
    disableDefaultUI: true,
    mapTypeId: isSatellite ? 'hybrid' : 'roadmap',
    styles: isSatellite ? [] : darkMapStyles,
    backgroundColor: '#1a1c24',
    gestureHandling: 'greedy',
    zoomControl: true,
    zoomControlOptions: { position: 9 },
    fullscreenControl: false,
    streetViewControl: false,
    mapTypeControl: false,
  };

  const defaultCenter = { lat: 20.5937, lng: 78.9629 };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-[#1a1c24] text-white overflow-hidden">

      {/* ── Top Header Bar ── */}
      <div className="flex-shrink-0 bg-[#1d1f2e]/95 backdrop-blur-2xl border-b border-white/8 px-4 py-3 z-20">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-3">

          {/* Title */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center border border-emerald-500/20">
              <Bus className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base font-black">Nearby Bus Stops</h1>
                {loading && <div className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />}
                {!loading && stops.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black px-2 py-0.5 bg-white/8 text-white/50 rounded-full border border-white/10">{stops.length} total</span>
                    {typeCounts[1] && <span className="text-[9px] font-black px-1.5 py-0.5 bg-emerald-500/15 text-emerald-400 rounded-full border border-emerald-500/20">T1: {typeCounts[1]}</span>}
                    {typeCounts[2] && <span className="text-[9px] font-black px-1.5 py-0.5 bg-amber-500/15 text-amber-400 rounded-full border border-amber-500/20">T2: {typeCounts[2]}</span>}
                    {typeCounts[3] && <span className="text-[9px] font-black px-1.5 py-0.5 bg-violet-500/15 text-violet-400 rounded-full border border-violet-500/20">T3: {typeCounts[3]}</span>}
                  </div>
                )}
              </div>
              <p className="text-[11px] text-white/40 leading-none mt-0.5">
                {userLocation
                  ? lastFetched
                    ? `Updated ${lastFetched.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                    : 'Searching…'
                  : 'Waiting for GPS location…'}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Source mode */}
            <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 border border-white/8">
              <button
                onClick={() => setSourceMode('system')}
                className={cn(
                  'text-[10px] font-black px-2.5 py-1.5 rounded-lg transition-all',
                  sourceMode === 'system' ? 'bg-violet-600 text-white' : 'text-white/40 hover:text-white hover:bg-white/10'
                )}
                title="Use saved (DB) stops"
              >
                City 1/2/3
              </button>
              <button
                onClick={() => setSourceMode('live')}
                className={cn(
                  'text-[10px] font-black px-2.5 py-1.5 rounded-lg transition-all',
                  sourceMode === 'live' ? 'bg-blue-600 text-white' : 'text-white/40 hover:text-white hover:bg-white/10'
                )}
                title="Use Google/OSM nearby search"
              >
                Live
              </button>
            </div>

            {/* City type filter (only for system mode) */}
            {sourceMode === 'system' && (
              <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 border border-white/8">
                {([0, 1, 2, 3] as const).map((ct) => (
                  <button
                    key={ct}
                    onClick={() => setCityTypeFilter(ct)}
                    className={cn(
                      'text-[10px] font-black px-2.5 py-1.5 rounded-lg transition-all',
                      cityTypeFilter === ct ? 'bg-emerald-600 text-white' : 'text-white/40 hover:text-white hover:bg-white/10'
                    )}
                    title={ct === 0 ? 'All city types' : `City type ${ct}`}
                  >
                    {ct === 0 ? 'All Cities' : `City ${ct}`}
                  </button>
                ))}
              </div>
            )}

            {/* Type filter */}
            <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 border border-white/8">
              {TYPE_FILTERS.map(f => (
                <button
                  key={f.value}
                  onClick={() => setFilterType(f.value as StopType | 0)}
                  className={cn(
                    'text-[10px] font-black px-2.5 py-1.5 rounded-lg transition-all',
                    filterType === f.value
                      ? f.value === 0 ? 'bg-white/20 text-white'
                        : f.value === 1 ? 'bg-emerald-600 text-white'
                        : f.value === 2 ? 'bg-amber-500 text-white'
                        : 'bg-violet-600 text-white'
                      : 'text-white/40 hover:text-white hover:bg-white/10'
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Radius selector */}
            <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 border border-white/8">
              {RADIUS_OPTIONS.map(r => (
                <button
                  key={r}
                  onClick={() => setRadius(r)}
                  className={cn(
                    'text-[10px] font-black px-2.5 py-1.5 rounded-lg transition-all',
                    radius === r
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-white/40 hover:text-white hover:bg-white/10'
                  )}
                >
                  {r >= 1000 ? `${r / 1000}km` : `${r}m`}
                </button>
              ))}
            </div>

            {/* View mode */}
            <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 border border-white/8">
              {([['split', <Compass key="s" className="w-3.5 h-3.5" />],
                ['map', <Map key="m" className="w-3.5 h-3.5" />],
                ['list', <List key="l" className="w-3.5 h-3.5" />]] as [string, React.ReactNode][]).map(([mode, icon]) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode as any)}
                    className={cn(
                      'p-1.5 rounded-lg transition-all',
                      viewMode === mode ? 'bg-white/20 text-white' : 'text-white/30 hover:text-white'
                    )}
                    title={mode}
                  >
                    {icon}
                  </button>
              ))}
            </div>

            {/* Satellite */}
            <button
              onClick={() => setIsSatellite(v => !v)}
              className={cn('p-2 rounded-xl border transition-all text-xs font-bold',
                isSatellite ? 'bg-violet-600 border-violet-500/40 text-white' : 'bg-white/5 border-white/10 text-white/40 hover:text-white')}
              title="Satellite view"
            >
              <Radio className="w-3.5 h-3.5" />
            </button>

            {/* Refresh */}
            <button
              onClick={() => {
                if (!userLocation) return;
                if (sourceMode === 'system') fetchStopsSystem(userLocation, radius, cityTypeFilter);
                else fetchStops(userLocation, radius);
              }}
              disabled={loading || !userLocation}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 rounded-xl text-xs font-black transition-all border border-emerald-500/30"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* ── Location Error ── */}
      <AnimatePresence>
        {locationError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="flex-shrink-0 mx-4 mt-3 flex items-center gap-3 px-4 py-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-sm font-semibold"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            {locationError}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Content ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Map panel */}
        <AnimatePresence>
          {(viewMode === 'split' || viewMode === 'map') && (
            <motion.div
              key="map-panel"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className={cn('relative', viewMode === 'split' ? 'flex-1' : 'w-full')}
            >
              {isLoaded ? (
                <GoogleMap
                  mapContainerStyle={{ width: '100%', height: '100%' }}
                  center={userLocation || defaultCenter}
                  zoom={userLocation ? 15 : 5}
                  options={mapOptions}
                  onLoad={onMapLoad}
                  onClick={() => { setActiveStop(null); setHighlightedStop(null); }}
                >
                  {/* Radius circle */}
                  {userLocation && (
                    <Circle
                      center={userLocation}
                      radius={radius}
                      options={{
                        fillColor: '#10b981', fillOpacity: 0.04,
                        strokeColor: '#10b981', strokeOpacity: 0.3,
                        strokeWeight: 1.5, clickable: false,
                      }}
                    />
                  )}

                  {/* User pulse */}
                  {userLocation && (
                    <>
                      <Circle center={userLocation} radius={25 * pulseSize}
                        options={{ fillColor: '#3b82f6', fillOpacity: 0.12, strokeColor: '#3b82f6', strokeOpacity: 0.6, strokeWeight: 1, clickable: false }} />
                      <Marker position={userLocation} zIndex={200}
                        icon={{ path: 0, scale: 11, fillColor: '#3b82f6', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 3 }} />
                    </>
                  )}

                  {/* Bus stop markers — colored by type */}
                  {filteredStops.map((stop) => {
                    const ts = getTypeStyle(stop.stopType);
                    const isHL = highlightedStop === stop.id;
                    return (
                      <Marker
                        key={stop.id}
                        position={{ lat: stop.lat, lng: stop.lng }}
                        title={`[${stop.stopTypeLabel}] ${stop.name}`}
                        zIndex={isHL ? 150 : stop.stopType * 10}
                        onClick={() => focusStop(stop)}
                        icon={{
                          path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
                          fillColor: isHL ? '#ffffff' : ts.marker,
                          fillOpacity: 1,
                          strokeColor: isHL ? ts.marker : '#ffffff',
                          strokeWeight: isHL ? 3 : 1.8,
                          scale: isHL ? 2.6 : stop.stopType === 3 ? 2.2 : stop.stopType === 2 ? 2.0 : 1.7,
                          anchor: { x: 12, y: 22 } as any,
                        }}
                      />
                    );
                  })}

                  {/* InfoWindow for clicked stop */}
                  {activeStop && (
                    <InfoWindow
                      position={{ lat: activeStop.lat, lng: activeStop.lng }}
                      onCloseClick={() => { setActiveStop(null); setHighlightedStop(null); }}
                    >
                      <div className="p-2 min-w-[200px] text-slate-900">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={cn('w-2 h-2 rounded-full',
                            activeStop.stopType === 3 ? 'bg-violet-500' : activeStop.stopType === 2 ? 'bg-amber-500' : 'bg-emerald-500')} />
                          <p className={cn('text-[9px] font-black uppercase tracking-wider',
                            activeStop.stopType === 3 ? 'text-violet-600' : activeStop.stopType === 2 ? 'text-amber-600' : 'text-emerald-600')}>
                            {activeStop.stopTypeLabel}
                          </p>
                        </div>
                        <p className="font-black text-base leading-tight mb-2">{activeStop.name}</p>
                        <div className="space-y-1 text-xs text-slate-500">
                          <p className="font-bold text-slate-400">{formatDist(activeStop.distance)} from you</p>
                          {activeStop.ref && <p>Ref: {activeStop.ref}</p>}
                          {activeStop.network && <p>Network: {activeStop.network}</p>}
                          {activeStop.routes && <p>Routes: {activeStop.routes}</p>}
                          {activeStop.operator && <p>Operator: {activeStop.operator}</p>}
                          {activeStop.shelter && <p>Shelter: {activeStop.shelter}</p>}
                        </div>
                        <div className="mt-3 flex gap-2">
                          <a href={`https://www.google.com/maps/dir/?api=1&destination=${activeStop.lat},${activeStop.lng}`}
                            target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg">
                            <Navigation2 className="w-3 h-3" /> Directions
                          </a>
                          <a href={`https://www.google.com/maps/search/?api=1&query=${activeStop.lat},${activeStop.lng}`}
                            target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2.5 py-1.5 rounded-lg">
                            <ExternalLink className="w-3 h-3" /> Maps
                          </a>
                        </div>
                      </div>
                    </InfoWindow>
                  )}
                </GoogleMap>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <Compass className="w-12 h-12 text-violet-500 animate-spin" />
                  <p className="text-white/50 text-xs font-bold uppercase tracking-widest">Loading Maps…</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* List panel */}
        <AnimatePresence>
          {(viewMode === 'split' || viewMode === 'list') && (
            <motion.div
              key="list-panel"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              className={cn(
                'flex flex-col bg-[#1d1f2e]/80 border-l border-white/6 overflow-hidden',
                viewMode === 'split' ? 'w-[360px] flex-shrink-0' : 'w-full'
              )}
            >
              {/* List header */}
              <div className="flex-shrink-0 px-5 py-3 border-b border-white/6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SortAsc className="w-4 h-4 text-white/40" />
                  <span className="text-xs font-black uppercase tracking-wider text-white/40">Sorted by Distance</span>
                </div>
                {loading && (
                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold">
                    <div className="w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                    Searching…
                  </div>
                )}
              </div>

              {/* Stop list */}
              <div ref={listRef} className="flex-1 overflow-y-auto">
                {loading && stops.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full gap-4 text-white/30">
                    <Bus className="w-10 h-10 animate-pulse" />
                    <p className="text-sm font-bold">Searching Google Maps…</p>
                    <div className="flex flex-col items-center gap-1">
                      <p className="text-[10px] text-white/20">📍 Local Transit Database</p>
                      <p className="text-[10px] text-white/20">🔍 Google Places API</p>
                      <p className="text-[10px] text-white/20">🏢 Bus Stations & Terminals</p>
                    </div>
                  </div>
                )}

                {!loading && !userLocation && (
                  <div className="flex flex-col items-center justify-center h-full gap-4 text-white/30 px-6 text-center">
                    <Navigation className="w-10 h-10" />
                    <div>
                      <p className="text-sm font-bold text-white/50 mb-1">Enable Location</p>
                      <p className="text-xs">Allow location access so we can find bus stops near you.</p>
                    </div>
                  </div>
                )}

                {!loading && userLocation && stops.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full gap-4 text-white/30 px-6 text-center">
                    <AlertCircle className="w-10 h-10" />
                    <div>
                      <p className="text-sm font-bold text-white/50 mb-1">No stops found</p>
                      <p className="text-xs">Try increasing the search radius above.</p>
                    </div>
                  </div>
                )}

                {filteredStops.length > 0 && (
                  <div className="divide-y divide-white/4">
                    {filteredStops.map((stop, idx) => {
                      const dist = getDistColor(stop.distance);
                      const ts = getTypeStyle(stop.stopType);
                      const isActive = activeStop?.id === stop.id;
                      return (
                        <motion.div
                          key={stop.id}
                          id={`stop-${stop.id}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: Math.min(idx * 0.025, 0.5) }}
                          onClick={() => focusStop(stop)}
                          className={cn(
                            'group flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-all hover:bg-white/4',
                            isActive && `bg-white/5 border-l-2`,
                            isActive && stop.stopType === 3 ? 'border-violet-500' : isActive && stop.stopType === 2 ? 'border-amber-500' : isActive ? 'border-emerald-500' : ''
                          )}
                        >
                          {/* Type color bar + index */}
                          <div className="flex-shrink-0 flex flex-col items-center gap-1">
                            <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black', isActive ? ts.bg : 'bg-white/8', isActive ? ts.color : 'text-white/50')}>
                              {idx + 1}
                            </div>
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className={cn('text-sm font-bold leading-snug truncate', isActive ? ts.color : 'text-white/80 group-hover:text-white')}>
                              {stop.name}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              {/* Type badge */}
                              <span className={cn('text-[9px] font-black px-1.5 py-0.5 rounded-md border', ts.bg, ts.color, ts.border)}>
                                {stop.stopTypeLabel}
                              </span>
                              {/* City type badge */}
                              {stop.cityType && (
                                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md border bg-blue-500/10 text-blue-300 border-blue-500/20">
                                  City {stop.cityType}
                                </span>
                              )}
                              {/* Distance */}
                              <span className={cn('text-[9px] font-black px-1.5 py-0.5 rounded-md border', dist.bg, dist.text, dist.border)}>
                                {formatDist(stop.distance)}
                              </span>
                              {stop.routes && (
                                <span className="text-[9px] text-violet-400 font-bold flex items-center gap-0.5">
                                  <Wifi className="w-2.5 h-2.5" /> {stop.routes}
                                </span>
                              )}
                            </div>
                            {/* Sub-info */}
                            {stop.network && <p className="text-[10px] text-white/25 mt-0.5 truncate">{stop.network}</p>}
                            {/* Amenities */}
                            {(stop.shelter || stop.bench || stop.lit) && (
                              <div className="flex items-center gap-1.5 mt-1">
                                {stop.shelter === 'yes' && <span className="text-[9px] bg-sky-500/10 text-sky-400 px-1.5 py-0.5 rounded-md font-bold border border-sky-500/20">Shelter</span>}
                                {stop.bench === 'yes' && <span className="text-[9px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded-md font-bold border border-amber-500/20">Bench</span>}
                                {stop.lit === 'yes' && <span className="text-[9px] bg-yellow-500/10 text-yellow-400 px-1.5 py-0.5 rounded-md font-bold border border-yellow-500/20">Lit</span>}
                              </div>
                            )}
                          </div>

                          {/* Directions */}
                          <div className="flex-shrink-0 flex flex-col items-end gap-1.5 mt-0.5">
                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${stop.lat},${stop.lng}`}
                              target="_blank" rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              className={cn('flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg border transition-all', ts.bg, ts.color, ts.border, 'hover:opacity-80')}
                            >
                              <Navigation2 className="w-3 h-3" /> Go
                            </a>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
                {!loading && userLocation && filteredStops.length === 0 && stops.length > 0 && (
                  <div className="flex flex-col items-center justify-center h-32 gap-2 text-white/30 text-center px-4">
                    <p className="text-sm font-bold text-white/40">No stops for this filter</p>
                    <p className="text-xs">Try selecting "All" or a different type.</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              {stops.length > 0 && (
                <div className="flex-shrink-0 px-4 py-2.5 border-t border-white/6 bg-[#1a1c24]/50 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="text-[9px] text-white/30 font-bold">T1 Stops</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-amber-400" />
                      <span className="text-[9px] text-white/30 font-bold">T2 Platform</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-violet-400" />
                      <span className="text-[9px] text-white/30 font-bold">T3 Station</span>
                    </div>
                  </div>
                  <p className="text-[9px] text-white/20 whitespace-nowrap">
                    {filteredStops.length} shown · 
                    <span className={cn(dataSource === 'Google' ? 'text-blue-400' : 'text-emerald-400', 'font-black ml-1')}>
                      {dataSource === 'Google' ? 'Google Maps' : 'OpenStreetMap'}
                    </span>
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
