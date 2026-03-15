
'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Map as MapIcon, Search, Mic, MicOff, Navigation, Layers, Info, MapPin } from 'lucide-react';
import { Autocomplete } from '@react-google-maps/api';
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import LiveMap from '@/components/LiveMap';
import { Stop } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { useGoogleMaps } from '@/context/GoogleMapsContext';

export default function MapSearchPage() {
  const [query, setQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [hasSpeechSupport, setHasSpeechSupport] = useState(false);
  const [allStops, setAllStops] = useState<Stop[]>([]);
  const [allBuses, setAllBuses] = useState<any[]>([]);
  const [allRoutes, setAllRoutes] = useState<any[]>([]);
  const [filteredStops, setFilteredStops] = useState<Stop[]>([]);
  const [mapCenter, setMapCenter] = useState<google.maps.LatLngLiteral | null>(null);
  const [userLocation, setUserLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [isSatellite, setIsSatellite] = useState(false);
  const [activeSearchMarker, setActiveSearchMarker] = useState<google.maps.LatLngLiteral | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const { isLoaded } = useGoogleMaps();

  const handlePlaceChanged = () => {
    const place = autocompleteRef.current?.getPlace();
    if (place?.geometry?.location) {
      const location = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng()
      };
      setMapCenter(location);
      setActiveSearchMarker(location);
      setQuery(place.formatted_address || place.name || '');
    }
  };

  useEffect(() => {
    let watchId: number;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        null,
        { enableHighAccuracy: true }
      );
    }

    const fetchData = async () => {
      try {
        const [stopsRes, busesRes, routesRes] = await Promise.all([
          fetch('/api/stops'),
          fetch('/api/buses'),
          fetch('/api/routes')
        ]);
        const [stopsData, busesData, routesData] = await Promise.all([
          stopsRes.json(),
          busesRes.json(),
          routesRes.json()
        ]);

        if (stopsData.success && stopsData.data) {
          const fetchedStops = stopsData.data.map((stop: any) => ({
            id: stop._id?.toString() || stop.id,
            name: stop.name,
            lat: stop.lat,
            lng: stop.lng,
            cityType: stop.cityType || 1
          }));
          setAllStops(fetchedStops);
        }

        if (busesData.success && busesData.data) {
          setAllBuses(busesData.data.map((bus: any) => ({
            id: bus._id?.toString() || bus.id,
            number: bus.number,
            routeId: bus.routeId || '',
            lat: bus.lat,
            lng: bus.lng,
            status: bus.status || 'active',
            driver: bus.driver || 'Unknown',
            lastUpdated: bus.lastUpdated
          })));
        }
        if (routesData.success && routesData.data) {
          setAllRoutes(routesData.data);
        }
      } catch (e) {
        console.error("Failed to fetch search data", e);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setHasSpeechSupport(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = 'en-US';
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        searchRealStops(transcript);
      };
      recognition.onend = () => setIsListening(false);
      (window as any)._recognition = recognition;
    }
  }, []);

  const searchRealStops = (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setFilteredStops([]);
      return;
    }

    // Search within our system stops to avoid "fake" results
    const filtered = allStops.filter(stop => 
      stop.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    setFilteredStops(filtered);
    
    if (filtered.length > 0) {
      setMapCenter({ lat: filtered[0].lat, lng: filtered[0].lng });
    }
  };

  const handleMicClick = () => {
    const recognition = (window as any)._recognition;
    if (!recognition) return;
    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] w-full relative overflow-hidden bg-background">
      {/* Floating Modern Search Bar */}
      <div className="absolute top-6 left-6 z-20 w-[calc(100%-3rem)] md:w-[400px]">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative group h-full"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-primary to-violet-600 rounded-[2.5rem] blur opacity-25 group-focus-within:opacity-100 transition duration-1000 group-focus-within:duration-200"></div>
          <div className="relative glass-deep rounded-[2.5rem] border-white/20 p-2 flex items-center shadow-2xl">
            <div className="bg-primary/20 p-2.5 rounded-2xl ml-1">
              <Search className="h-5 w-5 text-primary" />
            </div>
            {isLoaded ? (
              <Autocomplete
                onLoad={(autocomplete) => (autocompleteRef.current = autocomplete)}
                onPlaceChanged={handlePlaceChanged}
                className="flex-1"
              >
                <Input
                  placeholder="Search any place or stop..."
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); searchRealStops(e.target.value); }}
                  className="bg-transparent border-none text-white placeholder:text-white/40 h-12 rounded-2xl pl-3 pr-12 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm font-bold"
                />
              </Autocomplete>
            ) : (
              <Input
                placeholder="Loading maps..."
                disabled
                className="bg-transparent border-none text-white/30 h-12 rounded-2xl pl-3 flex-1"
              />
            )}

            {hasSpeechSupport && (
              <Button
                size="icon"
                variant="ghost"
                onClick={handleMicClick}
                className={cn(
                  "h-10 w-10 text-white/40 hover:text-white transition-colors mr-1 rounded-2xl",
                  isListening && "bg-rose-500/20 text-rose-500 border border-rose-500/30 animate-pulse"
                )}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </motion.div>

        {/* Floating Search Results (Mini) */}
        <AnimatePresence>
          {query.trim() !== "" && filteredStops.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mt-3 glass-deep rounded-[2rem] border-white/20 p-3 shadow-2xl max-h-[400px] overflow-y-auto custom-scrollbar"
            >
              <div className="px-3 py-2 border-b border-white/10 mb-2">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Suggested Stops</p>
              </div>
              <div className="space-y-1">
                {filteredStops.slice(0, 5).map((stop) => (
                  <button
                    key={stop.id}
                    onClick={() => {
                      setMapCenter({ lat: stop.lat, lng: stop.lng });
                      setQuery(stop.name);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-4 rounded-2xl hover:bg-white/10 transition-colors group text-left"
                  >
                    <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <MapPin className="h-4 w-4 text-white/40 group-hover:text-primary transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{stop.name}</p>
                      <p className="text-[10px] text-white/30 uppercase tracking-widest leading-none mt-1">Stop ID: {stop.id}</p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Full Screen Map View */}
      <div className="h-full w-full">
        <div className="absolute top-6 right-6 z-10 flex flex-col gap-3">
          <Button
            onClick={() => setIsSatellite(!isSatellite)}
            className={cn(
              "glass-deep text-white rounded-2xl h-14 w-14 p-0 shadow-2xl border-white/20 transition-all hover:scale-110",
              isSatellite ? "bg-primary border-primary shadow-primary/40" : "bg-white/5 hover:bg-white/10"
            )}
            title={isSatellite ? "Switch to Roadmap" : "Switch to Satellite"}
          >
            <Layers className={cn("h-6 w-6", isSatellite && "text-white")} />
          </Button>

          {userLocation && (
            <Button
              onClick={() => {
                setMapCenter(userLocation);
              }}
              className="glass-deep hover:bg-white/10 text-white rounded-2xl h-12 w-12 p-0 shadow-2xl border-white/20 bg-vibrant-gradient border-primary/30"
              title="Return to My Location"
            >
              <Navigation className="h-5 w-5 text-white" />
            </Button>
          )}
        </div>

        <LiveMap
          buses={allBuses}
          stops={filteredStops}
          allRoutes={allRoutes}
          center={mapCenter}
          userLocation={userLocation}
          zoom={14}
          isSatellite={isSatellite}
        />

        {/* Map Overlay info */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 glass-deep px-8 py-4 rounded-[2rem] border-white/20 flex items-center gap-6 shadow-2xl">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.6)]" />
            <span className="text-xs font-black uppercase tracking-widest leading-none text-white/80">Bus Stops</span>
          </div>
          <div className="w-px h-4 bg-white/20" />
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.6)]" />
            <span className="text-xs font-black uppercase tracking-widest leading-none text-white/80">Active Buses</span>
          </div>
        </div>
      </div>
    </div>
  );
}