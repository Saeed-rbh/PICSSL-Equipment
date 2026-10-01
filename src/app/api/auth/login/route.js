import { NextResponse } from 'next/server';

export async function POST(request) {
    const body = await request.json();
    const { username, password } = body ?? {};
    const configuredPassword = process.env.ADMIN_PASSWORD;

    if (!configuredPassword) {
        return NextResponse.json(
            { success: false, message: 'Admin login is not configured' },
            { status: 503 }
        );
    }

    if (username === 'admin' && password === configuredPassword) {
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
