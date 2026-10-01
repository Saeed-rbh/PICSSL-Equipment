import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';
import { isAdminAuthenticated } from '@/lib/adminAuth.mjs';
import { isAdminCollectionAllowed } from '@/lib/adminSecurity.mjs';

export async function POST(request) {
    if (!(await isAdminAuthenticated())) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { collection, id } = await request.json();

        if (!isAdminCollectionAllowed(collection) || typeof id !== 'string' || !id.trim()) {
            return NextResponse.json({ success: false, message: 'Invalid collection or id' }, { status: 400 });
        }

        await db.collection(collection).doc(id).delete();
        return NextResponse.json({ success: true, message: 'Deleted successfully' });
    } catch (error) {
        console.error('Delete Error:', error);
        return NextResponse.json({ success: false, message: 'Failed to delete' }, { status: 500 });
    }
}
