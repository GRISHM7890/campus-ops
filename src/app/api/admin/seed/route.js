export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { seedFromGoogleMaps, seedFromCSV, ingestCampusList } from '../../../../../backend/seed_engine';
import path from 'path';

export async function POST(request) {
    try {
        console.log('[RolloutSeeder] POST request received');
        const results = {
            seededCount: 0,
            updatedCount: 0,
            duplicateCount: 0,
            skippedCount: 0,
            migratedCount: 0,
            source: 'unknown'
        };

        const mergeSummaries = (summary) => {
            results.seededCount += (summary.seededCount || 0);
            results.updatedCount += (summary.updatedCount || 0);
            results.duplicateCount += (summary.duplicateCount || 0);
            results.skippedCount += (summary.skippedCount || 0);
            results.migratedCount += (summary.migratedCount || 0);
        };

        const contentType = request.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const body = await request.json();
            if (body && Array.isArray(body)) {
                results.source = 'manual';
                const summary = await ingestCampusList(body, 'manual');
                mergeSummaries(summary);
                return NextResponse.json({ message: 'Controlled Rollout (Manual) successful', summary: results });
            }
        }

        // Automated multi-source rollout
        results.source = 'automated_rollout';

        // 1. CSV Source
        const csvPath = path.join(process.cwd(), 'backend', 'seed_test.csv');
        const csvSummary = await seedFromCSV(csvPath);
        mergeSummaries(csvSummary);

        // 2. Partner Source (GMaps)
        const categories = ["Engineering College", "Institute of Technology"];
        for (const cat of categories) {
            const gSummary = await seedFromGoogleMaps(cat, "Maharashtra");
            mergeSummaries(gSummary);
        }

        return NextResponse.json({
            message: 'Controlled Rollout (Automated) successful',
            summary: results
        }, { status: 200 });

    } catch (error) {
        console.error('[RolloutSeeder] Critical failure:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
