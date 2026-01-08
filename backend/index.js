const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Firebase Admin
// If SERVICE_ACCOUNT_KEY is provided in ENV as JSON string, use it.
// Otherwise, it might use default credentials if running on GCP.
if (!admin.apps.length) {
    try {
        if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
            throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is missing');
        }
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log("Firebase Admin initialized via FIREBASE_SERVICE_ACCOUNT.");
    } catch (error) {
        console.error("Firebase Admin Initialization Error:", error.message);
        throw error;
    }
}

const db = admin.firestore();

// POST /users/create
app.post('/users/create', async (req, res) => {
    try {
        const { uid, fullName, email, role, campusId } = req.body;

        if (!uid || !email) {
            return res.status(400).json({ error: 'Missing uid or email' });
        }

        const userRef = db.collection('users').doc(uid);
        await userRef.set({
            uid,
            fullName,
            email,
            role: role || 'student',
            campusId: campusId || 'main-campus',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.status(201).json({ message: 'User profile created successfully', uid });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /users/:uid
app.get('/users/:uid', async (req, res) => {
    try {
        const { uid } = req.params;
        const userDoc = await db.collection('users').doc(uid).get();

        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json(userDoc.data());
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: error.message });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy', project: 'CampusOPS' });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
});
