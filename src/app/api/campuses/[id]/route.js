export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { calculateHealthSummary } from '@/lib/metrics';

export async function GET(request, { params }) {
    try {
        const { id } = await params;
        if (!id) return NextResponse.json({ error: 'ID is missing' }, { status: 400 });

        console.log(`[BACKEND] Fetching campus: ${id}`);
        const docRef = adminDb.collection('campuses').doc(id);
        let doc = await docRef.get();

        if (!doc.exists) {
            console.warn(`[BACKEND] Doc ID '${id}' not found. Trying field search...`);
            const snapshot = await adminDb.collection('campuses').where('id', '==', id).limit(1).get();
            if (snapshot.empty) {
                return NextResponse.json({
                    error: `Campus '${id}' not found.`,
                    id_attempted: id
                }, { status: 404 });
            }
            doc = snapshot.docs[0];
        }

        const data = doc.data();

        // Fetch issues for this campus to calculate health metrics
        const issuesSnapshot = await adminDb.collection('issues')
            .where('campusId', '==', doc.id)
            .get();

        const campusIssues = issuesSnapshot.docs.map(i => i.data());
        const prevScore = data.healthSummary?.score || 100;
        const healthSummary = calculateHealthSummary(campusIssues, prevScore);

        return NextResponse.json({
            id: doc.id,
            ...data,
            healthSummary
        }, {
            status: 200,
            headers: { 'X-Campus-Version': 'PROD-STABLE' }
        });
    } catch (error) {
        console.error('[BACKEND ERROR] fetch campus:', error);
        return NextResponse.json({
            errorCode: 'FIREBASE_FETCH_ERROR',
            message: `Failed to fetch campus detail: ${error.message}`,
            hint: 'Ensure document ID exists in Firestore and that Firestore indexes are healthy.'
        }, { status: 500 });
    }
}
