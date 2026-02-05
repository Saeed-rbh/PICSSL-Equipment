import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const start = searchParams.get('start'); // ISO Date string
        const end = searchParams.get('end'); // ISO Date string

        // Basic query: Get all confirmed reservations
        // Optimization: In a real app, we would query by date range.
        // For this scale, fetching all logic is acceptable for simplicity,
        // but let's try to be slightly efficient if possible.

        let query = db.collection('reservations').where('status', '==', 'confirmed');

        // If start/end provided, we could filter clientside or serverside.
        // Firestore filtering by range on string dates works if ISO format.
        // Let's just fetch all confirmed for now to ensure we catch everything
        // and filter in memory if strictly needed, or just return all.
        // Returning all is fine for small scale.

        const snapshot = await query.get();

        const reservations = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                date: data.selectedDate, // Store as ISO string in DB
                time: data.selectedSlots, // Array of strings e.g. ["09:00", "10:00"]
                user: data.fullName || 'Reserved' // Show name if available
            };
        });

        return NextResponse.json({ success: true, data: reservations });
    } catch (error) {
        console.error('Calendar Fetch Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch calendar' }, { status: 500 });
    }
}
