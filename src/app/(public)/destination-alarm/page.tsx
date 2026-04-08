"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, MapPin, Navigation, Map, AlertTriangle, Shield, CheckCircle2, ChevronRight, Bus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useGoogleMaps } from "@/context/GoogleMapsContext";
import { Autocomplete, GoogleMap, Marker } from "@react-google-maps/api";

type Destination = { lat: number; lng: number; name: string };

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

export default function DestinationAlarmPage() {
  const [destination, setDestination] = useState<Destination | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [distanceRemaining, setDistanceRemaining] = useState<number | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [hasArrived, setHasArrived] = useState(false);
  const [isAlarmActive, setIsAlarmActive] = useState(false);
  const [gpsAccuracyM, setGpsAccuracyM] = useState<number | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const { isLoaded } = useGoogleMaps();
  const [mapCenter, setMapCenter] = useState<{ lat: number, lng: number }>({ lat: 34.0522, lng: -118.2437 });
  const watchIdRef = useRef<number | null>(null);
  const alarmIntervalRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  useEffect(() => {
    if (navigator.geolocation && !isTracking && !hasArrived) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapCenter({ lat: position.coords.latitude, lng: position.coords.longitude });
          setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
          setGpsAccuracyM(position.coords.accuracy ?? null);
          setGpsError(null);
        }
      );
    }
  }, [isTracking, hasArrived]);

  const stopAlarm = useCallback(() => {
    setIsAlarmActive(false);
    if (alarmIntervalRef.current !== null) {
      window.clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }
    try {
      oscRef.current?.stop();
    } catch { }
    oscRef.current = null;
    gainRef.current = null;
    if (audioCtxRef.current) {
      const ctx = audioCtxRef.current;
      audioCtxRef.current = null;
      ctx.close().catch(() => { });
    }
  }, []);

  const startAlarm = useCallback(() => {
    setIsAlarmActive(true);

    // Vibration pulse loop (if supported)
    if (alarmIntervalRef.current !== null) window.clearInterval(alarmIntervalRef.current);
    alarmIntervalRef.current = window.setInterval(() => {
      if (navigator.vibrate) navigator.vibrate([400, 200, 400, 200, 800]);
    }, 1800);

    // Beep sound loop (requires user gesture; startJourney provides that)
    try {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) audioCtxRef.current = new AudioCtx();
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume().catch(() => { });

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = 880;
      gain.gain.value = 0;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      // Simple on/off beep pattern using gain ramps
      const tick = () => {
        const t = ctx.currentTime;
        gain.gain.cancelScheduledValues(t);
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
      };
      tick();
      window.setInterval(tick, 600);

      oscRef.current = osc;
      gainRef.current = gain;
    } catch (e) {
      // ignore audio failures
    }
  }, []);

  // Watch user location if tracking
  useEffect(() => {
    if (isTracking && destination && navigator.geolocation && !hasArrived) {
      setGpsError(null);
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          setGpsAccuracyM(position.coords.accuracy ?? null);

          const currentDistance = calculateDistance(latitude, longitude, destination.lat, destination.lng);
          setDistanceRemaining(currentDistance);

          // Trigger when within 400m, but avoid false triggers when GPS accuracy is poor.
          // If accuracy is > 250m, wait until we are closer than max(400m, accuracy).
          const accuracyKm = (position.coords.accuracy ?? 0) / 1000;
          const thresholdKm = Math.max(0.4, accuracyKm);
          if (currentDistance < thresholdKm && !hasArrived) {
            setHasArrived(true);
            setIsTracking(false);
            startAlarm();
          }
        },
        (error) => {
          console.error("Error watching location:", error);
          setGpsError(error.message || "Could not read GPS location.");
        },
        { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 }
      );
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [isTracking, destination, hasArrived, startAlarm]);

  const handlePlaceChanged = () => {
    const place = autocompleteRef.current?.getPlace();
    if (place?.geometry?.location) {
      setDestination({
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
        name: place.formatted_address || place.name || "Selected Destination"
      });
      setSearchQuery(place.formatted_address || place.name || "");
    }
  };

  const startJourney = () => {
    if (destination) {
      stopAlarm();
      setIsTracking(true);
      setHasArrived(false);
      setGpsError(null);
      // Try to get instant first location
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const d = calculateDistance(pos.coords.latitude, pos.coords.longitude, destination.lat, destination.lng);
          setDistanceRemaining(d);
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setGpsAccuracyM(pos.coords.accuracy ?? null);
        },
        (err) => setGpsError(err.message || "Could not get GPS location."),
        { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 }
      );
    }
  };

  const cancelJourney = () => {
    setIsTracking(false);
    setHasArrived(false);
    stopAlarm();
    setDistanceRemaining(null);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[10%] left-[20%] w-[40%] h-[40%] bg-rose-500/10 blur-[150px] rounded-full animate-blob" />
        <div className="absolute bottom-[20%] right-[10%] w-[30%] h-[50%] bg-violet-500/10 blur-[150px] rounded-full animate-blob [animation-delay:2s]" />
      </div>

      <div className="w-full max-w-lg relative z-10">

        <AnimatePresence mode="wait">
          {!isTracking && !hasArrived && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="text-center space-y-4">
                <div className="bg-rose-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Bell className="w-10 h-10 text-rose-500" />
                </div>
                <h1 className="text-4xl md:text-5xl font-black font-headline tracking-tighter">
                  Destination <span className="text-rose-500">Alarm</span>
                </h1>
                <p className="text-muted-foreground text-lg px-4">
                  Mark where you want to get down. You can safely sleep or read; we'll wake you up when you arrive.
                </p>
              </div>

              <Card className="glass border-white/20 shadow-2xl rounded-[2.5rem] p-4">
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-4 relative">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Search or Tap Map to Mark</label>
                    {isLoaded ? (
                      <div className="space-y-4">
                        <Autocomplete
                          onLoad={(ac) => autocompleteRef.current = ac}
                          onPlaceChanged={handlePlaceChanged}
                        >
                          <div className="relative z-10">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <Input
                              placeholder="Enter stop name..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="pl-12 h-14 rounded-2xl bg-black/5 border-white/10 text-lg font-medium shadow-inner"
                            />
                          </div>
                        </Autocomplete>
                        <div className="w-full h-48 rounded-2xl overflow-hidden border border-white/10 relative z-0">
                          <GoogleMap
                            mapContainerStyle={{ width: '100%', height: '100%' }}
                            center={destination ? { lat: destination.lat, lng: destination.lng } : mapCenter}
                            zoom={13}
                            options={{ disableDefaultUI: true, gestureHandling: 'greedy' }}
                            onClick={(e) => {
                              if (e.latLng) {
                                setDestination({
                                  lat: e.latLng.lat(),
                                  lng: e.latLng.lng(),
                                  name: "Dropped Pin"
                                });
                                setSearchQuery("Dropped Pin");
                              }
                            }}
                          >
                            {userLocation && (
                              <Marker position={userLocation} icon={{ path: 0, scale: 6, fillColor: '#3b82f6', fillOpacity: 1, strokeWeight: 2, strokeColor: '#fff' }} title="Your Location" />
                            )}
                            {destination && (
                              <Marker position={{ lat: destination.lat, lng: destination.lng }} icon={{ path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z', anchor: { x: 12, y: 22 } as any, scale: 1.5, fillColor: '#f43f5e', fillOpacity: 1, strokeWeight: 2, strokeColor: '#fff' }} title="Destination" />
                            )}
                          </GoogleMap>
                        </div>
                      </div>
                    ) : (
                      <div className="relative flex items-center h-14 bg-black/5 rounded-2xl px-4 text-muted-foreground">
                        Loading Map Services...
                      </div>
                    )}
                  </div>

                  {gpsError && (
                    <div className="flex items-start gap-3 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600">
                      <AlertTriangle className="w-5 h-5 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-black">GPS error</p>
                        <p className="text-rose-700/80">{gpsError}</p>
                      </div>
                    </div>
                  )}

                  <Button
                    className="w-full h-14 rounded-2xl bg-vibrant-gradient text-lg font-black tracking-tight shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
                    disabled={!destination}
                    onClick={startJourney}
                  >
                    {destination ? "Start Journey Tracking" : "Select a Destination"}
                    {destination && <ChevronRight className="w-5 h-5 ml-2" />}
                  </Button>
                </CardContent>
              </Card>

              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Shield className="w-4 h-4" /> Uninterrupted GPS tracking enabled
              </div>
            </motion.div>
          )}

          {isTracking && (
            <motion.div
              key="tracking"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full"
            >
              <div className="text-center space-y-2 mb-10">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 text-xs font-black uppercase tracking-widest mb-4 animate-pulse">
                  <Navigation className="w-4 h-4" /> Tracking Live
                </div>
                <h2 className="text-2xl font-black font-headline text-muted-foreground truncate px-4">
                  Heading to {destination?.name.split(',')[0]}
                </h2>
              </div>

              <div className="relative w-72 h-72 mx-auto mb-12 flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-full border-[3px] border-dashed border-primary/40"
                />
                <div className="absolute inset-4 rounded-full bg-primary/10 blur-xl animate-pulse" />

                <div className="relative z-10 glass-deep w-56 h-56 rounded-full flex flex-col items-center justify-center border border-white/20 shadow-[-10px_-10px_30px_rgba(255,255,255,0.1),_10px_10px_30px_rgba(0,0,0,0.5)]">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 mt-4">Distance</p>

                  {distanceRemaining !== null ? (
                    <>
                      <div className="text-6xl font-black font-headline text-white tracking-tighter">
                        {distanceRemaining < 1 ? (distanceRemaining * 1000).toFixed(0) : distanceRemaining.toFixed(1)}
                      </div>
                      <p className="text-sm font-bold text-white/60 mb-4">{distanceRemaining < 1 ? "Meters" : "Kilometers"}</p>
                    </>
                  ) : (
                    <span className="text-xl font-bold text-white/60 my-6 animate-pulse">Calculating...</span>
                  )}
                </div>
              </div>

              <Button
                variant="destructive"
                className="w-full h-14 rounded-2xl font-black text-lg bg-rose-500 hover:bg-rose-600 shadow-xl shadow-rose-500/20 max-w-xs mx-auto flex"
                onClick={cancelJourney}
              >
                Cancel Alarm
              </Button>
            </motion.div>
          )}

          {hasArrived && (
            <motion.div
              key="arrived"
              initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ type: "spring", bounce: 0.6 }}
              className="w-full text-center space-y-8"
            >
              <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full scale-150 animate-pulse" />
                <div className="absolute inset-0 rounded-full border-[3px] border-emerald-500/50 scale-110 animate-ping" />
                <div className="bg-gradient-to-br from-emerald-400 to-teal-500 w-full h-full rounded-full flex items-center justify-center shadow-2xl z-10">
                  <Bell className="w-20 h-20 text-white animate-bounce" />
                </div>
              </div>

              <div className="space-y-4 relative z-10">
                <h1 className="text-5xl md:text-6xl font-black font-headline text-emerald-500 tracking-tighter uppercase italic">
                  Wake Up!
                </h1>
                <p className="text-xl font-bold text-foreground">
                  You are arriving at your destination.
                </p>
                <p className="text-muted-foreground">
                  Please gather your belongings and prepare to exit.
                </p>
              </div>

              <Button
                className="w-full h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-lg shadow-xl shadow-emerald-500/30 max-w-xs mx-auto flex relative z-10"
                onClick={cancelJourney}
              >
                <CheckCircle2 className="w-6 h-6 mr-2" /> Stop Alarm
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
