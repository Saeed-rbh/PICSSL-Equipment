import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';

export async function POST(req) {
    try {
        const { username, password } = await req.json();

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

        // Check same day
        const isSameDay = now.getFullYear() === reservationDate.getFullYear() &&
            now.getMonth() === reservationDate.getMonth() &&
            now.getDate() === reservationDate.getDate();

        // We could be more strict about hours, but "isSameDay" is a good start.
        // Let's assume valid if it's the correct day.

        return NextResponse.json({
            success: true,
            valid: true,
            isTimeValid: isSameDay,
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
