import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Route from '@/models/Route';
import Stop from '@/models/Stop';
import Bus from '@/models/Bus';

// Seed data from the original data.ts
const seedData = {
  routes: [
    {
      name: 'Main Street Line',
      number: '101',
      stops: [
        { name: 'City Bus Terminal', lat: 34.0522, lng: -118.2437, cityType: 1 },
        { name: 'Central Market', lat: 34.056, lng: -118.242, cityType: 1 },
        { name: 'Government Hospital', lat: 34.062, lng: -118.238, cityType: 2 },
        { name: 'Town Hall', lat: 34.053, lng: -118.244, cityType: 1 },
      ],
    },
    {
      name: 'Industrial Area Shuttle',
      number: '202',
      stops: [
        { name: 'West End Shopping Center', lat: 34.04, lng: -118.26, cityType: 2 },
        { name: 'University Campus', lat: 34.03, lng: -118.27, cityType: 2 },
        { name: 'Technology Park', lat: 34.02, lng: -118.28, cityType: 3 },
        { name: 'Eastside Junction', lat: 34.01, lng: -118.29, cityType: 3 },
      ],
    },
    {
      name: 'Suburb Connector',
      number: '303',
      stops: [
        { name: 'North Residential Area', lat: 34.07, lng: -118.22, cityType: 3 },
        { name: 'Community College', lat: 34.075, lng: -118.21, cityType: 2 },
        { name: 'Public Library', lat: 34.08, lng: -118.20, cityType: 2 },
        { name: 'South Park', lat: 34.085, lng: -118.19, cityType: 3 },
      ],
    },
    {
      name: 'Kalasalingam University Express',
      number: 'KLU-01',
      stops: [
        { name: 'Krinankovil Bus Stop', lat: 9.5815, lng: 77.6750, cityType: 2 },
        { name: 'KLU Main Gate', lat: 9.5788, lng: 77.6766, cityType: 1 },
        { name: 'Srivilliputhur Bus Stand', lat: 9.5094, lng: 77.6322, cityType: 1 },
      ],
    },
  ],
  buses: [
    {
      number: 'B-1011',
      routeId: null as any, // Will be set after routes are created
      lat: 34.054,
      lng: -118.243,
      status: 'active',
      driver: 'Anil Kumar',
    },
    {
      number: 'B-1012',
      routeId: null as any,
      lat: 34.06,
      lng: -118.239,
      status: 'delayed',
      driver: 'Sunita Sharma',
    },
    {
      number: 'B-2021',
      routeId: null as any,
      lat: 34.035,
      lng: -118.265,
      status: 'active',
      driver: 'Rajesh Singh',
    },
    {
      number: 'B-3031',
      routeId: null as any,
      lat: 34.078,
      lng: -118.205,
      status: 'idle',
      driver: 'Priya Verma',
    },
    {
      number: 'B-2022',
      routeId: null as any,
      lat: 34.015,
      lng: -118.285,
      status: 'maintenance',
      driver: 'Sanjay Gupta',
    },
    {
      number: 'KLU-999',
      routeId: null as any,
      lat: 9.5800,
      lng: 77.6755,
      status: 'active',
      driver: 'Murugan',
    },
  ],
};

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Clear existing data
    await Bus.deleteMany({});
    await Route.deleteMany({});
    await Stop.deleteMany({});

    // Create stops and routes
    const createdRoutes = [];
    for (const routeData of seedData.routes) {
      // Create stops for this route
      const stopIds = [];
      for (const stopData of routeData.stops) {
        const stop = await Stop.create(stopData);
        stopIds.push(stop._id);
      }

      // Create route
      const route = await Route.create({
        name: routeData.name,
        number: routeData.number,
        stops: stopIds,
      });
      createdRoutes.push(route);
    }

    // Create buses with route references
    const buses = [];
    for (let i = 0; i < seedData.buses.length; i++) {
      const busData = seedData.buses[i];
      // Logic: 0,1 -> Route 0 | 2,3 -> Route 1 | 4 -> Route 2 | 5 -> Route 3 (KLU)
      let routeIndex = 0;
      if (i < 2) routeIndex = 0;
      else if (i < 4) routeIndex = 1;
      else if (i === 4) routeIndex = 2;
      else routeIndex = 3;

      busData.routeId = createdRoutes[routeIndex]._id;

      const bus = await Bus.create({
        ...busData,
        lastUpdated: new Date(),
      });
      buses.push(bus);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Database seeded successfully',
        data: {
          routes: createdRoutes.length,
          stops: await Stop.countDocuments(),
          buses: buses.length,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error seeding database:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to seed database' },
      { status: 500 }
    );
  }
}
