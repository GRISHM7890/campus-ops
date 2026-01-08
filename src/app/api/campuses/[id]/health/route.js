export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { calculateHealthSummary } from '@/lib/metrics';

export async function GET(request, { params }) {
    try {
        const { id } = await params;
        if (!id) return NextResponse.json({ error: 'Campus ID is required' }, { status: 400 });

        const campusDoc = await adminDb.collection('campuses').doc(id).get();
        if (!campusDoc.exists) return NextResponse.json({ error: 'Campus not found' }, { status: 404 });

        const issuesSnapshot = await adminDb.collection('issues')
            .where('campusId', '==', id)
            .get();

        const issues = issuesSnapshot.docs.map(doc => doc.data());
        const campusData = campusDoc.data();

        // Calculate new summary using previous score for trend
        const previousScore = campusData.healthSummary?.score || 100;
        const summary = calculateHealthSummary(issues, previousScore);

        // Persistent update of health status
        await adminDb.collection('campuses').doc(id).set({
            healthSummary: summary,
            lastHealthUpdate: new Date().toISOString()
        }, { merge: true });

        // Generate mock trend history for UI graph (last 7 days)
        const history = [
            { date: '2025-12-25', score: Math.min(100, summary.score + 5) },
            { date: '2025-12-26', score: Math.min(100, summary.score + 2) },
            { date: '2025-12-27', score: Math.min(100, summary.score + 10) },
            { date: '2025-12-28', score: Math.min(100, summary.score - 5) },
            { date: '2025-12-29', score: Math.min(100, summary.score - 2) },
            { date: '2025-12-30', score: previousScore },
            { date: '2025-12-31', score: summary.score }
        ];

        return NextResponse.json({
            campusId: id,
            currentHealth: summary,
            trendHistory: history,
            metadata: {
                engineVersion: "4.0.0-PROD",
                decayRate: "1pt/hr",
                restorationHalfLife: "12hrs"
            }
        });

    } catch (error) {
        console.error('[HealthAPI] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
