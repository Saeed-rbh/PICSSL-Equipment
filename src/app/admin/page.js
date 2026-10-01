import { isAdminAuthenticated } from '@/lib/adminAuth.mjs';
import { db } from '@/lib/firebaseAdmin';
import AdminDashboard from '@/components/AdminDashboard';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic'; // Disable caching to see real-time data

async function getData() {
    try {
        const reservationsSnap = await db.collection('reservations').orderBy('createdAt', 'desc').get();
        const trainingSnap = await db.collection('training_requests').orderBy('createdAt', 'desc').get();
        const analysisSnap = await db.collection('analysis_requests').orderBy('createdAt', 'desc').get();
        const logsSnap = await db.collection('access_logs').orderBy('timestamp', 'desc').limit(100).get(); // Limit mostly for performance

        const serialize = (doc) => {
            const data = doc.data();
            return {
                ...data,
                id: doc.id,
                createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null, // Convert Timestamp
            };
        };

        const serializeLog = (doc) => {
            const data = doc.data();
            return {
                ...data,
                id: doc.id
            };
        };

        return {
            reservations: reservationsSnap.docs.map(serialize),
            trainingRequests: trainingSnap.docs.map(serialize),
            analysisRequests: analysisSnap.docs.map(serialize),
            accessLogs: logsSnap.docs.map(serializeLog)
        };
    } catch (error) {
        console.error("Admin Fetch Error:", error);
        return { reservations: [], trainingRequests: [], analysisRequests: [] };
    }
}

export default async function AdminPage() {
    if (!(await isAdminAuthenticated())) {
        redirect('/admin/login');
    }

    const data = await getData();

    return <AdminDashboard {...data} />;
}
