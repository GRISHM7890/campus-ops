export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const campusId = searchParams.get('campusId');
        const userId = searchParams.get('userId');

        let issuesQuery = adminDb.collection('issues');

        if (campusId) {
            issuesQuery = issuesQuery.where('campusId', '==', campusId);
        }

        // Fetch without orderBy to avoid composite index requirement
        const snapshot = await issuesQuery.get();

        let issues = snapshot.docs.map(doc => {
            const data = doc.data();
            const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() :
                new Date(data.createdAt || Date.now());

            const now = new Date();
            const ageInMilliseconds = now - createdAt;
            const ageInDays = Math.floor(ageInMilliseconds / (1000 * 60 * 60 * 24));
            const isAged = data.status !== 'resolved' && ageInDays > 7;

            return {
                id: doc.id,
                ...data,
                ageInDays,
                isAged,
                createdAt: createdAt.toISOString(),
                severity: data.severity || 'medium'
            };
        });

        // Sort in memory by createdAt DESC
        issues.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        return NextResponse.json({ issues });
    } catch (error) {
        console.error('Error fetching issues:', error);
        return NextResponse.json({
            errorCode: 'ISSUES_FETCH_ERROR',
            message: `Failed to fetch issues: ${error.message}`,
            hint: 'Verify the issues collection and check for active Firestore rules.'
        }, { status: 500 });
    }
}
