
'use client';

import { useState, useEffect, useCallback } from 'react';
import LiveMap from '@/components/LiveMap';
import { routes, buses } from '@/lib/data';
import { Stop } from '@/lib/types';
import { Loader2, MapPin, Compass, Navigation2, Info, ChevronRight, BusIcon, Search, Map as MapIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useGoogleMaps } from '@/context/GoogleMapsContext';

export default function NearbyStopsPage() {
  const [userLocation, setUserLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [displayedStops, setDisplayedStops] = useState<Stop[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Initializing GPS...");
  const [activeStop, setActiveStop] = useState<Stop | null>(null);
  const [isSatellite, setIsSatellite] = useState(false);
  const { isLoaded } = useGoogleMaps();

  // Helper to calculate distance in km
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLng = deg2rad(lng2 - lng1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  function deg2rad(deg: number) {
    return deg * (Math.PI / 180);
  }

  const fetchRealNearbyStops = useCallback((location: google.maps.LatLngLiteral) => {
    if (!isLoaded || !window.google) return;

    setSearching(true);
    const service = new google.maps.places.PlacesService(document.createElement('div'));

    const request: google.maps.places.PlaceSearchRequest = {
      location: new google.maps.LatLng(location.lat, location.lng),
      radius: 3000, // 3km radius
      type: 'bus_station'
    };

    service.nearbySearch(request, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        const realStops: Stop[] = results.map(place => ({
          id: place.place_id || Math.random().toString(),
          name: place.name || 'Unnamed Stop',
          lat: place.geometry?.location?.lat() || 0,
          lng: place.geometry?.location?.lng() || 0,
          cityType: 1
        }));

        // Sort by distance
        realStops.sort((a, b) =>
          calculateDistance(location.lat, location.lng, a.lat, a.lng) -
          calculateDistance(location.lat, location.lng, b.lat, b.lng)
        );

        setDisplayedStops(realStops);
        setStatusMessage(`Found ${realStops.length} Real-World Stops`);
      } else {
        setDisplayedStops([]);
        setStatusMessage("No Real-World Stops Found Nearby");
      }
      setSearching(false);
      setLoading(false);
    });
  }, [isLoaded]);

  useEffect(() => {
    let watchId: number;

    if (navigator.geolocation) {
      // First get current position quickly
      navigator.geolocation.getCurrentPosition(
        position => {
          const location = { lat: position.coords.latitude, lng: position.coords.longitude };
          setUserLocation(location);
          if (isLoaded) fetchRealNearbyStops(location);
        },
        () => {
          setStatusMessage("GPS Restricted. Unable to find real stops.");
          setDisplayedStops([]);
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );

      // Then watch for changes
      watchId = navigator.geolocation.watchPosition(
        position => {
          const newLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
          setUserLocation(newLocation);
        },
        null,
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setStatusMessage("GPS Unavailable.");
      setDisplayedStops([]);
      setLoading(false);
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [isLoaded, fetchRealNearbyStops]);

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
          <h2 className="text-2xl font-black font-headline text-white italic tracking-tighter">Locating Your Position...</h2>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-white/40 animate-pulse">{statusMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] w-full relative flex overflow-hidden bg-deep">
      {/* Sidebar List */}
      <div className="w-96 hidden lg:flex flex-col border-r border-white/10 relative z-20">
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-black font-headline text-white italic tracking-tight">Nearby Stops</h1>
            {searching && <Loader2 className="h-4 w-4 text-primary animate-spin" />}
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">{statusMessage}</p>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-6 custom-scrollbar">
          <div className="space-y-3">
            {displayedStops.map((stop) => {
              const distance = userLocation ? calculateDistance(userLocation.lat, userLocation.lng, stop.lat, stop.lng) : null;
              const isActive = activeStop?.id === stop.id;

              return (
                <motion.div
                  key={stop.id}
                  layout
                  onClick={() => setActiveStop(stop)}
                  className={cn(
                    "p-4 rounded-3xl border cursor-pointer transition-all duration-300 group relative overflow-hidden",
                    isActive
                      ? "bg-primary border-primary shadow-lg shadow-primary/20"
                      : "bg-white/5 border-white/10 hover:bg-white/10"
                  )}
                >
                  <div className="flex items-start gap-4 relative z-10">
                    <div className={cn(
                      "p-3 rounded-2xl transition-colors",
                      isActive ? "bg-white/20" : "bg-primary/10 group-hover:bg-primary/20"
                    )}>
                      <BusIcon className={cn("h-5 w-5", isActive ? "text-white" : "text-primary")} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={cn("font-bold truncate", isActive ? "text-white" : "text-white/90")}>
                        {stop.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <MapPin className={cn("h-3 w-3", isActive ? "text-white/60" : "text-white/30")} />
                        <span className={cn("text-[10px] font-black uppercase tracking-widest", isActive ? "text-white/60" : "text-white/30")}>
                          {distance ? `${distance.toFixed(2)} km away` : 'Distance unknown'}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className={cn("h-4 w-4 mt-2 transition-transform", isActive ? "text-white rotate-90" : "text-white/20 group-hover:translate-x-1")} />
                  </div>

                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-2 relative z-10"
                    >
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Show alert for schedule in this demo
                          alert(`Upcoming Schedule for ${stop.name}:\n10:30 AM - KLU Express\n11:15 AM - Local Loop\n12:00 PM - Srivilliputhur Fast`);
                        }}
                        variant="secondary"
                        size="sm"
                        className="bg-white/20 hover:bg-white/30 text-white border-none rounded-xl text-[10px] font-black uppercase"
                      >
                        View Schedule
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`https://www.google.com/maps/dir/?api=1&destination=${stop.lat},${stop.lng}`, '_blank');
                        }}
                        variant="secondary"
                        size="sm"
                        className="bg-white/20 hover:bg-white/30 text-white border-none rounded-xl text-[10px] font-black uppercase"
                      >
                        Get Directions
                      </Button>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Map View */}
      <div className="flex-1 relative">
        {/* Floating Header for Mobile */}
        <div className="lg:hidden absolute top-6 left-1/2 -translate-x-1/2 z-10 w-[90%] max-w-sm">
          <div className="glass-deep px-6 py-4 rounded-[2rem] border-white/20 shadow-2xl flex items-center gap-4">
            <div className="bg-primary p-2 rounded-xl">
              <MapPin className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Current Radar</p>
              <h2 className="text-sm font-black font-headline tracking-tight text-white italic truncate">
                {statusMessage}
              </h2>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="absolute top-24 lg:top-6 right-6 z-10 flex flex-col gap-3">
          <Button
            onClick={() => setIsSatellite(!isSatellite)}
            className={cn(
              "glass-deep text-white rounded-2xl h-14 w-14 p-0 shadow-2xl border-white/20 transition-all hover:scale-110",
              isSatellite ? "bg-primary border-primary shadow-primary/40" : "bg-white/5 hover:bg-white/10"
            )}
            title={isSatellite ? "Switch to Roadmap" : "Switch to Satellite"}
          >
            <MapIcon className={cn("h-6 w-6", isSatellite && "text-white")} />
          </Button>

          <Button
            onClick={() => {
              if (userLocation) {
                fetchRealNearbyStops(userLocation);
              }
            }}
            disabled={searching}
            className="glass-deep hover:bg-white/10 text-white rounded-2xl h-12 w-12 p-0 shadow-2xl border-white/20"
            title="Refresh Scan"
          >
            <Search className={cn("h-5 w-5", searching && "animate-spin")} />
          </Button>

          {userLocation && (
            <Button
              onClick={() => {
                setActiveStop(null);
              }}
              className="glass-deep hover:bg-white/10 text-white rounded-2xl h-12 w-12 p-0 shadow-2xl border-white/20 bg-vibrant-gradient border-primary/30"
              title="Return to My Location"
            >
              <Navigation2 className="h-5 w-5 text-white" />
            </Button>
          )}
        </div>

        <LiveMap
          buses={buses}
          stops={displayedStops}
          userLocation={userLocation}
          center={activeStop ? { lat: activeStop.lat, lng: activeStop.lng } : userLocation}
          zoom={activeStop ? 16 : 14}
          isSatellite={isSatellite}
        />
      </div>
    </div>
  );
}
