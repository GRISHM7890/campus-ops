export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { admin, adminDb } from '@/lib/firebaseAdmin';
import { createAuditLog } from '@/lib/audit';

export async function PATCH(request, { params }) {
    try {
        const { id } = await params;
        const { status, message } = await request.json();

        if (!id || !status) {
            return NextResponse.json({ error: 'Issue ID and Status required' }, { status: 400 });
        }

        const validStatuses = ['ESCALATED', 'ACTIONED'];
        if (!validStatuses.includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        const issueRef = adminDb.collection('issues').doc(id);
        const issueSnap = await issueRef.get();

        if (!issueSnap.exists) {
            return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
        }

        const data = issueSnap.data();
        const previousState = data?.status || 'unknown';
        const userId = request.headers.get('x-user-id') || 'unknown';
        const userRole = request.headers.get('x-user-role') || 'staff';

        await issueRef.update({
            status: status, // Also update top-level status for visibility
            timeline: admin.firestore.FieldValue.arrayUnion({
                status: status,
                timestamp: new Date().toISOString(),
                message: message || (status === 'ESCALATED' ? 'Issue escalated to senior management.' : 'Field unit deployed; taking corrective action.')
            })
        });

        // Trigger health sync
        const { syncCampusHealth } = await import('@/lib/sync');
        await syncCampusHealth(data.campusId);

        // Create Audit Log
        await createAuditLog({
            issueId: id,
            action: 'STATUS_UPDATED',
            actorId: userId,
            actorRole: userRole,
            previousState: { status: previousState },
            newState: { status: status, message: message }
        });

        return NextResponse.json({ success: true, message: `Issue status updated to ${status}` });
    } catch (error) {
        console.error('Error updating issue status:', error);
        return NextResponse.json({ error: 'Failed to update issue status' }, { status: 500 });
    }
}
