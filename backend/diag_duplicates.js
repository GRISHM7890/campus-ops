const admin = require('firebase-admin');

if (!admin.apps.length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function findDuplicates() {
    console.log("Analyzing campuses for duplicates...");
    const snapshot = await db.collection('campuses').get();
    const seen = new Map();
    const duplicates = [];

    snapshot.forEach(doc => {
        const data = doc.data();
        const key = `${data.name.toLowerCase().trim()}_${data.city.toLowerCase().trim()}`;

        if (seen.has(key)) {
            duplicates.push({
                key,
                originalId: seen.get(key),
                duplicateId: doc.id,
                name: data.name
            });
        } else {
            seen.set(key, doc.id);
        }
    });

    console.log(`Total Docs: ${snapshot.size}`);
    console.log(`Duplicate sets found: ${duplicates.length}`);
    duplicates.forEach(d => {
        console.log(`[DUPE] ${d.name}: ${d.originalId} vs ${d.duplicateId}`);
    });
}

findDuplicates().catch(console.error);
