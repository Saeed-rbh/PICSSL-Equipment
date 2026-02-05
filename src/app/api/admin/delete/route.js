import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';
import { cookies } from 'next/headers';

export async function POST(request) {
    // 1. Check Auth
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session');

    if (!session || session.value !== 'true') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { collection, id } = await request.json();

        if (!collection || !id) {
            return NextResponse.json({ success: false, message: 'Missing collection or id' }, { status: 400 });
        }

        // 2. Perform Delete
        await db.collection(collection).doc(id).delete();

        return NextResponse.json({ success: true, message: 'Deleted successfully' });
    } catch (error) {
        console.error('Delete Error:', error);
        return NextResponse.json({ success: false, message: 'Failed to delete' }, { status: 500 });
    }
}
