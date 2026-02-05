import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';

export async function POST(req) {
    try {
        const { username, password, durationMinutes } = await req.json();

        if (!username || !password || durationMinutes === undefined) {
            return NextResponse.json({ success: false, message: 'Missing fields' }, { status: 400 });
        }

        // Re-verify to find the doc
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
        const duration = parseFloat(durationMinutes);

        // Calculate Cost
        // Rate: $50/hr standard. (User said "no industrial")
        // If PICSSL Group: $0.

        let finalCost = 0;

        if (reservation.picsslGroup) {
            finalCost = 0;
        } else {
            const hours = duration / 60;
            finalCost = hours * 50;
        }

        // Use toFixed(2) for display but store as number
        finalCost = Math.round(finalCost * 100) / 100;

        await db.collection('reservations').doc(doc.id).update({
            actualDuration: duration,
            finalCost: finalCost,
            usageReportedAt: new Date().toISOString()
        });

        return NextResponse.json({
            success: true,
            message: 'Usage reported successfully',
            data: {
                actualDuration: duration,
                finalCost: finalCost
            }
        });

    } catch (error) {
        console.error('Report API Error:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}
