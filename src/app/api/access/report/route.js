import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';

export async function POST(req) {
    try {
        const { username, password, durationMinutes } = await req.json();

        // Admin Override
        if (username === 'admin' && password === 'picssl2026') {
            // Log Admin Access
            await db.collection('access_logs').add({
                username: 'Admin',
                fullName: 'Administrator',
                userType: 'admin',
                durationMinutes: durationMinutes,
                finalCost: 0,
                timestamp: new Date().toISOString()
            });

            return NextResponse.json({
                success: true,
                message: 'Admin usage reported (No DB update)',
                data: {
                    actualDuration: durationMinutes,
                    finalCost: 0
                }
            });
        }


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
        const currentSessionDuration = parseFloat(durationMinutes);

        // Cumulative Usage Logic: Read existing or default to 0
        const existingDuration = parseFloat(reservation.actualDuration || 0);
        const newTotalDuration = existingDuration + currentSessionDuration;

        // Calculate Total Cost based on Cumulative Duration
        // Rate: $50/hr standard. (User said "no industrial")
        let totalCost = 0;
        let sessionCost = 0;

        if (reservation.picsslGroup) {
            totalCost = 0;
            sessionCost = 0;
        } else {
            // Total Cost
            const totalHours = newTotalDuration / 60;
            totalCost = totalHours * 50;

            // Session Cost (for log)
            const sessionHours = currentSessionDuration / 60;
            sessionCost = sessionHours * 50;
        }

        // Rounding
        totalCost = Math.round(totalCost * 100) / 100;
        sessionCost = Math.round(sessionCost * 100) / 100;

        // Update Reservation with TOTALS
        await db.collection('reservations').doc(doc.id).update({
            actualDuration: newTotalDuration,
            finalCost: totalCost,
            usageReportedAt: new Date().toISOString()
        });

        // Log Standard Access (Session specific)
        await db.collection('access_logs').add({
            reservationId: doc.id,
            username: reservation.generatedUsername,
            fullName: reservation.fullName,
            userType: 'user',
            durationMinutes: currentSessionDuration,
            finalCost: sessionCost,
            totalReservationCost: totalCost,
            timestamp: new Date().toISOString()
        });

        return NextResponse.json({
            success: true,
            message: 'Usage reported successfully',
            data: {
                actualDuration: newTotalDuration,
                finalCost: totalCost,
                sessionDuration: currentSessionDuration
            }
        });

    } catch (error) {
        console.error('Report API Error:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}
