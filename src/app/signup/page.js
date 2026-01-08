"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { reportUserAuth, createUserProfile } from '@/lib/api';
import Link from 'next/link';

export default function Signup() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('student');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const { signup, refreshProfile } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            return setError('Passwords do not match');
        }

        try {
            const userCredential = await signup(email, password);
            const user = userCredential.user;

            // Create user profile in Firestore
            await createUserProfile({
                uid: user.uid,
                name,
                email,
                role,
                campusId: 'main-campus'
            });

            // Refresh the auth context immediately to get the role/name
            await refreshProfile(user);

            // Background report
            reportUserAuth(user.uid, user.email, 'signup').catch(err => {
                console.error('Background backend report failed:', err);
            });

            // Small delay to ensure Firestore propagation before redirection
            setTimeout(() => {
                router.push('/');
            }, 500);
        } catch (err) {
            console.error('Signup error:', err);
            const errorCode = err.code || '';
            if (errorCode === 'auth/email-already-in-use') {
                setError('This email is already registered. Please log in.');
            } else if (errorCode === 'auth/invalid-email') {
                setError('Please enter a valid email address.');
            } else if (errorCode === 'auth/weak-password') {
                setError('Password is too weak. Must be at least 6 characters.');
            } else {
                setError('Failed to create account. ' + (err.message || 'Please try again.'));
            }
        }
    };

    return (
        <main className="auth-container">
            <motion.div
                className="auth-card"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
            >
                <div className="card-glass" />
                <div className="auth-content">
                    <h1 className="gradient-text">Create Account</h1>
                    <p className="auth-subtitle">Join the future of campus operations</p>

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="input-group">
                            <label>Full Name</label>
                            <input
                                type="text"
                                placeholder="John Doe"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                placeholder="name@university.edu"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <label>Role</label>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="auth-select"
                                required
                            >
                                <option value="student">Student</option>
                                <option value="faculty">Faculty</option>
                                <option value="admin">Administrator</option>
                            </select>
                        </div>
                        <div className="input-group">
                            <label>Password</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <label>Confirm Password</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                        {error && <p className="error-text">{error}</p>}
                        <button type="submit" className="cta-button auth-button">Sign Up</button>
                    </form>

                    <p className="auth-footer">
                        Already have an account? <Link href="/login">Log in</Link>
                    </p>
                </div>
            </motion.div>

            <div className="background-shapes">
                <div className="shape circle-1" />
                <div className="shape circle-2" />
                <div className="shape-orb orb-1" />
            </div>
        </main>
    );
}
