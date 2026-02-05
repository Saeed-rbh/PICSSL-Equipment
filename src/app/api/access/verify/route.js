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

        // TIME VALIDATION (Strict Toronto Time)
        // We normalize everything to "Lab Wall Time" to avoid UTC/Server timezone offsets causing early/late access.

        function getTorontoTimeComponents(dateObj) {
            const options = {
                timeZone: 'America/Toronto', hour12: false,
                year: 'numeric', month: 'numeric', day: 'numeric',
                hour: 'numeric', minute: 'numeric', second: 'numeric'
            };
            // formatToParts is robust
            const parts = new Intl.DateTimeFormat('en-US', options).formatToParts(dateObj);
            const p = {};
            parts.forEach(({ type, value }) => p[type] = value);

            // Return a Date object where the internal numbers match Toronto Wall Time
            return new Date(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
        }

        // 1. Get NOW in Toronto Time
        const nowServer = new Date();
        const nowLab = getTorontoTimeComponents(nowServer);

        // 2. Parse Reservation Date (Assume stored YYYY-MM-DD or ISO)
        const resDate = new Date(reservation.selectedDate);
        // We only want the Year/Month/Day from this.
        // NOTE: selectedDate string usually "2023-10-27". 3 PM user might mean 2023-10-27.
        // We need to be careful if selectedDate was stored with timezone.
        // Let's assume the string YYYY-MM-DD is the Truth for the Lab Day.
        // We extract Y, M, D from the string directly to be safe from UTC shifts.
        const dateStr = reservation.selectedDate.split('T')[0]; // "2023-10-27"
        const [rY, rM, rD] = dateStr.split('-').map(Number); // [2023, 10, 27]

        // 3. Parse Slots to find Start/End Lab Time
        const slots = reservation.selectedSlots || [];
        if (slots.length === 0) return NextResponse.json({ success: false, message: 'No slots booked.' });

        const parseSlotToLabTime = (timeStr) => {
            const [time, modifier] = timeStr.split(' ');
            let [hours, minutes] = time.split(':');
            hours = parseInt(hours);
            if (hours === 12 && modifier === 'AM') hours = 0;
            if (hours !== 12 && modifier === 'PM') hours += 12;

            // Construct using the date parts + slot time
            return new Date(rY, rM - 1, rD, hours, parseInt(minutes), 0);
        };

        const startTimeLab = parseSlotToLabTime(slots[0]);
        const endTimeLab = parseSlotToLabTime(slots[slots.length - 1]);
        endTimeLab.setHours(endTimeLab.getHours() + 1); // +1 Hour duration

        console.log(`Verifying Access: LabNow=${nowLab.toLocaleString()} | Start=${startTimeLab.toLocaleString()} | End=${endTimeLab.toLocaleString()}`);

        // STRICT CHECK (0 Minutes Buffer)
        // If now is even 1 second before Start, reject.
        if (nowLab < startTimeLab) {
            return NextResponse.json({
                success: true, // Handled as error by client logic if valid=false
                valid: false,
                message: `Too Early. Session starts at ${startTimeLab.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`
            });
        }

        if (nowLab > endTimeLab) {
            return NextResponse.json({
                success: true,
                valid: false,
                message: `Session Expired. Session ended at ${endTimeLab.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`
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
