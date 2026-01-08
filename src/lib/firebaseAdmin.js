import * as admin from 'firebase-admin';

const isVercel = process.env.VERCEL === '1';
const environment = isVercel ? 'Vercel/Production' : 'Local/Development';

if (!admin.apps.length) {
    console.log(`[FirebaseAdmin] Initializing in ${environment}...`);
    try {
        const saJson = process.env.FIREBASE_SERVICE_ACCOUNT;
        if (!saJson) {
            console.error('[FirebaseAdmin] FATAL: FIREBASE_SERVICE_ACCOUNT is missing');
            throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is not set');
        }

        let serviceAccount;
        try {
            serviceAccount = JSON.parse(saJson);
        } catch (parseError) {
            console.error('[FirebaseAdmin] FATAL: FIREBASE_SERVICE_ACCOUNT is not valid JSON');
            throw new Error('Malformed FIREBASE_SERVICE_ACCOUNT JSON');
        }

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
        });

        console.log(`[FirebaseAdmin] Bootstrapped successfully:`);
        console.log(` - Project ID: ${serviceAccount.project_id}`);
        console.log(` - Environment: ${environment}`);
        console.log(` - Auth Method: Service Account`);
    } catch (error) {
        console.error('[FirebaseAdmin] Startup Error:', error.message);
        // Important: Re-throw to prevent the app from serving requests in a broken state
        throw error;
    }
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
export { admin };
