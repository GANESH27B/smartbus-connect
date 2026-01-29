import type { Bus, Route, Stop } from './types';

// Fetch routes from MongoDB API
export async function getRoutes(): Promise<Route[]> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9002'}/api/routes`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch routes');
    }

    const result = await response.json();

    if (result.success) {
      // Transform MongoDB data to match Route type
      return result.data.map((route: any) => ({
        id: route._id.toString(),
        name: route.name,
        number: route.number,
        stops: route.stops.map((stop: any) => ({
          id: stop._id?.toString() || stop.id,
          name: stop.name,
          lat: stop.lat,
          lng: stop.lng,
          eta: stop.eta,
          cityType: stop.cityType,
        })),
      }));
    }

    return [];
  } catch (error) {
    console.error('Error fetching routes from API:', error);
    // Fallback to empty array or static data
    return [];
  }
}

// Fetch buses from MongoDB API
export async function getBuses(): Promise<Bus[]> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9002'}/api/buses`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch buses');
    }

    const result = await response.json();

    if (result.success) {
      // Transform MongoDB data to match Bus type
      return result.data.map((bus: any) => ({
        id: bus._id.toString(),
        number: bus.number,
        routeId: bus.routeId?._id?.toString() || bus.routeId?.toString() || bus.routeId,
        lat: bus.lat,
        lng: bus.lng,
        status: bus.status,
        driver: bus.driver,
        lastUpdated: bus.lastUpdated || bus.updatedAt || new Date().toISOString(),
      }));
    }

    return [];
  } catch (error) {
    console.error('Error fetching buses from API:', error);
    return [];
  }
}

// Fetch stops from MongoDB API
export async function getStops(cityType?: 1 | 2 | 3): Promise<Stop[]> {
  try {
    const url = new URL(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9002'}/api/stops`);
    if (cityType) {
      url.searchParams.append('cityType', cityType.toString());
    }

    const response = await fetch(url.toString(), {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch stops');
    }

    const result = await response.json();

    if (result.success) {
      // Transform MongoDB data to match Stop type
      return result.data.map((stop: any) => ({
        id: stop._id.toString(),
        name: stop.name,
        lat: stop.lat,
        lng: stop.lng,
        eta: stop.eta,
        cityType: stop.cityType,
      }));
    }

    return [];
  } catch (error) {
    console.error('Error fetching stops from API:', error);
    return [];
  }
}

// Server-side functions for API routes
export async function getRoutesServer(): Promise<Route[]> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9002'}/api/routes`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return [];
    }

    const result = await response.json();

    if (result.success) {
      return result.data.map((route: any) => ({
        id: route._id.toString(),
        name: route.name,
        number: route.number,
        stops: route.stops.map((stop: any) => ({
          id: stop._id?.toString() || stop.id,
          name: stop.name,
          lat: stop.lat,
          lng: stop.lng,
          eta: stop.eta,
          cityType: stop.cityType,
        })),
      }));
    }

    return [];
  } catch (error) {
    console.error('Error fetching routes:', error);
    return [];
  }
}
