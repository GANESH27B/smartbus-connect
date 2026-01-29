
'use client';

import { useState, useEffect } from 'react';
import LiveMap from '@/components/LiveMap';
import { routes, buses } from '@/lib/data';
import { Stop } from '@/lib/types';
import { Loader2, MapPin, Compass, Navigation2, Info, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useGoogleMaps } from '@/context/GoogleMapsContext';

export default function NearbyStopsPage() {
  const [userLocation, setUserLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [displayedStops, setDisplayedStops] = useState<Stop[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("Initializing GPS...");
  const [activeStop, setActiveStop] = useState<Stop | null>(null);
  const { isLoaded } = useGoogleMaps();

  useEffect(() => {
    const allStops = routes.flatMap(route => route.stops);
    let watchId: number;

    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        position => {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;
          const location = { lat: userLat, lng: userLng };
          setUserLocation(location);

          // Filter stops within 10km (increased range for better fallback)
          const nearby = allStops.filter(stop => {
            const R = 6371;
            const dLat = deg2rad(stop.lat - userLat);
            const dLng = deg2rad(stop.lng - userLng);
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(deg2rad(userLat)) * Math.cos(deg2rad(stop.lat)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const d = R * c;
            return d <= 10;
          });

          setDisplayedStops(prevStops => {
            if (nearby.length > 0) {
              setStatusMessage(`Located ${nearby.length} Premium Stops`);
              return nearby;
            } else {
              setStatusMessage(`Showing All Available Global Stops`);
              return allStops;
            }
          });
          setLoading(false);
        },
        () => {
          setStatusMessage("GPS Restricted. Showing Global Stops.");
          setDisplayedStops(allStops);
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setStatusMessage("GPS Unavailable. Showing Defaults.");
      setDisplayedStops(allStops);
      setLoading(false);
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  function deg2rad(deg: number) {
    return deg * (Math.PI / 180);
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] text-muted-foreground bg-deep relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 blur-[120px] rounded-full animate-blob" />
        </div>
        <motion.div
          animate={{ rotate: 360, scale: [1, 1.1, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="bg-white/5 p-8 rounded-[2.5rem] mb-8 border border-white/10 relative z-10 backdrop-blur-3xl"
        >
          <Compass className="h-12 w-12 text-primary" />
        </motion.div>
        <div className="text-center space-y-2 relative z-10">
          <h2 className="text-2xl font-black font-headline text-white italic tracking-tighter">Scanning Horizon...</h2>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-white/40 animate-pulse">{statusMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] w-full relative flex overflow-hidden">
      {/* Map View */}
      <div className="flex-1 relative">
        {/* Floating Top Header for Mobile/Global view */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-6 left-1/2 -translate-x-1/2 z-10 glass-deep px-8 py-4 rounded-[2rem] border-white/20 shadow-2xl flex items-center gap-4 min-w-[280px] justify-center"
        >
          <div className="bg-primary p-2 rounded-xl shadow-lg shadow-primary/30">
            <MapPin className="h-4 w-4 text-white" />
          </div>
          <div className="text-center whitespace-nowrap">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-0.5">Coverage Mode</p>
            <span className="text-sm font-black font-headline tracking-tight text-white italic">
              {userLocation ? 'PROXIMITY RADAR ACTIVE' : 'GLOBAL NETWORK VIEW'}
            </span>
          </div>
        </motion.div>

        {/* Refocus Action */}
        <div className="absolute top-24 right-6 z-10 flex flex-col gap-2">
          <Button
            onClick={() => {
              if (displayedStops.length > 0) {
                setActiveStop(displayedStops[0]);
              }
            }}
            className="glass-deep hover:bg-white/10 text-white rounded-2xl h-12 w-12 p-0 shadow-2xl border-white/20"
            title="Focus on Stops"
          >
            <Compass className="h-5 w-5" />
          </Button>
          {userLocation && (
            <Button
              onClick={() => {
                setActiveStop(null);
              }}
              className="glass-deep hover:bg-white/10 text-white rounded-2xl h-12 w-12 p-0 shadow-2xl border-white/20"
              title="Find Me"
            >
              <Navigation2 className="h-5 w-5 text-primary" />
            </Button>
          )}
        </div>

        <LiveMap
          buses={buses}
          stops={displayedStops}
          userLocation={userLocation}
          center={activeStop ? { lat: activeStop.lat, lng: activeStop.lng } : (displayedStops.length > 0 && (statusMessage.includes('Global') || !userLocation) ? { lat: displayedStops[0].lat, lng: displayedStops[0].lng } : userLocation)}
          zoom={activeStop ? 16 : (statusMessage.includes('Global') ? 12 : 14)}
        />
      </div>
    </div>
  );
}
