import { NextResponse } from 'next/server';
import {
    ADMIN_SESSION_COOKIE,
    ADMIN_SESSION_TTL_SECONDS,
    constantTimeEquals,
    createAdminSessionToken,
    isAdminPasswordConfigured,
} from '@/lib/adminSecurity.mjs';

export async function POST(request) {
    const body = await request.json().catch(() => ({}));
    const { username, password } = body ?? {};
    const configuredPassword = process.env.ADMIN_PASSWORD;

    if (!isAdminPasswordConfigured(configuredPassword)) {
        return NextResponse.json(
            {
                success: false,
                code: 'ADMIN_LOGIN_NOT_CONFIGURED',
                message: 'Admin login is not configured',
            },
            { status: 503 }
        );
    }

    if (username === 'admin' && constantTimeEquals(password, configuredPassword)) {
        const response = NextResponse.json({ success: true });
        response.cookies.set(ADMIN_SESSION_COOKIE, createAdminSessionToken(configuredPassword), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: ADMIN_SESSION_TTL_SECONDS,
            path: '/',
        });
        return response;
    }

    return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
}
