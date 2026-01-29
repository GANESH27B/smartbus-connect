import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import User from '@/models/User';
import connectDB from '@/lib/mongodb';

export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get('auth_token')?.value;

        if (!token) {
            return NextResponse.json({ success: false, user: null });
        }

        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            return NextResponse.json({ success: false, error: "Server config error" }, { status: 500 });
        }

        const decoded: any = jwt.verify(token, jwtSecret);

        // Optionally fetch fresh data from DB
        await connectDB();
        const user = await User.findById(decoded.userId).select('-password');

        if (!user) {
            return NextResponse.json({ success: false, user: null });
        }

        return NextResponse.json({
            success: true,
            user: {
                uid: user._id.toString(),
                email: user.email,
                displayName: user.name,
                photoURL: user.photoURL
            },
        });
    } catch (error) {
        // If token invalid, return null user
        return NextResponse.json({ success: false, user: null });
    }
}
