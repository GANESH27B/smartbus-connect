import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';

export async function POST(request: NextRequest) {
    try {
        await connectDB();

        const { name, email, password } = await request.json();

        if (!name || !email || !password) {
            return NextResponse.json(
                { success: false, error: 'Please provide all required fields' },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json(
                { success: false, error: 'User with this email already exists' },
                { status: 400 }
            );
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
        });

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
            { status: 201 }
        );

        response.headers.set('Set-Cookie', cookie);
        return response;
    } catch (error: any) {
        console.error('Signup error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Server Error' },
            { status: 500 }
        );
    }
}
