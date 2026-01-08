export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { admin, adminDb } from '@/lib/firebaseAdmin';
import { createAuditLog } from '@/lib/audit';

export async function POST(request: Request) {
    try {
        const { campusId, userId, reportedBy, title, description, severity } = await request.json();

        if (!campusId || !title) {
            return NextResponse.json({ error: 'CampusId and Title are required' }, { status: 400 });
        }

        // SLA Configuration
        const slaDurations = {
            critical: 1 * 60 * 60 * 1000, // 1 hour
            high: 4 * 60 * 60 * 1000,     // 4 hours
            medium: 12 * 60 * 60 * 1000,  // 12 hours
            low: 48 * 60 * 60 * 1000      // 48 hours
        };

        const duration = slaDurations[(severity?.toLowerCase() as keyof typeof slaDurations) || 'medium'] || slaDurations.medium;
        const now = new Date();
        const slaDeadline = new Date(now.getTime() + duration);

        const newIssue = {
            campusId,
            userId: userId || 'anonymous',
            reportedBy: reportedBy || 'Anonymous User',
            title,
            description: description || '',
            severity: severity || 'medium',
            status: 'open',
            slaStatus: 'within_sla',
            slaDeadline: admin.firestore.Timestamp.fromDate(slaDeadline),
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            timeline: [
                {
                    status: 'CREATED',
                    timestamp: now.toISOString(),
                    message: 'Incident reported and logged in system.'
                }
            ],
        };

        const docRef = await adminDb.collection('issues').add(newIssue);
        const issueId = docRef.id;

        // Trigger health sync
        const { syncCampusHealth } = await import('@/lib/sync');
        await syncCampusHealth(campusId);

        // Fetch User Role for Audit Log
        let actorRole = 'anonymous';
        if (userId) {
            const userDoc = await adminDb.collection('users').doc(userId).get();
            if (userDoc.exists) {
                actorRole = userDoc.data()?.role || 'user';
            }
        }

        // Create initial Audit Log
        await createAuditLog({
            issueId,
            action: 'ISSUE_CREATED',
            actorId: userId || 'anonymous',
            actorRole,
            newState: {
                status: 'open',
                severity: newIssue.severity,
                title: newIssue.title
            }
        });

        return NextResponse.json({
            success: true,
            issueId,
            message: 'Issue reported successfully.'
        });

    } catch (error: any) {
        console.error('[Issue Create Error]:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
