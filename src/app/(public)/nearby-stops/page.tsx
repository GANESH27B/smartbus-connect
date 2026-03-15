
'use client';

import { useState, useEffect, useCallback } from 'react';
import LiveMap from '@/components/LiveMap';
import { Stop } from '@/lib/types';
import { Loader2, MapPin, Compass, Navigation2, Info, ChevronRight, BusIcon, Search, Map as MapIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useGoogleMaps } from '@/context/GoogleMapsContext';

export default function NearbyStopsPage() {
  const [userLocation, setUserLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [allSystemStops, setAllSystemStops] = useState<Stop[]>([]);
  const [displayedStops, setDisplayedStops] = useState<Stop[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Initializing GPS...");
  const [activeStop, setActiveStop] = useState<Stop | null>(null);
  const [isSatellite, setIsSatellite] = useState(false);
  const [activeBuses, setActiveBuses] = useState<any[]>([]);
  const [showAllInSidebar, setShowAllInSidebar] = useState(false);
  const [allRoutes, setAllRoutes] = useState<any[]>([]);
  const { isLoaded } = useGoogleMaps();

  const fetchRealBuses = useCallback(async () => {
    try {
      const response = await fetch('/api/buses');
      const result = await response.json();
      if (result.success && result.data) {
        setActiveBuses(result.data.map((bus: any) => ({
          id: bus._id?.toString() || bus.id,
          number: bus.number,
          routeId: bus.routeId || '',
          lat: bus.lat,
          lng: bus.lng,
          status: bus.status || 'active',
          driver: bus.driver || 'Unknown',
          lastUpdated: bus.lastUpdated || new Date().toISOString()
        })));
      }
    } catch (e) {
      console.error("Failed to fetch real buses:", e);
      // No longer falling back to fake 'buses' data
      setActiveBuses([]); 
    }
  }, []);

  useEffect(() => {
    fetchRealBuses();
    const interval = setInterval(fetchRealBuses, 10000); // Update buses every 10 seconds
    return () => clearInterval(interval);
  }, [fetchRealBuses]);

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

  const fetchRealNearbyStops = useCallback(async (location: google.maps.LatLngLiteral) => {
    if (!isLoaded) return;

    setSearching(true);
    setStatusMessage("Fetching real-time data...");

    try {
      // 1. Fetch System Stops (Our DB)
      const systemResponse = await fetch('/api/stops');
      const systemResult = await systemResponse.json();
      
      let realSystemStops: Stop[] = [];
      if (systemResult.success && systemResult.data) {
        realSystemStops = systemResult.data.map((stop: any) => ({
          id: stop._id?.toString() || stop.id,
          name: stop.name,
          lat: stop.lat,
          lng: stop.lng,
          cityType: stop.cityType || 1,
          isSystem: true
        }));
      }

      // 2. Fetch Google Verified Stops
      const mapDiv = document.createElement('div');
      const service = new google.maps.places.PlacesService(mapDiv);
      
      const googleStopsPromise = new Promise<Stop[]>((resolve) => {
        service.nearbySearch(
          {
            location,
            radius: 5000,
            type: 'bus_station'
          },
          (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && results) {
              const stops = results
                .filter(p => (p.types?.includes('bus_station') || p.types?.includes('transit_station')) && !p.name?.toLowerCase().includes('mountains'))
                .map(p => ({
                  id: p.place_id!,
                  name: p.name!,
                  lat: p.geometry!.location!.lat(),
                  lng: p.geometry!.location!.lng(),
                  cityType: p.rating ? (p.rating > 4 ? 1 : 2) : 3,
                  isSystem: false,
                  rating: p.rating,
                  vicinity: p.vicinity
                }));
              resolve(stops);
            } else {
              resolve([]);
            }
          }
        );
      });

      const verifiedGoogleStops = await googleStopsPromise;
      
      // Merge and remove duplicates
      const allStops = [...realSystemStops];
      verifiedGoogleStops.forEach(gs => {
        const isDuplicate = allStops.some(s => 
          calculateDistance(s.lat, s.lng, gs.lat, gs.lng) < 0.1 // Within 100m
        );
        if (!isDuplicate) allStops.push(gs);
      });

      setAllSystemStops(allStops);

      // Fetch routes too for the map labels
      const routesRes = await fetch('/api/routes');
      const routesData = await routesRes.json();
      if (routesData.success) {
        setAllRoutes(routesData.data);
      }

      // Filter and Sort for Sidebar
      const nearbySorted = [...allStops].sort((a, b) =>
        calculateDistance(location.lat, location.lng, a.lat, a.lng) -
        calculateDistance(location.lat, location.lng, b.lat, b.lng)
      ).filter(stop => 
        calculateDistance(location.lat, location.lng, stop.lat, stop.lng) <= 25
      );

      setDisplayedStops(nearbySorted);
      setStatusMessage(nearbySorted.length > 0 ? `Found ${nearbySorted.length} Real-Time Stops` : "No Stops Found Nearby");

    } catch (error) {
      console.error("Failed to fetch stops:", error);
      setStatusMessage("Connection error. Using offline data.");
    } finally {
      setSearching(false);
      setLoading(false);
    }
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
            <div className="flex gap-2">
              <Button 
                onClick={() => setShowAllInSidebar(!showAllInSidebar)}
                variant="ghost" 
                size="sm"
                className={cn(
                  "text-[10px] font-black uppercase tracking-widest px-3 rounded-full border border-white/10",
                  showAllInSidebar ? "bg-primary text-white border-primary" : "text-white/40"
                )}
              >
                {showAllInSidebar ? "All Stops" : "Nearby Only"}
              </Button>
              {searching && <Loader2 className="h-4 w-4 text-primary animate-spin" />}
            </div>
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">{statusMessage}</p>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-6 custom-scrollbar">
          <div className="space-y-3">
            {(showAllInSidebar ? allSystemStops : displayedStops).map((stop) => {
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
                      isActive ? "bg-white/20" : (stop.isSystem ? "bg-rose-500/10" : "bg-sky-500/10")
                    )}>
                      <BusIcon className={cn("h-5 w-5", isActive ? "text-white" : (stop.isSystem ? "text-rose-500" : "text-sky-500"))} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                          "text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded",
                          isActive 
                            ? "bg-white/20 text-white" 
                            : (stop.isSystem ? "bg-rose-500 text-white" : "bg-sky-500 text-white")
                        )}>
                          {stop.isSystem ? 'System' : 'Public'}
                        </span>
                        {stop.rating && (
                          <span className={cn("text-[9px] font-bold flex items-center gap-0.5", isActive ? "text-white" : "text-amber-500")}>
                            ★ {stop.rating}
                          </span>
                        )}
                      </div>
                      <h3 className={cn("font-bold truncate text-sm", isActive ? "text-white" : "text-white/90")}>
                        {stop.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <MapPin className={cn("h-3 w-3", isActive ? "text-white/60" : "text-white/30")} />
                        <span className={cn("text-[10px] font-black uppercase tracking-widest leading-none", isActive ? "text-white/60" : "text-white/30")}>
                          {distance !== null ? `${distance.toFixed(2)} km away` : 'Locating...'}
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
                fetchRealBuses();
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
          buses={activeBuses}
          stops={showAllInSidebar ? allSystemStops : (displayedStops.length > 0 ? displayedStops : allSystemStops)}
          allRoutes={allRoutes}
          userLocation={userLocation}
          center={activeStop ? { lat: activeStop.lat, lng: activeStop.lng } : userLocation}
          zoom={activeStop ? 16 : (userLocation ? 14 : 10)}
          isSatellite={isSatellite}
        />
      </div>
    </div>
  );
}
