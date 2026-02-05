import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    const type = searchParams.get('type') || 'reservations'; // Default to reservations

    // 1. Security Check
    if (key !== 'picssl-api-key') { // Simple API Key
        return NextResponse.json({ error: 'Unauthorized: Invalid API Key' }, { status: 401 });
    }

    // 2. Validate Type
    const validTypes = ['reservations', 'training_requests', 'analysis_requests'];
    if (!validTypes.includes(type)) {
        return NextResponse.json({ error: `Invalid type. Start with one of: ${validTypes.join(', ')}` }, { status: 400 });
    }

    try {
        // 3. Fetch Data
        const snapshot = await db.collection(type).orderBy('createdAt', 'desc').get();

        const data = snapshot.docs.map(doc => {
            const d = doc.data();
            // Convert Timestamp to ISO string for JSON compatibility
            return {
                id: doc.id,
                ...d,
                createdAt: d.createdAt && d.createdAt.toDate ? d.createdAt.toDate().toISOString() : d.createdAt
            };
        });

        return NextResponse.json({
            success: true,
            count: data.length,
            data: data
        });

    } catch (error) {
        console.error('API Export Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
