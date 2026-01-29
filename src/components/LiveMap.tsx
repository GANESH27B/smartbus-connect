
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

const mapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  styles: [
    {
      "featureType": "poi",
      "stylers": [{ "visibility": "off" }]
    },
    {
      "featureType": "transit",
      "stylers": [{ "visibility": "off" }]
    },
    {
      "featureType": "all",
      "elementType": "labels.text.fill",
      "stylers": [{ "color": "#7c93a3" }, { "lightness": "-10" }]
    },
    {
      "featureType": "water",
      "elementType": "geometry",
      "stylers": [{ "color": "#cadeed" }]
    },
    {
      "featureType": "landscape",
      "elementType": "geometry",
      "stylers": [{ "color": "#f5f8fa" }]
    }
  ]
};

import { useGoogleMaps } from '@/context/GoogleMapsContext';

function LiveMap({ buses, stops = [], center, zoom, userLocation }: LiveMapProps) {
  const { isLoaded } = useGoogleMaps();

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [activeMarker, setActiveMarker] = useState<Bus | Stop | null>(null);

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
        center={center || defaultCenter}
        zoom={zoom || 12}
        options={mapOptions}
        onLoad={onLoad}
        onUnmount={onUnmount}
      >
        {/* Bus Markers - Using a more vibrant and distinct icon */}
        {buses.map(bus => (
          <Marker
            key={bus.id}
            position={{ lat: bus.lat, lng: bus.lng }}
            onClick={() => handleMarkerClick(bus)}
            icon={{
              path: "M20 12l-8 8-12-12 12-12z", // Bus-like arrow
              scale: 0.8,
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

        {/* Stop Markers - Vibrant Rose markers */}
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
              scale: 1.8,
              anchor: { x: 12, y: 24 } as any,
            }}
            zIndex={10}
          />
        ))}

        {userLocation && (
          <>
            <Marker
              position={userLocation}
              title="Your Location"
              zIndex={50}
              icon={{
                path: 0, // SymbolPath.CIRCLE
                scale: 10,
                fillColor: '#3b82f6',
                fillOpacity: 0.9,
                strokeColor: '#FFFFFF',
                strokeWeight: 3,
              }}
            />
            {/* Range Indicator */}
            <Circle
              center={userLocation}
              radius={5000}
              options={{
                fillColor: '#8b5cf6',
                fillOpacity: 0.05,
                strokeColor: '#8b5cf6',
                strokeOpacity: 0.5,
                strokeWeight: 2,
                clickable: false,
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
