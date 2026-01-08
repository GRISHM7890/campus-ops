export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { admin, adminDb } from '@/lib/firebaseAdmin';

export async function GET() {
    const timestamp = new Date().toISOString();
    const checks = {
        firebaseAdmin: false,
        firestoreRead: false,
    };

    try {
        // 1. Check if Firebase Admin is initialized (from our singleton)
        if (admin && admin.apps.length > 0) {
            checks.firebaseAdmin = true;
        }

        // 2. Perform a "canary" read to verify Firestore access
        // We'll just try to get a single document (or even just the collection reference is fine, 
        // but a real limit(1) fetch is the best canary).
        const canarySnapshot = await adminDb.collection('campuses').limit(1).get();
        checks.firestoreRead = true;

        const isHealthy = checks.firebaseAdmin && checks.firestoreRead;

        return NextResponse.json({
            status: isHealthy ? 'healthy' : 'degraded',
            timestamp,
            projectId: admin.app().options.projectId || 'campusops-d067a',
            environment: process.env.VERCEL === '1' ? 'production' : 'development',
            checks
        }, { status: isHealthy ? 200 : 503 });

    } catch (error) {
        console.error('[Health] Service check failed:', error.message);
        return NextResponse.json({
            status: 'unhealthy',
            timestamp,
            errorCode: 'HEALTH_CHECK_FAILURE',
            message: error.message,
            checks
        }, { status: 500 });
    }
}
