import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCmSf2WShguO39W6yDPojeNULzd9Vb9qK4",
    authDomain: "campusops-d067a.firebaseapp.com",
    projectId: "campusops-d067a",
    storageBucket: "campusops-d067a.firebasestorage.app",
    messagingSenderId: "100040755838",
    appId: "1:100040755838:web:fca681ef0fa1da33a4e62f",
    measurementId: "G-Z4FMJNLTC2"
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Analytics - client only
let analytics;
if (typeof window !== "undefined") {
    import("firebase/analytics").then(({ getAnalytics }) => {
        analytics = getAnalytics(app);
    });
}

export { app, analytics, auth, db };
