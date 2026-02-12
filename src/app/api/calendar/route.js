import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';
import { toZonedTime } from 'date-fns-tz';

const TIMEZONE = 'America/Toronto';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);

        // Fetch all 3 collections in parallel
        const [reservationsSnap, trainingSnap, analysisSnap] = await Promise.all([
            db.collection('reservations').where('status', '==', 'confirmed').get(),
            db.collection('training_requests').where('status', '==', 'scheduled').get(),
            db.collection('analysis_requests').where('status', '==', 'scheduled').get()
        ]);

        let allEvents = [];

        // 1. Process Reservations (Refined)
        reservationsSnap.docs.forEach(doc => {
            const data = doc.data();
            const slots = data.selectedSlots || [];
            if (slots.length > 0) {
                // Calculate start and end times from slots
                // Assumes slots are sorted and contiguous like "09:00", "10:00"
                const sortedSlots = [...slots].sort();
                const startSlot = sortedSlots[0];
                const endSlotCount = sortedSlots.length;

                // Construct basic ISO strings for start/end if possible, or just formatted time
                // We'll return readable start/end for display
                const startTime = startSlot;
                const startHour = parseInt(startSlot.split(':')[0], 10);
                const endHour = startHour + endSlotCount;
                const endTime = `${endHour.toString().padStart(2, '0')}:00`;

                allEvents.push({
                    id: doc.id,
                    date: data.selectedDate, // ISO String or Date String
                    time: slots,
                    start: startTime,
                    end: endTime,
                    title: `Reservation: ${data.fullName}`,
                    type: 'reservation',
                    user: data.fullName
                });
            }
        });


        // Helper to generate slots from start/end dates
        const getSlotsFromRange = (startIso, endIso) => {
            const start = toZonedTime(new Date(startIso), TIMEZONE);
            const end = toZonedTime(new Date(endIso), TIMEZONE);
            const slots = [];
            let current = new Date(start);
            while (current < end) {
                const h = current.getHours().toString().padStart(2, '0');
                const m = '00';
                slots.push(`${h}:${m}`);
                current.setHours(current.getHours() + 1);
            }
            return slots;
        };

        // Helper to format ISO to HH:MM (Local/Toronto approximation if needed, but here we likely rely on stored UTC)
        // Actually, training/analysis keys are likely absolute ISOs.
        // We want to return "HH:MM" for the calendar display.
        // If stored as UTC, we should convert to Toronto time string.
        // We can use a simple helper if we don't import date-fns-tz here (to avoid overhead if not needed), 
        // OR just return the full ISO and let frontend format.
        // Let's return full ISO for start/end and let frontend handle formatted time?
        // LabCalendar uses `res.time`. ReservationFlow uses `data.data.flatMap(r => r.time)`.
        // LabCalendar display uses `res.time` string.
        // I will add `displayTime` string.

        const getDisplayTime = (isoString) => {
            // Quick hack: assume the ISO is what we want to display roughly, or convert.
            // Better: Return the ISO, let frontend format.
            return isoString;
        };

        // 2. Process Training
        trainingSnap.docs.forEach(doc => {
            const data = doc.data();
            if (data.scheduledDate && data.scheduledEndDate) {
                const slots = getSlotsFromRange(data.scheduledDate, data.scheduledEndDate);
                allEvents.push({
                    id: doc.id,
                    date: data.scheduledDate,
                    time: slots,
                    start: data.scheduledDate, // Full ISO
                    end: data.scheduledEndDate, // Full ISO
                    title: `Training: ${data.fullName}`,
                    type: 'training',
                    user: data.fullName
                });
            }
        });

        // 3. Process Analysis
        analysisSnap.docs.forEach(doc => {
            const data = doc.data();
            if (data.scheduledDate && data.scheduledEndDate) {
                const slots = getSlotsFromRange(data.scheduledDate, data.scheduledEndDate);
                allEvents.push({
                    id: doc.id,
                    date: data.scheduledDate,
                    time: slots,
                    start: data.scheduledDate,
                    end: data.scheduledEndDate,
                    title: `Analysis: ${data.fullName}`,
                    type: 'analysis',
                    user: data.fullName
                });
            }
        });

        return NextResponse.json({ success: true, data: allEvents });
    } catch (error) {
        console.error('Calendar Fetch Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch calendar' }, { status: 500 });
    }
}
