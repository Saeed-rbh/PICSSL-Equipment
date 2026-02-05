import { NextResponse } from 'next/server';

export async function POST(request) {
    const body = await request.json();
    const { username, password } = body;

    // Hardcoded credentials (could use env vars)
    if (username === 'admin' && password === 'picssl2026') {
        const response = NextResponse.json({ success: true });

        // Set HTTP-only cookie
        response.cookies.set('admin_session', 'true', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24, // 1 day
            path: '/',
        });

        return response;
    }

    return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
}
