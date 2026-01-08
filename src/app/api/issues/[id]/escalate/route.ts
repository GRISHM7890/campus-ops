import { NextResponse } from 'next/server';
import { admin, adminDb } from '@/lib/firebaseAdmin';
import { createAuditLog } from '@/lib/audit';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { userId, role, level = 'district' } = body as { userId: string; role: string; level: string };

        // Security check: Only admins can manually force escalation in this demo
        if (role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const issueRef = adminDb.collection('issues').doc(id);
        const issueDoc = await issueRef.get();

        if (!issueDoc.exists) {
            return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
        }

        const authorities = {
            district: {
                name: "District Education Officer",
                email: "grishmmahorkar1@gmail.com"
            },
            university: {
                name: "University Senate",
                email: "mahorkarvidhya@gmail.com"
            }
        };

        const authority = authorities[level as keyof typeof authorities] || authorities.district;

        // Update Issue
        const updateData: any = {
            escalationStatus: 'active',
            escalationLevel: level,
            escalatedTo: authority,
            escalatedAt: new Date().toISOString(),
            status: 'escalated', // Force status to escalated
            timeline: admin.firestore.FieldValue.arrayUnion({
                status: 'ESCALATED',
                message: `Official Notice forwarded to ${authority.name}`,
                timestamp: new Date().toISOString()
            })
        };

        await issueRef.update(updateData);

        // Create High-Vis Audit Log
        await createAuditLog({
            action: 'EXTERNAL_ESCALATION',
            issueId: id,
            actorId: userId,
            actorRole: role,
            message: `Official Notice forwarded to ${authority.name} (${authority.email}).`,
            newState: {
                ...updateData,
                severity: 'CRITICAL'
            }
        });

        // Trigger valid revalidation if needed or relying on real-time listener
        return NextResponse.json({ success: true, escalation: updateData });

    } catch (error) {
        console.error('Escalation error:', error);
        return NextResponse.json({ error: (error as any).message }, { status: 500 });
    }
}
