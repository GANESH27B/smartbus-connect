import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Route from '@/models/Route';
import Stop from '@/models/Stop';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const routes = await Route.find().populate('stops').sort({ number: 1 });

    return NextResponse.json({ success: true, data: routes }, { status: 200 });
  } catch (error) {
    console.error('Error fetching routes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch routes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { name, number, stops } = body;

    // Create stops if they don't exist
    const stopIds = [];
    if (stops && Array.isArray(stops)) {
      for (const stopData of stops) {
        let stop = await Stop.findOne({ name: stopData.name, lat: stopData.lat, lng: stopData.lng });
        if (!stop) {
          stop = await Stop.create(stopData);
        }
        stopIds.push(stop._id);
      }
    }

    const route = await Route.create({
      name,
      number,
      stops: stopIds,
    });

    const populatedRoute = await Route.findById(route._id).populate('stops');

    return NextResponse.json({ success: true, data: populatedRoute }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating route:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create route' },
      { status: 500 }
    );
  }
}
