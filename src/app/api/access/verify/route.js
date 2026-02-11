import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';
import { toZonedTime } from 'date-fns-tz';

export async function POST(req) {
    try {
        const { username, password } = await req.json();

        // Admin Override
        if (username === 'admin' && password === 'picssl2026') {
            return NextResponse.json({
                success: true,
                valid: true,
                isTimeValid: true,
                message: 'Admin Access Granted',
                data: {
                    id: 'admin-session',
                    fullName: 'Administrator',
                    email: 'admin@picssl.com',
                    bookedDate: new Date().toISOString(),
                    bookedSlots: ['Admin Override'],
                    picsslGroup: true // Admin is internal
                }
            });
        }


        if (!username || !password) {
            return NextResponse.json({ success: false, message: 'Missing credentials' }, { status: 400 });
        }

        // Query reservations for matching credentials
        const snapshot = await db.collection('reservations')
            .where('generatedUsername', '==', username)
            .where('generatedPassword', '==', password)
            .limit(1)
            .get();

        if (snapshot.empty) {
            return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
        }

        const doc = snapshot.docs[0];
        const reservation = doc.data();

        // TIME VALIDATION (Robust Toronto Time)
        // We normalize everything to "Lab Wall Time" to avoid UTC/Server timezone offsets causing early/late access.
        const TIMEZONE = 'America/Toronto';

        // 1. Get NOW in Toronto Time
        const nowServer = new Date();
        const nowToronto = toZonedTime(nowServer, TIMEZONE);

        // 2. Determine "Lab Day" from stored date
        // reservation.selectedDate is UTC ISO (e.g., 2026-02-12T17:30:00Z -> 12:30 Est)
        // If stored as UTC, converting to Toronto gives the correct local date.
        // e.g. 2026-02-13T02:00:00Z (9 PM Est on 12th) -> Toronto Date is 12th.

        let reservationDateToronto;
        if (reservation.selectedDate) {
            reservationDateToronto = toZonedTime(reservation.selectedDate, TIMEZONE);
        } else {
            // Fallback if missing (shouldn't happen for valid bookings)
            console.warn(`Reservation ${doc.id} missing selectedDate`);
            return NextResponse.json({ success: false, message: 'Invalid Reservation Data' });
        }

        const rY = reservationDateToronto.getFullYear();
        const rM = reservationDateToronto.getMonth(); // 0-indexed
        const rD = reservationDateToronto.getDate();

        // 3. Parse Slots to find Start/End Lab Time
        const slots = reservation.selectedSlots || [];
        if (slots.length === 0) return NextResponse.json({ success: false, message: 'No slots booked.' });

        // Helper to parse "10:00 AM" to hours/minutes
        const getSlotHours = (timeStr) => {
            const [time, modifier] = timeStr.trim().split(' ');
            let [hours, minutes] = time.split(':');
            hours = parseInt(hours);
            if (hours === 12 && modifier === 'AM') hours = 0;
            if (hours !== 12 && modifier === 'PM') hours += 12;
            return { h: hours, m: parseInt(minutes) };
        };

        const startSlot = getSlotHours(slots[0]);
        const endSlot = getSlotHours(slots[slots.length - 1]);

        // Construct Start/End Time objects in Toronto Time context
        // We act "as if" we are in Toronto.
        // By constructing a Date with (rY, rM, rD, h, m), the JS runtime (if local) treats it as local.
        // BUT we are comparing against 'nowToronto' which is a Date object where properties match Toronto time.
        // So we should construct start/end similarly.

        // Example: 
        // Real Time: 12:00 UTC (07:00 Toronto).
        // nowToronto object internals: 07:00.
        // Booked: 09:00 Toronto.
        // startTimeToronto internals: 09:00.
        // 07:00 < 09:00. Correct.

        // Note: new Date(Y, M, D, h, m) uses LOCAL SERVER TIMEZONE for construction.
        // If server is UTC, it builds a UTC date.
        // nowToronto (from toZonedTime) is a Date where getHours() etc returns the Zoned time?
        // Wait, toZonedTime returns a Date where *UTC methods* returns the zoned time?
        // Docs: "The internal time value is adjusted so that getUTC* methods return the components of the zoned time."
        // So `nowToronto.getUTCHours()` is the Toronto hour.

        // Therefore, we must construct our start/end comparison dates such that their getUTC* methods return the target Toronto time.
        // best way: Date.UTC(Y, M, D, h, m).

        const startTimeToronto = new Date(Date.UTC(rY, rM, rD, startSlot.h, startSlot.m, 0));
        const endTimeToronto = new Date(Date.UTC(rY, rM, rD, endSlot.h, endSlot.m, 0));
        endTimeToronto.setHours(endTimeToronto.getHours() + 1); // +1 Hour duration (Date.UTC handles rollover)

        // Debug Log
        console.log(`Verifying Access [${username}]: NowToronto=${nowToronto.toISOString()} | StartToronto=${startTimeToronto.toISOString()} | EndToronto=${endTimeToronto.toISOString()}`);

        // Compare Timestamps
        // Since both are "shifted" to correct wall time in UTC representation, simple comparison works.
        if (nowToronto.getTime() < startTimeToronto.getTime()) {
            // Calculate time difference for friendly message (optional)
            return NextResponse.json({
                success: false, // Client expects false to show message red
                valid: false,
                message: `Too Early. Session starts at ${slots[0]}.`
            });
        }

        if (nowToronto.getTime() > endTimeToronto.getTime()) {
            return NextResponse.json({
                success: false,
                valid: false,
                message: `Session Expired. Session ended at ${endTimeToronto.getUTCHours()}:${endTimeToronto.getUTCMinutes() > 9 ? endTimeToronto.getUTCMinutes() : '0' + endTimeToronto.getUTCMinutes()}.`
            });
        }

        return NextResponse.json({
            success: true,
            valid: true,
            isTimeValid: true, // Legacy field
            message: 'Credentials verified',
            data: {
                id: doc.id,
                fullName: reservation.fullName,
                email: reservation.email,
                bookedDate: reservation.selectedDate, // Return original for client
                bookedSlots: reservation.selectedSlots,
                picsslGroup: reservation.picsslGroup || false
            }
        });

    } catch (error) {
        console.error('Verify API Error:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}
