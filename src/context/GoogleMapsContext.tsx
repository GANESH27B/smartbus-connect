
'use client';

import { useJsApiLoader } from '@react-google-maps/api';
import React, { createContext, useContext, ReactNode } from 'react';

const GoogleMapsContext = createContext<{ isLoaded: boolean }>({ isLoaded: false });

export const useGoogleMaps = () => useContext(GoogleMapsContext);

export function GoogleMapsProvider({ children }: { children: ReactNode }) {
    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
        libraries: ['places'],
    });

    if (loadError) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-rose-50 border border-rose-100 rounded-[2rem] text-center">
                <h2 className="text-xl font-black text-rose-600 mb-2">Google Maps Load Error</h2>
                <p className="text-sm text-rose-500 max-w-md">
                    {loadError.message || "The map could not be loaded. Please check your API key and Internet connection."}
                </p>
            </div>
        );
    }

    return (
        <GoogleMapsContext.Provider value={{ isLoaded }}>
            {children}
        </GoogleMapsContext.Provider>
    );
}
