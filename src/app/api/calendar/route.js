import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';

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

        // 1. Process Reservations (Already has slots)
        reservationsSnap.docs.forEach(doc => {
            const data = doc.data();
            allEvents.push({
                id: doc.id,
                date: data.selectedDate, // ISO String
                time: data.selectedSlots || [],
                type: 'reservation'
            });
        });

        // Helper to generate slots from start/end dates
        const getSlotsFromRange = (startIso, endIso) => {
            const start = new Date(startIso);
            const end = new Date(endIso);
            const slots = [];

            // Iterate by hour
            let current = new Date(start);
            // Round down to nearest hour for start? 
            // If training starts at 9:30, it blocks the 9-10 slot? Or maybe just 10?
            // Conservative: If it overlaps with an hour, block it.
            // Simplification: The system seems to use aligned hours (09:00). 
            // We'll extract the hour part.

            // Loop until we reach end time
            while (current < end) {
                const h = current.getHours().toString().padStart(2, '0');
                const m = '00'; // Force align to top of hour for blocking
                slots.push(`${h}:${m}`);
                current.setHours(current.getHours() + 1);
            }
            return slots;
        };

        // 2. Process Training
        trainingSnap.docs.forEach(doc => {
            const data = doc.data();
            if (data.scheduledDate && data.scheduledEndDate) {
                const slots = getSlotsFromRange(data.scheduledDate, data.scheduledEndDate);
                allEvents.push({
                    id: doc.id,
                    date: data.scheduledDate, // Use start date for the key
                    time: slots,
                    type: 'training'
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
                    type: 'analysis'
                });
            }
        });

        return NextResponse.json({ success: true, data: allEvents });
    } catch (error) {
        console.error('Calendar Fetch Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch calendar' }, { status: 500 });
    }
}
