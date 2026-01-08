export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { admin, adminDb } from '@/lib/firebaseAdmin';

export async function POST(request) {
    try {
        const { uid, name, email, role, campusId } = await request.json();

        if (!uid || !email) {
            return NextResponse.json({ error: 'Missing uid or email' }, { status: 400 });
        }

        const userRef = adminDb.collection('users').doc(uid);
        await userRef.set({
            uid,
            name,
            email,
            role: role || 'student',
            campusId: campusId || 'main-campus',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        return NextResponse.json({ message: 'User profile created successfully', uid }, { status: 201 });
    } catch (error) {
        console.error('Error creating user profile:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
