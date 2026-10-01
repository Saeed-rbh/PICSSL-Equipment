import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import test from 'node:test';
import {
    ADMIN_SESSION_TTL_SECONDS,
    constantTimeEquals,
    createAdminSessionToken,
    isAdminCollectionAllowed,
    isAdminPasswordConfigured,
    projectExportDocument,
    verifyAdminSessionToken,
} from '../src/lib/adminSecurity.mjs';

const makeTestSecret = () => randomBytes(32).toString('base64url');

test('admin session token is signed, expires, and is invalidated by password rotation', () => {
    const secret = makeTestSecret();
    const now = 1_800_000_000_000;
    const token = createAdminSessionToken(secret, now);

    assert.equal(verifyAdminSessionToken(token, secret, now + 1000), true);
    assert.equal(verifyAdminSessionToken('true', secret, now), false);
    assert.equal(verifyAdminSessionToken(token, makeTestSecret(), now), false);
    assert.equal(verifyAdminSessionToken(token, secret, now + ADMIN_SESSION_TTL_SECONDS * 1000 + 1000), false);
    assert.equal(verifyAdminSessionToken(token + 'x', secret, now), false);
});

test('admin password must be configured with the minimum length', () => {
    assert.equal(isAdminPasswordConfigured(undefined), false);
    assert.equal(isAdminPasswordConfigured('short'), false);
    assert.equal(isAdminPasswordConfigured(makeTestSecret()), true);
    assert.equal(constantTimeEquals('same-value', 'same-value'), true);
    assert.equal(constantTimeEquals('same-value', 'other-value'), false);
});

test('admin collection allowlist excludes arbitrary collections', () => {
    assert.equal(isAdminCollectionAllowed('reservations'), true);
    assert.equal(isAdminCollectionAllowed('access_logs'), false);
    assert.equal(isAdminCollectionAllowed('users'), false);
});

test('exports project approved fields and exclude reservation access credentials', () => {
    const fixtureCredential = makeTestSecret();
    const exported = projectExportDocument('reservations', 'reservation-1', {
        fullName: 'Example User',
        email: 'example@example.invalid',
        selectedDate: '2026-10-01T12:00:00.000Z',
        generatedUsername: 'fixture-user',
        generatedPassword: fixtureCredential,
        internalNotes: 'not exportable',
    });

    assert.deepEqual(exported, {
        id: 'reservation-1',
        fullName: 'Example User',
        email: 'example@example.invalid',
        selectedDate: '2026-10-01T12:00:00.000Z',
    });
    assert.equal(Object.hasOwn(exported, 'generatedPassword'), false);
    assert.equal(Object.hasOwn(exported, 'generatedUsername'), false);
    assert.throws(() => projectExportDocument('access_logs', 'x', {}), /Unsupported export collection/);
});
