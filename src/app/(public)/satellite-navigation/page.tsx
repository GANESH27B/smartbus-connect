
'use client';

import { useState, useEffect } from 'react';
import LiveMap from '@/components/LiveMap';
import { buses, routes } from '@/lib/data';
import { Navigation2, Map as MapIcon, Loader2, Compass, Search, MapPin, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useGoogleMaps } from '@/context/GoogleMapsContext';
import { cn } from '@/lib/utils';

export default function SatelliteNavigationPage() {
    const [userLocation, setUserLocation] = useState<google.maps.LatLngLiteral | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeMode, setActiveMode] = useState<'satellite' | 'roadmap'>('satellite');
    const [isFollowing, setIsFollowing] = useState(true);
    const { isLoaded } = useGoogleMaps();

    useEffect(() => {
        let watchId: number;

        if (navigator.geolocation) {
            watchId = navigator.geolocation.watchPosition(
                (position) => {
                    const newPos = { lat: position.coords.latitude, lng: position.coords.longitude };
                    setUserLocation(newPos);
                    setIsLoading(false);
                },
                (error) => {
                    console.error("Navigation error:", error);
                    setIsLoading(false);
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        } else {
            setIsLoading(false);
        }

        return () => {
            if (watchId) navigator.geolocation.clearWatch(watchId);
        };
    }, []);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-deep relative overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 blur-[120px] rounded-full animate-pulse" />
                </div>
                <motion.div
                    animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="relative z-10"
                >
                    <Navigation2 className="h-16 w-16 text-primary" />
                </motion.div>
                <h2 className="mt-8 text-2xl font-black font-headline text-white italic tracking-tighter relative z-10">
                    Syncing Satellite Uplink...
                </h2>
            </div>
        );
    }

    return (
        <div className="h-screen w-full relative bg-black overflow-hidden">
            {/* Top HUD */}
            <div className="absolute top-6 left-6 z-20 flex flex-col gap-2">
                <div className="glass-deep px-6 py-4 rounded-[2rem] border-white/20 shadow-2xl flex items-center gap-4">
                    <div className="bg-primary p-2 rounded-xl animate-pulse">
                        <Navigation2 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Real-Time NAV</p>
                        <h1 className="text-lg font-black font-headline tracking-tighter text-white italic">Satellite System Active</h1>
                    </div>
                </div>
            </div>

            {/* Control Panel */}
            <div className="absolute bottom-10 right-10 z-20 flex flex-col gap-4">
                <Button
                    onClick={() => setActiveMode(activeMode === 'satellite' ? 'roadmap' : 'satellite')}
                    className={cn(
                        "h-16 w-16 rounded-2xl shadow-2xl border-white/20 transition-all hover:scale-110",
                        activeMode === 'satellite' ? "bg-primary text-white" : "glass-deep text-white"
                    )}
                >
                    <MapIcon className="h-7 w-7" />
                </Button>

                <Button
                    onClick={() => setIsFollowing(!isFollowing)}
                    className={cn(
                        "h-16 w-16 rounded-2xl shadow-2xl border-white/20 transition-all hover:scale-110",
                        isFollowing ? "bg-emerald-500 text-white" : "glass-deep text-white"
                    )}
                >
                    <Compass className={cn("h-7 w-7", isFollowing && "animate-spin-slow")} />
                </Button>
            </div>

            {/* Speedometer/Data HUD (Simulation) */}
            <div className="absolute bottom-10 left-10 z-20 hidden md:block">
                <div className="glass-deep p-6 rounded-[2rem] border-white/20 flex flex-col gap-4 min-w-[200px]">
                    <div className="flex justify-between items-end">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Active Transit</span>
                        <span className="text-2xl font-black text-primary font-headline italic">12.4 KM</span>
                    </div>
                    <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: "65%" }}
                            className="h-full bg-primary"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-white/60">GPS Signal Strong</span>
                    </div>
                </div>
            </div>

            <LiveMap
                buses={buses}
                stops={routes.flatMap(r => r.stops)}
                userLocation={userLocation}
                center={isFollowing ? userLocation : null}
                zoom={isFollowing ? 17 : 14}
                isSatellite={activeMode === 'satellite'}
            />

            <style jsx global>{`
        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
}
