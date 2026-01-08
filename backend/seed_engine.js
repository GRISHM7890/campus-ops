const { Client } = require("@googlemaps/google-maps-services-js");
const fs = require('fs');
const { parse } = require('csv-parse/sync');
const crypto = require('crypto');
const Bottleneck = require('bottleneck');
const admin = require('firebase-admin');

if (!admin.apps.length) {
    try {
        if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
            throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is missing');
        }
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log('[FirebaseAdmin] Seed Engine initialized successfully');
    } catch (error) {
        console.error('[FirebaseAdmin] Initialization Error:', error.message);
        throw error;
    }
}

const db = admin.firestore();
const googleClient = new Client({});
const API_KEY = 'AIzaSyD3bkQoF87V5TtZyAKntH9fM5Zqpf8o38Ao';

// Rate limiter: 2 requests per second for Google Maps API
const limiter = new Bottleneck({
    minTime: 500
});

/**
 * Generate a unique SHA-256 hash for a campus to prevent duplicates
 */
function generateCampusId(name, city) {
    const normalized = `${name.toLowerCase().trim()}_${city.toLowerCase().trim()}`;
    return crypto.createHash('sha256').update(normalized).digest('hex');
}

/**
 * Primary entry point for the Controlled Rollout Seeder
 * @param {Array} dataArray - Array of campus objects
 * @param {string} source - Source tag (e.g., 'csv', 'manual', 'partner')
 */
async function ingestCampusList(dataArray, source = 'manual') {
    console.log(`[RolloutSeeder] Initiating ingestion of ${dataArray.length} records from source: ${source}`);
    const results = {
        seededCount: 0,
        updatedCount: 0,
        duplicateCount: 0,
        skippedCount: 0,
        migratedCount: 0
    };

    for (const item of dataArray) {
        try {
            const { name, city, state, lat, lng, category } = item;
            if (!name || !city) {
                results.skippedCount++;
                continue;
            }

            const targetId = generateCampusId(name, city);
            const campusesRef = db.collection('campuses');

            // Hash-based idempotency check
            let targetDoc = await campusesRef.doc(targetId).get();

            // Legacy deduplication search
            const existingQuery = await campusesRef
                .where('name', '==', name.trim())
                .where('city', '==', city.trim())
                .limit(1)
                .get();

            let legacyDoc = null;
            if (!existingQuery.empty) {
                const found = existingQuery.docs[0];
                if (found.id !== targetId) legacyDoc = found;
            }

            const campusData = {
                id: targetId,
                name: name.trim(),
                city: city.trim(),
                state: state ? state.trim() : 'Unknown',
                location: (lat && lng) ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null,
                category: category ? category.trim() : 'General',
                source: source,
                operationalStatus: item.operationalStatus || 'unknown',
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };

            if (legacyDoc) {
                console.log(`[RolloutSeeder] Migrating legacy doc ${legacyDoc.id} -> ${targetId}`);
                campusData.createdAt = legacyDoc.data().createdAt || admin.firestore.FieldValue.serverTimestamp();
                await campusesRef.doc(targetId).set(campusData, { merge: true });
                await legacyDoc.ref.delete();
                results.migratedCount++;
            } else if (targetDoc.exists) {
                // Check if data is actually different (optional deep compare, for now we merge)
                await campusesRef.doc(targetId).set(campusData, { merge: true });
                results.duplicateCount++;
                results.updatedCount++;
                console.log(`[RolloutSeeder] Duplicate detected for ${name}, merged updates.`);
            } else {
                campusData.createdAt = admin.firestore.FieldValue.serverTimestamp();
                await campusesRef.doc(targetId).set(campusData);
                results.seededCount++;
                console.log(`[RolloutSeeder] Successfully seeded: ${name}`);
            }

        } catch (error) {
            console.error(`[RolloutSeeder] Ingestion failure for ${item.name}:`, error.message);
            results.skippedCount++;
        }
    }

    // Update system metadata
    await db.collection('system_metadata').doc('last_seeder_run').set({
        lastRunAt: admin.firestore.FieldValue.serverTimestamp(),
        lastSource: source,
        counts: results
    }, { merge: true });

    // Track sources used
    await db.collection('system_metadata').doc('seeder_config').set({
        sourcesUsed: admin.firestore.FieldValue.arrayUnion(source)
    }, { merge: true });

    return results;
}

/**
 * Seed from Google Maps Places Search
 */
async function seedFromGoogleMaps(query, region = "India") {
    console.log(`[GoogleMaps] Seeding for query: "${query}" in ${region}...`);
    const results = [];

    try {
        const response = await limiter.schedule(() =>
            googleClient.textSearch({
                params: {
                    query: `${query} in ${region}`,
                    key: API_KEY
                }
            })
        );

        const places = response.data.results;
        for (const place of places) {
            const address = place.formatted_address || "";
            const parts = address.split(',');
            const city = parts[parts.length - 3]?.trim() || "Unknown";
            const state = parts[parts.length - 2]?.split(' ')[1]?.trim() || "Unknown";

            results.push({
                name: place.name,
                city,
                state,
                lat: place.geometry.location.lat,
                lng: place.geometry.location.lng,
                category: query.includes("IIT") ? "IIT" : (query.includes("NIT") ? "NIT" : "University")
            });
        }

        const summary = await ingestCampusList(results, 'partner');
        return summary;
    } catch (error) {
        console.error(`[RolloutSeeder] GMaps Error:`, error.message);
        return { seededCount: 0, error: error.message };
    }
}

/**
 * Seed from CSV file
 */
async function seedFromCSV(filePath) {
    console.log(`[CSV] Processing file: ${filePath}...`);
    try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const records = parse(fileContent, {
            columns: true,
            skip_empty_lines: true
        });

        const summary = await ingestCampusList(records, 'csv');
        return summary;
    } catch (error) {
        console.error(`[RolloutSeeder] CSV Error:`, error.message);
        return { seededCount: 0, error: error.message };
    }
}

module.exports = {
    seedFromGoogleMaps,
    seedFromCSV,
    ingestCampusList,
    generateCampusId
};
