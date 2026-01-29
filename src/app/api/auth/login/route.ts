import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';

export async function POST(request: NextRequest) {
    try {
        await connectDB();

        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { success: false, error: 'Please provide email and password' },
                { status: 400 }
            );
        }

        // Check for user
        const user = await User.findOne({ email });
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return NextResponse.json(
                { success: false, error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Create JWT
        const token = jwt.sign(
            { userId: user._id, email: user.email, name: user.name },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '7d' }
        );

        // Set Cookie
        const cookie = serialize('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: '/',
        });

        const response = NextResponse.json(
            {
                success: true,
                data: {
                    uid: user._id.toString(),
                    email: user.email,
                    displayName: user.name,
                },
            },
            { status: 200 }
        );

        response.headers.set('Set-Cookie', cookie);
        return response;
    } catch (error: any) {
        console.error('Login error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Server Error' },
            { status: 500 }
        );
    }
}
