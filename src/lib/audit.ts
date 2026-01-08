import { admin, adminDb } from './firebaseAdmin';

export interface AuditLogPayload {
    issueId: string;
    action: 'ISSUE_CREATED' | 'STATUS_CHANGED' | 'ISSUE_RESOLVED' | 'STATUS_UPDATED' | 'EXTERNAL_ESCALATION';
    actorId: string;
    actorRole: string;
    previousState?: any;
    newState: any;
    message?: string;
}

/**
 * Creates an immutable audit log entry for an issue.
 * We store in a root collection for high-performance indexing and visibility,
 * while still maintaining the requested hierarchical mapping via IDs.
 */
export async function createAuditLog(payload: AuditLogPayload) {
    try {
        const { issueId, ...logData } = payload;

        // Ensure we don't have undefined fields which Firestore might reject
        const sanitizedData = JSON.parse(JSON.stringify(logData));

        const logEntry = {
            ...sanitizedData,
            issueId,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            systemTime: new Date().toISOString() // Redundant fallback for immediate UI rendering
        };

        // 1. Maintain the requested subcollection path for hierarchy
        await adminDb
            .collection('auditLogs')
            .doc(issueId)
            .collection('events')
            .add(logEntry);

        // 2. Also log to a flat global ledger for easier admin reporting/export across campuses
        await adminDb
            .collection('globalAuditLedger')
            .add(logEntry);

        console.log(`[AuditLog] ${payload.action} securely persisted for issue ${issueId}`);
        return { success: true };
    } catch (error) {
        console.error('[AuditLog Fatal Error]:', error);
        return { success: false, error };
    }
}
