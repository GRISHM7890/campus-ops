export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { admin, adminDb } from '@/lib/firebaseAdmin';
import { createAuditLog } from '@/lib/audit';

export async function GET() {
    try {
        const now = new Date();
        const issuesSnapshot = await adminDb
            .collection('issues')
            .where('status', 'in', ['open', 'actioned', 'ACTIONED']) // Fixed possible casing
            .where('slaStatus', '==', 'within_sla')
            .get();

        const updates = [];
        const results = { escalated: 0, breached: 0 };

        for (const doc of issuesSnapshot.docs) {
            const data = doc.data();
            const deadline = data.slaDeadline?.toDate ? data.slaDeadline.toDate() : (data.slaDeadline ? new Date(data.slaDeadline) : null);

            if (deadline && now > deadline) {
                // BREACH DETECTED
                const issueRef = adminDb.collection('issues').doc(doc.id);

                const updatePayload = {
                    slaStatus: 'breached',
                    status: 'ESCALATED',
                    lastSlaCheck: admin.firestore.FieldValue.serverTimestamp(),
                    timeline: admin.firestore.FieldValue.arrayUnion({
                        status: 'ESCALATED',
                        message: 'SYSTEM: SLA Breach detected. Issue automatically escalated for priority resolution.',
                        timestamp: now.toISOString()
                    })
                };

                updates.push(issueRef.update(updatePayload));

                // Log to Audit Trail
                updates.push(createAuditLog({
                    issueId: doc.id,
                    action: 'STATUS_UPDATED',
                    actorId: 'SYSTEM_SLA_ENGINE',
                    actorRole: 'system',
                    previousState: { status: data.status, slaStatus: data.slaStatus },
                    newState: { status: 'ESCALATED', slaStatus: 'breached' },
                    message: 'Automatic escalation due to SLA breach.'
                }));

                results.breached++;
                results.escalated++;
            }
        }

        if (updates.length > 0) {
            await Promise.all(updates);

            // Trigger health sync for affected campuses
            const affectedCampuses = Array.from(new Set(issuesSnapshot.docs.map(doc => doc.data().campusId)));
            const { syncCampusHealth } = await import('@/lib/sync');
            await Promise.all(affectedCampuses.map(id => syncCampusHealth(id)));
        }

        return NextResponse.json({
            success: true,
            processedCount: issuesSnapshot.size,
            ...results,
            timestamp: now.toISOString()
        });
    } catch (error: any) {
        console.error('[SLA Check Error]:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
