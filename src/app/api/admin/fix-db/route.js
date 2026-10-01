import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';
import { isAdminAuthenticated } from '@/lib/adminAuth.mjs';
import { toZonedTime, format } from 'date-fns-tz';

const TIMEZONE = 'America/Toronto';

export async function GET(req) {
    if (!(await isAdminAuthenticated())) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    try {
        const trainingSnap = await db.collection('training_requests').get();
        const analysisSnap = await db.collection('analysis_requests').get();

        const results = [];

        trainingSnap.forEach(doc => {
            const data = doc.data();
            if (data.fullName === 'Rafael Corpuz' || data.fullName === 'Luna Marouf') {
                results.push({
                    id: doc.id,
                    collection: 'training_requests',
                    fullName: data.fullName,
                    storedStart: data.scheduledDate,
                    storedEnd: data.scheduledEndDate,
                    torontoStart: data.scheduledDate ? format(toZonedTime(data.scheduledDate, TIMEZONE), 'yyyy-MM-dd HH:mm:ss', { timeZone: TIMEZONE }) : 'N/A'
                });
            }
        });

        analysisSnap.forEach(doc => {
            const data = doc.data();
            if (data.fullName === 'Rafael Corpuz' || data.fullName === 'Luna Marouf') {
                results.push({
                    id: doc.id,
                    collection: 'analysis_requests',
                    fullName: data.fullName,
                    storedStart: data.scheduledDate,
                    storedEnd: data.scheduledEndDate,
                    torontoStart: data.scheduledDate ? format(toZonedTime(data.scheduledDate, TIMEZONE), 'yyyy-MM-dd HH:mm:ss', { timeZone: TIMEZONE }) : 'N/A'
                });
            }
        });

        return NextResponse.json({ results });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    if (!(await isAdminAuthenticated())) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    try {
        const body = await req.json();
        const { collection, id, newStart, newEnd } = body;
        if (!['training_requests', 'analysis_requests'].includes(collection) || typeof id !== 'string' || !id.trim()) {
            return NextResponse.json({ success: false, message: 'Invalid collection or id' }, { status: 400 });
        }

        // newStart/newEnd expected in absolute UTC ISO
        await db.collection(collection).doc(id).update({
            scheduledDate: newStart,
            scheduledEndDate: newEnd
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
