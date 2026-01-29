import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Bus from '@/models/Bus';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const bus = await Bus.findById(params.id).populate('routeId');

    if (!bus) {
      return NextResponse.json(
        { success: false, error: 'Bus not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: bus }, { status: 200 });
  } catch (error) {
    console.error('Error fetching bus:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch bus' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const body = await request.json();
    const bus = await Bus.findByIdAndUpdate(
      params.id,
      { ...body, lastUpdated: new Date() },
      {
        new: true,
        runValidators: true,
      }
    ).populate('routeId');

    if (!bus) {
      return NextResponse.json(
        { success: false, error: 'Bus not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: bus }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating bus:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update bus' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const bus = await Bus.findByIdAndDelete(params.id);

    if (!bus) {
      return NextResponse.json(
        { success: false, error: 'Bus not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: {} }, { status: 200 });
  } catch (error) {
    console.error('Error deleting bus:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete bus' },
      { status: 500 }
    );
  }
}
