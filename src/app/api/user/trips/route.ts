import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import TripHistory from '@/models/TripHistory';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get('auth_token')?.value;

        if (!token) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            return NextResponse.json({ success: false, error: "Server config error" }, { status: 500 });
        }

        const decoded: any = jwt.verify(token, jwtSecret);
        const userId = decoded.userId;

        await connectDB();
        const history = await TripHistory.find({ userId }).sort({ date: -1 }).limit(10); // Check existing History

        return NextResponse.json({ success: true, data: history });
    } catch (error: any) {
        console.error('Fetch trip history error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Server Error' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const token = request.cookies.get('auth_token')?.value;

        if (!token) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            return NextResponse.json({ success: false, error: "Server config error" }, { status: 500 });
        }
        const decoded: any = jwt.verify(token, jwtSecret);
        const userId = decoded.userId;

        await connectDB();
        const { origin, destination, plan } = await request.json();

        if (!origin || !destination || !plan) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const tripHistory = await TripHistory.create({
            userId,
            origin,
            destination,
            plan,
            date: new Date(),
        });

        return NextResponse.json({ success: true, data: tripHistory }, { status: 201 });
    } catch (error: any) {
        console.error('Save trip history error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Server Error' },
            { status: 500 }
        );
    }
}
