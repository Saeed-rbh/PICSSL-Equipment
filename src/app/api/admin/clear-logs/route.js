import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';

export async function POST() {
    try {
        const collectionRef = db.collection('access_logs');
        const snapshot = await collectionRef.get();

        if (snapshot.size === 0) {
            return NextResponse.json({ success: true, message: 'No logs to clear' });
        }

        const batch = db.batch();
        snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });

        await batch.commit();

        return NextResponse.json({ success: true, message: 'All logs cleared successfully' });

    } catch (error) {
        console.error('Clear Logs Error:', error);
        return NextResponse.json({ success: false, message: 'Failed to clear logs' }, { status: 500 });
    }
}
