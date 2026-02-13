
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
    try {
        await connectDB();

        const email = "test@example.com";
        const password = "password123";
        const name = "Test User";

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json({ success: true, message: 'Test user already exists', user: { email: existingUser.email } });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
        });

        return NextResponse.json({
            success: true,
            message: 'Test user created successfully',
            credentials: { email, password }
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
