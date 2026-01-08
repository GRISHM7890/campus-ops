export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { calculateHealthSummary } from '@/lib/metrics';

export async function GET() {
    try {
        const [campusesSnapshot, issuesSnapshot] = await Promise.all([
            adminDb.collection('campuses').get(),
            adminDb.collection('issues').get()
        ]);

        const allIssues = issuesSnapshot.docs.map(doc => doc.data());
        const campuses = [];

        campusesSnapshot.forEach(doc => {
            const campusData = doc.data();
            const campusIssues = allIssues.filter(i => i.campusId === doc.id || i.campusId === campusData.id);
            const prevScore = campusData.healthSummary?.score || 100;
            const healthSummary = calculateHealthSummary(campusIssues, prevScore);

            campuses.push({
                id: doc.id,
                ...campusData,
                healthSummary
            });
        });

        return NextResponse.json(campuses, { status: 200 });
    } catch (error) {
        console.error('[API] Error fetching campuses:', error);
        return NextResponse.json({
            errorCode: 'FIREBASE_READ_ERROR',
            message: `Failed to fetch campuses: ${error.message}`,
            hint: 'Verify Firestore rules and ensure the "campuses" collection exists.'
        }, { status: 500 });
    }
}
