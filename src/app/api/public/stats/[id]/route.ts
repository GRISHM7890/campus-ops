import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { calculateHealthSummary } from '@/lib/metrics';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        // 1. Fetch Campus Public Info
        const campusRef = adminDb.collection('campuses').doc(id);
        const campusSnap = await campusRef.get();

        if (!campusSnap.exists) {
            return NextResponse.json({ error: 'Campus not found' }, { status: 404 });
        }

        const campusData = campusSnap.data();
        const publicCampusInfo = {
            name: campusData?.name,
            location: { city: campusData?.city, state: campusData?.state },
            type: campusData?.type,
            established: campusData?.established
        };

        // 2. Fetch Issues (Sanitized)
        const issuesRef = adminDb.collection('issues').where('campusId', '==', id);
        const issuesSnap = await issuesRef.get();

        const rawIssues = issuesSnap.docs.map(doc => {
            const data = doc.data() as any;
            // CONVERT FIRESTORE TIMESTAMPS TO JS DATES FOR METRICS LIB
            return {
                ...data,
                id: doc.id,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
                resolvedAt: data.resolvedAt?.toDate ? data.resolvedAt.toDate() : (data.resolvedAt ? new Date(data.resolvedAt) : null),
                slaDeadline: data.slaDeadline?.toDate ? data.slaDeadline.toDate() : (data.slaDeadline ? new Date(data.slaDeadline) : null),
            };
        });

        // 3. Calculate Aggregated Stats via Shared Logic
        const stats = calculateHealthSummary(rawIssues);

        // 4. Create Anonymized Activity Feed (Last 10 events)
        const recentActivity = rawIssues
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, 10)
            .map(issue => ({
                id: issue.id.substring(0, 8), // Partial ID
                status: issue.status,
                severity: issue.severity,
                category: issue.category || 'Maintenance',
                timestamp: issue.createdAt.toISOString(),
                escalated: issue.escalationStatus === 'active'
            }));

        // 5. Construct Public Payload
        const payload = {
            meta: {
                generatedAt: new Date().toISOString(),
                disclaimer: "Public Transparency Record. Personal data removed.",
                version: "v1.0-open-data"
            },
            campus: publicCampusInfo,
            transparencyScore: stats.score, // Health Score
            resolutionRate: stats.resolvedPercentage,
            slaCompliance: stats.slaCompliance,
            totalIssuesLogged: stats.totalIssues,
            breakdown: stats.severityBreakdown,
            recentActivity: recentActivity
        };

        return NextResponse.json(payload, {
            headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30'
            }
        });

    } catch (error) {
        console.error('Public API Error:', error);
        return NextResponse.json({ error: 'Transparency node unavailable' }, { status: 500 });
    }
}
