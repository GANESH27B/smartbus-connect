import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Route from '@/models/Route';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const route = await Route.findById(params.id).populate('stops');

    if (!route) {
      return NextResponse.json(
        { success: false, error: 'Route not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: route }, { status: 200 });
  } catch (error) {
    console.error('Error fetching route:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch route' },
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
    const route = await Route.findByIdAndUpdate(params.id, body, {
      new: true,
      runValidators: true,
    }).populate('stops');

    if (!route) {
      return NextResponse.json(
        { success: false, error: 'Route not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: route }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating route:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update route' },
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

    const route = await Route.findByIdAndDelete(params.id);

    if (!route) {
      return NextResponse.json(
        { success: false, error: 'Route not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: {} }, { status: 200 });
  } catch (error) {
    console.error('Error deleting route:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete route' },
      { status: 500 }
    );
  }
}
