git branch -M mainexport type Stop = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  eta?: string;
  cityType?: 1 | 2 | 3;
  distance?: number; // Distance in kilometers from user location
};

export type Route = {
  id: string;
  name: string;
  number: string;
  stops: Stop[];
};

export type Bus = {
  id: string;
  number: string;
  routeId: string;
  lat: number;
  lng: number;
  status: 'active' | 'idle' | 'delayed' | 'maintenance';
  driver: string;
  lastUpdated: string;
};

export type Schedule = {
  routeId: string;
  timings: string[];
};

export type TripPlan = {
  summary?: string;
  steps: {
    instruction: string;
    busNumber?: string;
    departureStop?: string;
    arrivalStop?: string;
    departureTime?: string;
    arrivalTime?: string;
    description?: string;
    landmark?: string;
  }[];
  totalTime: string;
  mapsUrl?: string;
  debugPrompt?: string;
  estimatedCost?: string;
};
