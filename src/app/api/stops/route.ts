import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Stop from '@/models/Stop';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const cityType = searchParams.get('cityType');

    const query: any = {};
    if (cityType) {
      query.cityType = parseInt(cityType);
    }

    const stops = await Stop.find(query).sort({ name: 1 });

    return NextResponse.json({ success: true, data: stops }, { status: 200 });
  } catch (error) {
    console.error('Error fetching stops:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stops' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const stop = await Stop.create(body);

    return NextResponse.json({ success: true, data: stop }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating stop:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create stop' },
      { status: 500 }
    );
  }
}
