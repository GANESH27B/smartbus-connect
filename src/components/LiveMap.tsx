
'use client';

import {
  GoogleMap,
  Marker,
  InfoWindow,
  Circle,
} from '@react-google-maps/api';
import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { Bus, Stop } from '@/lib/types';
import { routes } from '@/lib/data';

interface LiveMapProps {
  buses: Bus[];
  stops?: Stop[];
  center?: google.maps.LatLngLiteral | null;
  zoom?: number;
  userLocation?: google.maps.LatLngLiteral | null;
}

const containerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = {
  lat: 34.0522,
  lng: -118.2437,
};

const mapOptions = (isSatellite: boolean = false): google.maps.MapOptions => ({
  disableDefaultUI: true,
  zoomControl: true,
  mapTypeId: isSatellite ? 'hybrid' : 'roadmap',
  tilt: 45,
  heading: 0,
  styles: isSatellite ? [] : [
    {
      "featureType": "poi",
      "stylers": [{ "visibility": "simplified" }]
    },
    {
      "featureType": "transit",
      "stylers": [{ "visibility": "on" }]
    },
    {
      "featureType": "transit.station.bus",
      "stylers": [{ "visibility": "on" }, { "color": "#f43f5e" }]
    }
  ]
});

import { useGoogleMaps } from '@/context/GoogleMapsContext';
import { Navigation2 } from 'lucide-react';

interface LiveMapProps {
  buses: Bus[];
  stops?: Stop[];
  center?: google.maps.LatLngLiteral | null;
  zoom?: number;
  userLocation?: google.maps.LatLngLiteral | null;
  isSatellite?: boolean;
}

function LiveMap({ buses, stops = [], center, zoom, userLocation, isSatellite = false }: LiveMapProps) {
  const { isLoaded } = useGoogleMaps();

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [activeMarker, setActiveMarker] = useState<Bus | Stop | null>(null);
  const [pulseSize, setPulseSize] = useState(1);

  // Animation for location pulse
  useEffect(() => {
    const interval = setInterval(() => {
      setPulseSize(s => (s >= 2 ? 1 : s + 0.1));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (map && center) {
      map.panTo(center);
      if (zoom) map.setZoom(zoom);
    } else if (map && buses.length > 0 && !center && !userLocation) {
      map.panTo({ lat: buses[0].lat, lng: buses[0].lng });
    } else if (map && userLocation && !center) {
      map.panTo(userLocation);
    }
  }, [map, center, zoom, buses, userLocation]);

  const handleMarkerClick = (marker: Bus | Stop) => {
    setActiveMarker(marker);
    if (map) map.panTo({ lat: marker.lat, lng: marker.lng });
  };

  const onLoad = useCallback(function callback(mapInstance: google.maps.Map) {
    setMap(mapInstance);
  }, []);

  const onUnmount = useCallback(function callback(map: google.maps.Map) {
    setMap(null);
  }, []);

  if (!isLoaded) return <div className="flex items-center justify-center h-full bg-muted font-bold text-muted-foreground">Initializing Satellite...</div>;

  return (
    <div className="relative h-full w-full">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center || userLocation || defaultCenter}
        zoom={zoom || 14}
        options={mapOptions(isSatellite)}
        onLoad={onLoad}
        onUnmount={onUnmount}
      >
        {/* Bus Markers */}
        {buses.map(bus => (
          <Marker
            key={bus.id}
            position={{ lat: bus.lat, lng: bus.lng }}
            onClick={() => handleMarkerClick(bus)}
            icon={{
              path: "M20 12l-8 8-12-12 12-12z",
              scale: isSatellite ? 1.2 : 0.8,
              fillColor: bus.status === 'delayed' ? '#f43f5e' : '#8b5cf6',
              fillOpacity: 1,
              strokeWeight: 2,
              strokeColor: '#FFFFFF',
              rotation: 0,
              anchor: { x: 12, y: 12 } as any,
            }}
            zIndex={100}
          />
        ))}

        {/* Stop Markers */}
        {stops && stops.length > 0 && stops.map(stop => (
          <Marker
            key={stop.id}
            position={{ lat: stop.lat, lng: stop.lng }}
            onClick={() => handleMarkerClick(stop)}
            icon={{
              path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
              fillColor: '#f43f5e',
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 2,
              scale: isSatellite ? 2.5 : 1.8,
              anchor: { x: 12, y: 24 } as any,
            }}
            zIndex={10}
          />
        ))}

        {userLocation && (
          <>
            {/* Real-time Pulsing Aura */}
            <Circle
              center={userLocation}
              radius={30 * pulseSize}
              options={{
                fillColor: '#3b82f6',
                fillOpacity: 0.2,
                strokeColor: '#3b82f6',
                strokeOpacity: 0.8,
                strokeWeight: 1,
                clickable: false,
              }}
            />
            <Marker
              position={userLocation}
              title="Your Location"
              zIndex={150}
              icon={{
                path: 0, // SymbolPath.CIRCLE
                scale: 14,
                fillColor: '#3b82f6',
                fillOpacity: 1,
                strokeColor: '#FFFFFF',
                strokeWeight: 4,
              }}
            />
          </>
        )}

        {activeMarker && (
          <InfoWindow
            position={{ lat: activeMarker.lat, lng: activeMarker.lng }}
            onCloseClick={() => setActiveMarker(null)}
          >
            <div className="p-4 min-w-[200px] font-sans">
              {'number' in activeMarker ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Live Bus</span>
                    <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                      activeMarker.status === 'delayed' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'
                    )}>
                      {activeMarker.status}
                    </span>
                  </div>
                  <h3 className="font-headline font-black text-xl italic text-primary">#{activeMarker.number}</h3>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
                    <div>
                      <p className="text-[10px] font-bold uppercase text-muted-foreground">Route</p>
                      <p className="font-bold text-sm">{routes.find(r => r.id === activeMarker.routeId)?.number}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase text-muted-foreground">Driver</p>
                      <p className="font-bold text-sm truncate">{activeMarker.driver}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-rose-500">Bus Stop</span>
                  <h3 className="font-headline font-bold text-lg leading-tight">{activeMarker.name}</h3>
                  <button className="w-full mt-3 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:opacity-90 transition-opacity">
                    See Next Arrivals
                  </button>
                </div>
              )}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}

export default React.memo(LiveMap);
