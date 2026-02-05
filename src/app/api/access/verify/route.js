import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';

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

        // Check if Time is Valid
        // Logic:
        // selectedDate: "2023-10-27T00:00:00.000Z"
        // selectedSlots: ["10:00 AM", "11:00 AM"]
        // We need to parse this to check if "NOW" is within the window.
        // Simplified for this task: Just return the booked info and let the client decide, 
        // OR do a basic check here. Let's do a basic check.

        const now = new Date();
        const reservationDate = new Date(reservation.selectedDate);

        // Check same day first
        const isSameDay = now.getFullYear() === reservationDate.getFullYear() &&
            now.getMonth() === reservationDate.getMonth() &&
            now.getDate() === reservationDate.getDate();

        if (!isSameDay) {
            return NextResponse.json({
                success: true, // Key: Success true so client handles message
                valid: false,
                message: `Invalid Date. Booked for ${reservationDate.toLocaleDateString()}.`
            });
        }

        // Parse Slots to find window
        // Formats: "10:00 AM", "2:00 PM"
        const parseTime = (timeStr, baseDate) => {
            const [time, modifier] = timeStr.split(' ');
            let [hours, minutes] = time.split(':');
            hours = parseInt(hours);
            if (hours === 12 && modifier === 'AM') hours = 0;
            if (hours !== 12 && modifier === 'PM') hours += 12;

            const d = new Date(baseDate);
            d.setHours(hours, parseInt(minutes), 0, 0);
            return d;
        };

        const slots = reservation.selectedSlots || [];
        if (slots.length === 0) {
            return NextResponse.json({ success: false, message: 'No slots booked.' });
        }

        // Find Start and End
        // Sort slots just in case
        // Logic: First slot is start. Last slot + 1 hour is end.

        let startTime = parseTime(slots[0], reservationDate);
        let endTime = parseTime(slots[slots.length - 1], reservationDate);
        endTime.setHours(endTime.getHours() + 1); // Add 1 hour duration for last slot

        // Allow 15 min grace period before start? User said "soon or later". 
        // Let's stick to strict or small buffer. Strict for now as requested "start from...".

        if (now < startTime) {
            return NextResponse.json({
                success: true,
                valid: false,
                message: `Too Early. Your session starts at ${startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`
            });
        }

        if (now > endTime) {
            return NextResponse.json({
                success: true,
                valid: false,
                message: `Session Expired. Your session ended at ${endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`
            });
        }

        return NextResponse.json({
            success: true,
            valid: true,
            isTimeValid: true,
            message: 'Credentials verified',
            data: {
                id: doc.id,
                fullName: reservation.fullName,
                email: reservation.email,
                bookedDate: reservation.selectedDate,
                bookedSlots: reservation.selectedSlots,
                picsslGroup: reservation.picsslGroup || false
            }
        });

    } catch (error) {
        console.error('Verify API Error:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}
