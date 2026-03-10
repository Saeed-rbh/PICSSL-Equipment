import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

if (!getApps().length) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        initializeApp({
            credential: cert(serviceAccount)
        });
    } else {
        console.error("Missing FIREBASE_SERVICE_ACCOUNT_KEY in .env.local");
        process.exit(1);
    }
}

const db = getFirestore();

async function updateExistingData() {
    const reservationsSnapshot = await db.collection('reservations').get();
    let updatedCount = 0;

    for (const doc of reservationsSnapshot.docs) {
        const reservation = doc.data();

        // Skip if this reservation hasn't been accessed yet (no actual duration)
        if (reservation.actualDuration === undefined) {
            continue;
        }

        const currentTotalDuration = parseFloat(reservation.actualDuration || 0);
        let totalCost = 0;

        if (reservation.picsslGroup || reservation.isPicsslGroup) {
            totalCost = 0;
        } else {
            const totalHours = currentTotalDuration / 60;
            let computedActualCost = totalHours * 50;

            if (computedActualCost > 250) computedActualCost = 250;

            if (reservation.requestOperator) {
                computedActualCost += (totalHours * 40);
            }

            const reservedCost = parseFloat(reservation.totalCost || 0);

            // Final total cost is the HIGHER of reserved vs actual computed
            totalCost = Math.max(reservedCost, computedActualCost);
        }

        totalCost = Math.round(totalCost * 100) / 100;

        // Only update if it's different to save writes
        if (reservation.finalCost !== totalCost) {
            await doc.ref.update({
                finalCost: totalCost
            });
            console.log(`Updated reservation ${doc.id}: finalCost is now ${totalCost}`);
            updatedCount++;
        }
    }

    console.log(`Finished! Updated ${updatedCount} records.`);
    process.exit(0);
}

updateExistingData();
