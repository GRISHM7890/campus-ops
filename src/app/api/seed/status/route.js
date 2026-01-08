export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function GET() {
    try {
        const [lastRunDoc, configDoc, campusesSnapshot] = await Promise.all([
            adminDb.collection('system_metadata').doc('last_seeder_run').get(),
            adminDb.collection('system_metadata').doc('seeder_config').get(),
            adminDb.collection('campuses').count().get()
        ]);

        const lastRunData = lastRunDoc.data() || {};
        const configData = configDoc.data() || {};

        return NextResponse.json({
            seederName: "Controlled Rollout Seeder",
            lastRunAt: lastRunData.lastRunAt ? lastRunData.lastRunAt.toDate().toISOString() : null,
            totalCampuses: campusesSnapshot.data().count,
            sourcesUsed: configData.sourcesUsed || [],
            lastRunSummary: lastRunData.counts || null
        });

    } catch (error) {
        console.error('[SeederStatus] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
