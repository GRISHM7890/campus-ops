export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { admin, adminDb } from '@/lib/firebaseAdmin';
import { createAuditLog } from '@/lib/audit';

export async function PATCH(request, { params }) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: 'Issue ID required' }, { status: 400 });
        }

        const issueRef = adminDb.collection('issues').doc(id);
        const issueSnap = await issueRef.get();

        if (!issueSnap.exists) {
            return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
        }

        const data = issueSnap.data();
        const previousStatus = data?.status || 'unknown';
        const slaDeadline = data.slaDeadline?.toDate ? data.slaDeadline.toDate() : (data.slaDeadline ? new Date(data.slaDeadline) : null);
        const resolvedAt = new Date();

        // Final SLA Assessment
        let slaStatus = data.slaStatus || 'within_sla';
        if (slaStatus !== 'breached' && slaDeadline && resolvedAt > slaDeadline) {
            slaStatus = 'breached';
        } else if (slaStatus !== 'breached') {
            slaStatus = 'met';
        }

        const userId = request.headers.get('x-user-id') || 'unknown';
        const userRole = request.headers.get('x-user-role') || 'staff';

        await issueRef.update({
            status: 'resolved',
            slaStatus: slaStatus,
            resolvedAt: admin.firestore.FieldValue.serverTimestamp(),
            timeline: admin.firestore.FieldValue.arrayUnion({
                status: 'RESOLVED',
                timestamp: resolvedAt.toISOString(),
                message: `Issue verified and marked as resolved. SLA ${slaStatus.toUpperCase()}`
            })
        });

        // Trigger health sync after update
        const { syncCampusHealth } = await import('@/lib/sync');
        await syncCampusHealth(data.campusId);

        // Create Audit Log
        await createAuditLog({
            issueId: id,
            action: 'ISSUE_RESOLVED',
            actorId: userId,
            actorRole: userRole,
            previousState: { status: previousStatus, slaStatus: data.slaStatus },
            newState: { status: 'resolved', slaStatus: slaStatus }
        });

        return NextResponse.json({ success: true, message: 'Issue marked as resolved' });
    } catch (error) {
        console.error('Error resolving issue:', error);
        return NextResponse.json({ error: 'Failed to resolve issue' }, { status: 500 });
    }
}
