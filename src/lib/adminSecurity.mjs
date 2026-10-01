import { createHmac, timingSafeEqual } from 'node:crypto';

export const ADMIN_SESSION_COOKIE = 'admin_session';
export const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 8;
export const MIN_ADMIN_PASSWORD_LENGTH = 16;

const ADMIN_COLLECTIONS = new Set([
    'reservations',
    'training_requests',
    'analysis_requests',
]);

const EXPORT_FIELDS = Object.freeze({
    reservations: [
        'fullName', 'email', 'supervisorEmail', 'selectedDate', 'selectedSlots',
        'sampleName', 'totalCost', 'actualDuration', 'finalCost', 'picsslGroup',
        'requestOperator', 'status', 'createdAt',
    ],
    training_requests: [
        'fullName', 'email', 'supervisorEmail', 'department', 'costCenter',
        'trainee2Name', 'trainee2Email', 'scheduledDate', 'scheduledEndDate',
        'adminNotes', 'status', 'createdAt',
    ],
    analysis_requests: [
        'fullName', 'email', 'supervisorEmail', 'institution', 'sampleCount',
        'sampleDescription', 'analysisType', 'estimatedCost', 'deliveryMethod',
        'costCenter', 'scheduledDate', 'scheduledEndDate', 'adminNotes',
        'status', 'createdAt',
    ],
});

export function isAdminPasswordConfigured(password = process.env.ADMIN_PASSWORD) {
    return typeof password === 'string' && password.length >= MIN_ADMIN_PASSWORD_LENGTH;
}

export function constantTimeEquals(left, right) {
    if (typeof left !== 'string' || typeof right !== 'string') return false;
    const leftBytes = Buffer.from(left, 'utf8');
    const rightBytes = Buffer.from(right, 'utf8');
    return leftBytes.length === rightBytes.length && timingSafeEqual(leftBytes, rightBytes);
}

export function createAdminSessionToken(password, now = Date.now()) {
    if (!isAdminPasswordConfigured(password)) {
        throw new Error('Admin password is not configured securely');
    }

    const expiresAt = Math.floor(now / 1000) + ADMIN_SESSION_TTL_SECONDS;
    const payload = Buffer.from(`v1:admin:${expiresAt}`).toString('base64url');
    const signature = createHmac('sha256', password).update(payload).digest('base64url');
    return `${payload}.${signature}`;
}

export function verifyAdminSessionToken(token, password = process.env.ADMIN_PASSWORD, now = Date.now()) {
    if (!isAdminPasswordConfigured(password) || typeof token !== 'string' || token.length > 512) return false;

    const parts = token.split('.');
    if (parts.length !== 2 || !/^[A-Za-z0-9_-]+$/.test(parts[0]) || !/^[A-Za-z0-9_-]+$/.test(parts[1])) {
        return false;
    }

    const [payload, providedSignature] = parts;
    const expectedSignature = createHmac('sha256', password).update(payload).digest('base64url');
    if (!constantTimeEquals(providedSignature, expectedSignature)) return false;

    try {
        const decoded = Buffer.from(payload, 'base64url').toString('utf8');
        const [version, subject, expiresAtText, ...extra] = decoded.split(':');
        if (version !== 'v1' || subject !== 'admin' || extra.length !== 0 || !/^\d+$/.test(expiresAtText)) {
            return false;
        }
        return Number(expiresAtText) > Math.floor(now / 1000);
    } catch {
        return false;
    }
}

export function isAdminCollectionAllowed(collection) {
    return typeof collection === 'string' && ADMIN_COLLECTIONS.has(collection);
}

export function projectExportDocument(collection, id, documentData) {
    const fields = EXPORT_FIELDS[collection];
    if (!fields) throw new Error('Unsupported export collection');

    const projected = { id };
    for (const field of fields) {
        const value = documentData?.[field];
        if (value === undefined) continue;
        projected[field] = field === 'createdAt' && value && typeof value.toDate === 'function'
            ? value.toDate().toISOString()
            : value;
    }
    return projected;
}
