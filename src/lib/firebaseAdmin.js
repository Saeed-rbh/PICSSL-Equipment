import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

if (!admin.apps.length) {
    try {
        admin.initializeApp();
    } catch (error) {
        console.error('Firebase Admin Initialization Error:', error);
    }
}

const db = getFirestore();

export { db };
