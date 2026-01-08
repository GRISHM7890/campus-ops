export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function GET(request, { params }) {
    try {
        const { id } = await params;
        if (!id) return NextResponse.json({ error: 'Issue ID is required' }, { status: 400 });

        // Fetch from the hierarchical events collection as requested
        const logsSnapshot = await adminDb
            .collection('auditLogs')
            .doc(id)
            .collection('events')
            .get();

        const logs = logsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                // Handle different timestamp formats accurately
                timestamp: data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : (data.systemTime || data.timestamp)
            };
        });

        // Sort in reverse chronological order in memory to avoid index requirements on new collections
        const sortedLogs = logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        return NextResponse.json({
            logs: sortedLogs,
            count: sortedLogs.length,
            generatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('[AuditFetch Error]:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
