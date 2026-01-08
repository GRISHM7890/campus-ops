import { adminDb } from './firebaseAdmin';
import { calculateHealthSummary } from './metrics';

/**
 * Recalculates and persists the health summary for a specific campus.
 */
export async function syncCampusHealth(campusId: string) {
    if (!campusId) return;

    try {
        const campusRef = adminDb.collection('campuses').doc(campusId);
        const campusDoc = await campusRef.get();
        if (!campusDoc.exists) {
            console.warn(`[SyncHealth] Campus ${campusId} not found.`);
            return;
        }

        const issuesSnapshot = await adminDb.collection('issues')
            .where('campusId', '==', campusId)
            .get();

        const issues = issuesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        const previousScore = campusDoc.data()?.healthSummary?.score || 100;
        const newSummary = calculateHealthSummary(issues, previousScore);

        await campusRef.set({
            healthSummary: newSummary,
            lastHealthUpdate: new Date().toISOString()
        }, { merge: true });

        console.log(`[SyncHealth] Correctly synchronized health for ${campusId}. Score: ${newSummary.score}%`);
        return newSummary;
    } catch (error) {
        console.error(`[SyncHealth Fatal Error] for ${campusId}:`, error);
    }
}
