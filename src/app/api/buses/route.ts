import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Bus from '@/models/Bus';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const routeId = searchParams.get('routeId');
    const status = searchParams.get('status');

    const query: any = {};
    if (routeId) {
      query.routeId = routeId;
    }
    if (status) {
      query.status = status;
    }

    const buses = await Bus.find(query).populate('routeId').sort({ number: 1 });

    return NextResponse.json({ success: true, data: buses }, { status: 200 });
  } catch (error) {
    console.error('Error fetching buses:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch buses' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const bus = await Bus.create({
      ...body,
      lastUpdated: new Date(),
    });

    const populatedBus = await Bus.findById(bus._id).populate('routeId');

    return NextResponse.json({ success: true, data: populatedBus }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating bus:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create bus' },
      { status: 500 }
    );
  }
}
