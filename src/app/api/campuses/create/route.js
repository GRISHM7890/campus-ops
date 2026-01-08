export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { admin, adminDb } from '@/lib/firebaseAdmin';

export async function POST(request) {
    try {
        const { name, city, state, location } = await request.json();

        if (!name || !city || !location) {
            return NextResponse.json({ error: 'Missing required fields: name, city, or location' }, { status: 400 });
        }

        // Standard SHA-256 ID generation for consistency and de-duplication
        const crypto = await import('crypto');
        const normalized = `${name.toLowerCase().trim()}_${city.toLowerCase().trim()}`;
        const docId = crypto.createHash('sha256').update(normalized).digest('hex');

        const campusRef = adminDb.collection('campuses').doc(docId);
        const existing = await campusRef.get();

        if (existing.exists) {
            // If it exists, we update it rather than creating a dupe
            await campusRef.set({
                name: name.trim(),
                city: city.trim(),
                state: state ? state.trim() : 'Unknown',
                location: {
                    lat: parseFloat(location.lat),
                    lng: parseFloat(location.lng)
                },
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            return NextResponse.json({ message: 'Campus already existed, updated instead', id: docId }, { status: 200 });
        }

        await campusRef.set({
            id: docId,
            name: name.trim(),
            city: city.trim(),
            state: state ? state.trim() : 'Unknown',
            location: {
                lat: parseFloat(location.lat),
                lng: parseFloat(location.lng)
            },
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        return NextResponse.json({ message: 'Campus created successfully', id: docId }, { status: 201 });
    } catch (error) {
        console.error('Error creating campus:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
