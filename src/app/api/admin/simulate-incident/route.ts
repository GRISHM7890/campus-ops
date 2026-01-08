export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { admin, adminDb } from '@/lib/firebaseAdmin';

export async function POST(request: Request) {
    try {
        const { campusId } = await request.json();

        if (!campusId) {
            return NextResponse.json({ error: 'Campus ID is required' }, { status: 400 });
        }

        const title = "CRITICAL: System Anomaly Detected (Simulated)";
        const description = "Automated simulation of a high-priority system failure for health scoring validation.";
        const severity = "critical";

        const criticalIssue = {
            campusId,
            title,
            description,
            severity,
            status: "open",
            reportedBy: "System Simulator",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            timeline: [
                {
                    status: 'CREATED',
                    timestamp: new Date().toISOString(),
                    message: 'Automated simulation payload injected.'
                }
            ],
        };

        const docRef = await adminDb.collection('issues').add(criticalIssue);
        const issueId = docRef.id;

        return NextResponse.json({
            success: true,
            issueId,
            message: `Simulated critical incident injected successfully.`
        });

    } catch (error: any) {
        console.error('[Simulation] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
