"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!auth) return;
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // Fetch profile data from Firestore
                try {
                    const { doc, getDoc } = await import('firebase/firestore');
                    const { db } = await import('@/lib/firebase');
                    const docRef = doc(db, 'users', firebaseUser.uid);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        const profile = docSnap.data();
                        setUser({
                            ...firebaseUser,
                            role: profile.role,
                            name: profile.name
                        });
                    } else {
                        setUser(firebaseUser);
                    }
                } catch (err) {
                    console.error('Error fetching user profile:', err);
                    setUser(firebaseUser);
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const login = (email, password) => {
        return signInWithEmailAndPassword(auth, email, password);
    };

    const signup = (email, password) => {
        return createUserWithEmailAndPassword(auth, email, password);
    };

    const refreshProfile = async (firebaseUser = user) => {
        if (!firebaseUser) return;
        try {
            const { doc, getDoc } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');
            const docRef = doc(db, 'users', firebaseUser.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const profile = docSnap.data();
                setUser({
                    ...firebaseUser,
                    role: profile.role,
                    name: profile.name
                });
                return profile;
            }
        } catch (err) {
            console.error('Error refreshing user profile:', err);
        }
        return null;
    };

    const logout = async () => {
        setUser(null);
        await signOut(auth);
    };

    return (
        <AuthContext.Provider value={{ user, login, signup, logout, refreshProfile, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
