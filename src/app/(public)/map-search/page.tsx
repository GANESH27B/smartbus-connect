
'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Map as MapIcon, Search, Mic, MicOff, Navigation, Layers, Info, MapPin } from 'lucide-react';
import { Autocomplete } from '@react-google-maps/api';
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import LiveMap from '@/components/LiveMap';
import { routes, buses } from '@/lib/data';
import { Stop } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { useGoogleMaps } from '@/context/GoogleMapsContext';

export default function MapSearchPage() {
  const [query, setQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [hasSpeechSupport, setHasSpeechSupport] = useState(false);
  const [allStops, setAllStops] = useState<Stop[]>([]);
  const [filteredStops, setFilteredStops] = useState<Stop[]>([]);
  const [mapCenter, setMapCenter] = useState<google.maps.LatLngLiteral | null>(null);
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
    const stops = routes.flatMap(route => route.stops);
    setAllStops(stops);
    setFilteredStops(stops);

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setHasSpeechSupport(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = 'en-US';
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        filterStops(transcript);
      };
      recognition.onend = () => setIsListening(false);
      (window as any)._recognition = recognition;
    }
  }, []);

  const filterStops = (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setFilteredStops(allStops);
      return;
    }
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
    <div className="h-[calc(100vh-4rem)] w-full flex flex-col md:flex-row overflow-hidden bg-background">
      {/* Search Sidebar */}
      <div className="w-full md:w-[400px] h-full bg-deep border-r border-white/10 flex flex-col z-20 shadow-2xl">
        <div className="p-8 space-y-8">
          <div className="flex items-center gap-3">
            <div className="bg-vibrant-accent p-2.5 rounded-2xl shadow-lg shadow-orange-500/20">
              <MapIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black font-headline tracking-tighter italic text-white leading-none">Global Map</h1>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mt-1">Satellite Navigation</p>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 to-cyan-500 rounded-2xl blur opacity-25 group-focus-within:opacity-100 transition duration-1000 group-focus-within:duration-200"></div>
            <div className="relative">
              {isLoaded ? (
                <Autocomplete
                  onLoad={(autocomplete) => (autocompleteRef.current = autocomplete)}
                  onPlaceChanged={handlePlaceChanged}
                >
                  <Input
                    placeholder="Search any place or stop..."
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); filterStops(e.target.value); }}
                    className="bg-black/40 border-white/10 text-white placeholder:text-white/30 h-14 rounded-2xl pl-12 pr-12 focus-visible:ring-primary/50"
                  />
                </Autocomplete>
              ) : (
                <Input
                  placeholder="Loading search engine..."
                  disabled
                  className="bg-black/40 border-white/10 text-white/30 h-14 rounded-2xl pl-12"
                />
              )}
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
              {hasSpeechSupport && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleMicClick}
                  className={cn("absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 text-white/40 hover:text-white transition-colors", isListening && "text-rose-500")}
                >
                  {isListening ? <MicOff className="h-5 w-5 animate-pulse" /> : <Mic className="h-5 w-5" />}
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-8 space-y-4 custom-scrollbar">
          <div className="flex items-center justify-between px-2">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Found {filteredStops.length} Stops</span>
            <Layers className="h-3.5 w-3.5 text-white/30" />
          </div>

          <div className="space-y-3">
            {filteredStops.map((stop, idx) => (
              <motion.button
                key={stop.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => setMapCenter({ lat: stop.lat, lng: stop.lng })}
                className="w-full p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all text-left group"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white/5 rounded-xl group-hover:bg-primary/20 transition-colors">
                    <Navigation className="h-4 w-4 text-white/60 group-hover:text-primary transition-colors" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm group-hover:text-primary transition-colors leading-tight">{stop.name}</h3>
                    <p className="text-[10px] text-white/40 mt-1 uppercase tracking-wider">Stop ID: {stop.id}</p>
                  </div>
                </div>
              </motion.button>
            ))}

            {filteredStops.length === 0 && (
              <div className="text-center py-20">
                <Info className="h-10 w-10 text-white/10 mx-auto mb-4" />
                <p className="text-sm font-bold text-white/20">No matching bus stops found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Map View */}
      <div className="flex-1 relative">
        <LiveMap
          buses={buses}
          stops={filteredStops}
          center={mapCenter}
          zoom={13}
        />

        {/* Map Overlay info */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 glass-deep px-8 py-4 rounded-[2rem] border-white/20 flex items-center gap-6 shadow-2xl">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.6)]" />
            <span className="text-xs font-black uppercase tracking-widest leading-none">Bus Stops</span>
          </div>
          <div className="w-px h-4 bg-white/20" />
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.6)]" />
            <span className="text-xs font-black uppercase tracking-widest leading-none">Active Buses</span>
          </div>
        </div>
      </div>
    </div>
  );
}