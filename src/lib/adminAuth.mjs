import { cookies } from 'next/headers';
import {
    ADMIN_SESSION_COOKIE,
    isAdminPasswordConfigured,
    verifyAdminSessionToken,
} from './adminSecurity.mjs';

export async function isAdminAuthenticated() {
    const password = process.env.ADMIN_PASSWORD;
    if (!isAdminPasswordConfigured(password)) return false;

    try {
        const cookieStore = await cookies();
        return verifyAdminSessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value, password);
    } catch {
        return false;
    }
}
