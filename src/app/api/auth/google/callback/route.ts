import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User'; // Ensure this model exists
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const code = searchParams.get('code');

        if (!code) {
            return NextResponse.json({ success: false, error: 'Authorization code missing' }, { status: 400 });
        }

        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        const redirectUri = process.env.GOOGLE_REDIRECT_URI;
        const jwtSecret = process.env.JWT_SECRET;

        if (!clientId || !clientSecret || !redirectUri || !jwtSecret) {
            return NextResponse.json({ success: false, error: 'Server configuration missing' }, { status: 500 });
        }

        // 1. Exchange code for tokens
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code',
            }),
        });

        const tokenData = await tokenResponse.json();
        if (tokenData.error) {
            console.error("Token exchange error:", tokenData);
            return NextResponse.json({ success: false, error: 'Failed to exchange token' }, { status: 400 });
        }

        const { access_token, id_token } = tokenData;

        // 2. Get user info
        const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${access_token}` },
        });
        const googleUser = await userResponse.json();

        if (!googleUser.email) {
            return NextResponse.json({ success: false, error: 'Failed to get user info' }, { status: 400 });
        }

        // 3. Connect to DB and find/create user
        await connectDB();

        let user = await User.findOne({ email: googleUser.email });

        if (!user) {
            const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
            user = await User.create({
                name: googleUser.name,
                email: googleUser.email,
                password: randomPassword,
                photoURL: googleUser.picture,
                provider: 'google'
            });
        } else {
            // Update photo if changed, optional
            if (googleUser.picture && user.photoURL !== googleUser.picture) {
                user.photoURL = googleUser.picture;
                await user.save();
            }
        }

        // 4. Create JWT
        const token = jwt.sign(
            { userId: user._id, email: user.email, name: user.name },
            jwtSecret,
            { expiresIn: '7d' }
        );

        // 5. Set Cookie
        const cookie = serialize('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: '/',
        });

        // 6. Redirect to home
        const response = NextResponse.redirect(new URL('/', request.url));
        response.headers.set('Set-Cookie', cookie);
        return response;

    } catch (error: any) {
        console.error('Google callback error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Server Error' },
            { status: 500 }
        );
    }
}
