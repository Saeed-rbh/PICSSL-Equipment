import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';
import { isAdminAuthenticated } from '@/lib/adminAuth.mjs';
import { projectExportDocument } from '@/lib/adminSecurity.mjs';

const validTypes = ['reservations', 'training_requests', 'analysis_requests'];

export async function GET(request) {
    if (!(await isAdminAuthenticated())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'reservations';

    if (!validTypes.includes(type)) {
        return NextResponse.json({ error: 'Unsupported export type' }, { status: 400 });
    }

    try {
        const snapshot = await db.collection(type).orderBy('createdAt', 'desc').get();
        const data = snapshot.docs.map((doc) => projectExportDocument(type, doc.id, doc.data()));

        return NextResponse.json(
            { success: true, count: data.length, data },
            { headers: { 'Cache-Control': 'no-store' } }
        );
    } catch (error) {
        console.error('API Export Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
