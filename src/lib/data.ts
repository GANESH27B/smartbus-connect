import type { Bus, Route } from './types';
import { getRoutesServer, getBuses } from './db-service';

// Fallback static data (used if MongoDB is not available)
export const fallbackRoutes: Route[] = [
  {
    id: 'route-1',
    name: 'Main Street Line',
    number: '101',
    stops: [
      { id: 'stop-1-1', name: 'City Bus Terminal', lat: 34.0522, lng: -118.2437, cityType: 1 },
      { id: 'stop-1-2', name: 'Central Market', lat: 34.056, lng: -118.242, cityType: 1 },
      { id: 'stop-1-3', name: 'Government Hospital', lat: 34.062, lng: -118.238, cityType: 2 },
      { id: 'stop-1-4', name: 'Town Hall', lat: 34.053, lng: -118.244, cityType: 1 },
      // Adding Indian coordinates (Mumbai)
      { id: 'stop-in-1', name: 'Gateway of India Terminal', lat: 18.922, lng: 72.834, cityType: 1 },
      { id: 'stop-in-2', name: 'Marine Drive Loop', lat: 18.943, lng: 72.823, cityType: 1 },
    ],
  },
  {
    id: 'route-2',
    name: 'Industrial Area Shuttle',
    number: '202',
    stops: [
      { id: 'stop-2-1', name: 'West End Shopping Center', lat: 34.04, lng: -118.26, cityType: 2 },
      { id: 'stop-in-3', name: 'Bandra Kurla Complex', lat: 19.062, lng: 72.863, cityType: 2 },
      { id: 'stop-in-4', name: 'Andheri East Station', lat: 19.119, lng: 72.846, cityType: 2 },
    ],
  },
  {
    id: 'route-3',
    name: 'Suburb Connector',
    number: '303',
    stops: [
      { id: 'stop-3-1', name: 'North Residential Area', lat: 34.07, lng: -118.22, cityType: 3 },
      { id: 'stop-3-2', name: 'Community College', lat: 34.075, lng: -118.21, cityType: 2 },
      { id: 'stop-3-3', name: 'Public Library', lat: 34.08, lng: -118.20, cityType: 2 },
      { id: 'stop-3-4', name: 'South Park', lat: 34.085, lng: -118.19, cityType: 3 },
    ],
  },
];

export const fallbackBuses: Bus[] = [
  {
    id: 'bus-1',
    number: 'B-1011',
    routeId: 'route-1',
    lat: 34.054,
    lng: -118.243,
    status: 'active',
    driver: 'Anil Kumar',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'bus-2',
    number: 'B-1012',
    routeId: 'route-1',
    lat: 34.06,
    lng: -118.239,
    status: 'delayed',
    driver: 'Sunita Sharma',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'bus-3',
    number: 'B-2021',
    routeId: 'route-2',
    lat: 34.035,
    lng: -118.265,
    status: 'active',
    driver: 'Rajesh Singh',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'bus-4',
    number: 'B-3031',
    routeId: 'route-3',
    lat: 34.078,
    lng: -118.205,
    status: 'idle',
    driver: 'Priya Verma',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'bus-5',
    number: 'B-2022',
    routeId: 'route-2',
    lat: 34.015,
    lng: -118.285,
    status: 'maintenance',
    driver: 'Sanjay Gupta',
    lastUpdated: new Date().toISOString(),
  },
];

// Export functions that try MongoDB first, then fallback to static data
export async function getRoutes(): Promise<Route[]> {
  try {
    const routes = await getRoutesServer();
    return routes.length > 0 ? routes : fallbackRoutes;
  } catch (error) {
    console.error('Error fetching routes, using fallback:', error);
    return fallbackRoutes;
  }
}

export async function getBusesData(): Promise<Bus[]> {
  try {
    const buses = await getBuses();
    return buses.length > 0 ? buses : fallbackBuses;
  } catch (error) {
    console.error('Error fetching buses, using fallback:', error);
    return fallbackBuses;
  }
}

// For backward compatibility, export static arrays (will be replaced by async functions)
export const routes: Route[] = fallbackRoutes;
export const buses: Bus[] = fallbackBuses;

export const getRouteById = (id: string) => fallbackRoutes.find(r => r.id === id);
export const getBusById = (id: string) => fallbackBuses.find(b => b.id === id);

